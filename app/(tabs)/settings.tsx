import AsyncStorage from "@react-native-async-storage/async-storage";
import { Spacing, Typography } from "@/constants/designTokens";
import { Colors, getColorScheme } from "@/theme/color";
import { ThemeMode, useTheme } from "@/theme/themeProvider";
import { BlurView } from "expo-blur";
import * as DocumentPicker from "expo-document-picker";
import { cacheDirectory, EncodingType, readAsStringAsync, writeAsStringAsync } from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as LocalAuthentication from "expo-local-authentication";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import * as Sharing from "expo-sharing";
import { useRouter } from "expo-router";
import {
  Bell,
  BellOff,
  BellRing,
  ChevronRight,
  Fingerprint,
  Info,
  Lock,
  Moon,
  Palette,
  RotateCcw,
  Shield,
  Smartphone,
  Sun,
  Upload,
} from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/src/context/AuthContext";
import { canSendBackupNotification } from "@/src/services/BackupNotificationSettings";
import { vaultService } from "@/src/services/passwords";
import { LinearGradient } from "expo-linear-gradient";

type AutoLockMinutes = 0 | 1 | 5 | 15 | 30;
type DefaultTab = "home" | "explore" | "settings";

type SecurityState = {
  appLockEnabled: boolean;
  biometricEnabled: boolean;
  pinEnabled: boolean;
  autoLockMinutes: AutoLockMinutes;
};

type DefaultPreferenceState = {
  defaultTab: DefaultTab;
};

type NightlyVaultBackupState = {
  enabled: boolean;
  hour: number;
  minute: number;
};

type BackupScheduleMode = "ondemand" | "scheduled";

type VaultBackupHistoryItem = {
  id: string;
  vaultId: string;
  vaultName: string;
  timestamp: number;
  source: "manual" | "scheduled";
};

type AppDataBackupPayload = {
  version: 2;
  exportedAt: string;
  userId: string | null;
  userEmail: string | null;
  asyncStorage: Record<string, string>;
  settingsFallback: {
    themeMode: ThemeMode;
    notifications: {
      notifyBills: boolean;
      notifyDue: boolean;
      notifyReminders: boolean;
      notifySound: boolean;
    };
    security: SecurityState;
    defaults: DefaultPreferenceState;
  };
};

const STORAGE_KEYS = {
  notifications: "notification_settings",
  security: "app_security_settings",
  defaults: "app_default_preferences",
  nightlyVaultBackup: "nightly_vault_backup_settings",
  nightlyVaultBackupNotificationId: "nightly_vault_backup_notification_id",
  nightlyVaultBackupLastRunAt: "nightly_vault_backup_last_run_at",
  backupScheduleMode: "vault_backup_schedule_mode",
  vaultBackupHistory: "vault_backup_history",
};

const DEFAULT_SECURITY: SecurityState = {
  appLockEnabled: false,
  biometricEnabled: false,
  pinEnabled: false,
  autoLockMinutes: 5,
};

const DEFAULT_PREFERENCES: DefaultPreferenceState = {
  defaultTab: "home",
};

const DEFAULT_NIGHTLY_VAULT_BACKUP: NightlyVaultBackupState = {
  enabled: false,
  hour: 23,
  minute: 0,
};

const AUTO_LOCK_OPTIONS: { value: AutoLockMinutes; label: string }[] = [
  { value: 0, label: "Never" },
  { value: 1, label: "1m" },
  { value: 5, label: "5m" },
  { value: 15, label: "15m" },
  { value: 30, label: "30m" },
];

const DEFAULT_TAB_OPTIONS: { value: DefaultTab; label: string }[] = [
  { value: "home", label: "Home" },
  { value: "explore", label: "Explore" },
  { value: "settings", label: "Settings" },
];

function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.sectionBlock}>
      <Text style={[styles.sectionTitle, { color: scheme.textTertiary }]}>{title}</Text>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: isDark ? "#15151A" : "#FFFFFF",
            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.08)",
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function RowDivider() {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.rowDivider,
        { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)" },
      ]}
    />
  );
}

