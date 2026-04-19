import { cacheDirectory, documentDirectory, EncodingType, readAsStringAsync, writeAsStringAsync } from 'expo-file-system/legacy';
import { vaultService } from './VaultService';
import { cryptoService, deriveKey, bytesToBase64, base64ToBytes, generateRandomBytes } from './CryptoService';
import type { PasswordEntry, PasswordGroup, VaultMeta } from '../../types/passwords';

export type VaultTransferScope = 'vault' | 'group';

export interface VaultTransferPreview {
  scope: VaultTransferScope;
  label: string;
  groupCount: number;
  entryCount: number;
  exportedAt: number;
  sourceFileName: string;
}

interface VaultTransferFile {
  format: 'PulseboxVaultX';
  version: 1;
  scope: VaultTransferScope;
  sourceName: string;
  exportedAt: number;
  salt: string;
  encryptedPayload: unknown;
}

interface VaultExportPayload {
  kind: 'vault';
  vault: VaultMeta;
  groups: PasswordGroup[];
  entries: PasswordEntry[];
}

interface GroupExportPayload {
  kind: 'group';
  sourceVaultId: string;
  sourceGroupId: string;
  group: PasswordGroup;
  groups: PasswordGroup[];
  entries: PasswordEntry[];
}

interface ParsedTransfer<T> {
  file: VaultTransferFile;
  payload: T;
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0;
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function sanitizeFileName(name: string): string {
  return name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60) || 'vault';
}

function buildPath(fileName: string): string {
  const baseDirectory = documentDirectory || cacheDirectory || '';
  return `${baseDirectory}${fileName}`;
}

function collectDescendantGroups(groups: PasswordGroup[], rootGroupId: string): PasswordGroup[] {
  const byParent = new Map<string | null, PasswordGroup[]>();
  for (const group of groups) {
    const list = byParent.get(group.parentId ?? null) || [];
    list.push(group);
    byParent.set(group.parentId ?? null, list);
  }

  const result: PasswordGroup[] = [];
  const stack = [...(byParent.get(rootGroupId) || [])];

  while (stack.length > 0) {
    const group = stack.shift()!;
    result.push(group);
    const children = byParent.get(group.id) || [];
    stack.unshift(...children);
  }

  return result;
}

function orderGroups(groups: PasswordGroup[]): PasswordGroup[] {
  const byId = new Map(groups.map((group) => [group.id, group]));

  const depthOf = (group: PasswordGroup): number => {
    if (!group.parentId) return 0;
    const parent = byId.get(group.parentId);
    return parent ? depthOf(parent) + 1 : 0;
  };

  return [...groups].sort((left, right) => depthOf(left) - depthOf(right));
}

function createFilePreview(scope: VaultTransferScope, label: string, groups: PasswordGroup[], entries: PasswordEntry[], sourceFileName: string, exportedAt: number): VaultTransferPreview {
  return {
    scope,
    label,
    groupCount: groups.length,
    entryCount: entries.length,
    exportedAt,
    sourceFileName,
  };
}

function validateTransferFile(value: any): VaultTransferFile {
  if (!value || typeof value !== 'object') {
    throw new Error('Invalid export file');
  }
  if (value.format !== 'PulseboxVaultX' || value.version !== 1) {
    throw new Error('Unsupported export file version');
  }
  if (value.scope !== 'vault' && value.scope !== 'group') {
    throw new Error('Invalid export file scope');
  }
  if (typeof value.salt !== 'string' || typeof value.sourceName !== 'string') {
    throw new Error('Corrupted export file');
  }
  return value as VaultTransferFile;
}

async function encryptTransferPayload(scope: VaultTransferScope, sourceName: string, password: string, payload: VaultExportPayload | GroupExportPayload): Promise<string> {
  const salt = bytesToBase64(await generateRandomBytes(16));
  const derived = await deriveKey(password, base64ToBytes(salt));
  const encryptedPayload = await cryptoService.encrypt(JSON.stringify(payload), derived.encryptionKey);

  const file: VaultTransferFile = {
    format: 'PulseboxVaultX',
    version: 1,
    scope,
    sourceName,
    exportedAt: Date.now(),
    salt,
    encryptedPayload,
  };

  return JSON.stringify(file, null, 2);
}

