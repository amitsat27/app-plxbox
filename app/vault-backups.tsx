import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import { useRouter, useFocusEffect } from "expo-router";
import { ArrowLeft, Clock3, CloudUpload, Shield, SlidersHorizontal } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Spacing, Typography } from "@/constants/designTokens";
import { useAuth } from "@/src/context/AuthContext";
import { canSendBackupNotification } from "@/src/services/BackupNotificationSettings";
import { vaultService } from "@/src/services/passwords";
import type { CloudBackupRecord } from "@/src/services/passwords/PasswordBackupService";
import type { VaultMeta } from "@/src/types/passwords";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";

type VaultSchedule = {
  vaultId: string;
  enabled: boolean;
  hour: number;
  minute: number;
  lastRunDate: string | null;
};

const STORAGE_KEY = "vault_backup_schedules_v1";

function schedulePasswordKey(vaultId: string) {
  return `vault_backup_schedule_pwd_${vaultId}`;
}

export default function VaultBackupsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [vaults, setVaults] = useState<VaultMeta[]>([]);
  const [cloudBackups, setCloudBackups] = useState<CloudBackupRecord[]>([]);
  const [schedules, setSchedules] = useState<Record<string, VaultSchedule>>({});

  const [showBackupNowModal, setShowBackupNowModal] = useState(false);
  const [selectedVault, setSelectedVault] = useState<VaultMeta | null>(null);
  const [backupPassword, setBackupPassword] = useState("");

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleVault, setScheduleVault] = useState<VaultMeta | null>(null);
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleHour, setScheduleHour] = useState("23");
  const [scheduleMinute, setScheduleMinute] = useState("00");
  const [schedulePassword, setSchedulePassword] = useState("");

  const backupLast7Days = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return cloudBackups.filter((backup) => (backup.lastSyncedAt || 0) >= cutoff);
  }, [cloudBackups]);

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      vaultService.setUser(user.uid);
      const secureVaults = (await vaultService.getAllVaults()).filter((vault) => vault.type === "secure");
      const backups = await vaultService.listCloudBackups();
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      const parsed = saved ? (JSON.parse(saved) as Record<string, VaultSchedule>) : {};

      setVaults(secureVaults);
      setCloudBackups(backups.filter((backup) => backup.vaultType === "secure"));
      setSchedules(parsed || {});
    } catch (error) {
      console.error("Failed to load vault backup data:", error);
      Alert.alert("Error", "Unable to load vault backup data.");
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const saveSchedules = async (next: Record<string, VaultSchedule>) => {
    setSchedules(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const runScheduledTick = useCallback(async () => {
    if (!user?.uid) return;
    const now = new Date();
    const currentDate = now.toISOString().slice(0, 10);
    const due = Object.values(schedules).filter((item) =>
      item.enabled &&
      item.hour === now.getHours() &&
      item.minute === now.getMinutes() &&
      item.lastRunDate !== currentDate
    );

    if (due.length === 0) return;

    const nextSchedules = { ...schedules };
    for (const item of due) {
      const vault = vaults.find((v) => v.id === item.vaultId);
      if (!vault) continue;

      try {
        const pwd = await SecureStore.getItemAsync(schedulePasswordKey(item.vaultId));
        if (!pwd) throw new Error("Missing saved password for scheduled backup.");

        const unlocked = await vaultService.unlockVault(item.vaultId, pwd);
        if (!unlocked) throw new Error("Saved schedule password is invalid.");

        await vaultService.backupNow(item.vaultId);
        nextSchedules[item.vaultId] = { ...item, lastRunDate: currentDate };

        if (await canSendBackupNotification('vault')) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Vault backup completed",
              body: `${vault.name} was backed up to Firebase.`,
            },
            trigger: null,
          });
        }
      } catch (error: any) {
        if (await canSendBackupNotification('vault')) {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: "Vault backup failed",
              body: `${vault.name}: ${error?.message || "Unable to run scheduled backup."}`,
            },
            trigger: null,
          });
        }
      } finally {
        vaultService.lockVault();
      }
    }

    await saveSchedules(nextSchedules);
    await loadData();
  }, [loadData, schedules, user?.uid, vaults]);

  useEffect(() => {
    if (!user?.uid) return;
    const interval = setInterval(() => {
      runScheduledTick().catch(() => {});
    }, 60 * 1000);

    return () => clearInterval(interval);
  }, [runScheduledTick, user?.uid]);

  const startBackupNow = (vault: VaultMeta) => {
    setSelectedVault(vault);
    setBackupPassword("");
    setShowBackupNowModal(true);
  };

  const handleBackupNow = async () => {
    if (!selectedVault) return;
    if (!backupPassword.trim()) {
      Alert.alert("Error", "Enter vault password");
      return;
    }

    setBusy(true);
    try {
      const unlocked = await vaultService.unlockVault(selectedVault.id, backupPassword.trim());
      if (!unlocked) {
        Alert.alert("Error", "Incorrect vault password");
        return;
      }

      await vaultService.backupNow(selectedVault.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setShowBackupNowModal(false);
      setBackupPassword("");
      await loadData();
      Alert.alert("Success", `${selectedVault.name} backup completed.`);
    } catch (error: any) {
      Alert.alert("Backup failed", error?.message || "Unable to back up vault.");
    } finally {
      vaultService.lockVault();
      setBusy(false);
    }
  };

  const openScheduleModal = async (vault: VaultMeta) => {
    const existing = schedules[vault.id];
    setScheduleVault(vault);
    setScheduleEnabled(existing?.enabled ?? false);
    setScheduleHour(String(existing?.hour ?? 23));
    setScheduleMinute(String(existing?.minute ?? 0).padStart(2, "0"));
    setSchedulePassword((await SecureStore.getItemAsync(schedulePasswordKey(vault.id))) || "");
    setShowScheduleModal(true);
  };

  const saveScheduleForVault = async () => {
    if (!scheduleVault) return;

    const hour = Number(scheduleHour);
    const minute = Number(scheduleMinute);

    if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
      Alert.alert("Invalid time", "Hour must be between 0 and 23.");
      return;
    }
    if (!Number.isInteger(minute) || minute < 0 || minute > 59) {
      Alert.alert("Invalid time", "Minute must be between 0 and 59.");
      return;
    }

    if (scheduleEnabled && !schedulePassword.trim()) {
      Alert.alert("Missing password", "Enter vault password for scheduled backups.");
      return;
    }

    if (scheduleEnabled) {
      const unlocked = await vaultService.unlockVault(scheduleVault.id, schedulePassword.trim());
      vaultService.lockVault();
      if (!unlocked) {
        Alert.alert("Invalid password", "Vault password is incorrect.");
        return;
      }
    }

    const next = {
      ...schedules,
      [scheduleVault.id]: {
        vaultId: scheduleVault.id,
        enabled: scheduleEnabled,
        hour,
        minute,
        lastRunDate: schedules[scheduleVault.id]?.lastRunDate || null,
      },
    };

    if (scheduleEnabled) {
      await SecureStore.setItemAsync(schedulePasswordKey(scheduleVault.id), schedulePassword.trim());
    } else {
      await SecureStore.deleteItemAsync(schedulePasswordKey(scheduleVault.id));
    }

    await saveSchedules(next);
    setShowScheduleModal(false);
    Alert.alert("Saved", `${scheduleVault.name} schedule updated.`);
  };

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadData();
    } finally {
      setRefreshing(false);
    }
  }, [loadData]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: scheme.background }]}> 
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <ArrowLeft size={20} color={scheme.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: scheme.textPrimary }]}>Vault Backups</Text>
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
              <Shield size={17} color={Colors.primary} />
              <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Backups from last 7 days</Text>
            </View>

            {backupLast7Days.length === 0 ? (
              <Text style={[styles.meta, { color: scheme.textSecondary }]}>No backups found in the last 7 days.</Text>
            ) : (
              <View style={styles.listWrap}>
                {backupLast7Days.map((backup) => (
                  <View key={`bkp-${backup.vaultId}`} style={styles.listItem}>
                    <Text style={[styles.itemTitle, { color: scheme.textPrimary }]} numberOfLines={1}>{backup.vaultName}</Text>
                    <Text style={[styles.meta, { color: scheme.textSecondary }]}>
                      {backup.entryCount} entries, {backup.groupCount} groups
                    </Text>
                    <Text style={[styles.meta, { color: scheme.textSecondary }]}>
                      {backup.lastSyncedAt ? new Date(backup.lastSyncedAt).toLocaleString("en-IN") : "No time"}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: scheme.surface }]}> 
            <View style={styles.cardHead}>
              <SlidersHorizontal size={17} color={Colors.primary} />
              <Text style={[styles.cardTitle, { color: scheme.textPrimary }]}>Per-vault controls</Text>
            </View>

            {vaults.length === 0 ? (
              <Text style={[styles.meta, { color: scheme.textSecondary }]}>No secure vaults available.</Text>
            ) : (
              <View style={styles.listWrap}>
                {vaults.map((vault) => {
                  const schedule = schedules[vault.id];
                  return (
                    <View key={`v-${vault.id}`} style={styles.listItem}>
                      <Text style={[styles.itemTitle, { color: scheme.textPrimary }]} numberOfLines={1}>{vault.name}</Text>
                      <Text style={[styles.meta, { color: scheme.textSecondary }]}>
                        {schedule?.enabled
                          ? `Scheduled: ${String(schedule.hour).padStart(2, "0")}:${String(schedule.minute).padStart(2, "0")}`
                          : "Schedule: Off"}
                      </Text>
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: Colors.primary }]} onPress={() => startBackupNow(vault)}>
                          <CloudUpload size={14} color="#FFF" />
                          <Text style={styles.actionBtnText}>Backup now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: "rgba(124,58,237,0.12)" }]} onPress={() => openScheduleModal(vault)}>
                          <Clock3 size={14} color={Colors.primary} />
                          <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Schedule</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <Modal visible={showBackupNowModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: scheme.surface }]}> 
            <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>Backup Now</Text>
            <Text style={[styles.meta, { color: scheme.textSecondary }]}>{selectedVault?.name}</Text>
            <TextInput
              style={[styles.input, { borderColor: scheme.border, color: scheme.textPrimary, backgroundColor: scheme.background }]}
              value={backupPassword}
              onChangeText={setBackupPassword}
              placeholder="Vault password"
              placeholderTextColor={scheme.textSecondary}
              secureTextEntry
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: scheme.background }]} onPress={() => setShowBackupNowModal(false)}>
                <Text style={{ color: scheme.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={handleBackupNow} disabled={busy}>
                {busy ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ color: "#FFF", fontWeight: "700" }}>Backup</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showScheduleModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: scheme.surface }]}> 
            <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>Schedule Vault Backup</Text>
            <Text style={[styles.meta, { color: scheme.textSecondary }]}>{scheduleVault?.name}</Text>

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

            <TextInput
              style={[styles.input, { borderColor: scheme.border, color: scheme.textPrimary, backgroundColor: scheme.background }]}
              value={schedulePassword}
              onChangeText={setSchedulePassword}
              placeholder="Vault password for scheduled backup"
              placeholderTextColor={scheme.textSecondary}
              secureTextEntry
            />

            <Text style={[styles.meta, { color: scheme.textSecondary }]}>Scheduled backup attempts run while app is active and sync to Firebase.</Text>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: scheme.background }]} onPress={() => setShowScheduleModal(false)}>
                <Text style={{ color: scheme.textPrimary }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={saveScheduleForVault}>
                <Text style={{ color: "#FFF", fontWeight: "700" }}>Save</Text>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.12)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  card: {
    borderRadius: 18,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.12)",
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  listWrap: {
    gap: 8,
  },
  listItem: {
    borderRadius: 12,
    padding: 10,
    backgroundColor: "rgba(124,58,237,0.08)",
    gap: 3,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: "700",
  },
  meta: {
    fontSize: 12,
    lineHeight: 17,
  },
  rowActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  actionBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  modalTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: "700",
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontWeight: "600",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  modalBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  timeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  timeInput: {
    width: 70,
    textAlign: "center",
  },
});