function SettingRow({
  icon,
  label,
  sublabel,
  value,
  onPress,
  destructive,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && !disabled ? styles.pressedRow : null,
        disabled ? styles.disabledRow : null,
      ]}
      onPress={onPress}
      disabled={!onPress || disabled}
    >
      <View
        style={[
          styles.rowIconWrap,
          {
            backgroundColor: disabled
              ? isDark
                ? "rgba(148,163,184,0.14)"
                : "rgba(148,163,184,0.18)"
              : isDark
                ? "rgba(124,58,237,0.2)"
                : "rgba(124,58,237,0.12)",
          },
        ]}
      >
        {icon}
      </View>
      <View style={styles.rowContent}>
        <Text
          style={[
            styles.rowLabel,
            {
              color: disabled
                ? scheme.textTertiary
                : destructive
                  ? Colors.error
                  : scheme.textPrimary,
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={[styles.rowSublabel, { color: disabled ? scheme.textTertiary : scheme.textTertiary }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {value ? <Text style={[styles.rowValue, { color: disabled ? scheme.textTertiary : scheme.textSecondary }]}>{value}</Text> : null}
      {disabled ? null : <ChevronRight size={18} color={isDark ? "rgba(255,255,255,0.3)" : "rgba(15,23,42,0.35)"} />}
    </Pressable>
  );
}

function ToggleRow({
  icon,
  label,
  sublabel,
  value,
  onValueChange,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.row}>
      <View style={[styles.rowIconWrap, { backgroundColor: isDark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.12)" }]}>{icon}</View>
      <View style={styles.rowContent}>
        <Text style={[styles.rowLabel, { color: scheme.textPrimary }]} numberOfLines={1}>
          {label}
        </Text>
        {sublabel ? <Text style={[styles.rowSublabel, { color: scheme.textTertiary }]}>{sublabel}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: isDark ? "#3A3A42" : "#E5E7EB", true: "#34C759" }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout, user } = useAuth();
  const { isDark, mode, setMode } = useTheme();
  const scheme = getColorScheme(isDark);

  const [loggingOut, setLoggingOut] = useState(false);

  const [notifyBills, setNotifyBills] = useState(true);
  const [notifyDue, setNotifyDue] = useState(true);
  const [notifyReminders, setNotifyReminders] = useState(true);
  const [notifySound, setNotifySound] = useState(true);
  const [notificationPermissionGranted, setNotificationPermissionGranted] = useState<boolean | null>(null);

  const [security, setSecurity] = useState<SecurityState>(DEFAULT_SECURITY);
  const [defaults, setDefaults] = useState<DefaultPreferenceState>(DEFAULT_PREFERENCES);
  const [nightlyVaultBackup, setNightlyVaultBackup] = useState<NightlyVaultBackupState>(DEFAULT_NIGHTLY_VAULT_BACKUP);
  const [backupScheduleMode, setBackupScheduleMode] = useState<BackupScheduleMode>("ondemand");
  const [vaultBackupHistory, setVaultBackupHistory] = useState<VaultBackupHistoryItem[]>([]);
  const [loadingVaultBackupStatus, setLoadingVaultBackupStatus] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [showSetPinModal, setShowSetPinModal] = useState(false);
  const [showVerifyPinModal, setShowVerifyPinModal] = useState(false);
  const [pinDraft, setPinDraft] = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinVerify, setPinVerify] = useState("");

  useEffect(() => {
    loadNotificationSettings();
    loadNotificationPermissionStatus();
    loadSecuritySettings();
    loadDefaultPreferences();
    loadNightlyVaultBackupSettings();
    loadBackupScheduleMode();
    loadVaultBackupHistory();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    vaultService.setUser(user.uid);
    loadVaultBackupStatus();
  }, [user?.uid]);

  useEffect(() => {
    if (!nightlyVaultBackup.enabled || !user?.uid) return;

    const runAtNight = () => {
      runNightlyVaultBackupSweep().catch(() => {});
    };

    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(nightlyVaultBackup.hour, nightlyVaultBackup.minute, 0, 0);
    if (now.getTime() >= nextRun.getTime()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delay = Math.max(1000, nextRun.getTime() - now.getTime());
    const timeoutId = setTimeout(() => {
      runAtNight();
      const intervalId = setInterval(runAtNight, 24 * 60 * 60 * 1000);
      (globalThis as any).__nightlyVaultBackupInterval = intervalId;
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      const activeInterval = (globalThis as any).__nightlyVaultBackupInterval as ReturnType<typeof setInterval> | undefined;
      if (activeInterval) {
        clearInterval(activeInterval);
        (globalThis as any).__nightlyVaultBackupInterval = undefined;
      }
    };
  }, [nightlyVaultBackup.enabled, nightlyVaultBackup.hour, nightlyVaultBackup.minute, user?.uid]);

  const profileInitial = useMemo(() => {
    if (user?.displayName?.trim()) return user.displayName.charAt(0).toUpperCase();
    if (user?.email?.trim()) return user.email.charAt(0).toUpperCase();
    return "U";
  }, [user?.displayName, user?.email]);

  const enabledNotificationCount = useMemo(
    () => [notifyBills, notifyDue, notifyReminders, notifySound].filter(Boolean).length,
    [notifyBills, notifyDue, notifyReminders, notifySound],
  );

  const notificationPreset = useMemo<"all" | "essential" | "quiet" | "custom">(() => {
    if (notifyBills && notifyDue && notifyReminders && notifySound) return "all";
    if (notifyBills && notifyDue && !notifyReminders && !notifySound) return "essential";
    if (!notifyBills && !notifyDue && !notifyReminders && !notifySound) return "quiet";
    return "custom";
  }, [notifyBills, notifyDue, notifyReminders, notifySound]);

  const notificationStatusLabel =
    notificationPermissionGranted === true
      ? "Permission on"
      : notificationPermissionGranted === false
        ? "Permission off"
        : "Permission unknown";

  const loadNotificationSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.notifications);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setNotifyBills(parsed.notifyBills ?? true);
      setNotifyDue(parsed.notifyDue ?? true);
      setNotifyReminders(parsed.notifyReminders ?? true);
      setNotifySound(parsed.notifySound ?? true);
    } catch (error) {
      console.error("Failed to load notification settings:", error);
    }
  };

  const loadNotificationPermissionStatus = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status === "granted") {
        setNotificationPermissionGranted(true);
        return;
      }
      if (status === "denied") {
        setNotificationPermissionGranted(false);
        return;
      }
      setNotificationPermissionGranted(null);
    } catch (error) {
      console.error("Failed to load notification permission status:", error);
      setNotificationPermissionGranted(null);
    }
  };

  const persistNotificationSettings = async (next: {
    notifyBills: boolean;
    notifyDue: boolean;
    notifyReminders: boolean;
    notifySound: boolean;
  }) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.notifications, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    }
  };

  const updateNotificationSetting = async (
    key: "notifyBills" | "notifyDue" | "notifyReminders" | "notifySound",
    value: boolean,
  ) => {
    const next = {
      notifyBills,
      notifyDue,
      notifyReminders,
      notifySound,
      [key]: value,
    };
    setNotifyBills(next.notifyBills);
    setNotifyDue(next.notifyDue);
    setNotifyReminders(next.notifyReminders);
    setNotifySound(next.notifySound);
    await persistNotificationSettings(next);
  };

  const loadSecuritySettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.security);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setSecurity({
        appLockEnabled: parsed.appLockEnabled ?? false,
        biometricEnabled: parsed.biometricEnabled ?? false,
        pinEnabled: parsed.pinEnabled ?? false,
        autoLockMinutes: parsed.autoLockMinutes ?? 5,
      });
    } catch (error) {
      console.error("Failed to load security settings:", error);
    }
  };

  const saveSecuritySettings = async (next: SecurityState) => {
    setSecurity(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.security, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save security settings:", error);
    }
  };

  const loadDefaultPreferences = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.defaults);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setDefaults({ defaultTab: parsed.defaultTab ?? "home" });
    } catch (error) {
      console.error("Failed to load default preferences:", error);
    }
  };

  const saveDefaultPreferences = async (next: DefaultPreferenceState) => {
    setDefaults(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.defaults, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save default preferences:", error);
    }
  };

  const loadNightlyVaultBackupSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.nightlyVaultBackup);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      setNightlyVaultBackup({
        enabled: parsed.enabled ?? false,
        hour: parsed.hour ?? 23,
        minute: parsed.minute ?? 0,
      });
    } catch (error) {
      console.error("Failed to load nightly vault backup settings:", error);
    }
  };

  const saveNightlyVaultBackupSettings = async (next: NightlyVaultBackupState) => {
    setNightlyVaultBackup(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.nightlyVaultBackup, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save nightly vault backup settings:", error);
    }
  };

  const loadBackupScheduleMode = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.backupScheduleMode);
      if (saved === "ondemand" || saved === "scheduled") {
        setBackupScheduleMode(saved);
      }
    } catch (error) {
      console.error("Failed to load backup schedule mode:", error);
    }
  };

  const saveBackupScheduleMode = async (next: BackupScheduleMode) => {
    setBackupScheduleMode(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.backupScheduleMode, next);
    } catch (error) {
      console.error("Failed to save backup schedule mode:", error);
    }
  };

  const pruneBackupHistory = (items: VaultBackupHistoryItem[]) => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return items
      .filter((item) => item.timestamp >= cutoff)
      .sort((left, right) => right.timestamp - left.timestamp);
  };

  const loadVaultBackupHistory = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.vaultBackupHistory);
      const parsed = saved ? (JSON.parse(saved) as VaultBackupHistoryItem[]) : [];
      const next = pruneBackupHistory(parsed || []);
      setVaultBackupHistory(next);
      await AsyncStorage.setItem(STORAGE_KEYS.vaultBackupHistory, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to load vault backup history:", error);
      setVaultBackupHistory([]);
    }
  };

  const appendVaultBackupHistory = async (items: VaultBackupHistoryItem[]) => {
    const next = pruneBackupHistory([...vaultBackupHistory, ...items]);
    setVaultBackupHistory(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.vaultBackupHistory, JSON.stringify(next));
    } catch (error) {
      console.error("Failed to save vault backup history:", error);
    }
  };

  const loadVaultBackupStatus = async () => {
    if (!user?.uid) return;
    setLoadingVaultBackupStatus(true);
    try {
      const cloud = await vaultService.listCloudBackups();
      const cloudHistory: VaultBackupHistoryItem[] = cloud
        .filter((backup) => Boolean(backup.lastSyncedAt))
        .map((backup) => ({
          id: `${backup.vaultId}-${backup.lastSyncedAt}`,
          vaultId: backup.vaultId,
          vaultName: backup.vaultName || "Vault backup",
          timestamp: backup.lastSyncedAt as number,
          source: "scheduled" as const,
        }));

      const merged = pruneBackupHistory([...vaultBackupHistory, ...cloudHistory]);
      setVaultBackupHistory(merged);
      await AsyncStorage.setItem(STORAGE_KEYS.vaultBackupHistory, JSON.stringify(merged));
    } catch (error) {
      console.error("Failed to load vault backup status:", error);
    } finally {
      setLoadingVaultBackupStatus(false);
    }
  };

  const runNightlyVaultBackupSweep = async () => {
    if (!user?.uid || !nightlyVaultBackup.enabled) return;

    const todayKey = new Date().toISOString().slice(0, 10);
    const alreadyRanAt = await AsyncStorage.getItem(STORAGE_KEYS.nightlyVaultBackupLastRunAt);
    if (alreadyRanAt === todayKey) return;

    const permission = await Notifications.getPermissionsAsync();
    if (permission.status !== "granted") {
      await AsyncStorage.setItem(STORAGE_KEYS.nightlyVaultBackupLastRunAt, todayKey);
      return;
    }

    const vaults = (await vaultService.getAllVaults()).filter((vault) => vault.type === "secure");
    let successCount = 0;
    const succeeded: VaultBackupHistoryItem[] = [];
    for (const vault of vaults) {
      try {
        await vaultService.backupNow(vault.id);
        successCount += 1;
        succeeded.push({
          id: `${vault.id}-${Date.now()}-${Math.random()}`,
          vaultId: vault.id,
          vaultName: vault.name,
          timestamp: Date.now(),
          source: "scheduled",
        });
      } catch {
        // Nightly backup can only run for vaults that are currently unlocked in this app session.
      }
    }

    await AsyncStorage.setItem(STORAGE_KEYS.nightlyVaultBackupLastRunAt, todayKey);
    if (succeeded.length > 0) {
      await appendVaultBackupHistory(succeeded);
    }
    await loadVaultBackupStatus();
    if (await canSendBackupNotification('vault')) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Nightly vault backup",
          body:
            successCount > 0
              ? `${successCount} vault backup(s) synced at 11:00 PM window.`
              : "No vault was unlocked at backup time. Open a vault to allow nightly sync.",
        },
        trigger: null,
      });
    }
  };

  const toggleNightlyVaultBackup = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;

      const previousId = await AsyncStorage.getItem(STORAGE_KEYS.nightlyVaultBackupNotificationId);
      if (previousId) {
        await Notifications.cancelScheduledNotificationAsync(previousId).catch(() => {});
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Nightly vault backup",
          body: "PulseBox is checking for vault backups now.",
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 23,
          minute: 0,
        },
      });
      await AsyncStorage.setItem(STORAGE_KEYS.nightlyVaultBackupNotificationId, notificationId);
      await saveNightlyVaultBackupSettings({ ...nightlyVaultBackup, enabled: true });
      await runNightlyVaultBackupSweep();
      return;
    }

    const previousId = await AsyncStorage.getItem(STORAGE_KEYS.nightlyVaultBackupNotificationId);
    if (previousId) {
      await Notifications.cancelScheduledNotificationAsync(previousId).catch(() => {});
      await AsyncStorage.removeItem(STORAGE_KEYS.nightlyVaultBackupNotificationId);
    }
    await saveNightlyVaultBackupSettings({ ...nightlyVaultBackup, enabled: false });
  };

  const runVaultBackupOnDemand = async () => {
    if (!user?.uid) return;
    const vaults = (await vaultService.getAllVaults()).filter((vault) => vault.type === "secure");
    let successCount = 0;
    const succeeded: VaultBackupHistoryItem[] = [];

    for (const vault of vaults) {
      try {
        await vaultService.backupNow(vault.id);
        successCount += 1;
        succeeded.push({
          id: `${vault.id}-${Date.now()}-${Math.random()}`,
          vaultId: vault.id,
          vaultName: vault.name,
          timestamp: Date.now(),
          source: "manual",
        });
      } catch {
        // On-demand backup only succeeds for currently unlocked vaults.
      }
    }

    if (succeeded.length > 0) {
      await appendVaultBackupHistory(succeeded);
    }

    await loadVaultBackupStatus();
    Alert.alert(
      "Vault backup",
      successCount > 0
        ? `${successCount} vault backup(s) completed.`
        : "No unlocked vault found. Unlock a vault and try again.",
    );
  };

  const handleBackupScheduleModeChange = async (next: BackupScheduleMode) => {
    await saveBackupScheduleMode(next);
    if (next === "scheduled") {
      await toggleNightlyVaultBackup(true);
      return;
    }
    await toggleNightlyVaultBackup(false);
  };

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        setNotificationPermissionGranted(false);
        Alert.alert("Permissions Required", "Please enable notifications in device settings to receive alerts.");
        return false;
      }
      setNotificationPermissionGranted(true);
      return true;
    } catch (error) {
      console.error("Failed to request notification permissions:", error);
      setNotificationPermissionGranted(null);
      return false;
    }
  };

  const applyNotificationPreset = async (preset: "all" | "essential" | "quiet") => {
    const next =
      preset === "all"
        ? {
            notifyBills: true,
            notifyDue: true,
            notifyReminders: true,
            notifySound: true,
          }
        : preset === "essential"
          ? {
              notifyBills: true,
              notifyDue: true,
              notifyReminders: false,
              notifySound: false,
            }
          : {
              notifyBills: false,
              notifyDue: false,
              notifyReminders: false,
              notifySound: false,
            };

    if (next.notifyBills || next.notifyDue || next.notifyReminders || next.notifySound) {
      const granted = await requestNotificationPermissions();
      if (!granted) return;
    }

    setNotifyBills(next.notifyBills);
    setNotifyDue(next.notifyDue);
    setNotifyReminders(next.notifyReminders);
    setNotifySound(next.notifySound);
    await persistNotificationSettings(next);
  };

  const handleBiometricToggle = async (next: boolean) => {
    if (!next) {
      await saveSecuritySettings({ ...security, biometricEnabled: false });
      return;
    }

    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      Alert.alert("Biometric unavailable", "No biometric method is configured on this device.");
      return;
    }

    const authResult = await LocalAuthentication.authenticateAsync({
      promptMessage: "Enable biometric app lock",
      disableDeviceFallback: false,
    });

    if (!authResult.success) return;

    await saveSecuritySettings({
      ...security,
      appLockEnabled: true,
      biometricEnabled: true,
    });
  };

  const handlePinToggle = async (next: boolean) => {
    if (next) {
      setPinDraft("");
      setPinConfirm("");
      setShowSetPinModal(true);
      return;
    }
    await SecureStore.deleteItemAsync("app_lock_pin");
    await saveSecuritySettings({ ...security, pinEnabled: false });
  };

  const savePin = async () => {
    const clean = pinDraft.trim();
    const confirm = pinConfirm.trim();
    if (!/^\d{4,8}$/.test(clean)) {
      Alert.alert("Invalid PIN", "PIN must be 4 to 8 digits.");
      return;
    }
    if (clean !== confirm) {
      Alert.alert("PIN mismatch", "Entered PIN values do not match.");
      return;
    }
    await SecureStore.setItemAsync("app_lock_pin", clean);
    await saveSecuritySettings({
      ...security,
      appLockEnabled: true,
      pinEnabled: true,
    });
    setShowSetPinModal(false);
  };

  const handleLockNow = async () => {
    if (!security.appLockEnabled) {
      Alert.alert("App lock disabled", "Enable app lock first to use this action.");
      return;
    }

    if (security.biometricEnabled) {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Unlock PulseBox",
        disableDeviceFallback: false,
      });
      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Verified", "Biometric verification successful.");
      }
      return;
    }

    if (security.pinEnabled) {
      setPinVerify("");
      setShowVerifyPinModal(true);
      return;
    }

    Alert.alert("No method", "Enable biometric or PIN to use app lock.");
  };

  const verifyPin = async () => {
    const stored = await SecureStore.getItemAsync("app_lock_pin");
    if (!stored) {
      Alert.alert("PIN not set", "Set a PIN first.");
      return;
    }
    if (pinVerify.trim() !== stored) {
      Alert.alert("Incorrect PIN", "Please try again.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setShowVerifyPinModal(false);
    Alert.alert("Verified", "PIN verification successful.");
  };

  const backupSettings = async () => {
    try {
      const storageKeys = await AsyncStorage.getAllKeys();
      const storagePairs = storageKeys.length > 0 ? await AsyncStorage.multiGet(storageKeys) : [];
      const asyncStorage = storagePairs.reduce<Record<string, string>>((acc, [key, value]) => {
        if (typeof value === "string") {
          acc[key] = value;
        }
        return acc;
      }, {});

      const payload: AppDataBackupPayload = {
        version: 2,
        exportedAt: new Date().toISOString(),
        userId: user?.uid ?? null,
        userEmail: user?.email ?? null,
        asyncStorage,
        settingsFallback: {
          themeMode: mode,
          notifications: { notifyBills, notifyDue, notifyReminders, notifySound },
          security,
          defaults,
        },
      };

      const fileUri = `${cacheDirectory}pulsebox-data-backup-${Date.now()}.json`;
      await writeAsStringAsync(fileUri, JSON.stringify(payload, null, 2), {
        encoding: EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        dialogTitle: "Export PulseBox app data backup",
        mimeType: "application/json",
      });
    } catch (error) {
      console.error("Backup failed:", error);
      Alert.alert("Backup failed", "Unable to create backup file.");
    }
  };

  const applyRestoredSettingsFromPayload = async (parsed: any) => {
    const settings = parsed?.settingsFallback ?? parsed;

    const nextNotifications = {
      notifyBills: settings?.notifications?.notifyBills ?? true,
      notifyDue: settings?.notifications?.notifyDue ?? true,
      notifyReminders: settings?.notifications?.notifyReminders ?? true,
      notifySound: settings?.notifications?.notifySound ?? true,
    };
    const nextSecurity: SecurityState = {
      appLockEnabled: settings?.security?.appLockEnabled ?? false,
      biometricEnabled: settings?.security?.biometricEnabled ?? false,
      pinEnabled: settings?.security?.pinEnabled ?? false,
      autoLockMinutes: settings?.security?.autoLockMinutes ?? 5,
    };
    const nextDefaults: DefaultPreferenceState = {
      defaultTab: settings?.defaults?.defaultTab ?? "home",
    };

    setNotifyBills(nextNotifications.notifyBills);
    setNotifyDue(nextNotifications.notifyDue);
    setNotifyReminders(nextNotifications.notifyReminders);
    setNotifySound(nextNotifications.notifySound);
    await persistNotificationSettings(nextNotifications);

    await saveSecuritySettings(nextSecurity);
    await saveDefaultPreferences(nextDefaults);

    if (settings?.themeMode === "light" || settings?.themeMode === "dark" || settings?.themeMode === "auto") {
      await setMode(settings.themeMode);
    }
  };

  const restoreSettings = async () => {
    try {
      const file = await DocumentPicker.getDocumentAsync({ type: "application/json", copyToCacheDirectory: true });
      if (file.canceled || !file.assets?.[0]?.uri) return;

      const dataText = await readAsStringAsync(file.assets[0].uri, {
        encoding: EncodingType.UTF8,
      });
      const parsed = JSON.parse(dataText);

      const serializedStorage = parsed?.asyncStorage;
      if (serializedStorage && typeof serializedStorage === "object") {
        const storageEntries = Object.entries(serializedStorage)
          .filter(([key, value]) => typeof key === "string" && typeof value === "string")
          .map(([key, value]) => [key, value as string] as [string, string]);

        if (storageEntries.length > 0) {
          await AsyncStorage.multiSet(storageEntries);
        }
      }

      await applyRestoredSettingsFromPayload(parsed);

      await Promise.all([
        loadNotificationSettings(),
        loadSecuritySettings(),
        loadDefaultPreferences(),
        loadNightlyVaultBackupSettings(),
        loadBackupScheduleMode(),
        loadVaultBackupHistory(),
      ]);

      Alert.alert("Restore complete", "Application data backup restored successfully.");
    } catch (error) {
      console.error("Restore failed:", error);
      Alert.alert("Restore failed", "Selected file is invalid or unreadable.");
    }
  };

  const openDataBackupOptions = () => {
    Alert.alert("Data Backups", "Choose an action", [
      { text: "Cancel", style: "cancel" },
      { text: "Export Full Backup", onPress: backupSettings },
      { text: "Restore Full Backup", onPress: restoreSettings },
    ]);
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadNotificationSettings(),
        loadNotificationPermissionStatus(),
        loadSecuritySettings(),
        loadDefaultPreferences(),
        loadNightlyVaultBackupSettings(),
        loadBackupScheduleMode(),
        loadVaultBackupHistory(),
        loadVaultBackupStatus(),
      ]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? "#07070A" : "#EEF2F7" }]} edges={["bottom"]}>
      <BlurView
        intensity={isDark ? 35 : 60}
        tint={isDark ? "dark" : "light"}
        style={[styles.headerBlur, { paddingTop: insets.top + 4 }]}
      >
        <Text style={[styles.headerEyebrow, { color: scheme.textTertiary }]}>Preferences and controls</Text>
        <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Settings</Text>
      </BlurView>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 84 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing || loadingVaultBackupStatus} onRefresh={handleRefresh} />}
      >
        <LinearGradient
          colors={isDark ? ["#1B1B2B", "#121226"] : ["#F8FBFF", "#EEF4FF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{profileInitial}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: scheme.textPrimary }]}>{user?.displayName || "PulseBox User"}</Text>
            <Text style={[styles.profileEmail, { color: scheme.textSecondary }]}>{user?.email || "Profile details"}</Text>
          </View>
          <TouchableOpacity style={styles.profileAction} onPress={() => router.push("/profile")}> 
            <ChevronRight size={18} color={scheme.textSecondary} />
          </TouchableOpacity>
        </LinearGradient>

        <SectionBlock title="General">
          <SettingRow
            icon={<BellRing size={18} color={Colors.primary} />}
            label="Manage Notifications"
            sublabel={`${enabledNotificationCount}/4 enabled • ${notificationStatusLabel}`}
            onPress={() => router.push("/manage-notifications")}
          />
          <RowDivider />
          <SettingRow icon={<Shield size={18} color={Colors.primary} />} label="Open Default Tab" value={defaults.defaultTab} onPress={() => router.push(defaults.defaultTab === "home" ? "/(tabs)" : defaults.defaultTab === "explore" ? "/(tabs)/sections" : "/(tabs)/settings")} />
        </SectionBlock>

        <SectionBlock title="Security">
          <ToggleRow
            icon={<Lock size={18} color={Colors.primary} />}
            label="App Lock"
            sublabel="Require verification for sensitive access"
            value={security.appLockEnabled}
            onValueChange={async (value) => {
              await saveSecuritySettings({
                ...security,
                appLockEnabled: value,
                biometricEnabled: value ? security.biometricEnabled : false,
                pinEnabled: value ? security.pinEnabled : false,
              });
            }}
          />
          <RowDivider />
          <ToggleRow
            icon={<Fingerprint size={18} color={Colors.primary} />}
            label="Biometric Unlock"
            sublabel="Use fingerprint or face authentication"
            value={security.biometricEnabled}
            onValueChange={handleBiometricToggle}
          />
          <RowDivider />
          <ToggleRow
            icon={<Smartphone size={18} color={Colors.primary} />}
            label="PIN Unlock"
            sublabel="Use a local device PIN"
            value={security.pinEnabled}
            onValueChange={handlePinToggle}
          />
          <RowDivider />
          <View style={styles.inlineBlock}>
            <Text style={[styles.inlineLabel, { color: scheme.textSecondary }]}>Auto-lock timer</Text>
            <View style={styles.segmentRow}>
              {AUTO_LOCK_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segmentChip,
                    {
                      backgroundColor: security.autoLockMinutes === option.value
                        ? Colors.primary
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(15,23,42,0.06)",
                    },
                  ]}
                  onPress={() => saveSecuritySettings({ ...security, autoLockMinutes: option.value })}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: security.autoLockMinutes === option.value ? "#FFFFFF" : scheme.textSecondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <RowDivider />
          <SettingRow icon={<Shield size={18} color={Colors.primary} />} label="Verify Lock Now" sublabel="Quick lock test" onPress={handleLockNow} />
        </SectionBlock>

        <SectionBlock title="Appearance">
          <View style={styles.inlineBlock}>
            <Text style={[styles.inlineLabel, { color: scheme.textSecondary }]}>Theme mode</Text>
            <View style={styles.segmentRow}>
              {([
                { key: "light", label: "Light", icon: <Sun size={14} color={mode === "light" ? "#FFFFFF" : scheme.textSecondary} /> },
                { key: "dark", label: "Dark", icon: <Moon size={14} color={mode === "dark" ? "#FFFFFF" : scheme.textSecondary} /> },
                { key: "auto", label: "Auto", icon: <Palette size={14} color={mode === "auto" ? "#FFFFFF" : scheme.textSecondary} /> },
              ] as { key: ThemeMode; label: string; icon: React.ReactNode }[]).map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.segmentChip,
                    {
                      flexDirection: "row",
                      gap: 6,
                      backgroundColor: mode === option.key
                        ? Colors.primary
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(15,23,42,0.06)",
                    },
                  ]}
                  onPress={async () => {
                    try {
                      await setMode(option.key);
                    } catch {
                      Alert.alert("Update failed", "Unable to change theme mode now.");
                    }
                  }}
                >
                  {option.icon}
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: mode === option.key ? "#FFFFFF" : scheme.textSecondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SectionBlock>

        <SectionBlock title="Backup">
          <SettingRow
            icon={<Shield size={18} color={Colors.primary} />}
            label="Vault Backups"
            sublabel="List last 7 days, backup now, and schedule per vault"
            onPress={() => router.push("/vault-backups")}
          />
          <RowDivider />
          <SettingRow
            icon={<Upload size={18} color={Colors.primary} />}
            label="Data Backups"
            sublabel="Backup schedule, overwrite, and restore history"
            onPress={() => {}}
            disabled
          />
        </SectionBlock>

        <SectionBlock title="Advanced">
          <View style={styles.inlineBlock}>
            <Text style={[styles.inlineLabel, { color: scheme.textSecondary }]}>Notification presets</Text>
            <View style={styles.segmentRow}>
              {([
                { key: "all", label: "All" },
                { key: "essential", label: "Essential" },
                { key: "quiet", label: "Quiet" },
              ] as const).map((option) => (
                <TouchableOpacity
                  key={option.key}
                  style={[
                    styles.segmentChip,
                    {
                      backgroundColor: notificationPreset === option.key
                        ? Colors.primary
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(15,23,42,0.06)",
                    },
                  ]}
                  onPress={() => applyNotificationPreset(option.key)}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: notificationPreset === option.key ? "#FFFFFF" : scheme.textSecondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <RowDivider />
          <View style={styles.inlineBlock}>
            <Text style={[styles.inlineLabel, { color: scheme.textSecondary }]}>Default start section</Text>
            <View style={styles.segmentRow}>
              {DEFAULT_TAB_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.segmentChip,
                    {
                      backgroundColor: defaults.defaultTab === option.value
                        ? Colors.primary
                        : isDark
                          ? "rgba(255,255,255,0.08)"
                          : "rgba(15,23,42,0.06)",
                    },
                  ]}
                  onPress={() => saveDefaultPreferences({ defaultTab: option.value })}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      fontWeight: "700",
                      color: defaults.defaultTab === option.value ? "#FFFFFF" : scheme.textSecondary,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <RowDivider />
          <ToggleRow
            icon={<Bell size={18} color={Colors.primary} />}
            label="Bill Reminders"
            value={notifyBills}
            onValueChange={async (value) => {
              if (value) await requestNotificationPermissions();
              await updateNotificationSetting("notifyBills", value);
            }}
          />
          <RowDivider />
          <ToggleRow
            icon={<BellOff size={18} color={Colors.primary} />}
            label="Due Date Alerts"
            value={notifyDue}
            onValueChange={async (value) => {
              if (value) await requestNotificationPermissions();
              await updateNotificationSetting("notifyDue", value);
            }}
          />
          <RowDivider />
          <ToggleRow
            icon={<Bell size={18} color={Colors.primary} />}
            label="Payment Reminders"
            value={notifyReminders}
            onValueChange={async (value) => {
              if (value) await requestNotificationPermissions();
              await updateNotificationSetting("notifyReminders", value);
            }}
          />
          <RowDivider />
          <ToggleRow
            icon={<Bell size={18} color={Colors.primary} />}
            label="Notification Sound"
            value={notifySound}
            onValueChange={async (value) => updateNotificationSetting("notifySound", value)}
          />
          <RowDivider />
          <SettingRow icon={<Info size={18} color={Colors.primary} />} label="App Info" value="1.0.0" onPress={() => router.push("/app-info")} />
          <RowDivider />
          <SettingRow icon={<RotateCcw size={18} color={Colors.error} />} label="Logout" destructive onPress={handleLogout} />
        </SectionBlock>

        <Text style={[styles.footerText, { color: scheme.textTertiary }]}>PulseBox v1.0.0</Text>
      </ScrollView>

      <Modal visible={showSetPinModal} transparent animationType="fade" onRequestClose={() => setShowSetPinModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#1C1C23" : "#FFFFFF" }]}>
            <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>Set App PIN</Text>
            <Text style={[styles.modalSubtitle, { color: scheme.textSecondary }]}>Create a 4 to 8 digit PIN for local app lock.</Text>
            <TextInput
              style={[styles.pinInput, { color: scheme.textPrimary, borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)" }]}
              value={pinDraft}
              onChangeText={setPinDraft}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              placeholder="Enter PIN"
              placeholderTextColor={scheme.textTertiary}
            />
            <TextInput
              style={[styles.pinInput, { color: scheme.textPrimary, borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)" }]}
              value={pinConfirm}
              onChangeText={setPinConfirm}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              placeholder="Confirm PIN"
              placeholderTextColor={scheme.textTertiary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalGhostBtn]} onPress={() => setShowSetPinModal(false)}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalSolidBtn]} onPress={savePin}>
                <Text style={styles.modalSolidText}>Save PIN</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showVerifyPinModal} transparent animationType="fade" onRequestClose={() => setShowVerifyPinModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: isDark ? "#1C1C23" : "#FFFFFF" }]}>
            <Text style={[styles.modalTitle, { color: scheme.textPrimary }]}>Verify PIN</Text>
            <Text style={[styles.modalSubtitle, { color: scheme.textSecondary }]}>Enter your PIN to verify lock access.</Text>
            <TextInput
              style={[styles.pinInput, { color: scheme.textPrimary, borderColor: isDark ? "rgba(255,255,255,0.16)" : "rgba(15,23,42,0.14)" }]}
              value={pinVerify}
              onChangeText={setPinVerify}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              placeholder="Enter PIN"
              placeholderTextColor={scheme.textTertiary}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalGhostBtn]} onPress={() => setShowVerifyPinModal(false)}>
                <Text style={styles.modalGhostText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalSolidBtn]} onPress={verifyPin}>
                <Text style={styles.modalSolidText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loggingOut ? (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingCard, { backgroundColor: isDark ? "#1C1C23" : "#FFFFFF" }]}>
            <Text style={[styles.loadingText, { color: scheme.textPrimary }]}>Logging out...</Text>
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerBlur: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerEyebrow: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  headerTitle: {
    fontSize: 31,
    fontWeight: "800",
    letterSpacing: -0.8,
    marginTop: 4,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: Spacing.md,
  },
  profileCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.16)",
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 4,
  },
  avatarWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    fontSize: 16,
    fontWeight: "700",
  },
  profileEmail: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "500",
  },
  profileAction: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(124,58,237,0.12)",
  },
  sectionBlock: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginLeft: 2,
  },
  sectionCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  pressedRow: {
    opacity: 0.7,
    transform: [{ scale: 0.995 }],
  },
  disabledRow: {
    opacity: 0.45,
  },
  rowIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  rowSublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  rowValue: {
    fontSize: 12,
    marginRight: 3,
    textTransform: "capitalize",
    fontWeight: "600",
  },
  rowDivider: {
    height: 1,
    marginLeft: 58,
  },
  inlineBlock: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inlineLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  segmentChip: {
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  backupStatusList: {
    gap: 8,
  },
  backupStatusItem: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "rgba(124,58,237,0.08)",
  },
  backupVaultName: {
    fontSize: 13,
    fontWeight: "700",
  },
  footerText: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  modalSubtitle: {
    fontSize: 13,
    lineHeight: 19,
  },
  pinInput: {
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
  modalGhostBtn: {
    backgroundColor: "rgba(15,23,42,0.08)",
  },
  modalGhostText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  modalSolidBtn: {
    backgroundColor: Colors.primary,
  },
  modalSolidText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
