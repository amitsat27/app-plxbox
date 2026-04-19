import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc } from 'firebase/firestore';
import * as SecureStore from 'expo-secure-store';
import { getFirebaseDb } from '../../config/firebaseConfig';
import { base64ToBytes, bytesToBase64, cryptoService, deriveKey, generateRandomBytes, sha256 } from './CryptoService';
import type { PasswordEntry, PasswordGroup, VaultMeta } from '../../types/passwords';

const BACKUP_COLLECTION = 'passwords_backups';
const RECOVERY_KEYS_COLLECTION = 'passwords_recovery_keys';
const BACKUP_FORMAT_VERSION = 1;

export type BackupReason = 'manual' | 'entry_add' | 'entry_update' | 'entry_delete' | 'group_add' | 'group_update' | 'group_delete';

export type RestoreMode = 'merge' | 'overwrite';
export type RestoreAuthType = 'vault_password' | 'recovery_key';

export interface PasswordBackupSnapshot {
  vault: VaultMeta;
  groups: PasswordGroup[];
  entries: PasswordEntry[];
}

export interface PasswordBackupStatus {
  exists: boolean;
  lastSyncedAt: number | null;
  entryCount: number;
  groupCount: number;
  lastReason: BackupReason | null;
  checksum: string | null;
  hasRecoveryWrap: boolean;
}

export interface CloudBackupRecord {
  vaultId: string;
  vaultName: string;
  vaultType: VaultMeta['type'];
  lastSyncedAt: number | null;
  entryCount: number;
  groupCount: number;
  hasRecoveryWrap: boolean;
  hasVaultPasswordRestore: boolean;
}

export interface PasswordBackupPackage {
  snapshot: PasswordBackupSnapshot;
  checksum: string;
  encryptedAt: number;
}

type BackupDocument = {
  vaultId: string;
  vaultName: string;
  vaultType: VaultMeta['type'];
  vaultSalt: string;
  vaultVerificationHash: string;
  version: number;
  encryptedPayload: unknown;
  checksum: string;
  entryCount: number;
  groupCount: number;
  encryptedAt: number;
  lastReason: BackupReason;
  wrappedBackupKeyByVault: unknown;
  recoverySalt?: string;
  wrappedBackupKeyByRecovery?: unknown;
  updatedAt?: any;
};

type BackupDecryptContext = {
  checksum: string;
  encryptedAt: number;
  encryptedPayload: unknown;
};

function secureStoreKey(vaultId: string): string {
  return `password_backup_recovery_${vaultId}`;
}

function cloneSnapshot(snapshot: PasswordBackupSnapshot): PasswordBackupSnapshot {
  return {
    vault: { ...snapshot.vault },
    groups: snapshot.groups.map((group) => ({ ...group })),
    entries: snapshot.entries.map((entry) => ({ ...entry })),
  };
}

export class PasswordBackupService {
  private userId: string | null = null;

  setUser(userId: string) {
    this.userId = userId;
  }

  private backupRef(vaultId: string) {
    if (!this.userId) throw new Error('User not authenticated');
    return doc(getFirebaseDb(), `users/${this.userId}/${BACKUP_COLLECTION}/${vaultId}`);
  }

  private backupsCollectionRef() {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(getFirebaseDb(), `users/${this.userId}/${BACKUP_COLLECTION}`);
  }

  private recoveryKeyRef(vaultId: string) {
    if (!this.userId) throw new Error('User not authenticated');
    return doc(getFirebaseDb(), `users/${this.userId}/${RECOVERY_KEYS_COLLECTION}/${vaultId}`);
  }

  private async syncRecoveryKeyToCloud(
    vaultId: string,
    key: string,
    metadata?: { vaultName?: string; vaultType?: VaultMeta['type'] },
  ): Promise<void> {
    await setDoc(this.recoveryKeyRef(vaultId), {
      vaultId,
      recoveryKey: key,
      vaultName: metadata?.vaultName || null,
      vaultType: metadata?.vaultType || null,
      updatedAt: serverTimestamp(),
    }, { merge: true });
  }

  private async getRecoveryKeyFromCloud(vaultId: string): Promise<string | null> {
    const snap = await getDoc(this.recoveryKeyRef(vaultId));
    if (!snap.exists()) return null;
    const data = snap.data() as { recoveryKey?: string };
    return data.recoveryKey || null;
  }

