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
import { Colors } from "@/theme/color";
import {
  Bell,
  BellOff,
  ChevronDown,
  ChevronLeft,
  Clock,
  CreditCard,
  Edit2,
  Home,
  Play,
  Plus,
  Repeat,
  Settings2,
  Trash2,
  Truck,
  Tv,
  X,
  Zap,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import * as Haptics from "expo-haptics";
import { sectionTemplates, getSmartNotificationData, generateSmartMessage, SmartNotificationData } from "@/src/services/NotificationDataService";
import { loadBackupNotificationSettings, setBackupNotificationEnabled } from "@/src/services/BackupNotificationSettings";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

interface TimePickerButtonProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}

const TimePickerButton: React.FC<TimePickerButtonProps> = ({ label, value, onChange }) => {
  const [show, setShow] = React.useState(false);

  const formatTime = (date: Date) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
    }
    if (selectedDate) {
      onChange(selectedDate);
    }
  };

  return (
    <View style={pickerStyles.container}>
      <Text style={pickerStyles.label}>{label}</Text>
      <TouchableOpacity style={pickerStyles.button} onPress={() => setShow(true)}>
        <Clock size={18} color={Colors.primary} />
        <Text style={pickerStyles.buttonText}>{formatTime(value)}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={value}
          mode="time"
          is24Hour={true}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      )}
      {Platform.OS === "ios" && show && (
        <TouchableOpacity style={pickerStyles.doneButton} onPress={() => setShow(false)}>
          <Text style={pickerStyles.doneText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

interface DayPickerProps {
  label: string;
  value: number;
  maxValue: number;
  onChange: (value: number) => void;
}

const DayPicker: React.FC<DayPickerProps> = ({ label, value, maxValue, onChange }) => {
  const [show, setShow] = React.useState(false);
  const [tempDate, setTempDate] = React.useState(new Date(2024, 0, value));

  const handlePress = () => {
    const d = new Date(2024, 0, value);
    setTempDate(d);
    setShow(true);
  };

  const handleChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === "android") {
      setShow(false);
      if (event.type === "set" && selectedDate) {
        onChange(selectedDate.getDate());
      }
    } else if (selectedDate) {
      setTempDate(selectedDate);
    }
  };

  return (
    <View style={pickerStyles.container}>
      <Text style={pickerStyles.label}>{label}</Text>
      <TouchableOpacity style={pickerStyles.button} onPress={handlePress}>
        <Text style={pickerStyles.buttonText}>{value}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={tempDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={handleChange}
        />
      )}
      {Platform.OS === "ios" && show && (
        <TouchableOpacity style={pickerStyles.doneButton} onPress={() => { setShow(false); onChange(tempDate.getDate()); }}>
          <Text style={pickerStyles.doneText}>Done</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const pickerStyles = StyleSheet.create({
  container: { marginVertical: 8 },
  label: { fontSize: 13, fontWeight: "600", color: "#8E8E93", marginBottom: 8, textAlign: "center" },
  button: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    gap: 8,
    padding: 14, 
    borderRadius: 12, 
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E5E5EA",
  },
  buttonText: { fontSize: 18, fontWeight: "600", color: Colors.primary },
  doneButton: { 
    alignSelf: "flex-end", 
    paddingVertical: 8, 
    paddingHorizontal: 16,
  },
  doneText: { fontSize: 16, fontWeight: "600", color: Colors.primary },
});

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
type Frequency = "once" | "daily" | "weekly" | "bimonthly" | "quarterly" | "biannual" | "custom" | "surprise";
type IntervalUnit = "days" | "weeks" | "months";
type SurpriseTime = "morning" | "afternoon" | "evening" | "night" | "anytime";
type SurpriseTopic = "bills" | "maintenance" | "alerts" | "savings";

const SURPRISE_TIMES = [
  { key: "morning", label: "Morning", range: "6AM - 12PM", icon: "🌅", minHour: 6, maxHour: 12 },
  { key: "afternoon", label: "Afternoon", range: "12PM - 5PM", icon: "☀️", minHour: 12, maxHour: 17 },
  { key: "evening", label: "Evening", range: "5PM - 9PM", icon: "🌆", minHour: 17, maxHour: 21 },
  { key: "night", label: "Night", range: "9PM - 12AM", icon: "🌙", minHour: 21, maxHour: 24 },
  { key: "anytime", label: "Anytime", range: "Any time", icon: "🎲", minHour: 0, maxHour: 24 },
];

const SURPRISE_TOPICS: { key: SurpriseTopic; label: string; icon: string; sections: Section[] }[] = [
  { key: "bills", label: "Bills", icon: "🧾", sections: ["electric", "gas", "wifi", "property"] },
  { key: "maintenance", label: "Maintenance", icon: "🛠️", sections: ["vehicles", "appliances", "property"] },
  { key: "alerts", label: "Alerts", icon: "🚨", sections: ["electric", "gas", "wifi", "property", "vehicles", "appliances"] },
  { key: "savings", label: "Savings", icon: "💸", sections: ["electric", "gas", "wifi", "property"] },
];

interface SmartNotification {
  id: string;
  section: Section;
  surpriseTopic?: SurpriseTopic;
  notificationType: NotificationType;
  frequency: Frequency;
  hour: number;
  minute: number;
  dayOfMonth?: number;
  dayOfWeek?: number;
  customIntervalValue?: number;
  customIntervalUnit?: IntervalUnit;
  surpriseTime?: SurpriseTime;
  enabled: boolean;
  customMessage?: string;
  templateData?: SmartNotificationData;
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
  customIntervalValue?: number;
  customIntervalUnit?: IntervalUnit;
  surpriseTime?: SurpriseTime;
  enabled: boolean;
}

const SECTIONS: { key: Section; label: string; icon: string; lastBillLabel: string }[] = [
  { key: "electric", label: "Electric Bills", icon: "⚡", lastBillLabel: "Last month's electricity bill" },
  { key: "gas", label: "Gas Bills", icon: "🔥", lastBillLabel: "Last month's gas bill" },
  { key: "wifi", label: "WiFi Bills", icon: "📶", lastBillLabel: "Last month's WiFi bill" },
  { key: "property", label: "Property Tax", icon: "🏠", lastBillLabel: "Last year's property tax" },
  { key: "vehicles", label: "Vehicles", icon: "🚗", lastBillLabel: "Vehicle expenses" },
  { key: "appliances", label: "Appliances", icon: "📺", lastBillLabel: "Appliance maintenance" },
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
  { key: "bimonthly", label: "Every 2 Months" },
  { key: "quarterly", label: "Every 3 Months" },
  { key: "biannual", label: "Every 6 Months" },
  { key: "surprise", label: "Surprise!" },
  { key: "custom", label: "Custom" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function NotificationManagementScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<"smart" | "custom" | "surprise">("smart");
  const [smartNotifications, setSmartNotifications] = useState<SmartNotification[]>([]);
  const [customNotifications, setCustomNotifications] = useState<CustomNotification[]>([]);
  const [showAddSmartForm, setShowAddSmartForm] = useState(false);
  const [showAddCustomForm, setShowAddCustomForm] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [editingSmartId, setEditingSmartId] = useState<string | null>(null);
  const [editingCustomId, setEditingCustomId] = useState<string | null>(null);
  const [backupNotif, setBackupNotif] = useState({
    vaultBackupEnabled: true,
    dataBackupEnabled: true,
  });

  const [smartSection, setSmartSection] = useState<Section>("electric");
  const [smartType, setSmartType] = useState<NotificationType>("bill_due");
  const [smartFrequency, setSmartFrequency] = useState<Frequency>("bimonthly");
  const [smartHour, setSmartHour] = useState(9);
  const [smartMinute, setSmartMinute] = useState(0);
  const [smartDayOfMonth, setSmartDayOfMonth] = useState(1);
  const [smartDayOfWeek, setSmartDayOfWeek] = useState(1);
  const [smartCustomInterval, setSmartCustomInterval] = useState(1);
  const [smartCustomUnit, setSmartCustomUnit] = useState<IntervalUnit>("months");
  const [smartSurpriseTime, setSmartSurpriseTime] = useState<SurpriseTime>("anytime");
  const [smartSurpriseTopic, setSmartSurpriseTopic] = useState<SurpriseTopic>("alerts");
  const [smartCustomMessage, setSmartCustomMessage] = useState("");

  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [customFrequency, setCustomFrequency] = useState<Frequency>("once");
  const [customHour, setCustomHour] = useState(9);
  const [customMinute, setCustomMinute] = useState(0);
  const [customDayOfMonth, setCustomDayOfMonth] = useState(1);
  const [customDayOfWeek, setCustomDayOfWeek] = useState(1);
  const [customCustomInterval, setCustomCustomInterval] = useState(1);
  const [customCustomUnit, setCustomCustomUnit] = useState<IntervalUnit>("months");
  const [customSurpriseTime, setCustomSurpriseTime] = useState<SurpriseTime>("anytime");

  useEffect(() => {
    checkPermissions();
    loadNotifications();
    loadBackupNotificationPrefs();
  }, []);

  const loadBackupNotificationPrefs = async () => {
    const settings = await loadBackupNotificationSettings();
    setBackupNotif(settings);
  };

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

  const toggleBackupNotification = async (type: "vault" | "data", value: boolean) => {
    const next = await setBackupNotificationEnabled(type, value);
    setBackupNotif(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

    const notificationData = await getSmartNotificationData(smartSection);
    const template = sectionTemplates.find(t => t.key === smartSection);
    const generatedMessage = generateSmartMessage(smartType, notificationData);
    const message = smartCustomMessage || generatedMessage;
    const icon = template?.icon || '📌';
    const title = `${typeLabel}: ${section.label}`;

    const newNotif: SmartNotification = {
      id: Date.now().toString(),
      section: smartSection,
      notificationType: smartType,
      frequency: smartFrequency,
      hour: smartHour,
      minute: smartMinute,
      dayOfMonth: smartFrequency === "bimonthly" || smartFrequency === "quarterly" || smartFrequency === "biannual" ? smartDayOfMonth : undefined,
      dayOfWeek: smartFrequency === "weekly" ? smartDayOfWeek : undefined,
      customIntervalValue: smartFrequency === "custom" ? smartCustomInterval : undefined,
      customIntervalUnit: smartFrequency === "custom" ? smartCustomUnit : undefined,
      surpriseTime: smartFrequency === "surprise" ? smartSurpriseTime : undefined,
      enabled: true,
      customMessage: smartCustomMessage || undefined,
      templateData: notificationData,
    };

    if (smartFrequency === "surprise") {
      await scheduleSurpriseNotification(title, message, smartSurpriseTime, "daily");
    } else {
      const trigger = getTrigger(smartFrequency, smartHour, smartMinute, smartDayOfMonth, smartDayOfWeek);
      await scheduleNotification(title, message, trigger);
    }

    const updated = [...smartNotifications, newNotif];
    await saveSmartNotifications(updated);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetSmartForm();
    setShowAddSmartForm(false);
    Alert.alert("Success", "Smart notification scheduled at random time!");
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
      dayOfMonth: customFrequency === "bimonthly" || customFrequency === "quarterly" || customFrequency === "biannual" ? customDayOfMonth : undefined,
      dayOfWeek: customFrequency === "weekly" ? customDayOfWeek : undefined,
      customIntervalValue: customFrequency === "custom" ? customCustomInterval : undefined,
      customIntervalUnit: customFrequency === "custom" ? customCustomUnit : undefined,
      surpriseTime: customFrequency === "surprise" ? customSurpriseTime : undefined,
      enabled: true,
    };

    if (customFrequency === "surprise") {
      await scheduleSurpriseNotification(newNotif.title, newNotif.message, customSurpriseTime, "daily");
    } else {
      const trigger = getTrigger(customFrequency, customHour, customMinute, customDayOfMonth, customDayOfWeek);
      await scheduleNotification(newNotif.title, newNotif.message, trigger);
    }

    const updated = [...customNotifications, newNotif];
    await saveCustomNotifications(updated);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetCustomForm();
    setShowAddCustomForm(false);
    Alert.alert("Success", "Surprise notification scheduled at random time!");
  };

  const getRandomTimeInRange = (surpriseTime: SurpriseTime) => {
    const timeConfig = SURPRISE_TIMES.find(t => t.key === surpriseTime) || SURPRISE_TIMES[4];
    const randomHour = Math.floor(Math.random() * (timeConfig.maxHour - timeConfig.minHour)) + timeConfig.minHour;
    const randomMinute = Math.floor(Math.random() * 60);
    return { hour: randomHour, minute: randomMinute };
  };

  const scheduleSurpriseNotification = async (title: string, message: string, surpriseTime: SurpriseTime, frequency: Frequency) => {
    try {
      const { hour, minute } = getRandomTimeInRange(surpriseTime);
      const trigger = getTrigger(frequency, hour, minute, 1, 0);
      await Notifications.scheduleNotificationAsync({
        content: { title, body: message, sound: true },
        trigger,
      });
    } catch (error) {
      console.error("Failed to schedule surprise notification:", error);
    }
  };

  const pickRandom = <T,>(items: T[]): T => items[Math.floor(Math.random() * items.length)];

  const buildTopicMessage = (topic: SurpriseTopic, data: SmartNotificationData, sectionLabel: string) => {
    const amountText = data.billAmount ? `₹${data.billAmount}` : "your latest amount";
    const monthText = data.billMonth || "this period";
    const dueText = data.dueDate || "soon";

    switch (topic) {
      case "bills":
        return pickRandom([
          `${sectionLabel}: ${amountText} is now ready for ${monthText}.`,
          `${sectionLabel} update for ${monthText} is available. Check before due date ${dueText}.`,
          `Quick bill check for ${sectionLabel}. Latest amount: ${amountText}.`,
        ]);
      case "maintenance":
        return pickRandom([
          `Maintenance check: review ${sectionLabel} status today.`,
          `${sectionLabel} upkeep reminder for ${monthText}.`,
          `Time for a quick health check of your ${sectionLabel.toLowerCase()}.`,
        ]);
      case "savings":
        return pickRandom([
          `Savings tip: compare your ${sectionLabel.toLowerCase()} spend with last cycle (${amountText}).`,
          `Track ${sectionLabel.toLowerCase()} costs this month to improve savings.`,
          `Optimization idea: review ${sectionLabel.toLowerCase()} usage and reduce extra spend.`,
        ]);
      case "alerts":
      default:
        return pickRandom([
          `${sectionLabel} attention: next important date is ${dueText}.`,
          `Heads up on ${sectionLabel.toLowerCase()}: review it now to stay on track.`,
          `${sectionLabel} alert for ${monthText}. Open and verify details.`,
        ]);
    }
  };

  const addSurpriseNotificationByTopic = async () => {
    const topicConfig = SURPRISE_TOPICS.find(t => t.key === smartSurpriseTopic) || SURPRISE_TOPICS[2];
    const randomSection = pickRandom(topicConfig.sections);
    const sectionLabel = SECTIONS.find(s => s.key === randomSection)?.label || "Updates";
    const notificationData = await getSmartNotificationData(randomSection);
    const typeLabel = NOTIFICATION_TYPES.find(t => t.key === smartType)?.label || "Alert";

    const randomTopicMessage = buildTopicMessage(smartSurpriseTopic, notificationData, sectionLabel);
    const message = smartCustomMessage.trim() || randomTopicMessage;
    const title = `${topicConfig.icon} ${topicConfig.label} ${typeLabel}`;

    const newNotif: SmartNotification = {
      id: Date.now().toString(),
      section: randomSection,
      surpriseTopic: smartSurpriseTopic,
      notificationType: smartType,
      frequency: "surprise",
      hour: smartHour,
      minute: smartMinute,
      surpriseTime: smartSurpriseTime,
      enabled: true,
      customMessage: message,
      templateData: notificationData,
    };

    await scheduleSurpriseNotification(title, message, smartSurpriseTime, "daily");

    const updated = [...smartNotifications, newNotif];
    await saveSmartNotifications(updated);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetSmartForm();
    setShowAddSmartForm(false);
    Alert.alert("Success", "Topic-based surprise notification scheduled at random time!");
  };

  const getTrigger = (freq: Frequency, hour: number, minute: number, dayOfMonth: number, dayOfWeek: number) => {
    switch (freq) {
      case "once":
        const date = new Date();
        date.setHours(hour, minute, 0, 0);
        if (date <= new Date()) date.setDate(date.getDate() + 1);
        return { type: "date", date } as any;
      case "daily":
        return { type: "daily", hour, minute } as any;
      case "weekly":
        return { type: "weekly", weekday: dayOfWeek + 1, hour, minute } as any;
      case "bimonthly":
      case "quarterly":
      case "biannual":
        return { type: "monthly", day: dayOfMonth, hour, minute } as any;
      case "custom":
        return { type: "daily", hour, minute } as any;
      default:
        const defaultDate = new Date();
        defaultDate.setHours(hour, minute, 0, 0);
        if (defaultDate <= new Date()) defaultDate.setDate(defaultDate.getDate() + 1);
        return { type: "date", date: defaultDate } as any;
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

  const startEditSmart = (n: SmartNotification) => {
    setEditingSmartId(n.id);
    setSmartSection(n.section);
    setSmartType(n.notificationType);
    setSmartFrequency(n.frequency);
    setSmartHour(n.hour);
    setSmartMinute(n.minute);
    setSmartDayOfMonth(n.dayOfMonth || 1);
    setSmartDayOfWeek(n.dayOfWeek || 1);
    setSmartCustomMessage(n.customMessage || "");
    setShowAddSmartForm(true);
  };

  const startEditCustom = (n: CustomNotification) => {
    setEditingCustomId(n.id);
    setCustomTitle(n.title);
    setCustomMessage(n.message);
    setCustomFrequency(n.frequency);
    setCustomHour(n.hour);
    setCustomMinute(n.minute);
    setCustomDayOfMonth(n.dayOfMonth || 1);
    setCustomDayOfWeek(n.dayOfWeek || 1);
    setShowAddCustomForm(true);
  };

  const updateSmartNotification = async () => {
    if (!editingSmartId) return;

    const section = SECTIONS.find(s => s.key === smartSection)!;
    const typeLabel = NOTIFICATION_TYPES.find(t => t.key === smartType)?.label || "Alert";
    const notificationData = await getSmartNotificationData(smartSection);
    const generatedMessage = generateSmartMessage(smartType, notificationData);
    const message = smartCustomMessage || generatedMessage;
    const title = `${typeLabel}: ${section.label}`;

    const updatedNotif: SmartNotification = {
      id: editingSmartId,
      section: smartSection,
      notificationType: smartType,
      frequency: smartFrequency,
      hour: smartHour,
      minute: smartMinute,
      dayOfMonth: smartFrequency === "bimonthly" || smartFrequency === "quarterly" || smartFrequency === "biannual" ? smartDayOfMonth : undefined,
      dayOfWeek: smartFrequency === "weekly" ? smartDayOfWeek : undefined,
      customIntervalValue: smartFrequency === "custom" ? smartCustomInterval : undefined,
      customIntervalUnit: smartFrequency === "custom" ? smartCustomUnit : undefined,
      enabled: smartNotifications.find(n => n.id === editingSmartId)?.enabled ?? true,
      customMessage: smartCustomMessage || undefined,
      templateData: notificationData,
    };

    const updated = smartNotifications.map(n => n.id === editingSmartId ? updatedNotif : n);
    await saveSmartNotifications(updated);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingSmartId(null);
    resetSmartForm();
    setShowAddSmartForm(false);
    Alert.alert("Success", "Notification updated!");
  };

  const updateCustomNotification = async () => {
    if (!editingCustomId || !customTitle.trim() || !customMessage.trim()) {
      Alert.alert("Error", "Please fill title and message");
      return;
    }

    const updatedNotif: CustomNotification = {
      id: editingCustomId,
      title: customTitle.trim(),
      message: customMessage.trim(),
      frequency: customFrequency,
      hour: customHour,
      minute: customMinute,
      dayOfMonth: customFrequency === "bimonthly" || customFrequency === "quarterly" || customFrequency === "biannual" ? customDayOfMonth : undefined,
      dayOfWeek: customFrequency === "weekly" ? customDayOfWeek : undefined,
      customIntervalValue: customFrequency === "custom" ? customCustomInterval : undefined,
      customIntervalUnit: customFrequency === "custom" ? customCustomUnit : undefined,
      enabled: customNotifications.find(n => n.id === editingCustomId)?.enabled ?? true,
    };

    const updated = customNotifications.map(n => n.id === editingCustomId ? updatedNotif : n);
    await saveCustomNotifications(updated);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditingCustomId(null);
    resetCustomForm();
    setShowAddCustomForm(false);
    Alert.alert("Success", "Notification updated!");
  };

  const resetSmartForm = () => {
    setSmartSection("electric");
    setSmartType("bill_due");
    setSmartFrequency("bimonthly");
    setSmartHour(9);
    setSmartMinute(0);
    setSmartDayOfMonth(1);
    setSmartDayOfWeek(1);
    setSmartCustomInterval(1);
    setSmartCustomUnit("months");
    setSmartSurpriseTime("anytime");
    setSmartSurpriseTopic("alerts");
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
    setCustomCustomInterval(1);
    setCustomCustomUnit("months");
    setCustomSurpriseTime("anytime");
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

    let notificationData: SmartNotificationData;
    if (n.templateData) {
      notificationData = n.templateData;
    } else {
      notificationData = await getSmartNotificationData(n.section);
    }

    const generatedMessage = generateSmartMessage(n.notificationType, notificationData);
    const message = n.customMessage || generatedMessage;
    const title = `${typeLabel}: ${sec.label}`;

    await Notifications.scheduleNotificationAsync({
      content: { title, body: message, sound: true },
      trigger: { type: "date", date: new Date(Date.now() + 5000) } as any,
    });
    Alert.alert("Test Sent!", `Testing: ${title}\n\n${message}\n\nCheck your notifications in 5 seconds.`);
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

  const activeSmartCount = smartNotifications.filter((n) => n.enabled && n.frequency !== "surprise").length;
  const activeCustomCount = customNotifications.filter((n) => n.enabled).length;
  const activeSurpriseCount = smartNotifications.filter((n) => n.enabled && n.frequency === "surprise").length;
  const totalActiveCount = activeSmartCount + activeCustomCount + activeSurpriseCount;

  const toggleAllNotifications = async (enabled: boolean) => {
    const nextSmart = smartNotifications.map((item) => ({ ...item, enabled }));
    const nextCustom = customNotifications.map((item) => ({ ...item, enabled }));
    await saveSmartNotifications(nextSmart);
    await saveCustomNotifications(nextCustom);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const clearDisabledNotifications = async () => {
    const nextSmart = smartNotifications.filter((item) => item.enabled);
    const nextCustom = customNotifications.filter((item) => item.enabled);
    await saveSmartNotifications(nextSmart);
    await saveCustomNotifications(nextCustom);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={28} color="#000000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "smart" && styles.tabActive]}
            onPress={() => setActiveTab("smart")}
          >
            <Settings2 size={16} color={activeTab === "smart" ? Colors.primary : "#8E8E93"} />
            <Text style={[styles.tabText, { color: activeTab === "smart" ? Colors.primary : "#8E8E93" }]}>Smart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "custom" && styles.tabActive]}
            onPress={() => setActiveTab("custom")}
          >
            <Bell size={16} color={activeTab === "custom" ? Colors.primary : "#8E8E93"} />
            <Text style={[styles.tabText, { color: activeTab === "custom" ? Colors.primary : "#8E8E93" }]}>Custom</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "surprise" && styles.tabActive]}
            onPress={() => setActiveTab("surprise")}
          >
            <Zap size={16} color={activeTab === "surprise" ? Colors.primary : "#8E8E93"} />
            <Text style={[styles.tabText, { color: activeTab === "surprise" ? Colors.primary : "#8E8E93" }]}>Surprise</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.testBtn} onPress={sendTest}>
          <Bell size={16} color="#FFF" />
          <Text style={styles.testBtnText}>Send Test</Text>
        </TouchableOpacity>

        <View style={styles.overviewCard}>
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewTitle}>Notification Overview</Text>
            <Text style={styles.overviewBadge}>{totalActiveCount} Active</Text>
          </View>
          <Text style={styles.overviewSub}>
            {permissionGranted ? "Device permission is enabled." : "Device permission is disabled."}
          </Text>

          <View style={styles.overviewStatsRow}>
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatValue}>{activeSmartCount}</Text>
              <Text style={styles.overviewStatLabel}>Smart</Text>
            </View>
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatValue}>{activeCustomCount}</Text>
              <Text style={styles.overviewStatLabel}>Custom</Text>
            </View>
            <View style={styles.overviewStatItem}>
              <Text style={styles.overviewStatValue}>{activeSurpriseCount}</Text>
              <Text style={styles.overviewStatLabel}>Surprise</Text>
            </View>
          </View>

          <View style={styles.bulkRow}>
            <TouchableOpacity style={styles.bulkBtn} onPress={() => toggleAllNotifications(true)}>
              <Text style={styles.bulkBtnText}>Enable All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkBtn} onPress={() => toggleAllNotifications(false)}>
              <Text style={styles.bulkBtnText}>Pause All</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.bulkBtnDanger} onPress={clearDisabledNotifications}>
              <Text style={styles.bulkBtnDangerText}>Clean Disabled</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.backupPrefsCard}>
          <Text style={styles.backupPrefsTitle}>Backup Notifications</Text>
          <Text style={styles.backupPrefsSub}>Control alerts from vault backups and full data backups.</Text>

          <View style={styles.backupNotifRow}>
            <View style={styles.backupNotifTextWrap}>
              <Text style={styles.backupNotifLabel}>Vault backup alerts</Text>
              <Text style={styles.backupNotifHint}>Success and failure updates from vault backup jobs</Text>
            </View>
            <Switch
              value={backupNotif.vaultBackupEnabled}
              onValueChange={(value) => toggleBackupNotification("vault", value)}
              trackColor={{ false: "#E5E5EA", true: "#34C759" }}
              thumbColor="#FFF"
            />
          </View>

          <View style={[styles.backupNotifRow, { borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.08)", paddingTop: 10 }]}> 
            <View style={styles.backupNotifTextWrap}>
              <Text style={styles.backupNotifLabel}>Data backup alerts</Text>
              <Text style={styles.backupNotifHint}>Notifications for scheduled and manual app-data backups</Text>
            </View>
            <Switch
              value={backupNotif.dataBackupEnabled}
              onValueChange={(value) => toggleBackupNotification("data", value)}
              trackColor={{ false: "#E5E5EA", true: "#34C759" }}
              thumbColor="#FFF"
            />
          </View>
        </View>

        {activeTab === "smart" && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddSmartForm(!showAddSmartForm)}>
              <View style={styles.addBtnContent}>
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add Smart Notification</Text>
              </View>
              <Text style={{ color: "#8E8E93" }}>{showAddSmartForm ? "−" : "+"}</Text>
            </TouchableOpacity>

            {showAddSmartForm && (
              <View style={styles.formCard}>
                <View style={styles.formHeaderRow}>
                  <Text style={styles.formTitle}>{editingSmartId ? "Edit" : "Add"} Smart Notification</Text>
                  {editingSmartId && (
                    <TouchableOpacity onPress={() => { setEditingSmartId(null); resetSmartForm(); setShowAddSmartForm(false); }} style={styles.closeFormBtn}>
                      <X size={20} color="#8E8E93" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.inputLabel}>Section</Text>
                <View style={styles.chipContainer}>
                  {SURPRISE_TOPICS.map(topic => (
                    <TouchableOpacity key={topic.key} style={[styles.chip, smartSurpriseTopic === topic.key && styles.chipSelected]} onPress={() => setSmartSurpriseTopic(topic.key)}>
                      <Text style={{ fontSize: 14 }}>{topic.icon}</Text>
                      <Text style={[styles.chipText, { color: smartSurpriseTopic === topic.key ? "#FFF" : "#000000" }]}>{topic.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Notification Type</Text>
                <View style={styles.chipContainer}>
                  {NOTIFICATION_TYPES.map(t => (
                    <TouchableOpacity key={t.key} style={[styles.chip, smartType === t.key && styles.chipSelected]} onPress={() => setSmartType(t.key as NotificationType)}>
                      {t.icon}
                      <Text style={[styles.chipText, { color: smartType === t.key ? "#FFF" : "#000000" }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.chipContainer}>
                  {FREQUENCIES.map(f => (
                    <TouchableOpacity key={f.key} style={[styles.chip, smartFrequency === f.key && styles.chipSelected]} onPress={() => setSmartFrequency(f.key as Frequency)}>
                      <Text style={[styles.chipText, { color: smartFrequency === f.key ? "#FFF" : "#000000" }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Time</Text>
                <TimePickerButton
                  label=""
                  value={new Date(2024, 0, 1, smartHour, smartMinute)}
                  onChange={(date) => {
                    setSmartHour(date.getHours());
                    setSmartMinute(date.getMinutes());
                  }}
                />

                {smartFrequency === "weekly" && (
                  <>
                    <Text style={styles.inputLabel}>Day</Text>
                    <View style={styles.weekRow}>
                      {WEEKDAYS.map((day, i) => (
                        <TouchableOpacity key={day} style={[styles.dayChip, smartDayOfWeek === i && styles.dayChipSelected]} onPress={() => setSmartDayOfWeek(i)}>
                          <Text style={[styles.dayText, { color: smartDayOfWeek === i ? "#FFF" : "#000000" }]}>{day}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {(smartFrequency === "bimonthly" || smartFrequency === "quarterly" || smartFrequency === "biannual") && (
                  <>
                    <Text style={styles.inputLabel}>Day of Month</Text>
                    <DayPicker
                      label=""
                      value={smartDayOfMonth}
                      maxValue={28}
                      onChange={setSmartDayOfMonth}
                    />
                  </>
                )}

                {smartFrequency === "custom" && (
                  <>
                    <Text style={styles.inputLabel}>Repeat Every</Text>
                    <DayPicker
                      label=""
                      value={smartCustomInterval}
                      maxValue={12}
                      onChange={setSmartCustomInterval}
                    />
                    <View style={styles.unitSelector}>
                      {["days", "weeks", "months"].map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[styles.unitChip, smartCustomUnit === unit && styles.unitChipSelected]}
                          onPress={() => setSmartCustomUnit(unit as IntervalUnit)}
                        >
                          <Text style={[styles.unitChipText, smartCustomUnit === unit && styles.unitChipTextSelected]}>
                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {smartFrequency === "surprise" && (
                  <>
                    <DayPicker
                      label=""
                      value={customCustomInterval}
                      maxValue={12}
                      onChange={setCustomCustomInterval}
                    />
                    <View style={styles.unitSelector}>
                      {["days", "weeks", "months"].map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[styles.unitChip, customCustomUnit === unit && styles.unitChipSelected]}
                          onPress={() => setCustomCustomUnit(unit as IntervalUnit)}
                        >
                          <Text style={[styles.unitChipText, customCustomUnit === unit && styles.unitChipTextSelected]}>
                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {customFrequency === "surprise" && (
                  <>
                    <Text style={styles.inputLabel}>Surprise Time Range</Text>
                    <Text style={styles.inputHint}>Notification will be sent at a random time within your selected range</Text>
                    <View style={styles.surpriseContainer}>
                      {SURPRISE_TIMES.map((time) => (
                        <TouchableOpacity
                          key={time.key}
                          style={[styles.surpriseChip, customSurpriseTime === time.key && styles.surpriseChipSelected]}
                          onPress={() => setCustomSurpriseTime(time.key as SurpriseTime)}
                        >
                          <Text style={styles.surpriseIcon}>{time.icon}</Text>
                          <Text style={[styles.surpriseLabel, customSurpriseTime === time.key && styles.surpriseLabelSelected]}>
                            {time.label}
                          </Text>
                          <Text style={[styles.surpriseRange, customSurpriseTime === time.key && styles.surpriseRangeSelected]}>
                            {time.range}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingSmartId(null); resetSmartForm(); setShowAddSmartForm(false); }}>
                    <Text style={{ color: "#000000" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={editingSmartId ? updateSmartNotification : addSmartNotification}>
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>{editingSmartId ? "Update" : "Save"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>SMART NOTIFICATIONS ({smartNotifications.length})</Text>

            {smartNotifications.length === 0 ? (
              <View style={styles.emptyCard}>
                <Settings2 size={40} color="#C7C7CC" />
                <Text style={styles.emptyText}>No smart notifications</Text>
              </View>
            ) : smartNotifications.map(n => {
              const sec = SECTIONS.find(s => s.key === n.section)!;
              const type = NOTIFICATION_TYPES.find(t => t.key === n.notificationType)!;
              const template = sectionTemplates.find(t => t.key === n.section);
              const icon = template?.icon || '📌';

              const displayMessage = n.templateData?.message || n.customMessage || sec.lastBillLabel;
              const displayAmount = n.templateData?.billAmount;
              const displayMonth = n.templateData?.billMonth;

              return (
                <View key={n.id} style={styles.notifCard}>
                  <View style={styles.notifHeader}>
                    <View style={styles.notifInfo}>
                      <View style={styles.iconCircle}>
                        <Text style={{ fontSize: 18 }}>{icon}</Text>
                      </View>
                      <View style={styles.notifTextContainer}>
                        <Text style={styles.notifTitle} numberOfLines={1}>{type.label}: {sec.label}</Text>
                        <Text style={styles.notifSub} numberOfLines={2}>{displayMessage}</Text>
                        {displayAmount && (
                          <Text style={styles.notifAmount}>₹{displayAmount} {displayMonth && `(${displayMonth})`}</Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.actionBtns}>
                      <TouchableOpacity style={styles.editBtnSmall} onPress={() => startEditSmart(n)}>
                        <Edit2 size={16} color={Colors.primary} />
                      </TouchableOpacity>
                      <Switch value={n.enabled} onValueChange={() => toggleSmart(n.id)} trackColor={{ false: "#E5E5EA", true: "#34C759" }} thumbColor="#FFF" />
                      <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => deleteSmart(n.id)}>
                        <Trash2 size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.notifMeta}>
                    <View style={styles.tag}><Repeat size={12} color="#8E8E93" /><Text style={styles.tagText}>{FREQUENCIES.find(f => f.key === n.frequency)?.label}</Text></View>
                    <View style={styles.tag}><Clock size={12} color="#8E8E93" /><Text style={styles.tagText}>{formatTime(n.hour, n.minute)}</Text></View>
                    <TouchableOpacity style={styles.testTag} onPress={() => sendTestForSmart(n)}>
                      <Play size={10} color="#FFF" fill="#FFF" /><Text style={styles.testTagText}>Test</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </>
        )}

        {activeTab === "custom" && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddCustomForm(!showAddCustomForm)}>
              <View style={styles.addBtnContent}>
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add Custom Notification</Text>
              </View>
              <Text style={{ color: "#8E8E93" }}>{showAddCustomForm ? "−" : "+"}</Text>
            </TouchableOpacity>

            {showAddCustomForm && (
              <View style={styles.formCard}>
                <View style={styles.formHeaderRow}>
                  <Text style={styles.formTitle}>{editingCustomId ? "Edit" : "Add"} Custom Notification</Text>
                  {editingCustomId && (
                    <TouchableOpacity onPress={() => { setEditingCustomId(null); resetCustomForm(); setShowAddCustomForm(false); }} style={styles.closeFormBtn}>
                      <X size={20} color="#8E8E93" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.inputLabel}>Title</Text>
                <TextInput style={styles.input} value={customTitle} onChangeText={setCustomTitle} placeholder="Notification title" placeholderTextColor="#C7C7CC" />

                <Text style={styles.inputLabel}>Message</Text>
                <TextInput style={[styles.input, styles.textArea]} value={customMessage} onChangeText={setCustomMessage} placeholder="Your custom message..." placeholderTextColor="#C7C7CC" multiline numberOfLines={3} />

                <Text style={styles.inputLabel}>Frequency</Text>
                <View style={styles.chipContainer}>
                  {FREQUENCIES.map(f => (
                    <TouchableOpacity key={f.key} style={[styles.chip, customFrequency === f.key && styles.chipSelected]} onPress={() => setCustomFrequency(f.key as Frequency)}>
                      <Text style={[styles.chipText, { color: customFrequency === f.key ? "#FFF" : "#000000" }]}>{f.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Time</Text>
                <TimePickerButton
                  label=""
                  value={new Date(2024, 0, 1, customHour, customMinute)}
                  onChange={(date) => {
                    setCustomHour(date.getHours());
                    setCustomMinute(date.getMinutes());
                  }}
                />

                {customFrequency === "weekly" && (
                  <>
                    <Text style={styles.inputLabel}>Day</Text>
                    <View style={styles.weekRow}>
                      {WEEKDAYS.map((day, i) => (
                        <TouchableOpacity key={day} style={[styles.dayChip, customDayOfWeek === i && styles.dayChipSelected]} onPress={() => setCustomDayOfWeek(i)}>
                          <Text style={[styles.dayText, { color: customDayOfWeek === i ? "#FFF" : "#000000" }]}>{day}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {(customFrequency === "bimonthly" || customFrequency === "quarterly" || customFrequency === "biannual") && (
                  <>
                    <Text style={styles.inputLabel}>Day of Month</Text>
                    <DayPicker
                      label=""
                      value={customDayOfMonth}
                      maxValue={28}
                      onChange={setCustomDayOfMonth}
                    />
                  </>
                )}

                {customFrequency === "custom" && (
                  <>
                    <Text style={styles.inputLabel}>Repeat Every</Text>
                    <DayPicker
                      label=""
                      value={customCustomInterval}
                      maxValue={12}
                      onChange={setCustomCustomInterval}
                    />
                    <View style={styles.unitSelector}>
                      {["days", "weeks", "months"].map((unit) => (
                        <TouchableOpacity
                          key={unit}
                          style={[styles.unitChip, customCustomUnit === unit && styles.unitChipSelected]}
                          onPress={() => setCustomCustomUnit(unit as IntervalUnit)}
                        >
                          <Text style={[styles.unitChipText, customCustomUnit === unit && styles.unitChipTextSelected]}>
                            {unit.charAt(0).toUpperCase() + unit.slice(1)}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setEditingCustomId(null); resetCustomForm(); setShowAddCustomForm(false); }}>
                    <Text style={{ color: "#000000" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={editingCustomId ? updateCustomNotification : addCustomNotification}>
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>{editingCustomId ? "Update" : "Save"}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>CUSTOM NOTIFICATIONS ({customNotifications.length})</Text>

            {customNotifications.length === 0 ? (
              <View style={styles.emptyCard}>
                <Bell size={40} color="#C7C7CC" />
                <Text style={styles.emptyText}>No custom notifications</Text>
              </View>
            ) : customNotifications.map(n => (
              <View key={n.id} style={styles.notifCard}>
                <View style={styles.notifHeader}>
                  <View style={styles.notifInfo}>
                    <View style={styles.iconCircle}><Bell size={18} color={Colors.primary} /></View>
                    <View style={styles.notifTextContainer}>
                      <Text style={styles.notifTitle} numberOfLines={1}>{n.title}</Text>
                      <Text style={styles.notifSub} numberOfLines={2}>{n.message}</Text>
                    </View>
                  </View>
                  <View style={styles.actionBtns}>
                    <TouchableOpacity style={styles.editBtnSmall} onPress={() => startEditCustom(n)}>
                      <Edit2 size={16} color={Colors.primary} />
                    </TouchableOpacity>
                    <Switch value={n.enabled} onValueChange={() => toggleCustom(n.id)} trackColor={{ false: "#E5E5EA", true: "#34C759" }} thumbColor="#FFF" />
                    <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => deleteCustom(n.id)}>
                      <Trash2 size={16} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.notifMeta}>
                  <View style={styles.tag}><Repeat size={12} color="#8E8E93" /><Text style={styles.tagText}>{FREQUENCIES.find(f => f.key === n.frequency)?.label}</Text></View>
                  <View style={styles.tag}><Clock size={12} color="#8E8E93" /><Text style={styles.tagText}>{formatTime(n.hour, n.minute)}</Text></View>
                  <TouchableOpacity style={styles.testTag} onPress={() => sendTestForCustom(n)}>
                    <Play size={10} color="#FFF" fill="#FFF" /><Text style={styles.testTagText}>Test</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </>
        )}

        {activeTab === "surprise" && (
          <>
            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddSmartForm(!showAddSmartForm)}>
              <View style={styles.addBtnContent}>
                <Zap size={20} color={Colors.primary} />
                <Text style={styles.addBtnText}>Add Surprise Notification</Text>
              </View>
              <Text style={{ color: "#8E8E93" }}>{showAddSmartForm ? "−" : "+"}</Text>
            </TouchableOpacity>

            {showAddSmartForm && (
              <View style={styles.formCard}>
                <View style={styles.formHeaderRow}>
                  <Text style={styles.formTitle}>Add Surprise Notification</Text>
                </View>

                <Text style={styles.inputLabel}>Section</Text>
                <View style={styles.chipContainer}>
                  {SECTIONS.map(s => (
                    <TouchableOpacity key={s.key} style={[styles.chip, smartSection === s.key && styles.chipSelected]} onPress={() => setSmartSection(s.key)}>
                      <Text style={{ fontSize: 14 }}>{s.icon}</Text>
                      <Text style={[styles.chipText, { color: smartSection === s.key ? "#FFF" : "#000000" }]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Notification Type</Text>
                <View style={styles.chipContainer}>
                  {NOTIFICATION_TYPES.map(t => (
                    <TouchableOpacity key={t.key} style={[styles.chip, smartType === t.key && styles.chipSelected]} onPress={() => setSmartType(t.key as NotificationType)}>
                      {t.icon}
                      <Text style={[styles.chipText, { color: smartType === t.key ? "#FFF" : "#000000" }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Surprise Time Range</Text>
                <Text style={styles.inputHint}>Notification will be sent at a random time within your selected range</Text>
                <View style={styles.surpriseContainer}>
                  {SURPRISE_TIMES.map((time) => (
                    <TouchableOpacity
                      key={time.key}
                      style={[styles.surpriseChip, smartSurpriseTime === time.key && styles.surpriseChipSelected]}
                      onPress={() => setSmartSurpriseTime(time.key as SurpriseTime)}
                    >
                      <Text style={styles.surpriseIcon}>{time.icon}</Text>
                      <Text style={[styles.surpriseLabel, smartSurpriseTime === time.key && styles.surpriseLabelSelected]}>
                        {time.label}
                      </Text>
                      <Text style={[styles.surpriseRange, smartSurpriseTime === time.key && styles.surpriseRangeSelected]}>
                        {time.range}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.inputLabel}>Custom Message (optional)</Text>
                <TextInput style={styles.input} value={smartCustomMessage} onChangeText={setSmartCustomMessage} placeholder="Custom reminder text..." placeholderTextColor="#C7C7CC" />

                <View style={styles.formActions}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={() => { setShowAddSmartForm(false); resetSmartForm(); }}>
                    <Text style={{ color: "#000000" }}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.saveBtn} onPress={addSurpriseNotificationByTopic}>
                    <Text style={{ color: "#FFF", fontWeight: "600" }}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <Text style={styles.sectionTitle}>SURPRISE NOTIFICATIONS</Text>

            {smartNotifications.filter(n => n.frequency === "surprise").length === 0 ? (
              <View style={styles.emptyCard}>
                <Zap size={40} color="#C7C7CC" />
                <Text style={styles.emptyText}>No surprise notifications</Text>
              </View>
            ) : smartNotifications.filter(n => n.frequency === "surprise").map(n => {
              const sec = SECTIONS.find(s => s.key === n.section)!;
              const type = NOTIFICATION_TYPES.find(t => t.key === n.notificationType)!;
              const topic = SURPRISE_TOPICS.find(t => t.key === n.surpriseTopic);
              const surpriseConfig = SURPRISE_TIMES.find(t => t.key === n.surpriseTime) || SURPRISE_TIMES[4];
              const displayMessage = n.customMessage || sec.lastBillLabel;

              return (
                <View key={n.id} style={styles.notifCard}>
                  <View style={styles.notifHeader}>
                    <View style={styles.notifInfo}>
                      <View style={styles.iconCircle}>
                        <Text style={{ fontSize: 18 }}>{surpriseConfig.icon}</Text>
                      </View>
                      <View style={styles.notifTextContainer}>
                        <Text style={styles.notifTitle} numberOfLines={1}>{topic ? `${topic.icon} ${topic.label}` : `${type.label}: ${sec.label}`}</Text>
                        <Text style={styles.notifSub} numberOfLines={2}>{displayMessage}</Text>
                        <View style={[styles.tag, { marginTop: 4 }]}>
                          <Text style={styles.tagText}>{(topic ? `${topic.label} • ` : "") + `${surpriseConfig.label} (${surpriseConfig.range})`}</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.actionBtns}>
                      <Switch value={n.enabled} onValueChange={() => toggleSmart(n.id)} trackColor={{ false: "#E5E5EA", true: "#34C759" }} thumbColor="#FFF" />
                      <TouchableOpacity style={styles.deleteBtnSmall} onPress={() => deleteSmart(n.id)}>
                        <Trash2 size={16} color="#FF3B30" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F2F2F7" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, backgroundColor: "#FFFFFF", borderBottomWidth: 0.5, borderBottomColor: "rgba(0,0,0,0.1)" },
  backBtn: { width: 44, height: 44, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#000000" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, gap: 12 },
  tabContainer: { flexDirection: "row", borderRadius: 12, padding: 4, backgroundColor: "#E8E8ED" },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10 },
  tabActive: { backgroundColor: "#FFFFFF" },
  tabText: { fontSize: 14, fontWeight: "600" },
  testBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 12, backgroundColor: Colors.primary },
  testBtnText: { color: "#FFF", fontSize: 14, fontWeight: "600" },
  overviewCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, gap: 10 },
  overviewHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  overviewTitle: { fontSize: 15, fontWeight: "700", color: "#000000" },
  overviewBadge: { fontSize: 12, fontWeight: "700", color: Colors.primary, backgroundColor: "rgba(124,58,237,0.1)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  overviewSub: { fontSize: 12, color: "#6B7280" },
  overviewStatsRow: { flexDirection: "row", gap: 8 },
  overviewStatItem: { flex: 1, borderRadius: 10, backgroundColor: "#F8FAFC", alignItems: "center", paddingVertical: 10 },
  overviewStatValue: { fontSize: 18, fontWeight: "800", color: "#111827" },
  overviewStatLabel: { fontSize: 11, fontWeight: "600", color: "#6B7280", marginTop: 2 },
  bulkRow: { flexDirection: "row", gap: 8 },
  bulkBtn: { flex: 1, borderRadius: 10, backgroundColor: "#EEF2FF", alignItems: "center", justifyContent: "center", paddingVertical: 9 },
  bulkBtnText: { fontSize: 12, fontWeight: "700", color: "#3730A3" },
  bulkBtnDanger: { flex: 1, borderRadius: 10, backgroundColor: "#FEF2F2", alignItems: "center", justifyContent: "center", paddingVertical: 9 },
  bulkBtnDangerText: { fontSize: 12, fontWeight: "700", color: "#B91C1C" },
  backupPrefsCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 14, gap: 8 },
  backupPrefsTitle: { fontSize: 15, fontWeight: "700", color: "#000000" },
  backupPrefsSub: { fontSize: 12, color: "#8E8E93", marginBottom: 4 },
  backupNotifRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  backupNotifTextWrap: { flex: 1 },
  backupNotifLabel: { fontSize: 13, fontWeight: "600", color: "#000000" },
  backupNotifHint: { fontSize: 11, color: "#8E8E93", marginTop: 2 },
  addBtn: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, borderRadius: 12, backgroundColor: "#FFFFFF" },
  addBtnContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  addBtnText: { fontSize: 15, fontWeight: "600", color: Colors.primary },
  formCard: { backgroundColor: "#FFFFFF", borderRadius: 12, padding: 16, gap: 12 },
  formHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  closeFormBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  formTitle: { fontSize: 16, fontWeight: "700", color: "#000000" },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#8E8E93" },
  input: { backgroundColor: "#F5F5F5", borderRadius: 10, padding: 12, fontSize: 14, color: "#000000", borderWidth: 1, borderColor: "#E5E5EA" },
  textArea: { minHeight: 80, textAlignVertical: "top" },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F5F5F5" },
  chipSelected: { backgroundColor: Colors.primary },
  chipText: { fontSize: 12, fontWeight: "500" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  timeSep: { fontSize: 24, fontWeight: "bold", color: "#000000" },
  timeDisplay: { alignItems: "center", paddingVertical: 8 },
  timeText: { fontSize: 36, fontWeight: "700", color: Colors.primary },
  timeInput: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12, padding: 12, borderRadius: 10, backgroundColor: "#F5F5F5" },
  stepBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.primary, justifyContent: "center", alignItems: "center" },
  timeValue: { fontSize: 24, fontWeight: "700", color: "#000000", minWidth: 40, textAlign: "center" },
  weekRow: { flexDirection: "row", justifyContent: "space-between" },
  dayChip: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F5F5" },
  dayChipSelected: { backgroundColor: Colors.primary },
  dayText: { fontSize: 11, fontWeight: "600" },
  dayRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  dayValue: { fontSize: 18, fontWeight: "700", color: "#000000", backgroundColor: "#F5F5F5", paddingHorizontal: 20, paddingVertical: 8, borderRadius: 10, minWidth: 60, textAlign: "center" },
  customIntervalRow: { flexDirection: "column", gap: 12 },
  customIntervalInput: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16 },
  unitSelector: { flexDirection: "row", justifyContent: "center", gap: 8 },
  unitChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: "#F5F5F5" },
  unitChipSelected: { backgroundColor: Colors.primary },
  unitChipText: { fontSize: 14, fontWeight: "500", color: "#000000" },
  unitChipTextSelected: { color: "#FFFFFF" },
  inputHint: { fontSize: 12, color: "#8E8E93", marginBottom: 8, textAlign: "center" },
  surpriseContainer: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10 },
  surpriseChip: { 
    alignItems: "center", 
    padding: 12, 
    borderRadius: 12, 
    backgroundColor: "#F5F5F5",
    minWidth: 100,
    borderWidth: 2,
    borderColor: "transparent",
  },
  surpriseChipSelected: { 
    backgroundColor: "rgba(124,58,237,0.1)",
    borderColor: Colors.primary,
  },
  surpriseIcon: { fontSize: 24, marginBottom: 4 },
  surpriseLabel: { fontSize: 12, fontWeight: "600", color: "#000000" },
  surpriseLabelSelected: { color: Colors.primary },
  surpriseRange: { fontSize: 10, color: "#8E8E93", marginTop: 2 },
  surpriseRangeSelected: { color: Colors.primary },
  formActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: "#F5F5F5" },
  saveBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: "center", backgroundColor: Colors.primary },
  sectionTitle: { fontSize: 12, fontWeight: "600", letterSpacing: 0.8, marginTop: 8, color: "#8E8E93" },
  emptyCard: { alignItems: "center", padding: 32, borderRadius: 12, backgroundColor: "#FFFFFF" },
  emptyText: { fontSize: 14, marginTop: 8, color: "#8E8E93" },
  notifCard: { borderRadius: 12, padding: 14, marginBottom: 10, backgroundColor: "#FFFFFF" },
  notifHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  notifInfo: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  notifTextContainer: { flex: 1, flexShrink: 1, marginRight: 8 },
  iconCircle: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginRight: 12, backgroundColor: "rgba(124,58,237,0.1)" },
  notifTitle: { fontSize: 14, fontWeight: "600", marginBottom: 2, color: "#000000" },
  notifSub: { fontSize: 12, color: "#8E8E93" },
  notifAmount: { fontSize: 13, fontWeight: "700", marginTop: 2, color: Colors.primary },
  notifMeta: { flexDirection: "row", gap: 8, paddingTop: 10, borderTopWidth: 0.5, borderTopColor: "rgba(0,0,0,0.06)", marginTop: 10, alignItems: "center" },
  tag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: "#F5F5F5" },
  tagText: { fontSize: 11, fontWeight: "500", color: "#666" },
  testTag: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, marginLeft: "auto", backgroundColor: Colors.primary },
  testTagText: { fontSize: 10, fontWeight: "600", color: "#FFF" },
  actionBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  actionBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: "center", alignItems: "center" },
  deleteBtn: { position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(239,68,68,0.1)", justifyContent: "center", alignItems: "center" },
  deleteBtnSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(239,68,68,0.1)", justifyContent: "center", alignItems: "center" },
  editBtnSmall: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(124,58,237,0.1)", justifyContent: "center", alignItems: "center" },
});
