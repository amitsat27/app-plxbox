import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/theme/color';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { useTheme } from '@/theme/themeProvider';
import * as Haptics from 'expo-haptics';
import {
  Lock,
  Folder,
  Plus,
  ChevronRight,
  Key,
  ArrowLeft,
  Upload,
  Settings,
  Download,
  Sparkles,
  Shield,
  RefreshCcw,
  CloudUpload,
  RotateCcw,
} from 'lucide-react-native';
import { vaultService, vaultTransferService } from '@/src/services/passwords';
import { PasswordEntry, PasswordGroup, VaultMeta } from '@/src/types/passwords';
import { useAuth } from '@/src/context/AuthContext';
import {
  PasswordChipBar,
  PasswordEmptyState,
  PasswordHero,
  PasswordSearchBar,
  PasswordSectionHeader,
} from '@/components/passwords/PasswordDesign';

export default function SecureVaultScreen() {
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const getColorScheme = (dark: boolean) => ({
    background: dark ? Colors.darkBackground : '#F2F2F7',
    card: dark ? Colors.darkCard : '#FFFFFF',
    text: dark ? Colors.darkText : '#000000',
    textSecondary: dark ? '#8E8E93' : '#8E8E93',
    primary: Colors.primary,
    border: dark ? '#38383A' : '#E5E5EA',
  });

  const scheme = getColorScheme(isDark);

  const [vault, setVault] = useState<VaultMeta | null>(null);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferPassword, setTransferPassword] = useState('');
  const [transferPreview, setTransferPreview] = useState<{ label: string; entryCount: number; groupCount: number } | null>(null);
  const [transferFileUri, setTransferFileUri] = useState('');
  const [transferFileName, setTransferFileName] = useState('');
  const [transfering, setTransfering] = useState(false);
  const [showGroupExportModal, setShowGroupExportModal] = useState(false);
  const [selectedGroupForExport, setSelectedGroupForExport] = useState<PasswordGroup | null>(null);
  const [groupExportPassword, setGroupExportPassword] = useState('');
  const [groupExporting, setGroupExporting] = useState(false);
  const [showGroupSettingsModal, setShowGroupSettingsModal] = useState(false);
  const [selectedGroupForSettings, setSelectedGroupForSettings] = useState<PasswordGroup | null>(null);
  const [groupSettingsName, setGroupSettingsName] = useState('');
  const [groupSettingsSaving, setGroupSettingsSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [backupStatus, setBackupStatus] = useState<{
    exists: boolean;
    lastSyncedAt: number | null;
    entryCount: number;
    groupCount: number;
    hasRecoveryWrap: boolean;
  } | null>(null);
  const [backupBusy, setBackupBusy] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreSecret, setRestoreSecret] = useState('');
  const [restoreMode, setRestoreMode] = useState<'merge' | 'overwrite'>('merge');
  const [restoreAuthType, setRestoreAuthType] = useState<'vault_password' | 'recovery_key'>('vault_password');
  const [recoveryKeyPreview, setRecoveryKeyPreview] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [entryForm, setEntryForm] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
    groupId: '',
  });

  const [groupName, setGroupName] = useState('');

  const loadVaultData = useCallback(async () => {
    if (!vaultId) return;
    try {
      const allVaults = await vaultService.getAllVaults();
      const vaultMeta = allVaults.find((v) => v.id === vaultId);
      if (vaultMeta) {
        setVault(vaultMeta);
        const vaultEntries = await vaultService.getEntries(vaultId);
        const vaultGroups = await vaultService.getGroups(vaultId);
        setEntries(vaultEntries);
        setGroups(vaultGroups);
      }
    } catch (error) {
      console.error('Error loading vault:', error);
    } finally {
      setLoading(false);
    }
  }, [vaultId]);

  const refreshBackupStatus = useCallback(async () => {
    if (!vaultId) return;
    try {
      const status = await vaultService.getBackupStatus(vaultId);
      setBackupStatus(status);
      const recoveryKey = await vaultService.getRecoveryKey(vaultId);
      setRecoveryKeyPreview(recoveryKey ? `${recoveryKey.slice(0, 6)}••••••${recoveryKey.slice(-4)}` : null);
    } catch (error) {
      console.error('Failed to load backup status:', error);
    }
  }, [vaultId]);

  useEffect(() => {
    if (user?.uid) {
      vaultService.setUser(user.uid);
    }
    loadVaultData();
  }, [vaultId, user?.uid, loadVaultData]);

  useEffect(() => {
    if (!vaultId) return;

    const unSubEntries = vaultService.subscribeToEntries(vaultId, (nextEntries) => {
      setEntries(nextEntries);
    });
    const unSubGroups = vaultService.subscribeToGroups(vaultId, (nextGroups) => {
      setGroups(nextGroups);
    });

    return () => {
      unSubEntries();
      unSubGroups();
    };
  }, [vaultId]);

  useEffect(() => {
    if (!vaultId) return;
    refreshBackupStatus();
  }, [vaultId, refreshBackupStatus]);

  const handleAddEntry = async () => {
    if (!entryForm.title || !entryForm.password) {
      Alert.alert('Error', 'Title and password are required');
      return;
    }
    setSaving(true);
    try {
      await vaultService.addEntry(vaultId!, {
        ...entryForm,
        groupId: entryForm.groupId || null,
        groupPath: '',
        tags: [],
        favorite: false,
        customFields: {},
      });
      await loadVaultData();
      setShowAddEntry(false);
      setEntryForm({
        title: '',
        username: '',
        password: '',
        url: '',
        notes: '',
        groupId: '',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Entry added');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add entry');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGroup = async () => {
    if (!groupName) {
      Alert.alert('Error', 'Group name is required');
      return;
    }
    setSaving(true);
    try {
      await vaultService.addGroup(vaultId!, { name: groupName, parentId: null });
      await loadVaultData();
      setShowAddGroup(false);
      setGroupName('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Group added');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add group');
    } finally {
      setSaving(false);
    }
  };

  const handleLockVault = () => {
    vaultService.lockVault();
    router.back();
  };

  const handleManualBackup = async () => {
    if (!vaultId) return;
    setBackupBusy(true);
    try {
      const status = await vaultService.backupNow(vaultId);
      setBackupStatus(status);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Backup Complete', `Encrypted backup synced at ${new Date(status.lastSyncedAt || Date.now()).toLocaleString()}`);
    } catch (error: any) {
      Alert.alert('Backup Failed', error?.message || 'Unable to sync encrypted backup');
    } finally {
      setBackupBusy(false);
    }
  };

  const handleGenerateRecoveryKey = async () => {
    if (!vaultId) return;
    Alert.alert(
      'Generate Recovery Key',
      'A new recovery key will replace the existing one for future backups. Keep it in a safe place.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Generate',
          onPress: async () => {
            try {
              const key = await vaultService.generateRecoveryKey(vaultId);
              setRecoveryKeyPreview(`${key.slice(0, 6)}••••••${key.slice(-4)}`);
              Alert.alert('Recovery Key', `${key}\n\nSave this key securely. It is required for recovery-key restore.`);
              await refreshBackupStatus();
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Unable to generate recovery key');
            }
          },
        },
      ],
    );
  };

  const handleRestore = async () => {
    if (!vaultId) return;
    if (!restoreSecret.trim()) {
      Alert.alert('Error', restoreAuthType === 'vault_password' ? 'Enter master password' : 'Enter recovery key');
      return;
    }

    Alert.alert(
      'Confirm Restore',
      restoreMode === 'overwrite'
        ? 'Overwrite mode will replace all current vault groups and entries with backup data.'
        : 'Merge mode will add backup data without deleting existing entries.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: restoreMode === 'overwrite' ? 'destructive' : 'default',
          onPress: async () => {
            setBackupBusy(true);
            try {
              const result = await vaultService.restoreFromBackup(vaultId, restoreMode, restoreAuthType, restoreSecret.trim());
              try {
                await loadVaultData();
                await refreshBackupStatus();
              } catch (refreshError) {
                console.error('Restore completed but refresh failed:', refreshError);
              }
              setShowRestoreModal(false);
              setRestoreSecret('');
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Restore Complete', `${result.groupsRestored} groups and ${result.entriesRestored} entries restored.`);
            } catch (error: any) {
              Alert.alert('Restore Failed', error?.message || 'Unable to restore backup');
            } finally {
              setBackupBusy(false);
            }
          },
        },
      ],
    );
  };

  const startImportFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled || !result.assets?.length) return;

      setTransferFileUri(result.assets[0].uri);
      setTransferFileName(result.assets[0].name || 'vault file');
      setTransferPassword('');
      setTransferPreview(null);
      setShowTransferModal(true);
    } catch {
      Alert.alert('Error', 'Failed to open the file picker');
    }
  };

  const previewTransfer = async () => {
    if (!vaultId) return;

    if (!transferFileUri || !transferPassword) {
      Alert.alert('Error', 'Choose a file and enter its password');
      return;
    }

    setTransfering(true);
    try {
      const preview = await vaultTransferService.previewImport(transferFileUri, transferPassword);
      if (preview.scope !== 'group') {
        Alert.alert('Unsupported file', 'Only group import is allowed from vault screen.');
        return;
      }
      setTransferPreview({
        label: preview.label,
        entryCount: preview.entryCount,
        groupCount: preview.groupCount,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Import failed', error?.message || 'Unable to read the file');
    } finally {
      setTransfering(false);
    }
  };

  const confirmTransfer = async () => {
    if (!vaultId) return;

    setTransfering(true);
    try {
      await vaultTransferService.importGroupFileIntoVault(transferFileUri, transferPassword, vaultId);

      await loadVaultData();
      setShowTransferModal(false);
      setTransferFileUri('');
      setTransferFileName('');
      setTransferPreview(null);
      setTransferPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Import completed');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to import file');
    } finally {
      setTransfering(false);
    }
  };

  const startGroupExport = (group: PasswordGroup) => {
    setSelectedGroupForExport(group);
    setGroupExportPassword('');
    setShowGroupExportModal(true);
  };

  const handleExportGroup = async () => {
    if (!vaultId || !selectedGroupForExport) return;
    if (!groupExportPassword) {
      Alert.alert('Error', 'Enter export password');
      return;
    }

    setGroupExporting(true);
    try {
      const exported = await vaultTransferService.exportGroup(vaultId, selectedGroupForExport.id, groupExportPassword);
      await Sharing.shareAsync(exported.fileUri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Share group export',
      });
      setShowGroupExportModal(false);
      setSelectedGroupForExport(null);
      setGroupExportPassword('');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to export group');
    } finally {
      setGroupExporting(false);
    }
  };

  const handleGroupSettings = (group: PasswordGroup) => {
    setSelectedGroupForSettings(group);
    setGroupSettingsName(group.name);
    setShowGroupSettingsModal(true);
  };

  const handleSaveGroupSettings = async () => {
    if (!vaultId || !selectedGroupForSettings) return;
    const nextName = groupSettingsName.trim();
    if (!nextName) {
      Alert.alert('Error', 'Group name is required');
      return;
    }

    setGroupSettingsSaving(true);
    try {
      await vaultService.updateGroup(vaultId, selectedGroupForSettings.id, nextName);
      setShowGroupSettingsModal(false);
      setSelectedGroupForSettings(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Unable to rename group');
    } finally {
      setGroupSettingsSaving(false);
    }
  };

  const handleDeleteFromSettings = async () => {
    if (!vaultId || !selectedGroupForSettings) return;
    Alert.alert(
      'Delete Group',
      `Delete ${selectedGroupForSettings.name}? Entries inside this group will be moved out of the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vaultService.deleteGroup(vaultId, selectedGroupForSettings.id);
              setShowGroupSettingsModal(false);
              setSelectedGroupForSettings(null);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Unable to delete group');
            }
          },
        },
      ]
    );
  };

  const normalizedGroupSettingsName = groupSettingsName.trim();
  const canSaveGroupSettings =
    !!selectedGroupForSettings &&
    normalizedGroupSettingsName.length > 0 &&
    normalizedGroupSettingsName !== selectedGroupForSettings.name;

  const handleDeleteGroupLongPress = (group: PasswordGroup) => {
    Alert.alert(
      'Delete Group',
      `Delete ${group.name}? Entries inside this group will be moved out of the group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!vaultId) return;
            try {
              await vaultService.deleteGroup(vaultId, group.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Error', error?.message || 'Unable to delete group');
            }
          },
        },
      ]
    );
  };

  const flatGroups = groups;
  const rootEntries = entries.filter((e) => !e.groupId);

  const visibleGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const getGroupCount = (groupId: string) => entries.filter((entry) => entry.groupId === groupId).length;
    let next = flatGroups.filter((group) => {
      const matchesSearch = !query || group.name.toLowerCase().includes(query) || group.fullPath.toLowerCase().includes(query);
      const matchesFilter = filterBy === 'entries' ? false : true;
      return matchesSearch && matchesFilter;
    });

    if (sortBy === 'name') {
      next = [...next].sort((left, right) => left.name.localeCompare(right.name));
    } else if (sortBy === 'count') {
      next = [...next].sort((left, right) => {
        const leftCount = getGroupCount(left.id);
        const rightCount = getGroupCount(right.id);
        return rightCount - leftCount;
      });
    }

    return next;
  }, [entries, flatGroups, filterBy, rootEntries, searchQuery, sortBy]);

  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let next = rootEntries.filter((entry) => {
      const matchesSearch =
        !query ||
        entry.title.toLowerCase().includes(query) ||
        (entry.username || '').toLowerCase().includes(query) ||
        (entry.url || '').toLowerCase().includes(query);
      const matchesFilter = filterBy === 'groups' ? false : true;
      return matchesSearch && matchesFilter;
    });

    if (sortBy === 'name') {
      next = [...next].sort((left, right) => left.title.localeCompare(right.title));
    } else {
      next = [...next].sort((left, right) => (right.modifiedAt || right.createdAt) - (left.modifiedAt || left.createdAt));
    }

    return next;
  }, [filterBy, rootEntries, searchQuery, sortBy]);

  const vaultStats = useMemo(() => ({
    groupCount: groups.length,
    entryCount: entries.length,
  }), [entries.length, groups.length]);

  const handleOpenGroup = (group: PasswordGroup) => {
    router.push({
      pathname: '/passwords/group/[groupId]',
      params: { groupId: group.id, vaultId: vaultId! },
    });
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([loadVaultData(), refreshBackupStatus()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadVaultData, refreshBackupStatus]);

  const renderGroup = (group: PasswordGroup) => {
    const groupEntries = entries.filter((e) => e.groupId === group.id).length;

    return (
      <View
        key={group.id}
        style={[styles.groupCard, { backgroundColor: scheme.card }]}
      >
        <TouchableOpacity
          style={styles.groupMainTap}
          onPress={() => handleOpenGroup(group)}
          onLongPress={() => handleDeleteGroupLongPress(group)}
        >
          <Folder size={20} color={Colors.primary} />
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: scheme.text }]}>{group.name}</Text>
            <Text style={[styles.groupMeta, { color: scheme.textSecondary }]}> 
              {groupEntries} entries
            </Text>
          </View>
          <ChevronRight size={18} color={scheme.textSecondary} />
        </TouchableOpacity>

        <View style={styles.groupActions}>
          <TouchableOpacity style={styles.groupIconBtn} onPress={() => startGroupExport(group)}>
            <Download size={17} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.groupIconBtn} onPress={() => handleGroupSettings(group)}>
            <Settings size={17} color={scheme.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderEntry = (entry: PasswordEntry) => {
    return (
      <TouchableOpacity
        key={entry.id}
        style={[styles.entryCard, { backgroundColor: scheme.card }]}
        onPress={() => router.push({ pathname: '/passwords/[id]', params: { id: entry.id, vaultId: vaultId! } })}
      >
        <View style={styles.entryHeader}>
          <Key size={18} color={Colors.primary} />
          <View style={styles.entryInfo}>
            <Text style={[styles.entryTitle, { color: scheme.text }]}>{entry.title}</Text>
            <Text style={[styles.entryUsername, { color: scheme.textSecondary }]}> 
              {entry.username || 'No username'}
            </Text>
          </View>
          <ChevronRight size={18} color={scheme.textSecondary} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}> 
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDark ? 'rgba(16,16,18,0.96)' : 'rgba(255,255,255,0.82)',
            borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(15,23,42,0.08)',
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={handleLockVault}>
          <ArrowLeft size={24} color={scheme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: scheme.text }]} numberOfLines={1}>
            {vault?.name || 'Secure Vault'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: scheme.textSecondary }]}>
            {entries.length} entries
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.lockButton} onPress={startImportFile}>
            <Upload size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.lockButton} onPress={handleLockVault}>
            <Lock size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={Colors.primary}
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={[{ type: 'root' }]}
          keyExtractor={(item) => item.type}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          keyboardDismissMode="on-drag"
          keyboardShouldPersistTaps="handled"
          renderItem={() => (
            <>
            <View style={styles.surfaceWrap}>
              <PasswordHero
                title={vault?.name || 'Secure Vault'}
                subtitle="A dedicated workspace for groups, entries, and encrypted file workflows."
                accent="#EC4899"
                icon={<Sparkles size={18} color="#FFF" />}
                statLabel="items"
                statValue={`${vaultStats.entryCount}`}
                rightContent={<View style={styles.heroBadge}><Text style={styles.heroBadgeText}>Protected</Text></View>}
              />

              <View style={styles.toolingBlock}>
                <PasswordSearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search groups or entries"
                  onClear={() => setSearchQuery('')}
                />
                <PasswordChipBar
                  label="Sort"
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { key: 'recent', label: 'Recent' },
                    { key: 'name', label: 'Name' },
                    { key: 'count', label: 'Count' },
                  ]}
                />
                <PasswordChipBar
                  label="Filter"
                  value={filterBy}
                  onChange={setFilterBy}
                  options={[
                    { key: 'all', label: 'All' },
                    { key: 'groups', label: 'Groups' },
                    { key: 'entries', label: 'Entries' },
                  ]}
                />
              </View>

              <View style={[styles.backupPanel, { backgroundColor: scheme.card }]}> 
                <View style={styles.backupHeaderRow}>
                  <View style={styles.backupTitleWrap}>
                    <Shield size={17} color={Colors.primary} />
                    <Text style={[styles.backupTitle, { color: scheme.text }]}>Encrypted Cloud Backup</Text>
                  </View>
                  <Text style={[styles.backupMeta, { color: scheme.textSecondary }]}> 
                    {backupStatus?.lastSyncedAt ? new Date(backupStatus.lastSyncedAt).toLocaleString() : 'Not synced yet'}
                  </Text>
                </View>

                <Text style={[styles.backupSub, { color: scheme.textSecondary }]}> 
                  Last snapshot: {backupStatus?.entryCount || 0} entries, {backupStatus?.groupCount || 0} groups
                </Text>

                <View style={styles.backupActionsRow}>
                  <TouchableOpacity
                    style={[styles.backupActionBtn, { backgroundColor: Colors.primary }]}
                    onPress={handleManualBackup}
                    disabled={backupBusy}
                  >
                    <CloudUpload size={14} color="#FFF" />
                    <Text style={styles.backupActionText}>Backup Now</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.backupActionBtn, { backgroundColor: 'rgba(124,58,237,0.14)' }]}
                    onPress={() => setShowRestoreModal(true)}
                    disabled={backupBusy}
                  >
                    <RotateCcw size={14} color={Colors.primary} />
                    <Text style={[styles.backupActionText, { color: Colors.primary }]}>Restore</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.backupActionBtn, { backgroundColor: 'rgba(16,185,129,0.14)' }]}
                    onPress={handleGenerateRecoveryKey}
                    disabled={backupBusy}
                  >
                    <RefreshCcw size={14} color="#059669" />
                    <Text style={[styles.backupActionText, { color: '#059669' }]}>Recovery Key</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.backupRecoveryText, { color: scheme.textSecondary }]}> 
                  Recovery key: {recoveryKeyPreview || 'Not generated'}
                </Text>
              </View>
            </View>

            <View style={styles.sectionsWrap}>
              <View style={styles.sectionBlock}>
                <PasswordSectionHeader
                  title="Groups"
                  subtitle={`${visibleGroups.length} visible`}
                  action={
                    <TouchableOpacity style={styles.sectionAction} onPress={() => setShowAddGroup(true)}>
                      <Plus size={16} color={Colors.primary} />
                      <Text style={styles.sectionActionText}>Add</Text>
                    </TouchableOpacity>
                  }
                />
                {visibleGroups.length === 0 ? (
                  <PasswordEmptyState
                    title="No groups match"
                    subtitle="Create a new group or change the search and filter settings."
                    actionLabel="Add group"
                    onAction={() => setShowAddGroup(true)}
                  />
                ) : (
                  <View style={styles.cardStack}>
                    {visibleGroups.map((group) => renderGroup(group))}
                  </View>
                )}
              </View>

              <View style={styles.sectionBlock}>
                <PasswordSectionHeader
                  title="Entries"
                  subtitle={`${visibleEntries.length} visible`}
                />
                {visibleEntries.length === 0 ? (
                  <PasswordEmptyState
                    title="No entries match"
                    subtitle="Search for an entry or adjust the filters to reveal saved passwords."
                    actionLabel="Add group"
                    onAction={() => setShowAddGroup(true)}
                    icon={<Key size={22} color={Colors.primary} />}
                  />
                ) : (
                  <View style={styles.cardStack}>
                    {visibleEntries.map((entry) => renderEntry(entry))}
                  </View>
                )}
              </View>
            </View>
            </>
          )}
          contentContainerStyle={styles.list}
        />
      )}

      {/* Floating Add Button */}
      {loading === false && (
        <View style={styles.fabContainer}>
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: Colors.primary }]}
            onPress={() => setShowAddGroup(true)}
          >
            <Plus size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      <Modal visible={showAddEntry} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: scheme.card }]}>
              <Text style={[styles.modalTitle, { color: scheme.text }]}>Add Password</Text>

              <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text },
                ]}
                value={entryForm.title}
                onChangeText={(text) => setEntryForm({ ...entryForm, title: text })}
                placeholder="Title"
                placeholderTextColor={scheme.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>
                Username
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text },
                ]}
                value={entryForm.username}
                onChangeText={(text) => setEntryForm({ ...entryForm, username: text })}
                placeholder="Username"
                placeholderTextColor={scheme.textSecondary}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>
                Password *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text },
                ]}
                value={entryForm.password}
                onChangeText={(text) => setEntryForm({ ...entryForm, password: text })}
                placeholder="Password"
                placeholderTextColor={scheme.textSecondary}
                secureTextEntry
              />

              <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>URL</Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text },
                ]}
                value={entryForm.url}
                onChangeText={(text) => setEntryForm({ ...entryForm, url: text })}
                placeholder="https://example.com"
                placeholderTextColor={scheme.textSecondary}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>
                Notes
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text },
                ]}
                value={entryForm.notes}
                onChangeText={(text) => setEntryForm({ ...entryForm, notes: text })}
                placeholder="Notes"
                placeholderTextColor={scheme.textSecondary}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: scheme.background }]}
                  onPress={() => setShowAddEntry(false)}
                >
                  <Text style={{ color: scheme.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                  onPress={handleAddEntry}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '600' }}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showAddGroup} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: scheme.card }]}>
              <Text style={[styles.modalTitle, { color: scheme.text }]}>Add Group</Text>

              <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>
                Group Name
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text },
                ]}
                value={groupName}
                onChangeText={setGroupName}
                placeholder="Group name"
                placeholderTextColor={scheme.textSecondary}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: scheme.background }]}
                  onPress={() => setShowAddGroup(false)}
                >
                  <Text style={{ color: scheme.text }}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                  onPress={handleAddGroup}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={{ color: '#FFF', fontWeight: '600' }}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showTransferModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}> 
                  Import Group
                </Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>File</Text>
                <Text style={[styles.fileName, { color: scheme.text }]} numberOfLines={2}>
                  {transferFileName || 'No file selected'}
                </Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={transferPassword}
                  onChangeText={setTransferPassword}
                  placeholder="Enter group file password"
                  placeholderTextColor={scheme.textSecondary}
                  secureTextEntry
                />

                {transferPreview && (
                  <View style={[styles.previewCard, { backgroundColor: scheme.background, borderColor: scheme.border }]}> 
                    <Text style={[styles.previewTitle, { color: scheme.text }]}>Preview</Text>
                    <Text style={[styles.previewLine, { color: scheme.textSecondary }]}>Name: {transferPreview.label}</Text>
                    <Text style={[styles.previewLine, { color: scheme.textSecondary }]}>Groups: {transferPreview.groupCount}</Text>
                    <Text style={[styles.previewLine, { color: scheme.textSecondary }]}>Entries: {transferPreview.entryCount}</Text>
                  </View>
                )}

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setShowTransferModal(false);
                      setTransferFileUri('');
                      setTransferFileName('');
                      setTransferPreview(null);
                      setTransferPassword('');
                    }}
                    disabled={transfering}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  {transferPreview ? (
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                      onPress={confirmTransfer}
                      disabled={transfering}
                    >
                      {transfering ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Import</Text>}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                      onPress={previewTransfer}
                      disabled={transfering || !transferPassword}
                    >
                      {transfering ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Preview</Text>}
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showGroupExportModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}>Export Group</Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Group</Text>
                <Text style={[styles.fileName, { color: scheme.text }]} numberOfLines={1}>
                  {selectedGroupForExport?.name || 'Group'}
                </Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Export Password</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={groupExportPassword}
                  onChangeText={setGroupExportPassword}
                  placeholder="Set group export password"
                  placeholderTextColor={scheme.textSecondary}
                  secureTextEntry
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setShowGroupExportModal(false);
                      setSelectedGroupForExport(null);
                      setGroupExportPassword('');
                    }}
                    disabled={groupExporting}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                    onPress={handleExportGroup}
                    disabled={groupExporting}
                  >
                    {groupExporting ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '600' }}>Export</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showGroupSettingsModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={[styles.modalContent, { backgroundColor: scheme.card }]}
              >
                <View style={styles.groupSettingsHeader}>
                  <View style={[styles.groupSettingsIconWrap, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)' }]}>
                    <Settings size={16} color={Colors.primary} />
                  </View>
                  <View style={styles.groupSettingsHeaderTextWrap}>
                    <Text style={[styles.modalTitle, styles.groupSettingsTitle, { color: scheme.text }]}>Group Settings</Text>
                    <Text style={[styles.groupSettingsSubtitle, { color: scheme.textSecondary }]}>Rename this group or remove it from this vault.</Text>
                  </View>
                </View>

                <View style={[styles.groupSettingsInfoCard, { backgroundColor: scheme.background }]}> 
                  <Text style={[styles.groupSettingsInfoLabel, { color: scheme.textSecondary }]}>Selected group</Text>
                  <Text style={[styles.groupSettingsInfoValue, { color: scheme.text }]} numberOfLines={1}>
                    {selectedGroupForSettings?.name || 'Group'}
                  </Text>
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Group Name</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={groupSettingsName}
                  onChangeText={setGroupSettingsName}
                  placeholder="Group name"
                  placeholderTextColor={scheme.textSecondary}
                />
                <Text style={[styles.groupSettingsHint, { color: scheme.textSecondary }]}>Use a short, descriptive name so entries are easier to scan.</Text>

                <TouchableOpacity
                  style={[styles.deleteSettingsBtn, { backgroundColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.12)' }]}
                  onPress={handleDeleteFromSettings}
                  disabled={groupSettingsSaving}
                >
                  <Text style={styles.deleteSettingsText}>Delete Group</Text>
                </TouchableOpacity>

                <View style={styles.groupSettingsActionRow}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.groupSettingsActionBtn, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setShowGroupSettingsModal(false);
                      setSelectedGroupForSettings(null);
                    }}
                    disabled={groupSettingsSaving}
                  >
                    <Text style={[styles.groupSettingsActionText, { color: scheme.text }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.groupSettingsActionBtn,
                      { backgroundColor: canSaveGroupSettings ? Colors.primary : isDark ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.28)' },
                    ]}
                    onPress={handleSaveGroupSettings}
                    disabled={groupSettingsSaving || !canSaveGroupSettings}
                  >
                    {groupSettingsSaving ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={styles.groupSettingsPrimaryActionText}>Save Changes</Text>}
                  </TouchableOpacity>
                </View>
              </KeyboardAvoidingView>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <Modal visible={showRestoreModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}>Restore Vault Backup</Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Restore Mode</Text>
                <View style={styles.restoreModeRow}>
                  <TouchableOpacity
                    style={[styles.restoreModeChip, restoreMode === 'merge' && styles.restoreModeChipActive]}
                    onPress={() => setRestoreMode('merge')}
                  >
                    <Text style={[styles.restoreModeText, restoreMode === 'merge' && styles.restoreModeTextActive]}>Merge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.restoreModeChip, restoreMode === 'overwrite' && styles.restoreModeChipActive]}
                    onPress={() => setRestoreMode('overwrite')}
                  >
                    <Text style={[styles.restoreModeText, restoreMode === 'overwrite' && styles.restoreModeTextActive]}>Overwrite</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Unlock Method</Text>
                <View style={styles.restoreModeRow}>
                  <TouchableOpacity
                    style={[styles.restoreModeChip, restoreAuthType === 'vault_password' && styles.restoreModeChipActive]}
                    onPress={() => setRestoreAuthType('vault_password')}
                  >
                    <Text style={[styles.restoreModeText, restoreAuthType === 'vault_password' && styles.restoreModeTextActive]}>Master Password</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.restoreModeChip, restoreAuthType === 'recovery_key' && styles.restoreModeChipActive]}
                    onPress={() => setRestoreAuthType('recovery_key')}
                  >
                    <Text style={[styles.restoreModeText, restoreAuthType === 'recovery_key' && styles.restoreModeTextActive]}>Recovery Key</Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>
                  {restoreAuthType === 'vault_password' ? 'Master Password' : 'Recovery Key'}
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={restoreSecret}
                  onChangeText={setRestoreSecret}
                  placeholder={restoreAuthType === 'vault_password' ? 'Enter master password' : 'Enter recovery key'}
                  placeholderTextColor={scheme.textSecondary}
                  secureTextEntry={restoreAuthType === 'vault_password'}
                  autoCapitalize="none"
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setShowRestoreModal(false);
                      setRestoreSecret('');
                    }}
                    disabled={backupBusy}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                    onPress={handleRestore}
                    disabled={backupBusy}
                  >
                    {backupBusy ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: '#FFF', fontWeight: '700' }}>Restore</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  lockButton: {
    padding: Spacing.sm,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  surfaceWrap: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  heroBadge: {
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
  },
  backupPanel: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  backupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  backupTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backupTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  backupMeta: {
    fontSize: Typography.fontSize.xs,
    flexShrink: 1,
    textAlign: 'right',
  },
  backupSub: {
    fontSize: Typography.fontSize.sm,
  },
  backupActionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  backupActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backupActionText: {
    color: '#FFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  backupRecoveryText: {
    fontSize: Typography.fontSize.xs,
  },
  sectionsWrap: {
    gap: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  sectionBlock: {
    gap: Spacing.md,
  },
  sectionAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  sectionActionText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  cardStack: {
    gap: Spacing.sm,
  },
  loader: {
    marginTop: 100,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  list: {
    padding: Spacing.md,
  },
  addGroupBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  addEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: 24,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  groupMainTap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  groupInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  groupActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.xs,
    gap: 2,
  },
  groupIconBtn: {
    padding: Spacing.sm,
    borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  groupName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  groupMeta: {
    fontSize: Typography.fontSize.sm,
  },
  groupContent: {
    paddingLeft: Spacing.lg,
  },
  addToGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  entryCard: {
    borderRadius: 24,
    marginBottom: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  entryInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  entryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  entryUsername: {
    fontSize: Typography.fontSize.sm,
  },
  entryDetails: {
    padding: Spacing.md,
    borderTopWidth: 1,
  },
  detailRow: {
    marginBottom: Spacing.sm,
  },
  detailLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: 2,
  },
  detailValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailValueText: {
    fontSize: Typography.fontSize.md,
  },
  detailActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    fontSize: Typography.fontSize.md,
  },
  fileName: {
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
  },
  previewLine: {
    fontSize: Typography.fontSize.sm,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  deleteSettingsBtn: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  deleteSettingsText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: Typography.fontSize.sm,
  },
  restoreModeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  restoreModeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(124,58,237,0.1)',
  },
  restoreModeChipActive: {
    backgroundColor: Colors.primary,
  },
  restoreModeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  restoreModeTextActive: {
    color: '#FFF',
  },
  groupSettingsHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  groupSettingsIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  groupSettingsHeaderTextWrap: {
    flex: 1,
  },
  groupSettingsTitle: {
    textAlign: 'left',
    marginBottom: 2,
  },
  groupSettingsSubtitle: {
    fontSize: Typography.fontSize.sm,
    lineHeight: 18,
  },
  groupSettingsInfoCard: {
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.sm,
  },
  groupSettingsInfoLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  groupSettingsInfoValue: {
    marginTop: 3,
    fontSize: Typography.fontSize.md,
    fontWeight: '700',
  },
  groupSettingsHint: {
    marginTop: 6,
    fontSize: Typography.fontSize.xs,
    lineHeight: 17,
  },
  groupSettingsActionText: {
    fontWeight: '600',
  },
  groupSettingsPrimaryActionText: {
    color: '#FFF',
    fontWeight: '700',
  },
  groupSettingsActionRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
    paddingTop: Spacing.xs,
    marginBottom: Spacing.lg,
  },
  groupSettingsActionBtn: {
    minHeight: 40,
    paddingVertical: Spacing.sm  + 3,
    paddingHorizontal: Spacing.sm,
  },
});