  async generateRecoveryKey(
    vaultId: string,
    metadata?: { vaultName?: string; vaultType?: VaultMeta['type'] },
  ): Promise<string> {
    const random = await generateRandomBytes(18);
    const base = bytesToBase64(random).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24).toUpperCase();
    const formatted = `${base.slice(0, 6)}-${base.slice(6, 12)}-${base.slice(12, 18)}-${base.slice(18, 24)}`;
    await SecureStore.setItemAsync(secureStoreKey(vaultId), formatted);
    await this.syncRecoveryKeyToCloud(vaultId, formatted, metadata);
    return formatted;
  }

  async getRecoveryKey(vaultId: string): Promise<string | null> {
    const local = await SecureStore.getItemAsync(secureStoreKey(vaultId));
    if (local) return local;

    const cloud = await this.getRecoveryKeyFromCloud(vaultId);
    if (cloud) {
      await SecureStore.setItemAsync(secureStoreKey(vaultId), cloud);
    }
    return cloud;
  }

  async clearLocalRecoveryKey(vaultId: string): Promise<void> {
    await SecureStore.deleteItemAsync(secureStoreKey(vaultId));
  }

  async linkRecoveryKeyToVault(
    vaultId: string,
    metadata: { vaultName?: string; vaultType?: VaultMeta['type'] },
    providedRecoveryKey?: string,
  ): Promise<void> {
    let key = providedRecoveryKey?.trim() || '';
    if (!key) {
      key = (await this.getRecoveryKey(vaultId)) || '';
    }
    if (!key) {
      // Nothing to link if no recovery key exists yet.
      return;
    }

    await SecureStore.setItemAsync(secureStoreKey(vaultId), key);
    await this.syncRecoveryKeyToCloud(vaultId, key, metadata);
  }

  async clearRecoveryKey(vaultId: string): Promise<void> {
    await SecureStore.deleteItemAsync(secureStoreKey(vaultId));
    await deleteDoc(this.recoveryKeyRef(vaultId));
  }

  async backupVaultSnapshot(vaultId: string, snapshot: PasswordBackupSnapshot, vaultEncryptionKey: Uint8Array, reason: BackupReason): Promise<PasswordBackupStatus> {
    if (!vaultEncryptionKey || vaultEncryptionKey.length < 32) {
      throw new Error('Vault key missing. Unlock the vault before backup.');
    }

    const normalized = cloneSnapshot(snapshot);
    const serialized = JSON.stringify(normalized);
    const checksum = await sha256(serialized);

    const backupDataKey = await generateRandomBytes(32);
    const encryptedPayload = await cryptoService.encrypt(serialized, backupDataKey);
    const wrappedBackupKeyByVault = await cryptoService.encrypt(bytesToBase64(backupDataKey), vaultEncryptionKey);

    const backupDoc: BackupDocument = {
      vaultId,
      vaultName: normalized.vault.name,
      vaultType: normalized.vault.type,
      vaultSalt: normalized.vault.salt,
      vaultVerificationHash: normalized.vault.verificationHash,
      version: BACKUP_FORMAT_VERSION,
      encryptedPayload,
      checksum,
      entryCount: normalized.entries.length,
      groupCount: normalized.groups.length,
      encryptedAt: Date.now(),
      lastReason: reason,
      wrappedBackupKeyByVault,
    };

    const recoveryKey = await this.getRecoveryKey(vaultId);
    if (recoveryKey) {
      const recoverySalt = bytesToBase64(await generateRandomBytes(16));
      const derived = await deriveKey(recoveryKey, base64ToBytes(recoverySalt));
      backupDoc.recoverySalt = recoverySalt;
      backupDoc.wrappedBackupKeyByRecovery = await cryptoService.encrypt(bytesToBase64(backupDataKey), derived.encryptionKey);
    }

    await setDoc(this.backupRef(vaultId), { ...backupDoc, updatedAt: serverTimestamp() }, { merge: true });

    return {
      exists: true,
      lastSyncedAt: backupDoc.encryptedAt,
      entryCount: backupDoc.entryCount,
      groupCount: backupDoc.groupCount,
      lastReason: backupDoc.lastReason,
      checksum: backupDoc.checksum,
      hasRecoveryWrap: Boolean(backupDoc.wrappedBackupKeyByRecovery),
    };
  }

  async getBackupStatus(vaultId: string): Promise<PasswordBackupStatus> {
    const snap = await getDoc(this.backupRef(vaultId));
    if (!snap.exists()) {
      return {
        exists: false,
        lastSyncedAt: null,
        entryCount: 0,
        groupCount: 0,
        lastReason: null,
        checksum: null,
        hasRecoveryWrap: false,
      };
    }

    const data = snap.data() as BackupDocument;
    return {
      exists: true,
      lastSyncedAt: data.encryptedAt || null,
      entryCount: data.entryCount || 0,
      groupCount: data.groupCount || 0,
      lastReason: data.lastReason || null,
      checksum: data.checksum || null,
      hasRecoveryWrap: Boolean(data.wrappedBackupKeyByRecovery),
    };
  }

  async listCloudBackups(): Promise<CloudBackupRecord[]> {
    const snapshot = await getDocs(this.backupsCollectionRef());
    const backups = snapshot.docs.map((item) => {
      const data = item.data() as BackupDocument;
      return {
        vaultId: item.id,
        vaultName: data.vaultName || 'Vault backup',
        vaultType: data.vaultType || 'secure',
        lastSyncedAt: data.encryptedAt || null,
        entryCount: data.entryCount || 0,
        groupCount: data.groupCount || 0,
        hasRecoveryWrap: Boolean(data.wrappedBackupKeyByRecovery),
        hasVaultPasswordRestore: Boolean(data.vaultSalt && data.vaultVerificationHash),
      } as CloudBackupRecord;
    });

    backups.sort((left, right) => (right.lastSyncedAt || 0) - (left.lastSyncedAt || 0));
    return backups;
  }

  private async decryptPackage(context: BackupDecryptContext, backupKey: Uint8Array): Promise<PasswordBackupPackage> {
    const plaintext = await cryptoService.decrypt(context.encryptedPayload as any, backupKey);
    const checksum = await sha256(plaintext);
    if (checksum !== context.checksum) {
      throw new Error('Backup integrity check failed');
    }

    const snapshot = JSON.parse(plaintext) as PasswordBackupSnapshot;
    return {
      snapshot,
      checksum: context.checksum,
      encryptedAt: context.encryptedAt,
    };
  }

  async restoreSnapshotWithVaultPassword(vaultId: string, vaultEncryptionKey: Uint8Array): Promise<PasswordBackupPackage> {
    const snap = await getDoc(this.backupRef(vaultId));
    if (!snap.exists()) throw new Error('No cloud backup found for this vault');
    const data = snap.data() as BackupDocument;

    const wrapped = data.wrappedBackupKeyByVault;
    if (!wrapped) throw new Error('Backup key data missing');

    const backupKeyBase64 = await cryptoService.decrypt(wrapped as any, vaultEncryptionKey);
    const backupKey = base64ToBytes(backupKeyBase64);
    return this.decryptPackage(
      { checksum: data.checksum, encryptedAt: data.encryptedAt, encryptedPayload: data.encryptedPayload },
      backupKey,
    );
  }

  async restoreSnapshotWithRecoveryKey(vaultId: string, recoveryKey: string): Promise<PasswordBackupPackage> {
    const snap = await getDoc(this.backupRef(vaultId));
    if (!snap.exists()) throw new Error('No cloud backup found for this vault');
    const data = snap.data() as BackupDocument;

    if (!data.recoverySalt || !data.wrappedBackupKeyByRecovery) {
      throw new Error('Recovery key restore is not enabled for this backup');
    }

    const derived = await deriveKey(recoveryKey.trim(), base64ToBytes(data.recoverySalt));
    const backupKeyBase64 = await cryptoService.decrypt(data.wrappedBackupKeyByRecovery as any, derived.encryptionKey);
    const backupKey = base64ToBytes(backupKeyBase64);
    return this.decryptPackage(
      { checksum: data.checksum, encryptedAt: data.encryptedAt, encryptedPayload: data.encryptedPayload },
      backupKey,
    );
  }

  async restoreSnapshotWithVaultPasswordValue(vaultId: string, vaultPassword: string): Promise<PasswordBackupPackage> {
    const snap = await getDoc(this.backupRef(vaultId));
    if (!snap.exists()) throw new Error('No cloud backup found for this vault');
    const data = snap.data() as BackupDocument;

    if (!data.vaultSalt || !data.vaultVerificationHash) {
      throw new Error('Vault password restore is unavailable for this backup');
    }

    const key = await cryptoService.unlockVault(vaultPassword.trim(), data.vaultSalt, data.vaultVerificationHash);
    const wrapped = data.wrappedBackupKeyByVault;
    if (!wrapped) throw new Error('Backup key data missing');

    const backupKeyBase64 = await cryptoService.decrypt(wrapped as any, key);
    const backupKey = base64ToBytes(backupKeyBase64);
    return this.decryptPackage(
      { checksum: data.checksum, encryptedAt: data.encryptedAt, encryptedPayload: data.encryptedPayload },
      backupKey,
    );
  }
}

export const passwordBackupService = new PasswordBackupService();
