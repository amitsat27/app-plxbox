import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/theme/color';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { useTheme } from '@/theme/themeProvider';
import {
  Upload,
  ChevronRight,
  ArrowLeft,
  FileKey,
  Folder,
} from 'lucide-react-native';
import { vaultService } from '@/src/services/passwords';
import { PasswordEntry, VaultMeta } from '@/src/types/passwords';
import { useAuth } from '@/src/context/AuthContext';
import {
  PasswordChipBar,
  PasswordEmptyState,
  PasswordHero,
  PasswordSearchBar,
  PasswordSectionHeader,
} from '@/components/passwords/PasswordDesign';

export default function PwsafeVaultScreen() {
  const { vaultId } = useLocalSearchParams<{ vaultId: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const getColorScheme = (dark: boolean) => ({
    background: dark ? '#000000' : '#F2F2F7',
    card: dark ? '#1C1C1E' : '#FFFFFF',
    text: dark ? '#FFFFFF' : '#000000',
    textSecondary: dark ? '#8E8E93' : '#8E8E93',
    primary: '#8B5CF6',
    border: dark ? '#38383A' : '#E5E5EA',
  });

  const scheme = getColorScheme(isDark);

  const [vault, setVault] = useState<VaultMeta | null>(null);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');

  useEffect(() => {
    if (user?.uid) {
      vaultService.setUser(user.uid);
    }
    loadVaultData();
  }, [vaultId, user?.uid]);

  useEffect(() => {
    if (!vaultId) return;

    const unSubEntries = vaultService.subscribeToEntries(vaultId, (nextEntries) => {
      setEntries(nextEntries);
    });

    return () => {
      unSubEntries();
    };
  }, [vaultId]);

  const loadVaultData = async () => {
    if (!vaultId) return;
    try {
      const allVaults = await vaultService.getAllVaults();
      const vaultMeta = allVaults.find((v) => v.id === vaultId);
      if (vaultMeta) {
        setVault(vaultMeta);
        const vaultEntries = await vaultService.getEntries(vaultId);
        setEntries(vaultEntries);
      }
    } catch (error) {
      console.error('Error loading vault:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLockVault = () => {
    vaultService.lockVault();
    router.back();
  };

  const groupedByPath = entries.reduce<Record<string, PasswordEntry[]>>((acc, entry) => {
    const key = entry.groupPath?.trim() || 'Ungrouped';
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(entry);
    return acc;
  }, {});

  const groupNames = Object.keys(groupedByPath).sort();

  const visibleGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let next = groupNames.filter((groupName) => !query || groupName.toLowerCase().includes(query));

    if (sortBy === 'name') {
      next = [...next].sort((left, right) => left.localeCompare(right));
    } else {
      next = [...next].sort((left, right) => (groupedByPath[right]?.length || 0) - (groupedByPath[left]?.length || 0));
    }

    return next;
  }, [groupNames, groupedByPath, searchQuery, sortBy]);

  const renderGroup = (groupName: string, index: number) => {
    const groupEntriesCount = groupedByPath[groupName]?.length || 0;
    return (
      <TouchableOpacity
        key={groupName}
        style={[styles.groupCard, { backgroundColor: scheme.card }]}
        onPress={() =>
          router.push({
            pathname: '/passwords/group/[groupId]',
            params: {
              groupId: `path-${index}`,
              vaultId: vaultId!,
              groupPath: groupName,
            },
          })
        }
      >
        <Folder size={18} color={Colors.primary} />
        <View style={styles.groupInfo}>
          <Text style={[styles.groupTitle, { color: scheme.text }]}>{groupName}</Text>
          <Text style={[styles.groupMeta, { color: scheme.textSecondary }]}>
            {groupEntriesCount} entries
          </Text>
        </View>
        <ChevronRight size={18} color={scheme.textSecondary} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleLockVault}>
          <ArrowLeft size={24} color={scheme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: scheme.text }]}>
            {vault?.name || 'pwsafe Vault'}
          </Text>
          <Text style={[styles.headerSubtitle, { color: scheme.textSecondary }]}>
            {entries.length} entries
          </Text>
        </View>
        <TouchableOpacity
          style={styles.importButton}
          onPress={() => setShowImportModal(true)}
        >
          <Upload size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.surfaceWrap}>
        <PasswordHero
          title={vault?.name || 'pwsafe Vault'}
          subtitle="Legacy Password Safe data in a cleaner, premium vault shell."
          accent="#8B5CF6"
          icon={<FileKey size={18} color="#FFF" />}
          statLabel="entries"
          statValue={`${entries.length}`}
        />

        <View style={styles.toolsBlock}>
          <PasswordSearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search groups"
            onClear={() => setSearchQuery('')}
          />
          <PasswordChipBar
            label="Sort"
            value={sortBy}
            onChange={setSortBy}
            options={[
              { key: 'recent', label: 'Most used' },
              { key: 'name', label: 'Name' },
            ]}
          />
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
          data={[{ key: 'content' }]}
          keyExtractor={(item) => item.key}
          renderItem={() => (
            <View>
              <PasswordSectionHeader
                title="Groups"
                subtitle={`${visibleGroups.length} visible`}
              />
              <View style={styles.groupStack}>
                {visibleGroups.map((name, index) => renderGroup(name, index))}
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <PasswordEmptyState
              title="No passwords yet"
              subtitle="Import your Password Safe database"
              actionLabel="Import .psafe3 File"
              onAction={() => setShowImportModal(true)}
              icon={<FileKey size={22} color={Colors.primary} />}
            />
          }
        />
      )}

      {/* Import Modal */}
      <Modal visible={showImportModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
          <View style={[styles.modalContent, { backgroundColor: scheme.card }]}>
            <Text style={[styles.modalTitle, { color: scheme.text }]}>
              Import Password Safe
            </Text>
            <Text style={[styles.modalText, { color: scheme.textSecondary }]}>
              Select a .psafe3 file to import your passwords
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: scheme.background }]}
                onPress={() => setShowImportModal(false)}
              >
                <Text style={{ color: scheme.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                onPress={() => {
                  setShowImportModal(false);
                  Alert.alert('Info', 'File picker not implemented in this version');
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600' }}>Select File</Text>
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
  },
  backButton: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.sm,
  },
  importButton: {
    padding: Spacing.sm,
  },
  loader: {
    marginTop: 100,
  },
  list: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  surfaceWrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  toolsBlock: {
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  groupStack: {
    gap: Spacing.sm,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 0,
    borderWidth: 1,
    overflow: 'hidden',
  },
  groupInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: Spacing.sm,
  },
  groupTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  groupMeta: {
    fontSize: Typography.fontSize.sm,
  },
  groupCount: {
    fontSize: Typography.fontSize.sm,
  },
  entryCard: {
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    overflow: 'hidden',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
  },
  entryInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  entryTitle: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
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
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '600',
    marginTop: Spacing.md,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.md,
    marginTop: Spacing.xs,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.lg,
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
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  modalText: {
    fontSize: Typography.fontSize.md,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
});