async function decryptTransferFile<T>(fileUri: string, password: string): Promise<ParsedTransfer<T>> {
  const raw = await readAsStringAsync(fileUri);
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('File is not a valid vault export');
  }

  const file = validateTransferFile(parsed);
  const derived = await deriveKey(password, base64ToBytes(file.salt));

  try {
    const decrypted = await cryptoService.decrypt(file.encryptedPayload as any, derived.encryptionKey);
    return {
      file,
      payload: JSON.parse(decrypted) as T,
    };
  } catch {
    throw new Error('Incorrect password or corrupted export file');
  }
}

function remapImportedData(existingGroups: PasswordGroup[], existingEntries: PasswordEntry[], groups: PasswordGroup[], entries: PasswordEntry[]): { groups: PasswordGroup[]; entries: PasswordEntry[] } {
  const groupIdMap = new Map<string, string>();
  const entryIdMap = new Map<string, string>();
  const usedGroupIds = new Set(existingGroups.map((group) => group.id));
  const usedEntryIds = new Set(existingEntries.map((entry) => entry.id));
  const ordered = orderGroups(groups);

  const remappedGroups = ordered.map((group) => {
    const nextId = usedGroupIds.has(group.id) ? generateUUID() : group.id;
    usedGroupIds.add(nextId);
    groupIdMap.set(group.id, nextId);

    return {
      ...group,
      id: nextId,
      parentId: group.parentId ? groupIdMap.get(group.parentId) || group.parentId : null,
    };
  });

  const remappedEntries = entries.map((entry) => {
    const nextId = usedEntryIds.has(entry.id) ? generateUUID() : entry.id;
    usedEntryIds.add(nextId);
    entryIdMap.set(entry.id, nextId);

    return {
      ...entry,
      id: nextId,
      groupId: entry.groupId ? groupIdMap.get(entry.groupId) || entry.groupId : null,
    };
  });

  return { groups: remappedGroups, entries: remappedEntries };
}

export class VaultTransferService {
  async exportVault(vaultId: string, exportPassword: string): Promise<{ fileUri: string; fileName: string; preview: VaultTransferPreview }> {
    const [vaultMeta, groups, entries] = await Promise.all([
      vaultService.getVaultMeta(vaultId),
      vaultService.getGroups(vaultId),
      vaultService.getEntries(vaultId),
    ]);

    if (!vaultMeta) {
      throw new Error('Vault not found');
    }

    const preview = createFilePreview('vault', vaultMeta.name, groups, entries, `${sanitizeFileName(vaultMeta.name)}.vaultx`, Date.now());
    const payload: VaultExportPayload = {
      kind: 'vault',
      vault: vaultMeta,
      groups,
      entries,
    };

    const fileName = `${sanitizeFileName(vaultMeta.name)}_${Date.now()}.vaultx`;
    const fileUri = buildPath(fileName);
    const contents = await encryptTransferPayload('vault', vaultMeta.name, exportPassword, payload);
    await writeAsStringAsync(fileUri, contents, { encoding: EncodingType.UTF8 });

    return { fileUri, fileName, preview };
  }

