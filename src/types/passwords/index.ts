// Password Manager Types

// ==================== Entry Types ====================

export interface PasswordEntry {
  id: string;
  groupId: string | null;
  groupPath: string;
  title: string;
  username: string;
  password: string;
  passwordHistory?: PasswordHistoryItem[];
  url: string;
  notes: string;
  email?: string;
  phone?: string;
  tags: string[];
  favorite: boolean;
  customFields: Record<string, string>;
  createdAt: number;
  modifiedAt: number;
  lastAccessedAt: number;
}

export interface PasswordHistoryItem {
  id: string;
  password: string;
  changedAt: number;
  username?: string;
}

export interface EncryptedEntry {
  id: string;
  groupPath: string;
  title: string;
  encryptedData: string;
  iv: string;
  authTag: string;
  createdAt: number;
  modifiedAt: number;
}

export interface DoubleEncryptedEntry {
  id: string;
  groupPath: string;
  title: string;
  // AES-256-GCM layer
  aesEncryptedData: string;
  aesIv: string;
  aesAuthTag: string;
  // ChaCha20-Poly1305 layer
  chachaEncryptedData: string;
  chachaNonce: string;
  chachaTag: string;
  // HMAC for verification
  hmac: string;
  createdAt: number;
  modifiedAt: number;
}

// ==================== Group Types ====================

export interface PasswordGroup {
  id: string;
  name: string;
  parentId: string | null;
  fullPath: string;
  entryCount: number;
  children: PasswordGroup[];
  isExpanded: boolean;
}

// ==================== Vault Types ====================

export type VaultType = 'pwsafe' | 'secure';

export interface VaultMeta {
  id: string;
  name: string;
  type: VaultType;
  salt: string;
  verificationHash: string;
  createdAt: number;
  modifiedAt: number;
  entryCount: number;
  lastUnlockedAt: number | null;
}

export interface Vault {
  id: string;
  name: string;
  type: VaultType;
  createdAt: number;
  modifiedAt: number;
  groups: PasswordGroup[];
  entries: PasswordEntry[];
}

// ==================== pwsafe Types ====================

export interface PwsafeEntry {
  uuid: string;
  group: string;
  title: string;
  username: string;
  password: string;
  notes: string;
  url: string;
  createdTime: number;
  passwordModTime: number;
  lastAccessTime: number;
  passwordExpiryTime: number;
  lastModificationTime: number;
}

export interface PwsafeHeader {
  version: number;
  uuid: string;
  lastSaveTime: number;
  lastSaveUser: string;
  lastSaveHost: string;
  dbName: string;
  dbDescription: string;
}

// ==================== Crypto Types ====================

export interface DerivedKey {
  encryptionKey: Uint8Array;
  hmacKey: Uint8Array;
  salt: Uint8Array;
}

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  authTag: string;
}

export interface DoubleEncryptedData {
  version?: number;
  algorithm?: string;
  kdf?: string;
  nonce?: string;
  ciphertext?: string;
  aesCiphertext?: string;
  aesIv?: string;
  aesAuthTag?: string;
  chachaCiphertext?: string;
  chachaNonce?: string;
  chachaTag?: string;
  hmac?: string;
}

export type DoubleEncryptedResult = DoubleEncryptedData;

export interface CryptoConfig {
  argon2Memory: number;      // KB (default: 256MB = 262144)
  argon2Iterations: number;
  argon2Parallelism: number;
  keyLength: number;         // bytes
  saltLength: number;        // bytes
  ivLength: number;          // bytes (12 for GCM)
}

// ==================== Import/Export Types ====================

export interface ImportResult {
  success: boolean;
  entriesImported: number;
  entriesSkipped: number;
  errors: string[];
}

export interface ExportResult {
  success: boolean;
  filePath: string;
  entriesExported: number;
  error?: string;
}

// ==================== Form Types ====================

export interface PasswordEntryFormData {
  groupId: string | null;
  groupPath: string;
  title: string;
  username: string;
  password: string;
  url: string;
  notes: string;
  email?: string;
  phone?: string;
  tags: string[];
  favorite: boolean;
  customFields: Record<string, string>;
}

export interface GroupFormData {
  name: string;
  parentId: string | null;
}

// ==================== UI State Types ====================

export type SortOption = 'title' | 'recent' | 'modified' | 'favorite';
export type FilterOption = 'all' | 'favorites' | 'recent';

export interface PasswordFilter {
  search: string;
  groupPath: string | null;
  sort: SortOption;
  filter: FilterOption;
}