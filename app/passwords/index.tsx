/**
 * Passwords Screen - Main entry point for password manager
 * Shows the secure vault list and creation flow.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/theme/color';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { useTheme } from '@/theme/themeProvider';
import * as Haptics from 'expo-haptics';
import { Lock, Shield, Plus, ChevronRight, Upload, Download, Database, Trash2, Eye, EyeOff, Archive, Sparkles, CloudUpload, RotateCcw } from 'lucide-react-native';
import { vaultService, vaultTransferService } from '@/src/services/passwords';
import type { CloudBackupRecord } from '@/src/services/passwords/PasswordBackupService';
import { VaultMeta } from '@/src/types/passwords';
import { useAuth } from '@/src/context/AuthContext';
import {
  PasswordChipBar,
  PasswordEmptyState,
  PasswordHero,
  PasswordSearchBar,
  PasswordSectionHeader,
} from '@/components/passwords/PasswordDesign';

export default function PasswordsScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const getColorScheme = (dark: boolean) => ({
    background: dark ? '#000000' : '#F2F2F7',
    card: dark ? '#1C1C1E' : '#FFFFFF',
    text: dark ? '#FFFFFF' : '#000000',
    textSecondary: dark ? '#8E8E93' : '#8E8E93',
    primary: Colors.primary,
    border: dark ? '#38383A' : '#E5E5EA',
  });

  const scheme = getColorScheme(isDark);

  const [vaults, setVaults] = useState<VaultMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultMeta | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [newVaultName, setNewVaultName] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [creating, setCreating] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFileUri, setImportFileUri] = useState('');
  const [importFileName, setImportFileName] = useState('');
  const [importPassword, setImportPassword] = useState('');
  const [importPreview, setImportPreview] = useState<{
    label: string;
    entryCount: number;
    groupCount: number;
    scope: 'vault' | 'group';
  } | null>(null);
  const [importing, setImporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedExportVault, setSelectedExportVault] = useState<VaultMeta | null>(null);
  const [vaultUnlockForExport, setVaultUnlockForExport] = useState('');
  const [vaultExportPassword, setVaultExportPassword] = useState('');
  const [exporting, setExporting] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [selectedBackupVault, setSelectedBackupVault] = useState<VaultMeta | null>(null);
  const [vaultPasswordForBackup, setVaultPasswordForBackup] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  const [backupStatusMap, setBackupStatusMap] = useState<Record<string, { exists: boolean; lastSyncedAt: number | null }>>({});
  const [showRestoreDeletedModal, setShowRestoreDeletedModal] = useState(false);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupRecord[]>([]);
  const [selectedBackupDocId, setSelectedBackupDocId] = useState('');
  const [restoreAuthType, setRestoreAuthType] = useState<'vault_password' | 'recovery_key'>('vault_password');
  const [recoveryKeyForRestore, setRecoveryKeyForRestore] = useState('');
  const [loadingCloudBackups, setLoadingCloudBackups] = useState(false);
  const [restoringDeletedVault, setRestoringDeletedVault] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');

  useFocusEffect(
    useCallback(() => {
      if (user?.uid) {
        vaultService.setUser(user.uid);
        loadVaults();
      }
    }, [user?.uid])
  );

  const loadVaults = async () => {
    try {
      const allVaults = await vaultService.getAllVaults();
      setVaults(allVaults);

      const statuses = await Promise.all(
        allVaults.map(async (vault) => {
          try {
            const status = await vaultService.getBackupStatus(vault.id);
            return [vault.id, { exists: status.exists, lastSyncedAt: status.lastSyncedAt }] as const;
          } catch {
            return [vault.id, { exists: false, lastSyncedAt: null }] as const;
          }
        })
      );

      setBackupStatusMap(Object.fromEntries(statuses));

      const cloud = await vaultService.listCloudBackups();
      setCloudBackups(cloud);
    } catch (error) {
      console.error('Error loading vaults:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRestoreDeletedModal = async () => {
    setShowRestoreDeletedModal(true);
    setRestoreAuthType('vault_password');
    setRecoveryKeyForRestore('');
    setLoadingCloudBackups(true);

    try {
      const cloud = await vaultService.listCloudBackups();
      setCloudBackups(cloud);
    } catch (error) {
      Alert.alert('Error', 'Failed to load cloud backups');
    } finally {
      setLoadingCloudBackups(false);
    }
  };

  const handleRestoreDeletedVault = async () => {
    if (!selectedBackupDocId) {
      Alert.alert('Error', 'Select a backup record to restore');
      return;
    }
    if (!recoveryKeyForRestore.trim()) {
      Alert.alert('Error', restoreAuthType === 'vault_password' ? 'Enter master password' : 'Enter recovery key');
      return;
    }

    setRestoringDeletedVault(true);
    try {
      const restored = await vaultService.restoreDeletedVaultFromBackup(
        selectedBackupDocId,
        restoreAuthType,
        recoveryKeyForRestore.trim(),
      );
      await loadVaults();
      setShowRestoreDeletedModal(false);
      setSelectedBackupDocId('');
      setRecoveryKeyForRestore('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Vault Restored', `${restored.vaultName} restored with ${restored.groupsRestored} groups and ${restored.entriesRestored} entries.`);
    } catch (error: any) {
      Alert.alert('Restore Failed', error?.message || 'Unable to restore deleted vault');
    } finally {
      setRestoringDeletedVault(false);
    }
  };

  const handleUseSavedRecoveryKey = async () => {
    if (!selectedBackupDocId) {
      Alert.alert('Error', 'Select a backup record first');
      return;
    }

    try {
      const key = await vaultService.getRecoveryKey(selectedBackupDocId);
      if (!key) {
        Alert.alert('Not Found', 'No saved recovery key found on this device for this backup.');
        return;
      }

      setRestoreAuthType('recovery_key');
      setRecoveryKeyForRestore(key);
      Alert.alert('Ready', 'Saved recovery key loaded from this device. Tap Restore to continue.');
    } catch (error) {
      Alert.alert('Error', 'Unable to load saved recovery key from this device');
    }
  };

  const handleStartBackupVault = (vault: VaultMeta) => {
    setSelectedBackupVault(vault);
    setVaultPasswordForBackup('');
    setShowBackupModal(true);
  };

  const handleBackupVault = async () => {
    if (!selectedBackupVault) return;
    if (!vaultPasswordForBackup) {
      Alert.alert('Error', 'Enter vault password');
      return;
    }

    setBackingUp(true);
    try {
      const unlocked = await vaultService.unlockVault(selectedBackupVault.id, vaultPasswordForBackup);
      if (!unlocked) {
        Alert.alert('Error', 'Incorrect vault password');
        return;
      }

      const status = await vaultService.backupNow(selectedBackupVault.id);
      setBackupStatusMap((prev) => ({
        ...prev,
        [selectedBackupVault.id]: { exists: status.exists, lastSyncedAt: status.lastSyncedAt },
      }));

      setShowBackupModal(false);
      setSelectedBackupVault(null);
      setVaultPasswordForBackup('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Vault backup completed');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to backup vault');
    } finally {
      vaultService.lockVault();
      setBackingUp(false);
    }
  };

  const handleCreateVault = async () => {
    if (!newVaultName.trim()) {
      Alert.alert('Error', 'Please enter a vault name');
      return;
    }
    if (masterPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }
    if (masterPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const vaultName = newVaultName.trim();
    const password = masterPassword;
    // Close immediately so UI feels responsive while heavy crypto/network work runs.
    setShowCreateModal(false);
    setNewVaultName('');
    setMasterPassword('');
    setConfirmPassword('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setCreating(true);
    try {
      await vaultService.createVault(vaultName, 'secure', password);
      await loadVaults();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Vault created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create vault');
    } finally {
      setCreating(false);
    }
  };

  const handleSelectVault = (vault: VaultMeta) => {
    setSelectedVault(vault);
    setShowUnlockModal(true);
  };

  const handleImportVaultFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const file = result.assets[0];
      setImportFileUri(file.uri);
      setImportFileName(file.name || 'vault export');
      setImportPassword('');
      setImportPreview(null);
      setShowImportModal(true);
    } catch (error) {
      Alert.alert('Error', 'Failed to open the file picker');
    }
  };

  const handlePreviewImport = async () => {
    if (!importFileUri || !importPassword) {
      Alert.alert('Error', 'Choose a file and enter the export password');
      return;
    }

    setImporting(true);
    try {
      const preview = await vaultTransferService.previewImport(importFileUri, importPassword);
      if (preview.scope !== 'vault') {
        Alert.alert('Unsupported file', 'Group imports must be opened from inside a vault.');
        return;
      }

      setImportPreview({
        label: preview.label,
        entryCount: preview.entryCount,
        groupCount: preview.groupCount,
        scope: preview.scope,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Import failed', error?.message || 'Unable to decrypt or read the file');
    } finally {
      setImporting(false);
    }
  };

  const handleCreateVaultFromImport = async () => {
    if (!importFileUri || !importPassword) return;

    setImporting(true);
    try {
      const created = await vaultTransferService.importVaultAsNewVault(
        importFileUri,
        importPassword,
        importPassword,
      );
      await loadVaults();
      setShowImportModal(false);
      setImportFileUri('');
      setImportPassword('');
      setImportPreview(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', `${created.name} imported successfully`);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to import vault');
    } finally {
      setImporting(false);
    }
  };

  const handleStartExportVault = (vault: VaultMeta) => {
    setSelectedExportVault(vault);
    setVaultUnlockForExport('');
    setVaultExportPassword('');
    setShowExportModal(true);
  };

  const handleExportVault = async () => {
    if (!selectedExportVault) return;
    if (!vaultUnlockForExport || !vaultExportPassword) {
      Alert.alert('Error', 'Enter both vault password and export password');
      return;
    }

    setExporting(true);
    try {
      const unlocked = await vaultService.unlockVault(selectedExportVault.id, vaultUnlockForExport);
      if (!unlocked) {
        Alert.alert('Error', 'Incorrect vault password');
        return;
      }

      const exported = await vaultTransferService.exportVault(selectedExportVault.id, vaultExportPassword);
      await Sharing.shareAsync(exported.fileUri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Share vault export',
      });

      setShowExportModal(false);
      setSelectedExportVault(null);
      setVaultUnlockForExport('');
      setVaultExportPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to export vault');
    } finally {
      setExporting(false);
    }
  };

  const handleVaultOptions = (vault: VaultMeta) => {
    Alert.alert(
      vault.name,
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Rename',
          onPress: async () => {
            Alert.prompt(
              'Rename Vault',
              'Enter new name',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Save',
                  onPress: async (newName?: string) => {
                    if (!newName?.trim()) return;
                    try {
                      await vaultService.renameVault(vault.id, newName.trim());
                      await loadVaults();
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    } catch (error) {
                      Alert.alert('Error', 'Failed to rename vault');
                    }
                  },
                },
              ],
              'plain-text',
              vault.name
            );
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vaultService.deleteVault(vault.id);
              await loadVaults();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete vault');
            }
          },
        },
      ]
    );
  };

  const handleUnlock = async () => {
    if (!selectedVault || !unlockPassword) return;
    setUnlocking(true);
    try {
      const unlocked = await vaultService.unlockVault(selectedVault.id, unlockPassword);
      if (unlocked) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        const route = selectedVault.type === 'secure' ? '/passwords/secure' : '/passwords/pwsafe';
        router.push(`${route}?vaultId=${selectedVault.id}` as any);
      } else {
        Alert.alert('Error', 'Incorrect password');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to unlock vault');
    } finally {
      setUnlocking(false);
      setShowUnlockModal(false);
      setUnlockPassword('');
    }
  };

  const secureVaults = vaults.filter(v => v.type === 'secure');
  const restorableCloudBackups = useMemo(
    () => cloudBackups.filter((backup) => !vaults.some((vault) => vault.id === backup.vaultId)),
    [cloudBackups, vaults],
  );
  const selectedRestoreBackup = useMemo(
    () => restorableCloudBackups.find((backup) => backup.vaultId === selectedBackupDocId) || null,
    [restorableCloudBackups, selectedBackupDocId],
  );

  useEffect(() => {
    if (!showRestoreDeletedModal) return;
    if (restorableCloudBackups.length === 0) {
      setSelectedBackupDocId('');
      return;
    }

    if (!restorableCloudBackups.some((backup) => backup.vaultId === selectedBackupDocId)) {
      setSelectedBackupDocId(restorableCloudBackups[0].vaultId);
    }
  }, [showRestoreDeletedModal, restorableCloudBackups, selectedBackupDocId]);

  useEffect(() => {
    if (!selectedRestoreBackup) return;
    if (restoreAuthType === 'vault_password' && !selectedRestoreBackup.hasVaultPasswordRestore) {
      setRestoreAuthType('recovery_key');
    }
  }, [restoreAuthType, selectedRestoreBackup]);

  const visibleVaults = useMemo(() => {
    let next = secureVaults.filter((vault) => {
      const matchesSearch =
        vault.name.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
        String(vault.entryCount || 0).includes(searchQuery.trim());

      const matchesFilter =
        filterBy === 'all'
          ? true
          : filterBy === 'empty'
            ? (vault.entryCount || 0) === 0
            : (vault.entryCount || 0) > 0;

      return matchesSearch && matchesFilter;
    });

    if (sortBy === 'name') {
      next = [...next].sort((left, right) => left.name.localeCompare(right.name));
    } else if (sortBy === 'entries') {
      next = [...next].sort((left, right) => (right.entryCount || 0) - (left.entryCount || 0));
    } else {
      next = [...next].sort((left, right) => (right.modifiedAt || right.lastUnlockedAt || 0) - (left.modifiedAt || left.lastUnlockedAt || 0));
    }

    return next;
  }, [filterBy, searchQuery, secureVaults, sortBy]);

  const vaultStats = useMemo(() => {
    const totalEntries = secureVaults.reduce((total, vault) => total + (vault.entryCount || 0), 0);
    return {
      vaultCount: secureVaults.length,
      totalEntries,
    };
  }, [secureVaults]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadVaults();
    } finally {
      setRefreshing(false);
    }
  }, []);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.backdropTop} />
        <View style={styles.backdropBottom} />

        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerIconWrap}>
              <Lock size={22} color="#FFF" />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: scheme.text }]}>Passwords</Text>
              <Text style={[styles.headerSubtitle, { color: scheme.textSecondary }]}>Private vaults and secure containers</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={[styles.addButton, { backgroundColor: Colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <PasswordHero
          title="Vault overview"
          subtitle="Create secure vaults, import encrypted vault files, and export selected vaults with a dedicated password."
          accent={Colors.primary}
          icon={<Shield size={18} color="#FFF" />}
          statLabel="secure vaults"
          statValue={`${vaultStats.vaultCount}`}
          rightContent={<View style={styles.heroBadge}><Sparkles size={14} color="#FFF" /><Text style={styles.heroBadgeText}>Protected</Text></View>}
          style={styles.heroCard}
        />

        <View style={styles.toolingBlock}>
          <PasswordSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search vaults"
            onClear={() => setSearchQuery('')}
          />

          <PasswordChipBar
            label="Sort"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { key: 'recent', label: 'Recent' },
              { key: 'name', label: 'Name' },
              { key: 'entries', label: 'Entries' },
            ]}
          />

          <PasswordChipBar
            label="Filter"
            value={filterBy}
            onChange={setFilterBy}
            options={[
              { key: 'all', label: 'All' },
              { key: 'withEntries', label: 'With entries' },
              { key: 'empty', label: 'Empty' },
            ]}
          />
        </View>

        <View style={styles.inlineActions}>
          <TouchableOpacity
            style={[styles.inlineActionBtn, { backgroundColor: scheme.card, borderColor: scheme.border }]}
            onPress={handleImportVaultFile}
          >
            <Upload size={17} color={Colors.primary} />
            <Text style={[styles.inlineActionText, { color: scheme.text }]}>Import Vault File</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.inlineActionBtn, { backgroundColor: Colors.primary }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Plus size={17} color="#FFF" />
            <Text style={[styles.inlineActionText, styles.inlineActionTextLight]}>New Vault</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.restoreDeletedBtn, { backgroundColor: scheme.card, borderColor: scheme.border }]}
          onPress={handleOpenRestoreDeletedModal}
        >
          <RotateCcw size={16} color={Colors.primary} />
          <Text style={[styles.restoreDeletedBtnText, { color: scheme.text }]}>Restore deleted vault</Text>
        </TouchableOpacity>

        <View style={styles.backupSectionWrap}>
          <PasswordSectionHeader
            title="Vault backup"
            subtitle="Backup a specific vault directly from this screen"
          />

          {secureVaults.length === 0 ? (
            <PasswordEmptyState
              title="No vaults available"
              subtitle="Create a vault first to enable per-vault backup."
              actionLabel="Create vault"
              onAction={() => setShowCreateModal(true)}
              icon={<CloudUpload size={22} color={Colors.primary} />}
            />
          ) : (
            <View style={styles.backupCardList}>
              {secureVaults.map((vault) => {
                const backupStatus = backupStatusMap[vault.id];
                const backupLabel = backupStatus?.lastSyncedAt
                  ? `Last backup: ${new Date(backupStatus.lastSyncedAt).toLocaleString('en-IN')}`
                  : 'No backup yet';

                return (
                  <View key={`backup-${vault.id}`} style={[styles.backupCard, { backgroundColor: scheme.card, borderColor: scheme.border }]}>
                    <View style={styles.backupCardInfo}>
                      <Text style={[styles.backupVaultName, { color: scheme.text }]} numberOfLines={1}>{vault.name}</Text>
                      <Text style={[styles.backupVaultMeta, { color: scheme.textSecondary }]} numberOfLines={2}>
                        {vault.entryCount || 0} entries · {backupLabel}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.backupVaultBtn, { backgroundColor: Colors.primary }]}
                      onPress={() => handleStartBackupVault(vault)}
                    >
                      <CloudUpload size={15} color="#FFF" />
                      <Text style={styles.backupVaultBtnText}>Backup</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
        ) : (
          <>
            <View style={styles.sectionTopRow}>
              <PasswordSectionHeader
                title="Secure vaults"
                subtitle={`${visibleVaults.length} of ${secureVaults.length} visible`}
              />
              <Text style={[styles.sectionHint, { color: scheme.textSecondary }]}>Tap a vault to unlock, export from the trailing button, or long-press for actions.</Text>
            </View>

            {visibleVaults.length === 0 ? (
              <PasswordEmptyState
                title="No vaults match"
                subtitle="Try adjusting the search or filter settings."
                actionLabel="Create vault"
                onAction={() => setShowCreateModal(true)}
                icon={<Archive size={22} color={Colors.primary} />}
              />
            ) : (
              <View style={styles.vaultListWrap}>
                {visibleVaults.map((vault, index) => (
                  <View
                    key={vault.id}
                    style={[
                      styles.vaultCard,
                      { backgroundColor: scheme.card, borderColor: scheme.border },
                      index === 0 && styles.vaultCardFirst,
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.vaultCardMain}
                      onPress={() => handleSelectVault(vault)}
                      onLongPress={() => handleVaultOptions(vault)}
                      activeOpacity={0.85}
                    >
                      <View style={styles.vaultAccentBar} />
                      <View style={styles.vaultInfo}>
                        <Text style={[styles.vaultName, { color: scheme.text }]}>{vault.name}</Text>
                        <Text style={[styles.vaultMeta, { color: scheme.textSecondary }]}>
                          {vault.entryCount} entries · {vault.lastUnlockedAt ? 'Recently used' : 'Locked'}
                          {backupStatusMap[vault.id]?.lastSyncedAt
                            ? ` · Backup ${new Date(backupStatusMap[vault.id].lastSyncedAt as number).toLocaleDateString('en-IN')}`
                            : ''}
                        </Text>
                      </View>
                      <View style={styles.vaultPill}>
                        <Text style={styles.vaultPillText}>{vault.type === 'secure' ? 'Secure' : 'Legacy'}</Text>
                      </View>
                    </TouchableOpacity>
                    <View style={styles.vaultActions}>
                      <TouchableOpacity style={styles.vaultActionIcon} onPress={() => handleStartBackupVault(vault)}>
                        <CloudUpload size={18} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.vaultActionIcon} onPress={() => handleStartExportVault(vault)}>
                        <Download size={18} color={Colors.primary} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        {/* Security Info */}
        <View style={[styles.securityInfo, { backgroundColor: scheme.card, borderColor: scheme.border }]}> 
          <View style={styles.securityHeaderRow}>
            <View style={styles.securityBadge}>
              <Sparkles size={14} color={Colors.primary} />
            </View>
            <Text style={[styles.securityTitle, { color: scheme.text }]}>Security Features</Text>
          </View>
          <View style={styles.securityList}>
            <Text style={[styles.securityItem, { color: scheme.textSecondary }]}>AES-256-GCM encryption</Text>
            <Text style={[styles.securityItem, { color: scheme.textSecondary }]}>ChaCha20-Poly1305 second layer</Text>
            <Text style={[styles.securityItem, { color: scheme.textSecondary }]}>Per-entry unique IVs</Text>
          </View>
        </View>
      </ScrollView>

      {/* Create Modal */}
      {showCreateModal && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}>
                <Text style={[styles.modalTitle, { color: scheme.text }]}>
                  Create Secure Vault
                </Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Vault Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={newVaultName}
                  onChangeText={setNewVaultName}
                  placeholder="Enter vault name"
                  placeholderTextColor={scheme.textSecondary}
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}> 
                  Master Password (min 8)
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text, flex: 1 }]}
                    value={masterPassword}
                    onChangeText={setMasterPassword}
                    placeholder="Enter password"
                    placeholderTextColor={scheme.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: -40, padding: 10 }}>
                    {showPassword ? <EyeOff size={20} color={scheme.textSecondary} /> : <Eye size={20} color={scheme.textSecondary} />}
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Confirm</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text, flex: 1 }]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Confirm password"
                    placeholderTextColor={scheme.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: -40, padding: 10 }}>
                    {showPassword ? <EyeOff size={20} color={scheme.textSecondary} /> : <Eye size={20} color={scheme.textSecondary} />}
                  </TouchableOpacity>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => { Keyboard.dismiss(); setShowCreateModal(false); }}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                    onPress={handleCreateVault}
                    disabled={creating}
                  >
                    {creating ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: '600' }}>Create</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Unlock Modal */}
      {showUnlockModal && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}>
                <Text style={[styles.modalTitle, { color: scheme.text }]}>
                  Unlock Vault
                </Text>
                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>
                  {selectedVault?.name}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text, flex: 1 }]}
                    value={unlockPassword}
                    onChangeText={setUnlockPassword}
                    placeholder="Enter password"
                    placeholderTextColor={scheme.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: -40, padding: 10 }}>
                    {showPassword ? <EyeOff size={20} color={scheme.textSecondary} /> : <Eye size={20} color={scheme.textSecondary} />}
                  </TouchableOpacity>
                </View>
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      Keyboard.dismiss();
                      setShowUnlockModal(false);
                      setUnlockPassword('');
                    }}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                    onPress={handleUnlock}
                    disabled={unlocking}
                  >
                    {unlocking ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={{ color: '#FFF', fontWeight: '600' }}>Unlock</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}>Import Vault</Text>
                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>File</Text>
                <Text style={[styles.importFileName, { color: scheme.text }]} numberOfLines={2}>
                  {importFileName || 'No file selected'}
                </Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Export Password</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TextInput
                    style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text, flex: 1 }]}
                    value={importPassword}
                    onChangeText={setImportPassword}
                    placeholder="Enter export password"
                    placeholderTextColor={scheme.textSecondary}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: -40, padding: 10 }}>
                    {showPassword ? <EyeOff size={20} color={scheme.textSecondary} /> : <Eye size={20} color={scheme.textSecondary} />}
                  </TouchableOpacity>
                </View>

                {importPreview && (
                  <View style={[styles.previewCard, { backgroundColor: scheme.background, borderColor: scheme.border }]}> 
                    <Text style={[styles.previewTitle, { color: scheme.text }]}>Preview</Text>
                    <Text style={[styles.previewLine, { color: scheme.textSecondary }]}>Name: {importPreview.label}</Text>
                    <Text style={[styles.previewLine, { color: scheme.textSecondary }]}>Groups: {importPreview.groupCount}</Text>
                    <Text style={[styles.previewLine, { color: scheme.textSecondary }]}>Entries: {importPreview.entryCount}</Text>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setShowImportModal(false);
                      setImportFileUri('');
                      setImportFileName('');
                      setImportPassword('');
                      setImportPreview(null);
                    }}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  {!importPreview ? (
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                      onPress={handlePreviewImport}
                      disabled={importing || !importPassword}
                    >
                      {importing ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Preview</Text>}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                      onPress={handleCreateVaultFromImport}
                      disabled={importing}
                    >
                      {importing ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Import</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}>Export Vault</Text>
                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Vault</Text>
                <Text style={[styles.importFileName, { color: scheme.text }]} numberOfLines={1}>
                  {selectedExportVault?.name || 'Vault'}
                </Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Vault Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={vaultUnlockForExport}
                  onChangeText={setVaultUnlockForExport}
                  placeholder="Enter vault password"
                  placeholderTextColor={scheme.textSecondary}
                  secureTextEntry
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Export Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={vaultExportPassword}
                  onChangeText={setVaultExportPassword}
                  placeholder="Set export file password"
                  placeholderTextColor={scheme.textSecondary}
                  secureTextEntry
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setShowExportModal(false);
                      setSelectedExportVault(null);
                      setVaultUnlockForExport('');
                      setVaultExportPassword('');
                    }}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                    onPress={handleExportVault}
                    disabled={exporting}
                  >
                    {exporting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Export</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Backup Modal */}
      {showBackupModal && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}>Backup Vault</Text>
                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Vault</Text>
                <Text style={[styles.importFileName, { color: scheme.text }]} numberOfLines={1}>
                  {selectedBackupVault?.name || 'Vault'}
                </Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Vault Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={vaultPasswordForBackup}
                  onChangeText={setVaultPasswordForBackup}
                  placeholder="Enter vault password"
                  placeholderTextColor={scheme.textSecondary}
                  secureTextEntry
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setShowBackupModal(false);
                      setSelectedBackupVault(null);
                      setVaultPasswordForBackup('');
                    }}
                    disabled={backingUp}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                    onPress={handleBackupVault}
                    disabled={backingUp}
                  >
                    {backingUp ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Backup</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Restore Deleted Vault Modal */}
      {showRestoreDeletedModal && (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}>Restore Deleted Vault</Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Cloud backup</Text>
                {loadingCloudBackups ? (
                  <ActivityIndicator size="small" color={Colors.primary} style={{ marginVertical: Spacing.md }} />
                ) : restorableCloudBackups.length === 0 ? (
                  <Text style={[styles.restoreHintText, { color: scheme.textSecondary }]}>No deleted vault backups found in cloud.</Text>
                ) : (
                  <View style={styles.restoreBackupList}>
                    {restorableCloudBackups.map((backup) => (
                      <TouchableOpacity
                        key={`restore-${backup.vaultId}`}
                        style={[
                          styles.restoreBackupItem,
                          { borderColor: scheme.border, backgroundColor: scheme.background },
                          selectedBackupDocId === backup.vaultId && styles.restoreBackupItemActive,
                        ]}
                        onPress={() => setSelectedBackupDocId(backup.vaultId)}
                      >
                        <Text style={[styles.restoreBackupName, { color: scheme.text }]} numberOfLines={1}>{backup.vaultName || 'Vault backup'}</Text>
                        <Text style={[styles.restoreBackupMeta, { color: scheme.textSecondary }]} numberOfLines={2}>
                          {backup.entryCount} entries · {backup.groupCount} groups · {backup.lastSyncedAt ? new Date(backup.lastSyncedAt).toLocaleString('en-IN') : 'Unknown time'}
                        </Text>
                        <Text style={[styles.restoreBackupMeta, { color: scheme.textSecondary }]}>Recovery key: {backup.hasRecoveryWrap ? 'Enabled' : 'Not available'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {selectedRestoreBackup?.hasRecoveryWrap ? (
                  <TouchableOpacity
                    style={[styles.savedKeyBtn, { backgroundColor: 'rgba(16,185,129,0.14)' }]}
                    onPress={handleUseSavedRecoveryKey}
                  >
                    <Text style={styles.savedKeyBtnText}>Use saved recovery key on this device</Text>
                  </TouchableOpacity>
                ) : null}

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Unlock Method</Text>
                <View style={styles.restoreMethodRow}>
                  <TouchableOpacity
                    style={[
                      styles.restoreMethodChip,
                      selectedRestoreBackup && !selectedRestoreBackup.hasVaultPasswordRestore && styles.restoreMethodChipDisabled,
                      restoreAuthType === 'vault_password' && styles.restoreMethodChipActive,
                    ]}
                    onPress={() => {
                      if (selectedRestoreBackup && !selectedRestoreBackup.hasVaultPasswordRestore) {
                        Alert.alert('Use Recovery Key', 'Master password restore is unavailable for this older backup. Use recovery key or create a fresh backup and try again.');
                        return;
                      }
                      setRestoreAuthType('vault_password');
                    }}
                  >
                    <Text
                      style={[
                        styles.restoreMethodText,
                        restoreAuthType === 'vault_password' && styles.restoreMethodTextActive,
                      ]}
                    >
                      Master Password
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.restoreMethodChip,
                      restoreAuthType === 'recovery_key' && styles.restoreMethodChipActive,
                    ]}
                    onPress={() => setRestoreAuthType('recovery_key')}
                  >
                    <Text
                      style={[
                        styles.restoreMethodText,
                        restoreAuthType === 'recovery_key' && styles.restoreMethodTextActive,
                      ]}
                    >
                      Recovery Key
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>
                  {restoreAuthType === 'vault_password' ? 'Master Password' : 'Recovery Key'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={recoveryKeyForRestore}
                  onChangeText={setRecoveryKeyForRestore}
                  placeholder={restoreAuthType === 'vault_password' ? 'Enter master password' : 'Enter recovery key'}
                  placeholderTextColor={scheme.textSecondary}
                  secureTextEntry={restoreAuthType === 'vault_password'}
                  autoCapitalize={restoreAuthType === 'recovery_key' ? 'characters' : 'none'}
                  autoCorrect={false}
                />
                <Text style={[styles.restoreHintText, { color: scheme.textSecondary }]}>This restores a vault that was deleted from your device profile.</Text>
                {selectedRestoreBackup && !selectedRestoreBackup.hasVaultPasswordRestore ? (
                  <Text style={[styles.restoreHintText, { color: '#B45309' }]}>Master password restore is not available for this backup. Please use recovery key.</Text>
                ) : null}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setShowRestoreDeletedModal(false);
                      setRecoveryKeyForRestore('');
                    }}
                    disabled={restoringDeletedVault}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                    onPress={handleRestoreDeletedVault}
                    disabled={restoringDeletedVault || loadingCloudBackups || restorableCloudBackups.length === 0}
                  >
                    {restoringDeletedVault ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Restore</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xl * 2, position: 'relative' },
  backdropTop: {
    position: 'absolute',
    top: -40,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(124,58,237,0.10)',
  },
  backdropBottom: {
    position: 'absolute',
    bottom: 120,
    left: -100,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(236,72,153,0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  headerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  headerTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  headerSubtitle: { fontSize: Typography.fontSize.sm, marginTop: 2 },
  addButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
  },
  heroCard: {
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  heroBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  toolingBlock: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inlineActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  inlineActionBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
  },
  inlineActionText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inlineActionTextLight: {
    color: '#FFF',
  },
  restoreDeletedBtn: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  restoreDeletedBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  backupSectionWrap: {
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  backupCardList: {
    gap: Spacing.sm,
  },
  backupCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backupCardInfo: {
    flex: 1,
    gap: 4,
  },
  backupVaultName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  backupVaultMeta: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
  },
  backupVaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  backupVaultBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 12,
  },
  loader: { marginTop: 100 },
  sectionTopRow: {
    marginBottom: Spacing.md,
  },
  sectionHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
  },
  vaultListWrap: {
    gap: Spacing.sm,
  },
  vaultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 24,
    padding: Spacing.md,
    marginBottom: 0,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  vaultCardMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  vaultAccentBar: {
    width: 4,
    height: 40,
    borderRadius: 999,
    backgroundColor: Colors.primary,
  },
  vaultExportBtn: {
    marginLeft: Spacing.sm,
    padding: Spacing.xs,
  },
  vaultInfo: { flex: 1 },
  vaultName: { fontSize: Typography.fontSize.md, fontWeight: '700' },
  vaultMeta: { fontSize: Typography.fontSize.sm, marginTop: 4, lineHeight: 18 },
  vaultPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  vaultPillText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  vaultActions: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultActionIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vaultCardFirst: {
    marginTop: 2,
  },
  securityInfo: {
    padding: Spacing.lg,
    borderRadius: 24,
    marginTop: Spacing.lg,
    borderWidth: 1,
  },
  securityHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  securityBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  securityTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  securityList: { gap: 8, paddingLeft: 2 },
  securityItem: { fontSize: Typography.fontSize.sm, lineHeight: 19 },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center', alignItems: 'center', padding: Spacing.lg,
  },
  modalContent: {
    width: '100%', padding: Spacing.lg, borderRadius: BorderRadius.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl, fontWeight: '700',
    marginBottom: Spacing.lg, textAlign: 'center',
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm, marginBottom: Spacing.xs, marginTop: Spacing.sm,
  },
  input: {
    padding: Spacing.md, borderRadius: BorderRadius.md, borderWidth: 1,
  },
  importFileName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  previewCard: {
    marginTop: Spacing.lg,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 4,
  },
  previewTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewLine: {
    fontSize: Typography.fontSize.sm,
  },
  restoreBackupList: {
    gap: Spacing.xs,
    maxHeight: 180,
  },
  restoreBackupItem: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.sm,
    gap: 3,
  },
  restoreBackupItemActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  restoreBackupName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  restoreBackupMeta: {
    fontSize: 12,
    lineHeight: 16,
  },
  restoreMethodRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  restoreMethodChip: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  restoreMethodChipDisabled: {
    opacity: 0.5,
  },
  restoreMethodChipActive: {
    backgroundColor: Colors.primary,
  },
  restoreMethodText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  restoreMethodTextActive: {
    color: '#FFF',
  },
  restoreHintText: {
    marginTop: Spacing.xs,
    fontSize: 12,
    lineHeight: 16,
  },
  savedKeyBtn: {
    marginTop: Spacing.xs,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedKeyBtnText: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1, padding: Spacing.md, borderRadius: BorderRadius.md, alignItems: 'center',
  },
});