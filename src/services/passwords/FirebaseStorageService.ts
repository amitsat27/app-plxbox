/**
 * FirebasePasswordStorageService - Cloud storage with encryption
 * Stores encrypted vault data in Firebase Firestore
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
  serverTimestamp 
} from 'firebase/firestore';
import { getFirebaseDb } from '../../config/firebaseConfig';
import { cryptoService } from './CryptoService';
import { VaultMeta, PasswordEntry, PasswordGroup } from '../../types/passwords';

const VAULTS_COLLECTION = 'passwords_vaults';
const ENTRIES_SUB_COLLECTION = 'entries';
const GROUPS_SUB_COLLECTION = 'groups';

export class FirebasePasswordStorageService {
  private userId: string | null = null;
  private encryptionKey: Uint8Array | null = null;

  setUser(userId: string) {
    this.userId = userId;
  }

  setEncryptionKey(key: Uint8Array) {
    this.encryptionKey = key;
  }

  private getVaultDoc(vaultId: string) {
    if (!this.userId) throw new Error('User not authenticated');
    return doc(getFirebaseDb(), 'users', this.userId, VAULTS_COLLECTION, vaultId);
  }

  private getEntriesCollection(vaultId: string) {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(getFirebaseDb(), 'users', this.userId, VAULTS_COLLECTION, vaultId, ENTRIES_SUB_COLLECTION);
  }

  private getGroupsCollection(vaultId: string) {
    if (!this.userId) throw new Error('User not authenticated');
    return collection(getFirebaseDb(), 'users', this.userId, VAULTS_COLLECTION, vaultId, GROUPS_SUB_COLLECTION);
  }

  // ==================== Vault Metadata ====================

  async saveVaultMeta(vault: VaultMeta): Promise<void> {
    const vaultData = {
      ...vault,
      updatedAt: serverTimestamp(),
    };
    await setDoc(this.getVaultDoc(vault.id), vaultData, { merge: true });
  }

  async getVaultMeta(vaultId: string): Promise<VaultMeta | null> {
    const snap = await getDoc(this.getVaultDoc(vaultId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...snap.data() } as VaultMeta;
  }

  async getAllVaultIds(): Promise<string[]> {
    if (!this.userId) return [];
    const q = query(collection(getFirebaseDb(), 'users', this.userId, VAULTS_COLLECTION));
    const snap = await getDocs(q);
    return snap.docs.map(d => d.id);
  }

  // ==================== Entries (Stored Encrypted) ====================

  async saveEntries(vaultId: string, entries: PasswordEntry[]): Promise<void> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key required for cloud entry writes');
    }

    const col = this.getEntriesCollection(vaultId);
    
    // Clear existing entries
    const existing = await getDocs(col);
    for (const d of existing.docs) {
      await deleteDoc(d.ref);
    }

    // Save encrypted entries
    for (const entry of entries) {
      const entryDoc = doc(col, entry.id);
      
      // Encrypt sensitive fields
      const encrypted = await this.encryptEntry(entry);
      await setDoc(entryDoc, {
        ...encrypted,
        updatedAt: serverTimestamp(),
      });
    }
  }

  private async encryptEntry(entry: PasswordEntry): Promise<any> {
    if (!this.encryptionKey) {
      throw new Error('Encryption key required for cloud entry encryption');
    }

    return {
      id: entry.id,
      title: entry.title,
      groupId: entry.groupId || null,
      groupPath: entry.groupPath || '',
      createdAt: entry.createdAt,
      modifiedAt: entry.modifiedAt,
      lastAccessedAt: entry.lastAccessedAt,
      encryptedData: await cryptoService.encrypt(JSON.stringify(entry), this.encryptionKey),
    };
  }

  async getEntries(vaultId: string): Promise<PasswordEntry[]> {
    const col = this.getEntriesCollection(vaultId);
    const snap = await getDocs(col);

    const entries: PasswordEntry[] = [];
    for (const document of snap.docs) {
      const data = document.data() as any;
      if (data.encryptedData) {
        if (!this.encryptionKey) {
          throw new Error('Encryption key required for cloud entry decryption');
        }
        const plaintext = await cryptoService.decrypt(data.encryptedData, this.encryptionKey);
        const parsed = JSON.parse(plaintext) as PasswordEntry;
        entries.push({ ...parsed, id: document.id });
      } else {
        entries.push({ id: document.id, ...data } as PasswordEntry);
      }
    }

    return entries;
  }

  async deleteEntries(vaultId: string): Promise<void> {
    const col = this.getEntriesCollection(vaultId);
    const snap = await getDocs(col);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }

  // ==================== Groups ====================

  async saveGroups(vaultId: string, groups: PasswordGroup[]): Promise<void> {
    const col = this.getGroupsCollection(vaultId);
    
    // Clear existing groups
    const existing = await getDocs(col);
    for (const d of existing.docs) {
      await deleteDoc(d.ref);
    }

    // Save groups
    for (const group of groups) {
      const groupDoc = doc(col, group.id);
      await setDoc(groupDoc, {
        ...group,
        updatedAt: serverTimestamp(),
      });
    }
  }

  async getGroups(vaultId: string): Promise<PasswordGroup[]> {
    const col = this.getGroupsCollection(vaultId);
    const snap = await getDocs(col);
    
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
    })) as PasswordGroup[];
  }

  async deleteGroups(vaultId: string): Promise<void> {
    const col = this.getGroupsCollection(vaultId);
    const snap = await getDocs(col);
    for (const d of snap.docs) {
      await deleteDoc(d.ref);
    }
  }

  // ==================== Delete Vault ====================

  async deleteVault(vaultId: string): Promise<void> {
    // Delete all entries
    await this.deleteEntries(vaultId);
    // Delete all groups
    await this.deleteGroups(vaultId);
    // Delete vault metadata
    await deleteDoc(this.getVaultDoc(vaultId));
  }

  // ==================== Subscribe (Real-time) ====================

  subscribeToVault(vaultId: string, callback: (vault: VaultMeta | null) => void): () => void {
    return onSnapshot(this.getVaultDoc(vaultId), (snap) => {
      if (snap.exists()) {
        callback({ id: snap.id, ...snap.data() } as VaultMeta);
      } else {
        callback(null);
      }
    });
  }
}

export const firebasePasswordStorage = new FirebasePasswordStorageService();