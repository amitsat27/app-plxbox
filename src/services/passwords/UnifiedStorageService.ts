/**
 * Unified Password Storage Service
 * Switches between local (AsyncStorage) and cloud (Firebase) based on user preference
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  VaultMeta, 
  PasswordEntry, 
  PasswordGroup,
  PasswordEntryFormData,
  GroupFormData,
} from '../../types/passwords';
import { cryptoService } from './CryptoService';
import { firebasePasswordStorage } from './FirebaseStorageService';

const VAULT_META_PREFIX = 'vault_meta_';
const VAULT_ENTRIES_PREFIX = 'vault_entries_';
const VAULT_GROUPS_PREFIX = 'vault_groups_';

export type StorageMode = 'local' | 'cloud';

export class UnifiedPasswordStorageService {
  private storageMode: StorageMode = 'local';
  private userId: string | null = null;
  private encryptionKey: Uint8Array | null = null;

  setMode(mode: StorageMode) {
    this.storageMode = mode;
  }

  setUser(userId: string) {
    this.userId = userId;
    firebasePasswordStorage.setUser(userId);
  }

  setEncryptionKey(key: Uint8Array) {
    this.encryptionKey = key;
    firebasePasswordStorage.setEncryptionKey(key);
  }

  private getCloud() {
    return firebasePasswordStorage;
  }

  private async getLocalEntries(vaultId: string): Promise<PasswordEntry[]> {
    const data = await AsyncStorage.getItem(VAULT_ENTRIES_PREFIX + vaultId);
    if (!data) return [];
    
    try {
      const entries = JSON.parse(data);
// Decrypt entries if key available
    const key = this.encryptionKey;
    if (key && entries.length > 0) {
      const decrypted: PasswordEntry[] = [];
      for (const entry of entries) {
        if (entry.encrypted && key) {
          const decryptedData = await cryptoService.decrypt(
            entry.encrypted,
            key
          );
          decrypted.push(JSON.parse(decryptedData));
        } else {
          decrypted.push(entry);
        }
      }
      return decrypted;
    }
    return entries;
    } catch {
      return [];
    }
  }

  private async saveLocalEntries(vaultId: string, entries: PasswordEntry[]): Promise<void> {
    if (!this.encryptionKey) {
      await AsyncStorage.setItem(
        VAULT_ENTRIES_PREFIX + vaultId,
        JSON.stringify(entries)
      );
      return;
    }

    // Encrypt entries before saving
    const key = this.encryptionKey;
    const encryptedEntries = await Promise.all(
      entries.map(async (entry) => {
        if (key) {
          const encrypted = await cryptoService.encrypt(
            JSON.stringify(entry),
            key
          );
          return { ...entry, encrypted };
        }
        return entry;
      })
    );

    await AsyncStorage.setItem(
      VAULT_ENTRIES_PREFIX + vaultId,
      JSON.stringify(encryptedEntries)
    );
  }

  private async getLocalGroups(vaultId: string): Promise<PasswordGroup[]> {
    const data = await AsyncStorage.getItem(VAULT_GROUPS_PREFIX + vaultId);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveLocalGroups(vaultId: string, groups: PasswordGroup[]): Promise<void> {
    await AsyncStorage.setItem(
      VAULT_GROUPS_PREFIX + vaultId,
      JSON.stringify(groups)
    );
  }

  private async getLocalVaultMeta(vaultId: string): Promise<VaultMeta | null> {
    const data = await AsyncStorage.getItem(VAULT_META_PREFIX + vaultId);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  private async saveLocalVaultMeta(vault: VaultMeta): Promise<void> {
    await AsyncStorage.setItem(
      VAULT_META_PREFIX + vault.id,
      JSON.stringify(vault)
    );
  }

  private async getLocalAllVaultIds(): Promise<string[]> {
    const data = await AsyncStorage.getItem('all_vaults');
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private async saveLocalAllVaultIds(ids: string[]): Promise<void> {
    await AsyncStorage.setItem('all_vaults', JSON.stringify(ids));
  }

  private async deleteLocalVaultMeta(vaultId: string): Promise<void> {
    await AsyncStorage.removeItem(VAULT_META_PREFIX + vaultId);
  }

  private async deleteLocalEntries(vaultId: string): Promise<void> {
    await AsyncStorage.removeItem(VAULT_ENTRIES_PREFIX + vaultId);
  }

  private async deleteLocalGroups(vaultId: string): Promise<void> {
    await AsyncStorage.removeItem(VAULT_GROUPS_PREFIX + vaultId);
  }

  // ==================== Public API (Mode-Agnostic) ====================

  async getVaultMeta(vaultId: string): Promise<VaultMeta | null> {
    if (this.storageMode === 'cloud') {
      return this.getCloud().getVaultMeta(vaultId);
    }
    return this.getLocalVaultMeta(vaultId);
  }

  async saveVaultMeta(vault: VaultMeta): Promise<void> {
    if (this.storageMode === 'cloud') {
      return this.getCloud().saveVaultMeta(vault);
    }
    return this.saveLocalVaultMeta(vault);
  }

  async getEntries(vaultId: string): Promise<PasswordEntry[]> {
    if (this.storageMode === 'cloud') {
      return this.getCloud().getEntries(vaultId);
    }
    return this.getLocalEntries(vaultId);
  }

  async saveEntries(vaultId: string, entries: PasswordEntry[]): Promise<void> {
    if (this.storageMode === 'cloud') {
      return this.getCloud().saveEntries(vaultId, entries);
    }
    return this.saveLocalEntries(vaultId, entries);
  }

  async getGroups(vaultId: string): Promise<PasswordGroup[]> {
    if (this.storageMode === 'cloud') {
      return this.getCloud().getGroups(vaultId);
    }
    return this.getLocalGroups(vaultId);
  }

  async saveGroups(vaultId: string, groups: PasswordGroup[]): Promise<void> {
    if (this.storageMode === 'cloud') {
      return this.getCloud().saveGroups(vaultId, groups);
    }
    return this.saveLocalGroups(vaultId, groups);
  }

  async deleteVault(vaultId: string): Promise<void> {
    if (this.storageMode === 'cloud') {
      return this.getCloud().deleteVault(vaultId);
    }
    await this.deleteLocalVaultMeta(vaultId);
    await this.deleteLocalEntries(vaultId);
    await this.deleteLocalGroups(vaultId);
    
    // Remove from all vaults list
    const ids = await this.getLocalAllVaultIds();
    const filtered = ids.filter(id => id !== vaultId);
    await this.saveLocalAllVaultIds(filtered);
  }

  async getAllVaultIds(): Promise<string[]> {
    if (this.storageMode === 'cloud') {
      return this.getCloud().getAllVaultIds();
    }
    return this.getLocalAllVaultIds();
  }

  async addToAllVaultIds(vaultId: string): Promise<void> {
    const ids = await this.getAllVaultIds();
    if (!ids.includes(vaultId)) {
      ids.push(vaultId);
      if (this.storageMode === 'local') {
        await this.saveLocalAllVaultIds(ids);
      }
    }
  }
}

export const unifiedPasswordStorage = new UnifiedPasswordStorageService();