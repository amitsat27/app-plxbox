import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Clock3, Folder, Globe, Key, Plus } from 'lucide-react-native';
import { Colors } from '@/theme/color';
import { BorderRadius, Spacing, Typography } from '@/constants/designTokens';
import { useTheme } from '@/theme/themeProvider';
import { PasswordEntry, PasswordGroup } from '@/src/types/passwords';
import { vaultService } from '@/src/services/passwords';
import { useAuth } from '@/src/context/AuthContext';
import * as Haptics from 'expo-haptics';
import {
  PasswordChipBar,
  PasswordEmptyState,
  PasswordHero,
  PasswordSearchBar,
  PasswordSectionHeader,
} from '@/components/passwords/PasswordDesign';

export default function PasswordGroupScreen() {
  const { groupId, vaultId, groupPath } = useLocalSearchParams<{
    groupId: string;
    vaultId: string;
    groupPath?: string;
  }>();
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const scheme = {
    background: isDark ? Colors.darkBackground : '#F2F2F7',
    card: isDark ? Colors.darkCard : '#FFFFFF',
    text: isDark ? Colors.darkText : '#000000',
    textSecondary: '#8E8E93',
    border: isDark ? '#38383A' : '#E5E5EA',
  };

  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<PasswordGroup[]>([]);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [savingEntry, setSavingEntry] = useState(false);
  const [entryForm, setEntryForm] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [filterBy, setFilterBy] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      vaultService.setUser(user.uid);
    }
    loadData();
  }, [user?.uid, groupId, vaultId]);

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

  const loadData = async () => {
    if (!vaultId) return;
    try {
      const [vaultGroups, vaultEntries] = await Promise.all([
        vaultService.getGroups(vaultId),
        vaultService.getEntries(vaultId),
      ]);
      setGroups(vaultGroups);
      setEntries(vaultEntries);
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentGroup = useMemo(
    () =>
      groupPath
        ? {
            id: `path-${groupPath}`,
            name: groupPath,
            parentId: null,
            fullPath: groupPath,
            entryCount: 0,
            children: [],
            isExpanded: false,
          }
        : groups.find((group) => group.id === groupId) || null,
    [groups, groupId, groupPath]
  );

  const groupEntries = useMemo(
    () =>
      groupPath
        ? entries.filter((entry) => (entry.groupPath?.trim() || 'Ungrouped') === groupPath)
        : entries.filter((entry) => entry.groupId === groupId),
    [entries, groupId, groupPath]
  );

  const visibleEntries = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let next = groupEntries.filter((entry) => {
      const matchesSearch =
        !query ||
        entry.title.toLowerCase().includes(query) ||
        (entry.username || '').toLowerCase().includes(query) ||
        (entry.url || '').toLowerCase().includes(query);

      const matchesFilter =
        filterBy === 'all'
          ? true
          : filterBy === 'withUser'
            ? !!entry.username?.trim()
            : !entry.username?.trim();

      return matchesSearch && matchesFilter;
    });

    if (sortBy === 'name') {
      next = [...next].sort((left, right) => left.title.localeCompare(right.title));
    } else if (sortBy === 'modified') {
      next = [...next].sort((left, right) => (right.modifiedAt || right.createdAt) - (left.modifiedAt || left.createdAt));
    } else {
      next = [...next].sort((left, right) => (right.modifiedAt || right.createdAt) - (left.modifiedAt || left.createdAt));
    }

    return next;
  }, [filterBy, groupEntries, searchQuery, sortBy]);

  const childGroups = useMemo(() => {
    if (!currentGroup) return [];

    if (groupPath) {
      const prefix = `${groupPath}/`;
      return groups.filter((group) => {
        if (!group.fullPath || !group.fullPath.startsWith(prefix)) return false;
        const remainder = group.fullPath.slice(prefix.length);
        return remainder.length > 0 && !remainder.includes('/');
      });
    }

    const byParent = groups.filter((group) => group.parentId === currentGroup.id);
    if (byParent.length > 0) return byParent;

    if (currentGroup.fullPath) {
      const prefix = `${currentGroup.fullPath}/`;
      return groups.filter((group) => {
        if (!group.fullPath || !group.fullPath.startsWith(prefix)) return false;
        const remainder = group.fullPath.slice(prefix.length);
        return remainder.length > 0 && !remainder.includes('/');
      });
    }

    return [];
  }, [currentGroup, groupPath, groups]);

  const openChildGroup = (group: PasswordGroup) => {
    router.push({
      pathname: '/passwords/group/[groupId]',
      params: {
        groupId: group.id,
        vaultId: vaultId!,
        groupPath: group.fullPath,
      },
    });
  };

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Updated just now';
    const diffMs = Date.now() - timestamp;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'Updated just now';
    if (diffMin < 60) return `Updated ${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `Updated ${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `Updated ${diffDay}d ago`;
    return `Updated ${new Date(timestamp).toLocaleDateString('en-IN')}`;
  };

  const getUrlHost = (url?: string) => {
    const clean = (url || '').trim();
    if (!clean) return '';
    try {
      const parsed = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return clean.replace(/^https?:\/\//, '').split('/')[0];
    }
  };

  const handleCreateEntry = async () => {
    if (!vaultId) return;
    if (!entryForm.title.trim() || !entryForm.password.trim()) {
      Alert.alert('Error', 'Title and password are required');
      return;
    }

    setSavingEntry(true);
    try {
      const matchedGroup = groupPath
        ? groups.find((group) => group.fullPath === groupPath)
        : groups.find((group) => group.id === groupId);

      await vaultService.addEntry(vaultId, {
        title: entryForm.title.trim(),
        username: entryForm.username.trim(),
        password: entryForm.password,
        url: entryForm.url.trim(),
        notes: entryForm.notes.trim(),
        groupId: matchedGroup?.id || groupId || null,
        groupPath: matchedGroup?.fullPath || groupPath || '',
        tags: [],
        favorite: false,
        customFields: {},
      });

      await loadData();
      setShowAddEntry(false);
      setEntryForm({ title: '', username: '', password: '', url: '', notes: '' });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Entry added');
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to add entry');
    } finally {
      setSavingEntry(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!currentGroup) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
            <ArrowLeft size={22} color={scheme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: scheme.text }]}>Group Not Found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}> 
      <View style={[styles.header, { borderBottomColor: scheme.border }]}> 
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <ArrowLeft size={22} color={scheme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: scheme.text }]} numberOfLines={1}>
            {currentGroup.name}
          </Text>
          <Text style={[styles.headerMeta, { color: scheme.textSecondary }]}>
            {groupEntries.length} entries
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: Colors.primary }]}
          onPress={() => setShowAddEntry(true)}
        >
          <Plus size={18} color="#FFF" />
        </TouchableOpacity>
      </View>

      <FlatList
        style={styles.list}
        data={[{ id: 'content' }]}
        keyExtractor={(item) => item.id}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
        renderItem={() => (
          <View>
            <View style={styles.surfaceWrap}>
              <View style={[styles.bgOrb, { backgroundColor: isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.12)' }]} />
              <PasswordHero
                title={currentGroup.name}
                subtitle={`${currentGroup.fullPath || currentGroup.name} • ${childGroups.length} subgroups`}
                accent={Colors.primary}
                icon={<Folder size={18} color="#FFF" />}
                statLabel="entries"
                statValue={`${visibleEntries.length}`}
              />

              <View style={styles.toolsBlock}>
                <PasswordSearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search this group"
                  onClear={() => setSearchQuery('')}
                />
                <PasswordChipBar
                  label="Sort"
                  value={sortBy}
                  onChange={setSortBy}
                  options={[
                    { key: 'recent', label: 'Recent' },
                    { key: 'name', label: 'Name' },
                    { key: 'modified', label: 'Modified' },
                  ]}
                />
                <PasswordChipBar
                  label="Filter"
                  value={filterBy}
                  onChange={setFilterBy}
                  options={[
                    { key: 'all', label: 'All' },
                    { key: 'withUser', label: 'With Username' },
                    { key: 'noUser', label: 'No Username' },
                  ]}
                />
              </View>
            </View>

            {childGroups.length > 0 ? (
              <View style={styles.subgroupSection}>
                <PasswordSectionHeader
                  title="Subgroups"
                  subtitle={`${childGroups.length} available`}
                />
                <View style={styles.subgroupStack}>
                  {childGroups.map((group) => {
                    const subgroupEntryCount = entries.filter((entry) => entry.groupId === group.id).length;
                    return (
                      <TouchableOpacity
                        key={group.id}
                        style={[
                          styles.subgroupCard,
                          {
                            backgroundColor: scheme.card,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 6 },
                            shadowOpacity: isDark ? 0.3 : 0.09,
                            shadowRadius: isDark ? 10 : 14,
                            elevation: isDark ? 2 : 3,
                          },
                        ]}
                        onPress={() => openChildGroup(group)}
                        activeOpacity={0.86}
                      >
                        <View style={[styles.subgroupIconWrap, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)' }]}>
                          <Folder size={16} color={Colors.primary} />
                        </View>
                        <View style={styles.subgroupInfo}>
                          <Text style={[styles.subgroupName, { color: scheme.text }]} numberOfLines={1}>{group.name}</Text>
                          <Text style={[styles.subgroupMeta, { color: scheme.textSecondary }]} numberOfLines={1}>
                            {group.fullPath || group.name}
                          </Text>
                          <View style={styles.subgroupMetaRow}>
                            <View style={[styles.subgroupPill, { backgroundColor: isDark ? 'rgba(124,58,237,0.2)' : 'rgba(124,58,237,0.12)' }]}>
                              <Text style={styles.subgroupPillText}>{subgroupEntryCount} entries</Text>
                            </View>
                          </View>
                        </View>
                        <ChevronRight size={18} color={scheme.textSecondary} />
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}

            <PasswordSectionHeader
              title="Entries"
              subtitle={`${visibleEntries.length} visible`}
            />

            {visibleEntries.length === 0 ? (
              <PasswordEmptyState
                title="No entries found"
                subtitle="Create a new entry or adjust search and sorting to reveal matches."
                actionLabel="Add entry"
                onAction={() => setShowAddEntry(true)}
                icon={<Key size={22} color={Colors.primary} />}
              />
            ) : (
              <View style={styles.entryStack}>
                {visibleEntries.map((entry) => (
                  <TouchableOpacity
                    key={entry.id}
                    style={[
                      styles.entryCard,
                      {
                        backgroundColor: scheme.card,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: isDark ? 0.3 : 0.09,
                        shadowRadius: isDark ? 10 : 14,
                        elevation: isDark ? 2 : 3,
                      },
                    ]}
                    onPress={() =>
                      router.push({
                        pathname: '/passwords/[id]',
                        params: { id: entry.id, vaultId: vaultId! },
                      })
                    }
                    activeOpacity={0.86}
                  >
                    <View style={styles.entryAccent} />
                    <View style={[styles.entryTypeIcon, { backgroundColor: isDark ? 'rgba(124,58,237,0.18)' : 'rgba(124,58,237,0.10)' }]}>
                      <Key size={14} color={Colors.primary} />
                    </View>
                    <View style={styles.entryInfoBlock}>
                      <Text style={[styles.groupName, { color: scheme.text }]}>{entry.title}</Text>
                      <Text style={[styles.entrySubtext, { color: scheme.textSecondary }]}>
                        {entry.username || 'No username'}
                      </Text>
                      <View style={styles.entryMetaRow}>
                        {!!entry.url?.trim() && (
                          <View style={[styles.entryMetaChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.06)' }]}>
                            <Globe size={11} color={scheme.textSecondary} />
                            <Text style={[styles.entryMetaChipText, { color: scheme.textSecondary }]} numberOfLines={1}>
                              {getUrlHost(entry.url)}
                            </Text>
                          </View>
                        )}
                        <View style={[styles.entryMetaChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.09)' : 'rgba(15,23,42,0.06)' }]}>
                          <Clock3 size={11} color={scheme.textSecondary} />
                          <Text style={[styles.entryMetaChipText, { color: scheme.textSecondary }]}>
                            {formatRelativeTime(entry.modifiedAt || entry.createdAt)}
                          </Text>
                        </View>
                      </View>
                    </View>
                    {!!entry.username?.trim() && (
                      <View style={[styles.userBadge, { backgroundColor: isDark ? 'rgba(59,130,246,0.22)' : 'rgba(59,130,246,0.14)' }]}>
                        <Text style={styles.userBadgeText}>User</Text>
                      </View>
                    )}
                    <ChevronRight size={18} color={scheme.textSecondary} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      />

      <Modal visible={showAddEntry} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}>Add Entry</Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Title *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={entryForm.title}
                  onChangeText={(value) => setEntryForm((prev) => ({ ...prev, title: value }))}
                  placeholder="e.g. Gmail"
                  placeholderTextColor={scheme.textSecondary}
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Username</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={entryForm.username}
                  onChangeText={(value) => setEntryForm((prev) => ({ ...prev, username: value }))}
                  placeholder="Optional"
                  placeholderTextColor={scheme.textSecondary}
                  autoCapitalize="none"
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Password *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={entryForm.password}
                  onChangeText={(value) => setEntryForm((prev) => ({ ...prev, password: value }))}
                  placeholder="Required"
                  placeholderTextColor={scheme.textSecondary}
                  secureTextEntry
                  autoCapitalize="none"
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>URL</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={entryForm.url}
                  onChangeText={(value) => setEntryForm((prev) => ({ ...prev, url: value }))}
                  placeholder="Optional"
                  placeholderTextColor={scheme.textSecondary}
                  autoCapitalize="none"
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={entryForm.notes}
                  onChangeText={(value) => setEntryForm((prev) => ({ ...prev, notes: value }))}
                  placeholder="Optional"
                  placeholderTextColor={scheme.textSecondary}
                  multiline
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: scheme.background }]}
                    onPress={() => {
                      setEntryForm({ title: '', username: '', password: '', url: '', notes: '' });
                      setShowAddEntry(false);
                    }}
                    disabled={savingEntry}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, { backgroundColor: Colors.primary }]}
                    onPress={handleCreateEntry}
                    disabled={savingEntry}
                  >
                    {savingEntry ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={styles.saveText}>Save</Text>}
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
  container: { flex: 1 },
  loader: { marginTop: 120 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  iconBtn: {
    padding: Spacing.xs,
  },
  headerCenter: {
    flex: 1,
    marginHorizontal: Spacing.sm,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  headerMeta: {
    fontSize: Typography.fontSize.sm,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexGrow: 1,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  list: {
    flex: 1,
  },
  surfaceWrap: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    position: 'relative',
    overflow: 'hidden',
  },
  bgOrb: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    top: -30,
    right: -28,
  },
  toolsBlock: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    overflow: 'visible',
  },
  entryStack: {
    marginTop: Spacing.sm,
  },
  subgroupSection: {
    marginTop: Spacing.sm,
  },
  subgroupStack: {
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  subgroupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  subgroupIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  subgroupInfo: {
    flex: 1,
    minWidth: 0,
  },
  subgroupName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  subgroupMeta: {
    fontSize: Typography.fontSize.xs,
    marginTop: 2,
  },
  subgroupMetaRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  subgroupPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  subgroupPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  entryAccent: {
    width: 4,
    height: 34,
    borderRadius: 999,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  entryTypeIcon: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.sm,
  },
  entryInfoBlock: {
    flex: 1,
    minWidth: 0,
  },
  groupName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  entryMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 7,
  },
  entryMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  entryMetaChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  userBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: Spacing.xs,
  },
  userBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  entrySubtext: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
  },
  groupMeta: {
    fontSize: Typography.fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: '700',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
  },
  textArea: {
    minHeight: 82,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalButton: {
    flex: 1,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
  },
});