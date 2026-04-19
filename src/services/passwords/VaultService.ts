/**
 * VaultService - Firebase Cloud Storage
 * All vault data stored encrypted in Firebase Firestore
 */

import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { getFirebaseDb } from '../../config/firebaseConfig';
import { getFirebaseAuth } from '../../config/firebaseConfig';
import {
  PasswordEntry,
  PasswordHistoryItem,
  PasswordGroup,
  VaultMeta,
  VaultType,
  PasswordEntryFormData,
  GroupFormData,
  DoubleEncryptedEntry,
  DoubleEncryptedResult,
  PwsafeEntry,
} from '../../types/passwords';
import { cryptoService, deriveKey, generateSalt, createVerificationHash, bytesToBase64 } from './CryptoService';
import { passwordBackupService, type BackupReason, type CloudBackupRecord, type PasswordBackupStatus, type RestoreMode, type RestoreAuthType } from './PasswordBackupService';

const VAULTS_COLLECTION = 'passwords_vaults';
const ENTRIES_COLLECTION = 'entries';
const GROUPS_COLLECTION = 'groups';

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export class VaultService {
  private currentKey: Uint8Array | null = null;
  private currentVaultId: string | null = null;
  private userId: string | null = null;
  private encryptionKey: Uint8Array | null = null;
  private backupTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private backupInFlight = new Set<string>();

  setUser(userId: string) {
    this.userId = userId;
    passwordBackupService.setUser(userId);
  }

  private async runBackupWithRetry(vaultId: string, reason: BackupReason, attempt = 0): Promise<void> {
    if (this.backupInFlight.has(vaultId)) return;
    if (!this.encryptionKey || this.currentVaultId !== vaultId) return;

    this.backupInFlight.add(vaultId);
    try {
      const [vault, groups, entries] = await Promise.all([
        this.getVaultMeta(vaultId),
        this.getGroups(vaultId),
        this.getEntries(vaultId),
      ]);

      if (!vault) throw new Error('Vault not found for backup');

      await passwordBackupService.backupVaultSnapshot(
        vaultId,
        { vault, groups, entries },
        this.encryptionKey,
        reason,
      );
    } catch (error) {
      if (attempt < 3) {
        const delayMs = 800 * Math.pow(2, attempt);
        setTimeout(() => {
          this.runBackupWithRetry(vaultId, reason, attempt + 1).catch(() => {});
        }, delayMs);
      } else {
        console.error('Password backup sync failed:', error);
      }
    } finally {
      this.backupInFlight.delete(vaultId);
    }
  }

  private scheduleAutoBackup(vaultId: string, reason: BackupReason): void {
    if (!this.encryptionKey || this.currentVaultId !== vaultId) return;
    const existingTimer = this.backupTimers.get(vaultId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.backupTimers.delete(vaultId);
      this.runBackupWithRetry(vaultId, reason).catch(() => {});
    }, 700);

    this.backupTimers.set(vaultId, timer);
  }

  private getUserDoc(collectionName: string, ...pathSegments: string[]) {
    if (!this.userId) throw new Error('User not authenticated');
    const path = ['users', this.userId, collectionName, ...pathSegments].join('/');
    return doc(getFirebaseDb(), path);
  }

  private getSubCollection(vaultId: string, subCollection: string) {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(getFirebaseDb(), `users/${this.userId}/${VAULTS_COLLECTION}/${vaultId}/${subCollection}`);
  }

  setCurrentVault(vaultId: string, key: Uint8Array): void {
    this.currentVaultId = vaultId;
    this.currentKey = key;
    this.encryptionKey = key;
  }

  lockVault(): void {
    this.currentVaultId = null;
    this.currentKey = null;
    this.encryptionKey = null;
  }

  isUnlocked(): boolean {
    return this.currentKey !== null && this.currentVaultId !== null;
  }

  async createVault(name: string, type: VaultType, masterPassword: string): Promise<VaultMeta> {
    if (!this.userId) throw new Error('User not authenticated - please login first');
    
    const vaultId = generateUUID();
    const now = Date.now();
    const { salt, verificationHash } = await cryptoService.createVault(masterPassword);

    const vaultMeta: VaultMeta = {
      id: vaultId,
      name,
      type,
      salt,
      verificationHash,
      createdAt: now,
      modifiedAt: now,
      entryCount: 0,
      lastUnlockedAt: null,
    };

    const vaultRef = this.getUserDoc(VAULTS_COLLECTION, vaultId);
    await setDoc(vaultRef, { ...vaultMeta, createdAt: serverTimestamp(), modifiedAt: serverTimestamp() });

    try {
      await passwordBackupService.generateRecoveryKey(vaultId, { vaultName: name, vaultType: type });
    } catch (error) {
      // Keep vault and recovery-key lifecycle in sync if auto-key provisioning fails.
      await deleteDoc(vaultRef);
      throw error;
    }

    return vaultMeta;
  }

  async getVaultMeta(vaultId: string): Promise<VaultMeta | null> {
    const vaultRef = this.getUserDoc(VAULTS_COLLECTION, vaultId);
    const snap = await getDoc(vaultRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as VaultMeta;
  }

  async saveVaultMeta(vaultMeta: VaultMeta): Promise<void> {
    if (!this.userId) throw new Error('User not authenticated');
    const vaultRef = this.getUserDoc(VAULTS_COLLECTION, vaultMeta.id);
    await setDoc(vaultRef, { ...vaultMeta, modifiedAt: serverTimestamp() }, { merge: true });
  }

  async getAllVaults(): Promise<VaultMeta[]> {
    if (!this.userId) return [];
    const q = query(collection(getFirebaseDb(), `users/${this.userId}/${VAULTS_COLLECTION}`));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as VaultMeta));
  }

  async getEntries(vaultId: string): Promise<PasswordEntry[]> {
    const col = this.getSubCollection(vaultId, ENTRIES_COLLECTION);
    const snap = await getDocs(col);
    const entries: PasswordEntry[] = [];
    
    for (const d of snap.docs) {
      const data = d.data();
      try {
        if (data.encryptedData && this.encryptionKey) {
          const decrypted = await cryptoService.decrypt(data.encryptedData, this.encryptionKey);
          const parsed = JSON.parse(decrypted);
          entries.push({
            id: d.id,
            groupId: parsed.groupId || null,
            groupPath: parsed.groupPath || '',
            title: parsed.title || '',
            username: parsed.username || '',
            password: parsed.password || '',
            passwordHistory: Array.isArray(parsed.passwordHistory) ? parsed.passwordHistory : [],
            url: parsed.url || '',
            notes: parsed.notes || '',
            tags: parsed.tags || [],
            favorite: parsed.favorite || false,
            customFields: parsed.customFields || {},
            createdAt: parsed.createdAt || Date.now(),
            modifiedAt: parsed.modifiedAt || Date.now(),
            lastAccessedAt: parsed.lastAccessedAt || Date.now(),
          });
        } else {
          entries.push({
            id: d.id,
            groupId: data.groupId || null,
            groupPath: data.groupPath || '',
            title: data.title || '',
            username: data.username || '',
            password: data.password || '',
            passwordHistory: Array.isArray(data.passwordHistory) ? data.passwordHistory : [],
            url: data.url || '',
            notes: data.notes || '',
            tags: data.tags || [],
            favorite: data.favorite || false,
            customFields: data.customFields || {},
            createdAt: data.createdAt || Date.now(),
            modifiedAt: data.modifiedAt || Date.now(),
            lastAccessedAt: data.lastAccessedAt || Date.now(),
          });
        }
      } catch (e) {
        console.error('Error parsing entry:', e);
      }
    }
    
    return entries;
  }

  async saveEntries(vaultId: string, entries: PasswordEntry[]): Promise<void> {
    const col = this.getSubCollection(vaultId, ENTRIES_COLLECTION);
    const snap = await getDocs(col);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }

    for (const entry of entries) {
      const entryData: any = {
        id: entry.id,
        title: entry.title,
        groupId: entry.groupId || null,
        groupPath: entry.groupPath || '',
        createdAt: entry.createdAt,
        modifiedAt: entry.modifiedAt,
        lastAccessedAt: entry.lastAccessedAt,
      };

      if (!this.encryptionKey) {
        throw new Error('Vault encryption key missing. Unlock the vault before saving entries.');
      }

      // Sensitive fields remain in encrypted blob only.
      entryData.encryptedData = await cryptoService.encrypt(JSON.stringify(entry), this.encryptionKey);

      const entryRef = doc(col, entry.id);
      await setDoc(entryRef, { ...entryData, modifiedAt: serverTimestamp() });
    }

    await this.updateEntryCount(vaultId);
  }

  async addEntry(vaultId: string, formData: PasswordEntryFormData): Promise<PasswordEntry> {
    if (!this.isUnlocked()) throw new Error('Vault is locked');
    const now = Date.now();
    const entryId = generateUUID();
    
    const entry: PasswordEntry = {
      id: entryId,
      groupId: formData.groupId,
      groupPath: formData.groupPath || '',
      title: formData.title,
      username: formData.username,
      password: formData.password,
      passwordHistory: [
        {
          id: generateUUID(),
          password: formData.password,
          changedAt: now,
          username: formData.username,
        },
      ],
      url: formData.url,
      notes: formData.notes,
      tags: formData.tags || [],
      favorite: formData.favorite || false,
      customFields: formData.customFields || {},
      createdAt: now,
      modifiedAt: now,
      lastAccessedAt: now,
    };

    const entries = await this.getEntries(vaultId);
    entries.push(entry);
    await this.saveEntries(vaultId, entries);
    this.scheduleAutoBackup(vaultId, 'entry_add');

    return entry;
  }

  async updateEntry(vaultId: string, entryId: string, formData: PasswordEntryFormData): Promise<PasswordEntry> {
    if (!this.isUnlocked()) throw new Error('Vault is locked');
    const entries = await this.getEntries(vaultId);
    const index = entries.findIndex(e => e.id === entryId);
    if (index === -1) throw new Error('Entry not found');

    const entry = entries[index];
    const history: PasswordHistoryItem[] = Array.isArray(entry.passwordHistory)
      ? [...entry.passwordHistory]
      : [];

    if (formData.password && formData.password !== entry.password) {
      history.push({
        id: generateUUID(),
        password: formData.password,
        changedAt: Date.now(),
        username: formData.username,
      });
    }

    const updated: PasswordEntry = {
      ...entry,
      ...formData,
      passwordHistory: history,
      modifiedAt: Date.now(),
    };

    entries[index] = updated;
    await this.saveEntries(vaultId, entries);
    this.scheduleAutoBackup(vaultId, 'entry_update');
    return updated;
  }

  async deleteEntry(vaultId: string, entryId: string): Promise<void> {
    const col = this.getSubCollection(vaultId, ENTRIES_COLLECTION);
    const entryRef = doc(col, entryId);
    await deleteDoc(entryRef);
    await this.updateEntryCount(vaultId);
    this.scheduleAutoBackup(vaultId, 'entry_delete');
  }

  async getGroups(vaultId: string): Promise<PasswordGroup[]> {
    const col = this.getSubCollection(vaultId, GROUPS_COLLECTION);
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as PasswordGroup));
  }

  async saveGroups(vaultId: string, groups: PasswordGroup[]): Promise<void> {
    const col = this.getSubCollection(vaultId, GROUPS_COLLECTION);
    const snap = await getDocs(col);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }

    for (const group of groups) {
      const groupRef = doc(col, group.id);
      await setDoc(groupRef, { ...group, modifiedAt: serverTimestamp() });
    }
  }

  async addGroup(vaultId: string, formData: GroupFormData): Promise<PasswordGroup> {
    const groups = await this.getGroups(vaultId);
    const groupId = generateUUID();
    
    const group: PasswordGroup = {
      id: groupId,
      name: formData.name,
      parentId: formData.parentId,
      fullPath: formData.parentId ? groups.find(g => g.id === formData.parentId)?.fullPath + '/' + formData.name : formData.name,
      entryCount: 0,
      children: [],
      isExpanded: false,
    };

    groups.push(group);
    await this.saveGroups(vaultId, groups);
    this.scheduleAutoBackup(vaultId, 'group_add');
    return group;
  }

  async updateGroup(vaultId: string, groupId: string, newName: string): Promise<PasswordGroup> {
    const groups = await this.getGroups(vaultId);
    const index = groups.findIndex((group) => group.id === groupId);
    if (index === -1) throw new Error('Group not found');

    const target = groups[index];
    const oldPath = target.fullPath;
    const parentPath = target.parentId
      ? groups.find((group) => group.id === target.parentId)?.fullPath || ''
      : '';
    const nextPath = parentPath ? `${parentPath}/${newName}` : newName;

    const updatedGroups = groups.map((group) => {
      if (group.id === groupId) {
        return { ...group, name: newName, fullPath: nextPath };
      }

      if (group.fullPath.startsWith(`${oldPath}/`)) {
        return {
          ...group,
          fullPath: group.fullPath.replace(oldPath, nextPath),
        };
      }

      return group;
    });

    const entries = await this.getEntries(vaultId);
    const updatedEntries = entries.map((entry) => {
      if (!entry.groupPath) return entry;
      if (entry.groupPath === oldPath || entry.groupPath.startsWith(`${oldPath}/`)) {
        return {
          ...entry,
          groupPath: entry.groupPath.replace(oldPath, nextPath),
          modifiedAt: Date.now(),
        };
      }
      return entry;
    });

    await this.saveGroups(vaultId, updatedGroups);
    await this.saveEntries(vaultId, updatedEntries);
    this.scheduleAutoBackup(vaultId, 'group_update');
    return updatedGroups[index];
  }

  async deleteGroup(vaultId: string, groupId: string): Promise<void> {
    const groups = await this.getGroups(vaultId);
    const target = groups.find((group) => group.id === groupId);
    if (!target) throw new Error('Group not found');

    const deletedIds = new Set<string>([groupId]);
    let changed = true;
    while (changed) {
      changed = false;
      for (const group of groups) {
        if (group.parentId && deletedIds.has(group.parentId) && !deletedIds.has(group.id)) {
          deletedIds.add(group.id);
          changed = true;
        }
      }
    }

    const filtered = groups.filter((group) => !deletedIds.has(group.id));

    const entries = await this.getEntries(vaultId);
    const updatedEntries = entries.map((entry) => {
      if (entry.groupId && deletedIds.has(entry.groupId)) {
        return {
          ...entry,
          groupId: null,
          groupPath: '',
          modifiedAt: Date.now(),
        };
      }

      return entry;
    });

    await this.saveGroups(vaultId, filtered);
    await this.saveEntries(vaultId, updatedEntries);
    this.scheduleAutoBackup(vaultId, 'group_delete');
  }

  private async deleteEntries(vaultId: string): Promise<void> {
    const col = this.getSubCollection(vaultId, ENTRIES_COLLECTION);
    const snap = await getDocs(col);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }

  private async deleteGroups(vaultId: string): Promise<void> {
    const col = this.getSubCollection(vaultId, GROUPS_COLLECTION);
    const snap = await getDocs(col);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }

  async getEntriesByGroup(vaultId: string): Promise<Record<string, PasswordEntry[]>> {
    const entries = await this.getEntries(vaultId);
    const groups = await this.getGroups(vaultId);
    
    const result: Record<string, PasswordEntry[]> = { '': [] };
    
    for (const group of groups) {
      result[group.id] = [];
    }
    
    for (const entry of entries) {
      const groupId = entry.groupId || '';
      if (!result[groupId]) result[groupId] = [];
      result[groupId].push(entry);
    }
    
    return result;
  }

  private async updateEntryCount(vaultId: string): Promise<void> {
    const entries = await this.getEntries(vaultId);
    const vaultMeta = await this.getVaultMeta(vaultId);
    if (vaultMeta) {
      vaultMeta.entryCount = entries.length;
      vaultMeta.modifiedAt = Date.now();
      await this.saveVaultMeta(vaultMeta);
    }
  }

  async unlockVault(vaultId: string, masterPassword: string): Promise<boolean> {
    const vaultMeta = await this.getVaultMeta(vaultId);
    if (!vaultMeta) throw new Error('Vault not found');

    let key: Uint8Array;
    try {
      key = await cryptoService.unlockVault(masterPassword, vaultMeta.salt, vaultMeta.verificationHash);
    } catch (error: any) {
      if (error?.message === 'Invalid vault password') {
        return false;
      }
      throw error;
    }
    this.setCurrentVault(vaultId, key);

    vaultMeta.lastUnlockedAt = Date.now();
    await this.saveVaultMeta(vaultMeta);
    return true;
  }

  async generateRecoveryKey(vaultId: string): Promise<string> {
    return passwordBackupService.generateRecoveryKey(vaultId);
  }

  async clearRecoveryKey(vaultId: string): Promise<void> {
    await passwordBackupService.clearRecoveryKey(vaultId);
  }

  async clearLocalRecoveryKey(vaultId: string): Promise<void> {
    await passwordBackupService.clearLocalRecoveryKey(vaultId);
  }

  async getRecoveryKey(vaultId: string): Promise<string | null> {
    return passwordBackupService.getRecoveryKey(vaultId);
  }

  async getBackupStatus(vaultId: string): Promise<PasswordBackupStatus> {
    return passwordBackupService.getBackupStatus(vaultId);
  }

  async listCloudBackups(): Promise<CloudBackupRecord[]> {
    return passwordBackupService.listCloudBackups();
  }

  async backupNow(vaultId: string): Promise<PasswordBackupStatus> {
    if (!this.encryptionKey || this.currentVaultId !== vaultId) {
      throw new Error('Unlock this vault before creating backup');
    }

    const [vault, groups, entries] = await Promise.all([
      this.getVaultMeta(vaultId),
      this.getGroups(vaultId),
      this.getEntries(vaultId),
    ]);

    if (!vault) throw new Error('Vault not found');

    return passwordBackupService.backupVaultSnapshot(
      vaultId,
      { vault, groups, entries },
      this.encryptionKey,
      'manual',
    );
  }

  private remapRestoredData(existingGroups: PasswordGroup[], existingEntries: PasswordEntry[], incomingGroups: PasswordGroup[], incomingEntries: PasswordEntry[]) {
    const groupIdMap = new Map<string, string>();
    const usedGroupIds = new Set(existingGroups.map((group) => group.id));
    const usedEntryIds = new Set(existingEntries.map((entry) => entry.id));

    const byId = new Map(incomingGroups.map((group) => [group.id, group]));
    const depthOf = (group: PasswordGroup): number => {
      if (!group.parentId) return 0;
      const parent = byId.get(group.parentId);
      return parent ? depthOf(parent) + 1 : 0;
    };

    const orderedGroups = [...incomingGroups].sort((left, right) => depthOf(left) - depthOf(right));

    const groups = orderedGroups.map((group) => {
      const nextId = usedGroupIds.has(group.id) ? generateUUID() : group.id;
      usedGroupIds.add(nextId);
      groupIdMap.set(group.id, nextId);

      return {
        ...group,
        id: nextId,
        parentId: group.parentId ? groupIdMap.get(group.parentId) || group.parentId : null,
      };
    });

    const entries = incomingEntries.map((entry) => {
      const nextId = usedEntryIds.has(entry.id) ? generateUUID() : entry.id;
      usedEntryIds.add(nextId);
      return {
        ...entry,
        id: nextId,
        groupId: entry.groupId ? groupIdMap.get(entry.groupId) || entry.groupId : null,
      };
    });

    return { groups, entries };
  }

  async restoreFromBackup(
    vaultId: string,
    mode: RestoreMode,
    authType: RestoreAuthType,
    secret: string,
  ): Promise<{ groupsRestored: number; entriesRestored: number }> {
    if (!secret.trim()) throw new Error('Authentication value is required');

    let restored;
    if (authType === 'vault_password') {
      const vault = await this.getVaultMeta(vaultId);
      if (!vault) throw new Error('Vault not found');
      const key = await cryptoService.unlockVault(secret, vault.salt, vault.verificationHash);
      this.setCurrentVault(vaultId, key);
      restored = await passwordBackupService.restoreSnapshotWithVaultPassword(vaultId, key);
    } else {
      if (!this.encryptionKey || this.currentVaultId !== vaultId) {
        throw new Error('Unlock this vault first, or restore using master password');
      }
      restored = await passwordBackupService.restoreSnapshotWithRecoveryKey(vaultId, secret);
    }

    const incomingGroups = restored.snapshot.groups || [];
    const incomingEntries = restored.snapshot.entries || [];

    if (mode === 'overwrite') {
      await this.saveGroups(vaultId, incomingGroups);
      await this.saveEntries(vaultId, incomingEntries);
      return {
        groupsRestored: incomingGroups.length,
        entriesRestored: incomingEntries.length,
      };
    }

    const [existingGroups, existingEntries] = await Promise.all([
      this.getGroups(vaultId),
      this.getEntries(vaultId),
    ]);

    // Merge mode now performs an upsert by id to prevent duplicate records.
    const groupsById = new Map(existingGroups.map((group) => [group.id, group]));
    for (const group of incomingGroups) {
      groupsById.set(group.id, group);
    }

    const entriesById = new Map(existingEntries.map((entry) => [entry.id, entry]));
    for (const entry of incomingEntries) {
      entriesById.set(entry.id, entry);
    }

    await this.saveGroups(vaultId, Array.from(groupsById.values()));
    await this.saveEntries(vaultId, Array.from(entriesById.values()));

    return {
      groupsRestored: incomingGroups.length,
      entriesRestored: incomingEntries.length,
    };
  }

  async restoreDeletedVaultFromBackup(
    vaultId: string,
    authType: RestoreAuthType,
    secret: string,
    mode: RestoreMode = 'overwrite',
  ): Promise<{ vaultName: string; groupsRestored: number; entriesRestored: number }> {
    if (!vaultId.trim()) throw new Error('Vault id is required');
    if (!secret.trim()) throw new Error('Authentication value is required');

    const existing = await this.getVaultMeta(vaultId);
    if (existing) {
      throw new Error('Vault already exists. Open the vault and use restore from inside it.');
    }

    const restored = authType === 'vault_password'
      ? await passwordBackupService.restoreSnapshotWithVaultPasswordValue(vaultId, secret)
      : await passwordBackupService.restoreSnapshotWithRecoveryKey(vaultId, secret.trim());
    const snapshotVault = restored.snapshot.vault;
    const incomingGroups = restored.snapshot.groups || [];
    const incomingEntries = restored.snapshot.entries || [];
    const now = Date.now();

    const restoredMeta: VaultMeta = {
      ...snapshotVault,
      id: vaultId,
      modifiedAt: now,
      entryCount: incomingEntries.length,
      lastUnlockedAt: null,
    };

    await this.saveVaultMeta(restoredMeta);
    await passwordBackupService.linkRecoveryKeyToVault(
      vaultId,
      { vaultName: restoredMeta.name, vaultType: restoredMeta.type },
      authType === 'recovery_key' ? secret : undefined,
    );

    if (authType === 'vault_password') {
      const key = await cryptoService.unlockVault(secret, restoredMeta.salt, restoredMeta.verificationHash);
      this.setCurrentVault(vaultId, key);
    } else if (!this.encryptionKey || this.currentVaultId !== vaultId) {
      throw new Error('Master password is required to finalize restore for this vault');
    }

    if (mode === 'overwrite') {
      await this.saveGroups(vaultId, incomingGroups);
      await this.saveEntries(vaultId, incomingEntries);
      return {
        vaultName: restoredMeta.name,
        groupsRestored: incomingGroups.length,
        entriesRestored: incomingEntries.length,
      };
    }

    const [existingGroups, existingEntries] = await Promise.all([
      this.getGroups(vaultId),
      this.getEntries(vaultId),
    ]);
    const merged = this.remapRestoredData(existingGroups, existingEntries, incomingGroups, incomingEntries);
    await this.saveGroups(vaultId, [...existingGroups, ...merged.groups]);
    await this.saveEntries(vaultId, [...existingEntries, ...merged.entries]);

    return {
      vaultName: restoredMeta.name,
      groupsRestored: merged.groups.length,
      entriesRestored: merged.entries.length,
    };
  }

  async deleteVault(vaultId: string): Promise<void> {
    await this.deleteEntries(vaultId);
    await this.deleteGroups(vaultId);
    // Keep Firebase recovery-key document for future restore, clear only local copy.
    await this.clearLocalRecoveryKey(vaultId);
    
    const vaultRef = this.getUserDoc(VAULTS_COLLECTION, vaultId);
    await deleteDoc(vaultRef);

    if (this.currentVaultId === vaultId) {
      this.lockVault();
    }
  }

  async renameVault(vaultId: string, newName: string): Promise<void> {
    const vaultMeta = await this.getVaultMeta(vaultId);
    if (!vaultMeta) throw new Error('Vault not found');
    vaultMeta.name = newName;
    vaultMeta.modifiedAt = Date.now();
    await this.saveVaultMeta(vaultMeta);
  }

  async changeMasterPassword(vaultId: string, oldPassword: string, newPassword: string): Promise<void> {
    const isValid = await this.unlockVault(vaultId, oldPassword);
    if (!isValid) throw new Error('Invalid current password');

    const { salt, verificationHash } = await cryptoService.createVault(newPassword);
    const vaultMeta = await this.getVaultMeta(vaultId);
    if (!vaultMeta) throw new Error('Vault not found');

    vaultMeta.salt = salt;
    vaultMeta.verificationHash = verificationHash;
    vaultMeta.modifiedAt = Date.now();
    await this.saveVaultMeta(vaultMeta);
  }

  subscribeToVault(vaultId: string, callback: (vault: VaultMeta | null) => void): () => void {
    return onSnapshot(this.getUserDoc(VAULTS_COLLECTION, vaultId), (snap) => {
      callback(snap.exists() ? { id: snap.id, ...snap.data() } as VaultMeta : null);
    });
  }

  subscribeToEntries(vaultId: string, callback: (entries: PasswordEntry[]) => void): () => void {
    return onSnapshot(this.getSubCollection(vaultId, ENTRIES_COLLECTION), async (snap) => {
      const entries = await this.getEntries(vaultId);
      callback(entries);
    });
  }

  subscribeToGroups(vaultId: string, callback: (groups: PasswordGroup[]) => void): () => void {
    return onSnapshot(this.getSubCollection(vaultId, GROUPS_COLLECTION), async () => {
      const groups = await this.getGroups(vaultId);
      callback(groups);
    });
  }

  // For pwsafe import
  async createPwsafeVault(name: string, entries: PwsafeEntry[], password: string): Promise<VaultMeta> {
    if (!this.userId) throw new Error('User not authenticated');
    
    const vaultId = generateUUID();
    const now = Date.now();
    const { salt, verificationHash } = await cryptoService.createVault(password);

    const vaultMeta: VaultMeta = {
      id: vaultId,
      name,
      type: 'pwsafe',
      salt,
      verificationHash,
      createdAt: now,
      modifiedAt: now,
      entryCount: entries.length,
      lastUnlockedAt: null,
    };

    await this.saveVaultMeta(vaultMeta);

    const initialKey = await cryptoService.unlockVault(password, salt, verificationHash);
    this.setCurrentVault(vaultId, initialKey);
    
    const convertedEntries: PasswordEntry[] = entries.map(entry => ({
      id: entry.uuid,
      groupId: null,
      groupPath: entry.group || 'Imported',
      title: entry.title,
      username: entry.username,
      password: entry.password,
      passwordHistory: [
        {
          id: generateUUID(),
          password: entry.password,
          changedAt: entry.passwordModTime || entry.lastModificationTime || Date.now(),
          username: entry.username,
        },
      ],
      url: entry.url,
      notes: entry.notes,
      tags: ['imported'],
      favorite: false,
      customFields: {},
      createdAt: entry.createdTime,
      modifiedAt: entry.lastModificationTime,
      lastAccessedAt: entry.lastAccessTime,
    }));
    
    await this.saveEntries(vaultId, convertedEntries);
    this.scheduleAutoBackup(vaultId, 'manual');
    return vaultMeta;
  }
}

export const vaultService = new VaultService();