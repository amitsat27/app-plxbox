import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '@/theme/color';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { useTheme } from '@/theme/themeProvider';
import * as Haptics from 'expo-haptics';
import { ArrowLeft, Copy, Trash2, Edit, Eye, EyeOff, Key, Globe, User, FileText, Lock } from 'lucide-react-native';
import { vaultService } from '@/src/services/passwords';
import { PasswordEntry } from '@/src/types/passwords';
import { useAuth } from '@/src/context/AuthContext';
import {
  PasswordEmptyState,
  PasswordHero,
  PasswordSectionHeader,
} from '@/components/passwords/PasswordDesign';

export default function PasswordDetailScreen() {
  const { id, entryId, vaultId } = useLocalSearchParams<{ id?: string; entryId?: string; vaultId: string }>();
  const resolvedEntryId = id || entryId;
  const router = useRouter();
  const { isDark } = useTheme();
  const { user } = useAuth();

  const getColorScheme = (dark: boolean) => ({
    background: dark ? Colors.darkBackground : '#F2F2F7',
    card: dark ? Colors.darkCard : '#FFFFFF',
    text: dark ? Colors.darkText : '#000000',
    textSecondary: dark ? '#8E8E93' : '#8E8E93',
    border: dark ? '#38383A' : '#E5E5EA',
  });

  const scheme = getColorScheme(isDark);

  const [entry, setEntry] = useState<PasswordEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showHistoryPasswords, setShowHistoryPasswords] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    username: '',
    password: '',
    url: '',
    notes: '',
  });

  const historyRecords = entry
    ? Array.isArray(entry.passwordHistory) && entry.passwordHistory.length > 0
      ? [...entry.passwordHistory].sort((a, b) => b.changedAt - a.changedAt)
      : [
          {
            id: `current-${entry.id}`,
            password: entry.password,
            changedAt: entry.modifiedAt || entry.createdAt,
            username: entry.username,
          },
        ]
    : [];

  useEffect(() => {
    if (user?.uid) {
      vaultService.setUser(user.uid);
    }
    loadEntry();
  }, [resolvedEntryId, vaultId, user?.uid]);

  const loadEntry = async () => {
    if (!resolvedEntryId || !vaultId) return;
    try {
      const entries = await vaultService.getEntries(vaultId);
      const found = entries.find(e => e.id === resolvedEntryId);
      setEntry(found || null);
    } catch (error) {
      console.error('Error loading entry:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert('Copied', `${label} copied to clipboard`);
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Password',
      'Are you sure you want to delete this password?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await vaultService.deleteEntry(vaultId!, resolvedEntryId!);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  const handleStartEdit = () => {
    if (!entry) return;
    setShowEditPassword(false);
    setEditForm({
      title: entry.title,
      username: entry.username || '',
      password: entry.password,
      url: entry.url || '',
      notes: entry.notes || '',
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!entry || !vaultId || !resolvedEntryId) return;

    if (!editForm.title.trim() || !editForm.password.trim()) {
      Alert.alert('Error', 'Title and password are required');
      return;
    }

    setSaving(true);
    try {
      const updated = await vaultService.updateEntry(vaultId, resolvedEntryId, {
        title: editForm.title.trim(),
        username: editForm.username.trim(),
        password: editForm.password,
        url: editForm.url.trim(),
        notes: editForm.notes.trim(),
        groupId: entry.groupId,
        groupPath: entry.groupPath,
        tags: entry.tags || [],
        favorite: !!entry.favorite,
        customFields: entry.customFields || {},
      });

      setEntry(updated);
      setShowEditModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error?.message || 'Failed to update entry');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
      </SafeAreaView>
    );
  }

  if (!entry) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={scheme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: scheme.text }]}>Not Found</Text>
        </View>
        <Text style={[styles.errorText, { color: scheme.textSecondary }]}>Password entry not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={scheme.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: scheme.text }]} numberOfLines={1}>
              {entry.title}
            </Text>
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={handleStartEdit} style={styles.actionBtn}>
                <Edit size={20} color={Colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleDelete} style={styles.actionBtn}>
                <Trash2 size={20} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.surfaceWrap}>
            <PasswordHero
              title={entry.title}
              subtitle={entry.username || entry.url || 'Secure entry details with copy, edit, and history controls.'}
              accent={Colors.primary}
              icon={<Key size={18} color="#FFF" />}
              statLabel="updated"
              statValue={new Date(entry.modifiedAt || entry.createdAt).toLocaleDateString()}
            />

            <View style={styles.quickActions}>
              <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: scheme.card, borderColor: scheme.border }]} onPress={handleStartEdit}>
                <Edit size={18} color={Colors.primary} />
                <Text style={[styles.quickActionText, { color: scheme.text }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.quickActionBtn, { backgroundColor: scheme.card, borderColor: scheme.border }]} onPress={handleDelete}>
                <Trash2 size={18} color="#EF4444" />
                <Text style={[styles.quickActionText, { color: scheme.text }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: scheme.card }]}>
            <PasswordSectionHeader title="Credentials" subtitle="Tap a field to copy it" />
            
            {entry.username && (
              <TouchableOpacity style={styles.detailRow} onPress={() => handleCopy(entry.username, 'Username')}>
                <View style={styles.detailIcon}>
                  <User size={18} color={scheme.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailLabel, { color: scheme.textSecondary }]}>Username</Text>
                  <Text style={[styles.detailValue, { color: scheme.text }]}>{entry.username}</Text>
                </View>
                <Copy size={18} color={scheme.textSecondary} />
              </TouchableOpacity>
            )}

            <TouchableOpacity style={styles.detailRow} onPress={() => handleCopy(entry.password, 'Password')}>
              <View style={styles.detailIcon}>
                <Lock size={18} color={scheme.textSecondary} />
              </View>
              <View style={styles.detailContent}>
                <Text style={[styles.detailLabel, { color: scheme.textSecondary }]}>Password</Text>
                <Text style={[styles.detailValue, { color: scheme.text }]}>
                  {showPassword ? entry.password : '••••••••••••'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? <EyeOff size={18} color={scheme.textSecondary} /> : <Eye size={18} color={scheme.textSecondary} />}
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: scheme.card }]}> 
            <PasswordSectionHeader title="Metadata" subtitle="Creation and modification history" />
            <Text style={[styles.metaText, { color: scheme.textSecondary }]}>Created: {new Date(entry.createdAt).toLocaleDateString()}</Text>
            <Text style={[styles.metaText, { color: scheme.textSecondary }]}>Modified: {new Date(entry.modifiedAt).toLocaleDateString()}</Text>
          </View>

          {entry.url && (
            <View style={[styles.card, { backgroundColor: scheme.card }]}>
              <PasswordSectionHeader title="Website" subtitle="Open or copy the saved URL" />
              <TouchableOpacity style={styles.detailRow} onPress={() => handleCopy(entry.url, 'URL')}>
                <View style={styles.detailIcon}>
                  <Globe size={18} color={scheme.textSecondary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={[styles.detailValue, { color: Colors.primary }]}>{entry.url}</Text>
                </View>
                <Copy size={18} color={scheme.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          {entry.notes && (
            <View style={[styles.card, { backgroundColor: scheme.card }]}>
              <PasswordSectionHeader title="Notes" subtitle="Additional context attached to the entry" />
              <View style={styles.notesRow}>
                <FileText size={18} color={scheme.textSecondary} />
                <Text style={[styles.notesText, { color: scheme.text }]}>{entry.notes}</Text>
              </View>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: scheme.card }]}> 
            <TouchableOpacity style={styles.historyHeader} onPress={() => setShowHistory((prev) => !prev)}>
              <PasswordSectionHeader title="Password history" subtitle="Track changes over time" />
              <View style={styles.historyActions}>
                <TouchableOpacity onPress={() => setShowHistoryPasswords((prev) => !prev)}>
                  <Text style={[styles.historyToggle, { color: Colors.primary }]}>
                    {showHistoryPasswords ? 'Mask' : 'Reveal'}
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.historyToggle, { color: Colors.primary }]}>{showHistory ? 'Hide' : 'Show'}</Text>
              </View>
            </TouchableOpacity>

            {showHistory && (
              <View style={styles.historyList}>
                {historyRecords.length > 0 ? (
                  historyRecords.map((item, index) => (
                      <View key={item.id} style={[styles.historyItem, { borderBottomColor: scheme.border }]}> 
                        <View style={styles.historyTopRow}>
                          <Text style={[styles.historyValue, { color: scheme.text }]}>
                            {showHistoryPasswords ? item.password : '••••••••••••'}
                          </Text>
                          <View style={styles.historyRightActions}>
                            <Text style={[styles.historyBadge, index === 0 ? styles.currentBadge : styles.previousBadge]}>
                              {index === 0 ? 'Current' : `Previous ${index}`}
                            </Text>
                            <TouchableOpacity
                              style={styles.historyCopyBtn}
                              onPress={() => handleCopy(item.password, index === 0 ? 'Current password' : `Previous password ${index}`)}
                            >
                              <Copy size={16} color={scheme.textSecondary} />
                            </TouchableOpacity>
                          </View>
                        </View>
                        <Text style={[styles.historyDate, { color: scheme.textSecondary }]}>
                          {new Date(item.changedAt).toLocaleString()}
                        </Text>
                      </View>
                    ))
                ) : (
                  <PasswordEmptyState
                    title="No history yet"
                    subtitle="The original password will appear here after the first change."
                    icon={<Lock size={22} color={Colors.primary} />}
                  />
                )}
              </View>
            )}
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <Modal visible={showEditModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalContent, { backgroundColor: scheme.card }]}> 
                <Text style={[styles.modalTitle, { color: scheme.text }]}>Edit Entry</Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Title *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={editForm.title}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, title: text }))}
                  placeholder="Title"
                  placeholderTextColor={scheme.textSecondary}
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Username</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={editForm.username}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, username: text }))}
                  placeholder="Username"
                  placeholderTextColor={scheme.textSecondary}
                  autoCapitalize="none"
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Password *</Text>
                <View style={[styles.inputWithAction, { backgroundColor: scheme.background, borderColor: scheme.border }]}> 
                  <TextInput
                    style={[styles.passwordInputField, { color: scheme.text }]}
                    value={editForm.password}
                    onChangeText={(text) => setEditForm((prev) => ({ ...prev, password: text }))}
                    placeholder="Password"
                    placeholderTextColor={scheme.textSecondary}
                    secureTextEntry={!showEditPassword}
                  />
                  <TouchableOpacity style={styles.inputActionBtn} onPress={() => setShowEditPassword((prev) => !prev)}>
                    {showEditPassword ? (
                      <EyeOff size={18} color={scheme.textSecondary} />
                    ) : (
                      <Eye size={18} color={scheme.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>URL</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={editForm.url}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, url: text }))}
                  placeholder="https://example.com"
                  placeholderTextColor={scheme.textSecondary}
                  autoCapitalize="none"
                />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.notesInput, { backgroundColor: scheme.background, borderColor: scheme.border, color: scheme.text }]}
                  value={editForm.notes}
                  onChangeText={(text) => setEditForm((prev) => ({ ...prev, notes: text }))}
                  placeholder="Notes"
                  placeholderTextColor={scheme.textSecondary}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: scheme.background }]}
                    onPress={() => setShowEditModal(false)}
                    disabled={saving}
                  >
                    <Text style={{ color: scheme.text }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalBtn, { backgroundColor: Colors.primary }]}
                    onPress={handleSaveEdit}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.saveText}>Save</Text>
                    )}
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
  loader: { marginTop: 100 },
  scrollView: { flex: 1 },
  content: { padding: Spacing.md, paddingBottom: 40 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  backButton: { padding: Spacing.xs, marginRight: Spacing.sm },
  headerTitle: { flex: 1, fontSize: Typography.fontSize.xl, fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: Spacing.md },
  actionBtn: { padding: Spacing.xs },
  surfaceWrap: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.sm,
  },
  quickActionText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  errorText: { textAlign: 'center', marginTop: 100, fontSize: Typography.fontSize.md },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  titleText: { flex: 1, fontSize: Typography.fontSize.xl, fontWeight: '700' },
  sectionTitle: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.md,
    letterSpacing: 1,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  detailIcon: { width: 28, marginRight: Spacing.sm },
  detailContent: { flex: 1 },
  detailLabel: { fontSize: Typography.fontSize.xs, marginBottom: 2 },
  detailValue: { fontSize: Typography.fontSize.md },
  notesRow: { flexDirection: 'row', gap: Spacing.sm },
  notesText: { flex: 1, fontSize: Typography.fontSize.md, lineHeight: 22 },
  metaText: { fontSize: Typography.fontSize.sm, marginBottom: Spacing.xs },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  historyToggle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  historyList: {
    marginTop: Spacing.sm,
  },
  historyItem: {
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  historyValue: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
  },
  historyTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  historyCopyBtn: {
    padding: Spacing.xs,
  },
  historyBadge: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
    borderRadius: 999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    overflow: 'hidden',
  },
  currentBadge: {
    color: '#065F46',
    backgroundColor: 'rgba(16,185,129,0.15)',
  },
  previousBadge: {
    color: '#6D28D9',
    backgroundColor: 'rgba(124,58,237,0.15)',
  },
  historyDate: {
    fontSize: Typography.fontSize.sm,
    marginTop: 2,
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
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  inputLabel: {
    fontSize: Typography.fontSize.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: Typography.fontSize.md,
  },
  inputWithAction: {
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.md,
  },
  passwordInputField: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: Typography.fontSize.md,
  },
  inputActionBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  notesInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  modalBtn: {
    flex: 1,
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
  },
  saveText: {
    color: '#FFF',
    fontWeight: '700',
  },
});