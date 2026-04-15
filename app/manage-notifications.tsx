/**
 * Notification Management Screen - Smart & Custom Notifications
 * 
 * Smart notifications pull data from bills and create alerts for sections
 * Custom notifications are fully user-defined
 * 
 * DATA STORAGE:
 * - Smart Notifications: AsyncStorage key "smart_notifications"
 * - Custom Notifications: AsyncStorage key "custom_notifications"
 * - Settings: AsyncStorage key "notification_settings"
 * 
 * NOTIFICATIONS:
 * - Uses expo-notifications for local push notifications
 * - Notifications are scheduled on device using system notification scheduler
 */

import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { BorderRadius, Spacing, Typography } from "@/constants/designTokens";
import { Colors, getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { BlurView } from "expo-blur";
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronLeft,
  Clock,
  CreditCard,
  Home,
  Play,
  Plus,
  Repeat,
  Settings2,
  Trash2,
  Truck,
  Tv,
  Zap,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

type Section = "electric" | "gas" | "wifi" | "property" | "vehicles" | "appliances";
type NotificationType = "bill_due" | "reminder" | "alert" | "custom";
type Frequency = "once" | "daily" | "weekly" | "monthly" | "yearly";

interface SmartNotification {
  id: string;
  section: Section;
  notificationType: NotificationType;
  frequency: Frequency;
  hour: number;
  minute: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  enabled: boolean;
  customMessage?: string;
}

interface CustomNotification {
  id: string;
  title: string;
  message: string;
  frequency: Frequency;
  hour: number;
  minute: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  enabled: boolean;
}

const SECTIONS: { key: Section; label: string; icon: React.ReactNode; lastBillLabel: string }[] = [
  { key: "electric", label: "Electric Bills", icon: <Zap size={16} color={Colors.primary} />, lastBillLabel: "Last month's electricity bill" },
  { key: "gas", label: "Gas Bills", icon: <Home size={16} color={Colors.primary} />, lastBillLabel: "Last month's gas bill" },
  { key: "wifi", label: "WiFi Bills", icon: <Tv size={16} color={Colors.primary} />, lastBillLabel: "Last month's WiFi bill" },
  { key: "property", label: "Property Tax", icon: <Home size={16} color={Colors.primary} />, lastBillLabel: "Last year's property tax" },
  { key: "vehicles", label: "Vehicles", icon: <Truck size={16} color={Colors.primary} />, lastBillLabel: "Vehicle expenses" },
  { key: "appliances", label: "Appliances", icon: <Tv size={16} color={Colors.primary} />, lastBillLabel: "Appliance maintenance" },
];

const NOTIFICATION_TYPES = [
  { key: "bill_due", label: "Bill Due", icon: <CreditCard size={16} color={Colors.primary} /> },
  { key: "reminder", label: "Reminder", icon: <Bell size={16} color={Colors.primary} /> },
  { key: "alert", label: "Alert", icon: <BellOff size={16} color={Colors.primary} /> },
];

const FREQUENCIES = [
  { key: "once", label: "Once" },
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function NotificationManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  
  const [activeTab, setActiveTab] = useState<"smart" | "custom">("smart");
  const [smartNotifications, setSmartNotifications] = useState<SmartNotification[]>([]);
  const [customNotifications, setCustomNotifications] = useState<CustomNotification[]>([]);
  const [showAddSmartForm, setShowAddSmartForm] = useState(false);
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  
  // Smart form state
  const [smartSection, setSmartSection] = useState<Section>("electric");
  const [smartType, setSmartType] = useState<NotificationType>("bill_due");
  const [smartFrequency, setSmartFrequency] = useState<Frequency>("monthly");
  const [smartHour, setSmartHour] = useState(9);
  const [smartMinute, setSmartMinute] = useState(0);
  const [smartDayOfMonth, setSmartDayOfMonth] = useState(1);
  const [smartDayOfWeek, setSmartDayOfWeek] = useState(1);
  const [smartCustomMessage, setSmartCustomMessage] = useState("");
  
  // Custom form state
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customFrequency, setCustomFrequency] = useState<Frequency>("once");
  const [customHour, setCustomHour] = useState(9);
  const [customMinute, setCustomMinute] = useState(0);
  const [customDayOfMonth, setCustomDayOfMonth] = useState(1);
  const [customDayOfWeek, setCustomDayOfWeek] = useState(1);

  useEffect(() => {
    checkPermissions();
    loadNotifications();
  }, []);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionGranted(status === "granted");
    if (status !== "granted") {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      setPermissionGranted(newStatus === "granted");
    }
  };

  const loadNotifications = async () => {
    try {
      const smart = await AsyncStorage.getItem("smart_notifications");
      const custom = await AsyncStorage.getItem("custom_notifications");
      if (smart) setSmartNotifications(JSON.parse(smart));
      if (custom) setCustomNotifications(JSON.parse(custom));
    } catch (error) {
      console.error("Failed to load notifications:", error);
    }
  };

  const saveSmartNotifications = async (updated: SmartNotification[]) => {
    try {
      await AsyncStorage.setItem("smart_notifications", JSON.stringify(updated));
      setSmartNotifications(updated);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const saveCustomNotifications = async (updated: CustomNotification[]) => {
    try {
      await AsyncStorage.setItem("custom_notifications", JSON.stringify(updated));
      setCustomNotifications(updated);
    } catch (error) {
      console.error("Failed to save:", error);
    }
  };

  const scheduleNotification = async (title: string, message: string, trigger: any) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title, body: message, sound: true },
        trigger,
      });
    } catch (error) {
      console.error("Failed to schedule:", error);
    }
  };

  const addSmartNotification = async () => {
    const section = SECTIONS.find(s => s.key === smartSection)!;
    const typeLabel = NOTIFICATION_TYPES.find(t => t.key === smartType)?.label || "Alert";
    
    const title = `${typeLabel}: ${section.label}`;
    let message = smartCustomMessage || `Check your ${section.label.toLowerCase()}`;
    
    // Generate smart message based on section
    if (!smartCustomMessage) {
      const lastBillMessages: Record<Section, string> = {
        electric: "Your last month's electricity usage - check current bill",
        gas: "Time to check this month's gas cylinder status",
        wifi: "Your WiFi bill cycle reminder",
        property: "Property tax payment reminder",
        vehicles: "Vehicle maintenance check reminder",
        appliances: "Appliance warranty & service reminder",
      };
      message = lastBillMessages[smartSection];
    }

    const newNotif: SmartNotification = {
      id: Date.now().toString(),
      section: smartSection,
      notificationType: smartType,
      frequency: smartFrequency,
      hour: smartHour,
      minute: smartMinute,
      dayOfMonth: smartFrequency === "monthly" || smartFrequency === "yearly" ? smartDayOfMonth : undefined,
      dayOfWeek: smartFrequency === "weekly" ? smartDayOfWeek : undefined,
      enabled: true,
      customMessage: smartCustomMessage || undefined,
    };

    const trigger = getTrigger(smartFrequency, smartHour, smartMinute, smartDayOfMonth, smartDayOfWeek);
    await scheduleNotification(title, message, trigger);
    
    const updated = [...smartNotifications, newNotif];
    await saveSmartNotifications(updated);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetSmartForm();
    setShowAddSmartForm(false);
    Alert.alert("Success", "Smart notification scheduled!");
  };

  const addCustomNotification = async () => {
    if (!customTitle.trim() || !customMessage.trim()) {
      Alert.alert("Error", "Please fill title and message");
      return;
    }

    const newNotif: CustomNotification = {
      id: Date.now().toString(),
      title: customTitle.trim(),
      message: customMessage.trim(),
      frequency: customFrequency,
      hour: customHour,
      minute: customMinute,
      dayOfMonth: customFrequency === "monthly" || customFrequency === "yearly" ? customDayOfMonth : undefined,
      dayOfWeek: customFrequency === "weekly" ? customDayOfWeek : undefined,
      enabled: true,
    };

    const trigger = getTrigger(customFrequency, customHour, customMinute, customDayOfMonth, customDayOfWeek);
    await scheduleNotification(newNotif.title, newNotif.message, trigger);
    
    const updated = [...customNotifications, newNotif];
    await saveCustomNotifications(updated);
    
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetCustomForm();
    setShowAddCustomForm(false);
    Alert.alert("Success", "Custom notification scheduled!");
  };

  const getTrigger = (freq: Frequency, hour: number, minute: number, dayOfMonth: number, dayOfWeek: number) => {
    switch (freq) {
      case "daily":
        return { type: "daily", hour, minute } as any;
      case "weekly":
        return { type: "weekly", weekday: dayOfWeek + 1, hour, minute } as any;
      case "monthly":
        return { type: "monthly", day: dayOfMonth, hour, minute } as any;
      case "yearly":
        return { type: "yearly", day: dayOfMonth, month: 1, hour, minute } as any;
      default:
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        if (date <= new Date()) date.setDate(date.getDate() + 1);
        return { type: "date", date } as any;
    }
  };

  const toggleSmart = async (id: string) => {
    const updated = smartNotifications.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n);
    await saveSmartNotifications(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleCustom = async (id: string) => {
    const updated = customNotifications.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n);
    await saveCustomNotifications(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteSmart = async (id: string) => {
    Alert.alert("Delete", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await saveSmartNotifications(smartNotifications.filter(n => n.id !== id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }},
    ]);
  };

  const deleteCustom = async (id: string) => {
    Alert.alert("Delete", "Remove this notification?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: async () => {
        await saveCustomNotifications(customNotifications.filter(n => n.id !== id));
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }},
    ]);
  };

  const resetSmartForm = () => {
    setSmartSection("electric");
    setSmartType("bill_due");
    setSmartFrequency("monthly");
    setSmartHour(9);
    setSmartMinute(0);
    setSmartDayOfMonth(1);
    setSmartDayOfWeek(1);
    setSmartCustomMessage("");
  };

  const resetCustomForm = () => {
    setCustomTitle("");
    setCustomMessage("");
    setCustomFrequency("once");
    setCustomHour(9);
    setCustomMinute(0);
    setCustomDayOfMonth(1);
    setCustomDayOfWeek(1);
  };

  const sendTest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const date = new Date();
    date.setSeconds(date.getSeconds() + 3);
    await Notifications.scheduleNotificationAsync({
      content: { title: "🔔 Test Notification", body: "Pulsebox notifications are working!", sound: true },
      trigger: { type: "date", date } as any,
    });
    Alert.alert("Test Sent!", "Check your notifications in 3 seconds.");
  };

  const sendTestForSmart = async (n: SmartNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const sec = SECTIONS.find(s => s.key === n.section)!;
    const typeLabel = NOTIFICATION_TYPES.find(t => t.key === n.notificationType)?.label || "Alert";
    const title = `${typeLabel}: ${sec.label}`;
    const message = n.customMessage || sec.lastBillLabel;
    
    await Notifications.scheduleNotificationAsync({
      content: { title, body: message, sound: true },
      trigger: { type: "date", date: new Date(Date.now() + 5000) } as any,
    });
    Alert.alert("Test Sent!", `Testing: ${title}\n\nCheck your notifications in 5 seconds.`);
  };

  const sendTestForCustom = async (n: CustomNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Notifications.scheduleNotificationAsync({
      content: { title: n.title, body: n.message, sound: true },
      trigger: { type: "date", date: new Date(Date.now() + 5000) } as any,
    });
    Alert.alert("Test Sent!", `Testing: ${n.title}\n\nCheck your notifications in 5 seconds.`);
  };

  const formatTime = (h: number, m: number) => {
    const hour12 = h % 12 || 12;
    return `${hour12}:${m.toString().padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
  };

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#000000" : "#F2F2F7" }]}>
      <BlurView intensity={isDark ? 60 : 80} style={styles.headerBlur}>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={28} color={scheme.textPrimary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: scheme.textPrimary }]}>Notifications</Text>
          <View style={{ width: 44 }} />
        </View>
      </BlurView>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Tab Selector */}
        <View style={[styles.tabContainer, { backgroundColor: isDark ? "#1C1C1E" : "#E8E8ED" }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "smart" && { backgroundColor: isDark ? "#2C2C2E" : "#FFFFFF" }]}
            onPress={() => setActiveTab("smart")}
          >
            <Settings2 size={16} color={activeTab === "smart" ? Colors.primary : scheme.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === "smart" ? Colors.primary : scheme.textSecondary }]}>Smart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "custom" && { backgroundColor: isDark ? "#2C2C2E" : "#FFFFFF" }]}
            onPress={() => setActiveTab("custom")}
          >
            <Bell size={16} color={activeTab === "custom" ? Colors.primary : scheme.textSecondary} />
            <Text style={[styles.tabText, { color: activeTab === "custom" ? Colors.primary : scheme.textSecondary }]}>Custom</Text>
          </TouchableOpacity>
        </View>

        {/* Test Button */}
        <TouchableOpacity style={[styles.testBtn, { backgroundColor: Colors.primary }]} onPress={sendTest}>
          <Bell size={16} color="#FFF" />
          <Text style={styles.testBtnText}>Send Test</Text>
        </TouchableOpacity>

        {/* SMART NOTIFICATIONS */}
        {activeTab === "smart" && (
          <>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]} onPress={() => setShowAddSmartForm(!showAddSmartForm)}>
              <View style={styles.addBtnContent}>
                <Plus size={20} color={Colors.primary} />
                <Text style={[styles.addBtnText, { color: Colors.primary }]}>Add Smart Notification</Text>
              </View>
              <Text style={{ color: scheme.textSecondary }}>{showAddSmartForm ? "−" : "+"}</Text>
            </TouchableOpacity>

            {showAddSmartForm && (
              <View style={[styles.formCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
                <Text style={[styles.formTitle, { color: scheme.textPrimary }]}>Smart Notification</Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Section</Text>
                <View style={styles.chipContainer}>
                  {SECTIONS.map(s => (
                    <TouchableOpacity key={s.key} style={[styles.chip, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }, smartSection === s.key && { backgroundColor: Colors.primary }]} onPress={() => setSmartSection(s.key)}>
                      {s.icon}
                      <Text style={[styles.chipText, { color: smartSection === s.key ? "#FFF" : scheme.textPrimary }]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Notification Type</Text>
                <View style={styles.chipContainer}>
                  {NOTIFICATION_TYPES.map(t => (
                    <TouchableOpacity key={t.key} style={[styles.chip, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }, smartType === t.key && { backgroundColor: Colors.primary }]} onPress={() => setSmartType(t.key as NotificationType)}>
                      {t.icon}
                      <Text style={[styles.chipText, { color: smartType === t.key ? "#FFF" : scheme.textPrimary }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Frequency</Text>
                <View style={styles.chipContainer}>
                  {FREQUENCIES.map(f => (
                    <TouchableOpacity key={f.key} style={[styles.chip, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }, smartFrequency === f.key && { backgroundColor: Colors.primary }]} onPress={() => setSmartFrequency(f.key as Frequency)}>
                      <Text style={[styles.chipText, { color: smartFrequency === f.key ? "#FFF" : scheme.textPrimary }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Time</Text>
                <View style={styles.timeRow}>
                  <View style={[styles.timeInput, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setSmartHour(h => (h - 1 + 24) % 24)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>-</Text></TouchableOpacity>
                    <Text style={[styles.timeValue, { color: scheme.textPrimary }]}>{smartHour.toString().padStart(2, "0")}</Text>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setSmartHour(h => (h + 1) % 24)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>+</Text></TouchableOpacity>
                  </View>
                  <Text style={[styles.timeSep, { color: scheme.textPrimary }]}>:</Text>
                  <View style={[styles.timeInput, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setSmartMinute(m => (m - 1 + 60) % 60)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>-</Text></TouchableOpacity>
                    <Text style={[styles.timeValue, { color: scheme.textPrimary }]}>{smartMinute.toString().padStart(2, "0")}</Text>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setSmartMinute(m => (m + 1) % 60)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>+</Text></TouchableOpacity>
                  </View>
                </View>

                {smartFrequency === "weekly" && (
                  <>
                    <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Day</Text>
                    <View style={styles.weekRow}>
                      {WEEKDAYS.map((day, i) => (
                        <TouchableOpacity key={day} style={[styles.dayChip, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }, smartDayOfWeek === i && { backgroundColor: Colors.primary }]} onPress={() => setSmartDayOfWeek(i)}>
                          <Text style={[styles.dayText, { color: smartDayOfWeek === i ? "#FFF" : scheme.textPrimary }]}>{day}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {(smartFrequency === "monthly" || smartFrequency === "yearly") && (
                  <>
                    <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Day of Month</Text>
                    <View style={styles.dayRow}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => setSmartDayOfMonth(d => (d - 1 + 31) || 31)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>-</Text></TouchableOpacity>
                      <Text style={[styles.dayValue, { color: scheme.textPrimary, backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}>{smartDayOfMonth}</Text>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => setSmartDayOfMonth(d => (d % 31) + 1)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>+</Text></TouchableOpacity>
                    </View>
                  </>
                )}

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Custom Message (optional)</Text>
                <TextInput style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5", color: scheme.textPrimary, borderColor: isDark ? "#3C3C3E" : "#E5E5E5" }]} value={smartCustomMessage} onChangeText={setSmartCustomMessage} placeholder="Custom reminder text..." placeholderTextColor={scheme.textTertiary} />

                <View style={styles.formActions}>
                  <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]} onPress={() => { resetSmartForm(); setShowAddSmartForm(false); }}>
                    <Text style={{ color: scheme.textPrimary }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={addSmartNotification}>
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: scheme.textSecondary }]}>SMART NOTIFICATIONS ({smartNotifications.length})</Text>
            
            {smartNotifications.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
                <Settings2 size={40} color={scheme.textTertiary} />
                <Text style={[styles.emptyText, { color: scheme.textSecondary }]}>No smart notifications</Text>
              </View>
            ) : smartNotifications.map(n => {
              const sec = SECTIONS.find(s => s.key === n.section)!;
              const type = NOTIFICATION_TYPES.find(t => t.key === n.notificationType)!;
              return (
                <View key={n.id} style={[styles.notifCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
                  <View style={styles.notifHeader}>
                    <View style={styles.notifInfo}>
                      <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)" }]}>{sec.icon}</View>
                      <View>
                        <Text style={[styles.notifTitle, { color: scheme.textPrimary }]}>{type.label}: {sec.label}</Text>
                        <Text style={[styles.notifSub, { color: scheme.textSecondary }]}>{n.customMessage || sec.lastBillLabel}</Text>
                      </View>
                    </View>
                    <View style={styles.actionBtns}>
                      <Switch value={n.enabled} onValueChange={() => toggleSmart(n.id)} trackColor={{ false: "#39393D", true: "#34C759" }} thumbColor="#FFF" />
                      <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => deleteSmart(n.id)}>
                        <Trash2 size={16} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={[styles.notifMeta, { borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
                    <View style={[styles.tag, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}><Repeat size={12} color={scheme.textTertiary} /><Text style={styles.tagText}>{FREQUENCIES.find(f => f.key === n.frequency)?.label}</Text></View>
                    <View style={[styles.tag, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}><Clock size={12} color={scheme.textTertiary} /><Text style={styles.tagText}>{formatTime(n.hour, n.minute)}</Text></View>
                    <TouchableOpacity style={[styles.testTag, { backgroundColor: Colors.primary }]} onPress={() => sendTestForSmart(n)}>
                      <Play size={10} color="#FFF" fill="#FFF" /><Text style={styles.testTagText}>Test</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {/* CUSTOM NOTIFICATIONS */}
        {activeTab === "custom" && (
          <>
            <TouchableOpacity style={[styles.addBtn, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]} onPress={() => setShowAddCustomForm(!showAddCustomForm)}>
              <View style={styles.addBtnContent}>
                <Plus size={20} color={Colors.primary} />
                <Text style={[styles.addBtnText, { color: Colors.primary }]}>Add Custom Notification</Text>
              </View>
              <Text style={{ color: scheme.textSecondary }}>{showAddCustomForm ? "−" : "+"}</Text>
            </TouchableOpacity>

            {showAddCustomForm && (
              <View style={[styles.formCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
                <Text style={[styles.formTitle, { color: scheme.textPrimary }]}>Custom Notification</Text>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Title</Text>
                <TextInput style={[styles.input, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5", color: scheme.textPrimary, borderColor: isDark ? "#3C3C3E" : "#E5E5E5" }]} value={customTitle} onChangeText={setCustomTitle} placeholder="Notification title" placeholderTextColor={scheme.textTertiary} />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Message</Text>
                <TextInput style={[styles.input, styles.textArea, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5", color: scheme.textPrimary, borderColor: isDark ? "#3C3C3E" : "#E5E5E5" }]} value={customMessage} onChangeText={setCustomMessage} placeholder="Your custom message..." placeholderTextColor={scheme.textTertiary} multiline numberOfLines={3} />

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Frequency</Text>
                <View style={styles.chipContainer}>
                  {FREQUENCIES.map(f => (
                    <TouchableOpacity key={f.key} style={[styles.chip, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }, customFrequency === f.key && { backgroundColor: Colors.primary }]} onPress={() => setCustomFrequency(f.key as Frequency)}>
                      <Text style={[styles.chipText, { color: customFrequency === f.key ? "#FFF" : scheme.textPrimary }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Time</Text>
                <View style={styles.timeRow}>
                  <View style={[styles.timeInput, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setCustomHour(h => (h - 1 + 24) % 24)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>-</Text></TouchableOpacity>
                    <Text style={[styles.timeValue, { color: scheme.textPrimary }]}>{customHour.toString().padStart(2, "0")}</Text>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setCustomHour(h => (h + 1) % 24)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>+</Text></TouchableOpacity>
                  </View>
                  <Text style={[styles.timeSep, { color: scheme.textPrimary }]}>:</Text>
                  <View style={[styles.timeInput, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setCustomMinute(m => (m - 1 + 60) % 60)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>-</Text></TouchableOpacity>
                    <Text style={[styles.timeValue, { color: scheme.textPrimary }]}>{customMinute.toString().padStart(2, "0")}</Text>
                    <TouchableOpacity style={styles.stepBtn} onPress={() => setCustomMinute(m => (m + 1) % 60)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>+</Text></TouchableOpacity>
                  </View>
                </View>

                {customFrequency === "weekly" && (
                  <>
                    <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Day</Text>
                    <View style={styles.weekRow}>
                      {WEEKDAYS.map((day, i) => (
                        <TouchableOpacity key={day} style={[styles.dayChip, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }, customDayOfWeek === i && { backgroundColor: Colors.primary }]} onPress={() => setCustomDayOfWeek(i)}>
                          <Text style={[styles.dayText, { color: customDayOfWeek === i ? "#FFF" : scheme.textPrimary }]}>{day}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {(customFrequency === "monthly" || customFrequency === "yearly") && (
                  <>
                    <Text style={[styles.inputLabel, { color: scheme.textSecondary }]}>Day of Month</Text>
                    <View style={styles.dayRow}>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => setCustomDayOfMonth(d => (d - 1 + 31) || 31)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>-</Text></TouchableOpacity>
                      <Text style={[styles.dayValue, { color: scheme.textPrimary, backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}>{customDayOfMonth}</Text>
                      <TouchableOpacity style={styles.stepBtn} onPress={() => setCustomDayOfMonth(d => (d % 31) + 1)}><Text style={{ color: "#FFF", fontWeight: "bold" }}>+</Text></TouchableOpacity>
                    </View>
                  </>
                )}

                <View style={styles.formActions}>
                  <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]} onPress={() => { resetCustomForm(); setShowAddCustomForm(false); }}>
                    <Text style={{ color: scheme.textPrimary }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.saveBtn, { backgroundColor: Colors.primary }]} onPress={addCustomNotification}>
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={[styles.sectionTitle, { color: scheme.textSecondary }]}>CUSTOM NOTIFICATIONS ({customNotifications.length})</Text>
            
            {customNotifications.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
                <Bell size={40} color={scheme.textTertiary} />
                <Text style={[styles.emptyText, { color: scheme.textSecondary }]}>No custom notifications</Text>
              </View>
            ) : customNotifications.map(n => (
              <View key={n.id} style={[styles.notifCard, { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" }]}>
                <View style={styles.notifHeader}>
                  <View style={styles.notifInfo}>
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? "rgba(124,58,237,0.2)" : "rgba(124,58,237,0.1)" }]}><Bell size={18} color={Colors.primary} /></View>
                    <View>
                      <Text style={[styles.notifTitle, { color: scheme.textPrimary }]}>{n.title}</Text>
                      <Text style={[styles.notifSub, { color: scheme.textSecondary }]}>{n.message}</Text>
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <Switch value={n.enabled} onValueChange={() => toggleCustom(n.id)} trackColor={{ false: "#39393D", true: "#34C759" }} thumbColor="#FFF" />
                    <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => deleteCustom(n.id)}>
                      <Trash2 size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={[styles.notifMeta, { borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
                  <View style={[styles.tag, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}><Repeat size={12} color={scheme.textTertiary} /><Text style={styles.tagText}>{FREQUENCIES.find(f => f.key === n.frequency)?.label}</Text></View>
                  <View style={[styles.tag, { backgroundColor: isDark ? "#2C2C2E" : "#F5F5F5" }]}><Clock size={12} color={scheme.textTertiary} /><Text style={styles.tagText}>{formatTime(n.hour, n.minute)}</Text></View>
                  <TouchableOpacity style={[styles.testTag, { backgroundColor: Colors.primary }]} onPress={() => sendTestForCustom(n)}>
                    <Play size={10} color="#FFF" fill="#FFF" /><Text style={styles.testTagText}>Test</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingBottom: 34 },
  headerBlur: { borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.1)" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  tabContainer: { flexDirection: "row", borderRadius: 12, padding: 4 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabText: { fontSize: 14, fontWeight: "600" },
  testBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12 },
  testBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12 },
  addBtnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBtnText: { fontSize: 15, fontWeight: "600" },
  formCard: { borderRadius: 12, padding: 16, gap: 12 },
  formTitle: { fontSize: 16, fontWeight: "700" },
  inputLabel: { fontSize: 13, fontWeight: "600" },
  input: { borderRadius: 10, padding: 12, fontSize: 14, borderWidth: 1 },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: "500" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeSep: { fontSize: 24, fontWeight: "bold" },
  timeInput: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 12, borderRadius: 10 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  timeValue: { fontSize: 24, fontWeight: "700", minWidth: 40, textAlign: "center" },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayChip: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
  dayText: { fontSize: 11, fontWeight: "600" },
  dayRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  dayValue: { fontSize: 18, fontWeight: "700", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, minWidth: 60, textAlign: "center" },
  formActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center" },
  sectionTitle: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginTop: 8 },
  emptyCard: { alignItems: "center", padding: 32, borderRadius: 12 },
  emptyText: { fontSize: 14, marginTop: 8 },
  notifCard: { borderRadius: 12, padding: 14, marginBottom: 10 },
  notifHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notifInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12 },
  notifTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  notifSub: { fontSize: 12 },
  notifMeta: { flexDirection: "row", gap: 8, paddingTop: 10, borderTopWidth: 0.5, marginTop: 10, alignItems: "center" },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  tagText: { fontSize: 11, fontWeight: "500", color: "#666" },
  testTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: "auto" },
  testTagText: { fontSize: 10, fontWeight: "600", color: "#FFF" },
  actionBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  deleteBtn: { position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(239,68,68,0.1)", justifyContent: "center", alignItems: "center" },
  deleteBtnSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(239,68,68,0.1)", justifyContent: "center", alignItems: "center" },
});