  async exportGroup(vaultId: string, groupId: string, exportPassword: string): Promise<{ fileUri: string; fileName: string; preview: VaultTransferPreview }> {
    const [groups, entries] = await Promise.all([vaultService.getGroups(vaultId), vaultService.getEntries(vaultId)]);
    const group = groups.find((item) => item.id === groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const groupTree = [group, ...collectDescendantGroups(groups, group.id)];
    const groupIds = new Set(groupTree.map((item) => item.id));
    const groupEntries = entries.filter((entry) => entry.groupId && groupIds.has(entry.groupId));

    const preview = createFilePreview('group', group.name, groupTree, groupEntries, `${sanitizeFileName(group.name)}.groupx`, Date.now());
    const payload: GroupExportPayload = {
      kind: 'group',
      sourceVaultId: vaultId,
      sourceGroupId: group.id,
      group,
      groups: groupTree,
      entries: groupEntries,
    };

    const fileName = `${sanitizeFileName(group.name)}_${Date.now()}.groupx`;
    const fileUri = buildPath(fileName);
    const contents = await encryptTransferPayload('group', group.name, exportPassword, payload);
    await writeAsStringAsync(fileUri, contents, { encoding: EncodingType.UTF8 });

    return { fileUri, fileName, preview };
  }

  async previewImport(fileUri: string, password: string): Promise<VaultTransferPreview & { file: VaultTransferFile; payload: VaultExportPayload | GroupExportPayload }> {
    const parsed = await decryptTransferFile<VaultExportPayload | GroupExportPayload>(fileUri, password);
    const { file, payload } = parsed;

    if (payload.kind === 'vault') {
      return {
        ...createFilePreview('vault', payload.vault.name, payload.groups, payload.entries, file.sourceName, file.exportedAt),
        file,
        payload,
      };
    }

    return {
      ...createFilePreview('group', payload.group.name, payload.groups, payload.entries, file.sourceName, file.exportedAt),
      file,
      payload,
    };
  }

  async importVaultAsNewVault(fileUri: string, password: string, vaultPassword: string): Promise<VaultMeta> {
    const parsed = await decryptTransferFile<VaultExportPayload>(fileUri, password);
    if (parsed.payload.kind !== 'vault') {
      throw new Error('Selected file is not a vault export');
    }

    const importedName = parsed.payload.vault.name || 'Imported Vault';
    const vault = await vaultService.createVault(importedName, 'secure', vaultPassword);
    const unlocked = await vaultService.unlockVault(vault.id, vaultPassword);
    if (!unlocked) {
      throw new Error('Failed to unlock imported vault with provided master password');
    }
    const merged = remapImportedData([], [], parsed.payload.groups || [], parsed.payload.entries || []);

    await vaultService.saveGroups(vault.id, merged.groups);
    await vaultService.saveEntries(vault.id, merged.entries);
    return vault;
  }

  async mergeVaultFileIntoExistingVault(fileUri: string, password: string, targetVaultId: string): Promise<void> {
    const parsed = await decryptTransferFile<VaultExportPayload>(fileUri, password);
    if (parsed.payload.kind !== 'vault') {
      throw new Error('Selected file is not a vault export');
    }

    const [existingGroups, existingEntries] = await Promise.all([
      vaultService.getGroups(targetVaultId),
      vaultService.getEntries(targetVaultId),
    ]);

    const merged = remapImportedData(existingGroups, existingEntries, parsed.payload.groups || [], parsed.payload.entries || []);
    await vaultService.saveGroups(targetVaultId, [...existingGroups, ...merged.groups]);
    await vaultService.saveEntries(targetVaultId, [...existingEntries, ...merged.entries]);
  }

  async importGroupFileIntoVault(fileUri: string, password: string, targetVaultId: string): Promise<void> {
    const parsed = await decryptTransferFile<GroupExportPayload>(fileUri, password);
    if (parsed.payload.kind !== 'group') {
      throw new Error('Selected file is not a group export');
    }

    const [existingGroups, existingEntries] = await Promise.all([
      vaultService.getGroups(targetVaultId),
      vaultService.getEntries(targetVaultId),
    ]);

    const merged = remapImportedData(existingGroups, existingEntries, parsed.payload.groups || [], parsed.payload.entries || []);
    await vaultService.saveGroups(targetVaultId, [...existingGroups, ...merged.groups]);
    await vaultService.saveEntries(targetVaultId, [...existingEntries, ...merged.entries]);
  }
}

export const vaultTransferService = new VaultTransferService();