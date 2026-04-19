import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import { useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Clock3, Database, DownloadCloud, History, RotateCcw } from 'lucide-react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spacing, Typography } from '@/constants/designTokens';
import { useAuth } from '@/src/context/AuthContext';
import { canSendBackupNotification } from '@/src/services/BackupNotificationSettings';
import {
  dataBackupService,
  type DataBackupRecord,
  type FirebaseProjectBackupRecord,
} from '@/src/services/DataBackupService';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

type DataBackupSchedule = {
  enabled: boolean;
  hour: number;
  minute: number;
  lastRunDate: string | null;
};

type ScheduleTarget = 'app' | 'firebase';

const APP_STORAGE_KEY = 'data_backup_schedule_v1';
const FIREBASE_STORAGE_KEY = 'firebase_full_backup_schedule_v1';
const FIREBASE_TARGET_MACHINE = 'azopeun';

const DEFAULT_SCHEDULE: DataBackupSchedule = {
  enabled: false,
  hour: 23,
  minute: 0,
  lastRunDate: null,
};

function formatSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DataBackupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [backups, setBackups] = useState<DataBackupRecord[]>([]);
  const [firebaseBackups, setFirebaseBackups] = useState<FirebaseProjectBackupRecord[]>([]);
  const [appSchedule, setAppSchedule] = useState<DataBackupSchedule>(DEFAULT_SCHEDULE);
  const [firebaseSchedule, setFirebaseSchedule] = useState<DataBackupSchedule>(DEFAULT_SCHEDULE);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<ScheduleTarget>('app');
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleHour, setScheduleHour] = useState('23');
  const [scheduleMinute, setScheduleMinute] = useState('00');

  const recentBackups = useMemo(() => backups.slice(0, 30), [backups]);
  const recentFirebaseBackups = useMemo(() => firebaseBackups.slice(0, 30), [firebaseBackups]);

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      dataBackupService.setUser(user.uid);
      const [cloudBackups, cloudFirebaseBackups, savedAppSchedule, savedFirebaseSchedule] = await Promise.all([
        dataBackupService.listBackups(),
        dataBackupService.listFirebaseProjectBackups(),
        AsyncStorage.getItem(APP_STORAGE_KEY),
        AsyncStorage.getItem(FIREBASE_STORAGE_KEY),
      ]);

      setBackups(cloudBackups);
      setFirebaseBackups(cloudFirebaseBackups);
      setAppSchedule(savedAppSchedule ? (JSON.parse(savedAppSchedule) as DataBackupSchedule) : DEFAULT_SCHEDULE);
      setFirebaseSchedule(savedFirebaseSchedule ? (JSON.parse(savedFirebaseSchedule) as DataBackupSchedule) : DEFAULT_SCHEDULE);
    } catch (error) {
      console.error('Failed to load data backups:', error);
      Alert.alert('Error', 'Unable to load data backups.');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  const saveSchedule = async (target: ScheduleTarget, next: DataBackupSchedule) => {
    if (target === 'app') {
      setAppSchedule(next);
      await AsyncStorage.setItem(APP_STORAGE_KEY, JSON.stringify(next));
      return;
    }

    setFirebaseSchedule(next);
    await AsyncStorage.setItem(FIREBASE_STORAGE_KEY, JSON.stringify(next));
  };

  const notifyIfEnabled = async (title: string, body: string) => {
    const shouldNotify = await canSendBackupNotification('data');
    if (!shouldNotify) return;

    await Notifications.scheduleNotificationAsync({
      content: { title, body },
      trigger: null,
    });
  };

  const runScheduledTick = useCallback(async () => {
    if (!user?.uid) return;

    const now = new Date();
    const dayKey = now.toISOString().slice(0, 10);

    try {
      dataBackupService.setUser(user.uid);
      const shouldRunApp =
        appSchedule.enabled &&
        appSchedule.lastRunDate !== dayKey &&
        appSchedule.hour === now.getHours() &&
        appSchedule.minute === now.getMinutes();

      const shouldRunFirebase =
        firebaseSchedule.enabled &&
        firebaseSchedule.lastRunDate !== dayKey &&
        firebaseSchedule.hour === now.getHours() &&
        firebaseSchedule.minute === now.getMinutes();

      if (!shouldRunApp && !shouldRunFirebase) {
        return;
      }

      if (shouldRunApp) {
        const record = await dataBackupService.runScheduledOverwriteBackup(FIREBASE_TARGET_MACHINE);
        await saveSchedule('app', { ...appSchedule, lastRunDate: dayKey });
        await notifyIfEnabled('Data backup completed', `Scheduled backup saved on ${record.targetMachine} (${record.itemCount} items).`);
      }

      if (shouldRunFirebase) {
        await dataBackupService.requestFirebaseProjectBackup('scheduled', FIREBASE_TARGET_MACHINE);
        await saveSchedule('firebase', { ...firebaseSchedule, lastRunDate: dayKey });
        await notifyIfEnabled('Firebase full backup requested', 'Scheduled Firestore + Storage backup request submitted.');
      }

      await loadData();
    } catch (error: any) {
      await notifyIfEnabled(
        'Data backup failed',
        error?.message || 'Scheduled backup could not be completed.',
      );
    }
  }, [appSchedule, firebaseSchedule, loadData, user?.uid]);

  useEffect(() => {
    if (!user?.uid) return;
    const timer = setInterval(() => {
      runScheduledTick().catch(() => {});
    }, 60 * 1000);

    return () => clearInterval(timer);
  }, [runScheduledTick, user?.uid]);

  const handleBackupNow = async () => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      dataBackupService.setUser(user.uid);
      const record = await dataBackupService.backupNow(FIREBASE_TARGET_MACHINE);
      await loadData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await notifyIfEnabled('Data backup completed', `Manual backup saved on ${record.targetMachine} (${record.itemCount} items).`);
      Alert.alert('Success', `Application data backup saved on ${record.targetMachine}.`);
    } catch (error: any) {
      Alert.alert('Backup failed', error?.message || 'Unable to create backup.');
    } finally {
      setBusy(false);
    }
  };

  const handleFirebaseBackupNow = async () => {
    if (!user?.uid) return;
    setBusy(true);
    try {
      dataBackupService.setUser(user.uid);
      await dataBackupService.requestFirebaseProjectBackup('manual', FIREBASE_TARGET_MACHINE);
      await loadData();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await notifyIfEnabled('Firebase full backup requested', `Manual Firestore + Storage backup request submitted for ${FIREBASE_TARGET_MACHINE}.`);
      Alert.alert('Request Submitted', `Full Firebase backup has been requested for ${FIREBASE_TARGET_MACHINE} and added to backup queue.`);
    } catch (error: any) {
      Alert.alert('Request failed', error?.message || 'Unable to request firebase full backup.');
    } finally {
      setBusy(false);
    }
  };

  const handleCancelFirebaseRequest = (item: FirebaseProjectBackupRecord) => {
    Alert.alert(
      'Cancel Backup Request',
      `Cancel full backup request ${item.id}?`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              if (!user?.uid) throw new Error('User not authenticated');
              dataBackupService.setUser(user.uid);
              await dataBackupService.cancelFirebaseProjectBackupRequest(item.id);
              await loadData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              await notifyIfEnabled('Firebase backup request cancelled', `Request ${item.id} was cancelled.`);
            } catch (error: any) {
              Alert.alert('Cancel failed', error?.message || 'Unable to cancel backup request.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteFirebaseRequest = (item: FirebaseProjectBackupRecord) => {
    Alert.alert(
      'Delete Backup Request',
      `Delete request ${item.id}? This cannot be undone.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              if (!user?.uid) throw new Error('User not authenticated');
              dataBackupService.setUser(user.uid);
              await dataBackupService.deleteFirebaseProjectBackupRequest(item.id);
              await loadData();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error: any) {
              Alert.alert('Delete failed', error?.message || 'Unable to delete backup request.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  const openScheduleModal = (target: ScheduleTarget) => {
    const selected = target === 'app' ? appSchedule : firebaseSchedule;
    setScheduleTarget(target);
    setScheduleEnabled(selected.enabled);
    setScheduleHour(String(selected.hour).padStart(2, '0'));
    setScheduleMinute(String(selected.minute).padStart(2, '0'));
    setShowScheduleModal(true);
  };

  const saveScheduleConfig = async () => {
    const hour = Number(scheduleHour);
    const minute = Number(scheduleMinute);

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      Alert.alert('Invalid time', 'Hour must be between 0 and 23.');
      return;
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      Alert.alert('Invalid time', 'Minute must be between 0 and 59.');
      return;
    }

    if (scheduleEnabled) {
      const permission = await Notifications.getPermissionsAsync();
      if (permission.status !== 'granted') {
        const requested = await Notifications.requestPermissionsAsync();
        if (requested.status !== 'granted') {
          Alert.alert('Permissions required', 'Enable notifications to receive backup status alerts.');
          return;
        }
      }
    }

    const next: DataBackupSchedule = {
      enabled: scheduleEnabled,
      hour,
      minute,
      lastRunDate: scheduleEnabled
        ? (scheduleTarget === 'app' ? appSchedule.lastRunDate : firebaseSchedule.lastRunDate)
        : null,
    };

    await saveSchedule(scheduleTarget, next);
    setShowScheduleModal(false);
    Alert.alert('Saved', `${scheduleTarget === 'app' ? 'Application data' : 'Firebase full backup'} schedule updated.`);
  };

  const handleRestore = (item: DataBackupRecord) => {
    Alert.alert(
      'Restore Backup',
      'This will overwrite current local application data values with selected backup values. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          style: 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              if (!user?.uid) throw new Error('User not authenticated');
              dataBackupService.setUser(user.uid);
              await dataBackupService.restoreBackup(item.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Restore complete', 'Backup restored to local application data.');
            } catch (error: any) {
              Alert.alert('Restore failed', error?.message || 'Unable to restore backup.');
            } finally {
              setBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={scheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: scheme.textPrimary }]}>Data Backups</Text>
        <View style={styles.backBtn} />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 80 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        >
          <View style={[styles.card, { backgroundColor: scheme.surface }]}>
            <View style={styles.cardHead}>
              <Database size={17} color={Colors.primary} />
              <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Application Data Backup</Text>
            </View>
            <Text style={[styles.meta, { color: scheme.textSecondary }]}>Back up local app state directly to your Raspberry Pi.</Text>
            <Text style={[styles.meta, { color: scheme.textSecondary }]}>Target machine: {FIREBASE_TARGET_MACHINE}</Text>

            <View style={styles.rowActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={handleBackupNow} disabled={busy}>
                <DownloadCloud size={14} color="#FFF" />
                <Text style={styles.actionBtnText}>Backup now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(124,58,237,0.12)' }]} onPress={() => openScheduleModal('app')}>
                <Clock3 size={14} color={Colors.primary} />
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Schedule</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.meta, { color: scheme.textSecondary }]}> 
              Schedule: {appSchedule.enabled ? `${String(appSchedule.hour).padStart(2, '0')}:${String(appSchedule.minute).padStart(2, '0')}` : 'Off'}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: scheme.surface }]}>
            <View style={styles.cardHead}>
              <Database size={17} color={Colors.primary} />
              <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Firebase Full Backup</Text>
            </View>
            <Text style={[styles.meta, { color: scheme.textSecondary }]}>Create backup requests for entire Firestore and Storage data.</Text>
            <Text style={[styles.meta, { color: scheme.textSecondary }]}>Target machine: {FIREBASE_TARGET_MACHINE}</Text>
            <Text style={[styles.meta, { color: scheme.textSecondary }]}>A backend worker should process these requests and update status/output path.</Text>

            <View style={styles.rowActions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={handleFirebaseBackupNow} disabled={busy}>
                <DownloadCloud size={14} color="#FFF" />
                <Text style={styles.actionBtnText}>Request now</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: 'rgba(124,58,237,0.12)' }]} onPress={() => openScheduleModal('firebase')}>
                <Clock3 size={14} color={Colors.primary} />
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Schedule</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.meta, { color: scheme.textSecondary }]}> 
              Schedule: {firebaseSchedule.enabled ? `${String(firebaseSchedule.hour).padStart(2, '0')}:${String(firebaseSchedule.minute).padStart(2, '0')}` : 'Off'}
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: scheme.surface }]}>
            <View style={styles.cardHead}>
              <History size={17} color={Colors.primary} />
              <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Application Backup History</Text>
            </View>

            {recentBackups.length === 0 ? (
              <Text style={[styles.meta, { color: scheme.textSecondary }]}>No backups found.</Text>
            ) : (
              <View style={styles.listWrap}>
                {recentBackups.map((backup) => (
                  <View key={backup.id} style={styles.listItem}>
                    <Text style={[styles.itemTitle, { color: scheme.textPrimary }]} numberOfLines={1}>{backup.id}</Text>
                    <Text style={[styles.meta, { color: scheme.textSecondary }]}>
                      {backup.source.toUpperCase()} · {backup.itemCount} items · {formatSize(backup.totalBytes)}
                    </Text>
                    <Text style={[styles.meta, { color: scheme.textSecondary }]}>Target: {backup.targetMachine} · Status: {backup.status.toUpperCase()}</Text>
                    <Text style={[styles.meta, { color: scheme.textSecondary }]}>
                      {new Date(backup.backupAt).toLocaleString('en-IN')}
                    </Text>
                    {backup.outputPath ? (
                      <Text style={[styles.meta, { color: scheme.textSecondary }]}>Output: {backup.outputPath}</Text>
                    ) : null}
                    {backup.errorMessage ? (
                      <Text style={[styles.meta, { color: Colors.error }]}>Error: {backup.errorMessage}</Text>
                    ) : null}
                    <TouchableOpacity style={[styles.actionBtn, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(16,185,129,0.14)' }]} onPress={() => handleRestore(backup)}>
                      <RotateCcw size={14} color="#059669" />
                      <Text style={[styles.actionBtnText, { color: '#059669' }]}>Restore</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: scheme.surface }]}>
            <View style={styles.cardHead}>
              <History size={17} color={Colors.primary} />
              <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Firebase Full Backup History</Text>
            </View>

            {recentFirebaseBackups.length === 0 ? (
              <Text style={[styles.meta, { color: scheme.textSecondary }]}>No full-backup requests found.</Text>
            ) : (
              <View style={styles.listWrap}>
                {recentFirebaseBackups.map((backup) => (
                  <View key={backup.id} style={styles.listItem}>
                    <Text style={[styles.itemTitle, { color: scheme.textPrimary }]} numberOfLines={1}>{backup.id}</Text>
                    <Text style={[styles.meta, { color: scheme.textSecondary }]}>
                      {backup.source.toUpperCase()} · Status: {backup.status.toUpperCase()}
                    </Text>
                    <Text style={[styles.meta, { color: scheme.textSecondary }]}>Target: {backup.targetMachine}</Text>
                    <Text style={[styles.meta, { color: scheme.textSecondary }]}>
                      {new Date(backup.requestedAt).toLocaleString('en-IN')}
                    </Text>
                    {backup.outputPath ? (
                      <Text style={[styles.meta, { color: scheme.textSecondary }]}>Output: {backup.outputPath}</Text>
                    ) : null}
                    {backup.errorMessage ? (
                      <Text style={[styles.meta, { color: Colors.error }]}>Error: {backup.errorMessage}</Text>
                    ) : null}
                    {(backup.status === 'requested' || backup.status === 'running') ? (
                      <TouchableOpacity
                        style={[styles.actionBtn, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(239,68,68,0.12)' }]}
                        onPress={() => handleCancelFirebaseRequest(backup)}
                        disabled={busy}
                      >
                        <RotateCcw size={14} color={Colors.error} />
                        <Text style={[styles.actionBtnText, { color: Colors.error }]}>Cancel Request</Text>
                      </TouchableOpacity>
                    ) : null}

                    <TouchableOpacity
                      style={[styles.actionBtn, { alignSelf: 'flex-start', marginTop: 8, backgroundColor: 'rgba(239,68,68,0.12)' }]}
                      onPress={() => handleDeleteFirebaseRequest(backup)}
                      disabled={busy}
                    >
                      <RotateCcw size={14} color={Colors.error} />
                      <Text style={[styles.actionBtnText, { color: Colors.error }]}>Delete Request</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={showScheduleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: scheme.surface }]}>
            <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>Schedule {scheduleTarget === 'app' ? 'Application Data' : 'Firebase Full'} Backup</Text>

            <View style={styles.toggleRow}>
              <Text style={[styles.meta, { color: scheme.textPrimary }]}>Enable schedule</Text>
              <Switch value={scheduleEnabled} onValueChange={setScheduleEnabled} />
            </View>

            <View style={styles.timeRow}>
              <TextInput
                style={[styles.input, styles.timeInput, { borderColor: scheme.border, color: scheme.textPrimary, backgroundColor: scheme.background }]}
                value={scheduleHour}
                onChangeText={setScheduleHour}
                placeholder="HH"
                placeholderTextColor={scheme.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={[styles.modalTitle, { color: scheme.textPrimary, fontSize: 20, marginBottom: 0 }]}>:</Text>
              <TextInput
                style={[styles.input, styles.timeInput, { borderColor: scheme.border, color: scheme.textPrimary, backgroundColor: scheme.background }]}
                value={scheduleMinute}
                onChangeText={setScheduleMinute}
                placeholder="MM"
                placeholderTextColor={scheme.textSecondary}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>

            <Text style={[styles.meta, { color: scheme.textSecondary }]}>
              {scheduleTarget === 'app'
                ? 'Scheduled backups overwrite the same application backup document for the current day.'
                : 'Scheduled full backups overwrite the same full-backup request document for the current day.'}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: scheme.background }]} onPress={() => setShowScheduleModal(false)}>
                <Text style={{ color: scheme.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={saveScheduleConfig}>
                <Text style={{ color: '#FFF', fontWeight: '700' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.md,
  },
  card: {
    borderRadius: 18,
    padding: 14,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    fontSize: 12,
    lineHeight: 18,
  },
  listWrap: {
    gap: 10,
    marginTop: 8,
  },
  listItem: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: 'rgba(124,58,237,0.08)',
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    padding: 22,
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 10,
    justifyContent: 'center',
  },
  timeInput: {
    width: 70,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
});
