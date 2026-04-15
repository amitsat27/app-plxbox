/**
 * Vehicle Detail Screen — premium detail view with parallax hero, tabs, compliance tracking
 */

import { firebaseService } from "@/src/services/FirebaseService";
import type { ServiceRecord, Vehicle } from "@/src/types";
import { Colors } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import {
  Calendar,
  ChevronLeft,
  Edit3,
  FileText,
  Gauge,
  Info,
  Shield,
  Trash2,
  Wrench,
  ExternalLink,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import ComplianceEditModal from "./components/ComplianceEditModal";
import ServiceHistoryList from "./components/ServiceHistoryList";
import ServiceRecordModal from "./components/ServiceRecordModal";
import StatusBadge from "./components/StatusBadge";
import VehicleImageHeader from "./components/VehicleImageHeader";
import {
  formatExpiryDate,
  getExpiryColor
} from "./utils/compliance";
import { formatOdometer } from "./utils/formatNumbers";
import { FUEL_EMOJI_MAP } from "./utils/vehicleImages";

type ComplianceEditTarget = "insurance" | "puc" | "registration" | "service";

const safeToIso = (dateValue: Date | string | undefined): string => {
  if (!dateValue) return '';
  if (dateValue instanceof Date) {
    return isNaN(dateValue.getTime()) ? '' : dateValue.toISOString();
  }
  const d = new Date(dateValue);
  return isNaN(d.getTime()) ? '' : d.toISOString();
};

const COMPLIANCE_FIELD_MAP: Record<ComplianceEditTarget, keyof Vehicle> = {
  insurance: "insuranceExpiry",
  puc: "pucExpiry",
  registration: "registrationExpiry",
  service: "nextServiceDue",
};

const COMPLIANCE_LABEL_MAP: Record<ComplianceEditTarget, string> = {
  insurance: "Insurance Expiry",
  puc: "PUC Expiry",
  registration: "Registration Expiry",
  service: "Next Service Due",
};

export default function VehicleDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const vehicleJson = params.vehicle
    ? decodeURIComponent(params.vehicle as string)
    : null;
  const [vehicle, setVehicle] = useState<Vehicle | null>(
    vehicleJson ? JSON.parse(vehicleJson) : null,
  );
  const [activeTab, setActiveTab] = useState<
    "overview" | "compliance" | "specs"
  >("overview");
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  // Compliance edit
  const [editTarget, setEditTarget] = useState<ComplianceEditTarget | null>(
    null,
  );
  const [editDate, setEditDate] = useState(new Date());
  const [uploadingCompliance, setUploadingCompliance] = useState<ComplianceEditTarget | null>(null);

  // Service records
  const [serviceRecords, setServiceRecords] = useState<ServiceRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  // Service record modal
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [editingServiceRecord, setEditingServiceRecord] =
    useState<ServiceRecord | null>(null);

  useEffect(() => {
    if (vehicle?.id) {
      setLoadingRecords(true);
      const cleanup = firebaseService.getVehicleServiceHistory(
        vehicle.id,
        (records) => {
          setServiceRecords(records);
          setLoadingRecords(false);
        },
      );
      return cleanup;
    }
  }, [vehicle?.id]);

  const scrollY = useSharedValue(0);
  const tabFade = useSharedValue(1);
  const tabSlideY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
  }));
  const headerTextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [0, 1], Extrapolation.CLAMP),
  }));
  const tabAnimatedStyle = useAnimatedStyle(() => ({
    opacity: tabFade.value,
    transform: [{ translateY: tabSlideY.value }],
  }));

  if (!vehicle) {
    return (
      <View
        style={[
          styles.center,
          { backgroundColor: isDark ? "#050510" : "#F8FAFC" },
        ]}
      >
        <ActivityIndicator size="large" color={Colors.warning} />
      </View>
    );
  }

  const accentColor = getVehicleAccentColor(vehicle.type);
  const dividerColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)";
  const rowBorder = isDark ? "#2C2C2E" : "#F2F2F7";

  // ── Action Handlers ──

  const handleComplianceEdit = (target: ComplianceEditTarget) => {
    Haptics.selectionAsync();
    const dateMap: Record<ComplianceEditTarget, Date | undefined> = {
      insurance: vehicle.insuranceExpiry,
      puc: vehicle.pucExpiry,
      registration: vehicle.registrationExpiry,
      service: vehicle.nextServiceDue,
    };
    setEditTarget(target);
    setEditDate(dateMap[target] || new Date());
  };

  const handleSaveCompliance = async () => {
    if (!editTarget || !vehicle) return;
    try {
      const key = COMPLIANCE_FIELD_MAP[editTarget];
      await firebaseService.updateVehicle(vehicle.id, {
        [key]: editDate,
      } as any);
      setVehicle((prev) => {
        if (!prev) return prev;
        const updated: Partial<Vehicle> = { ...prev };
        if (editTarget === "service") {
          updated.lastServiceDate = editDate;
          updated.nextServiceDue = editDate;
        } else if (editTarget === "insurance") {
          updated.insuranceExpiry = editDate;
        } else if (editTarget === "puc") {
          updated.pucExpiry = editDate;
        } else if (editTarget === "registration") {
          updated.registrationExpiry = editDate;
        }
        return updated as Vehicle;
      });
      setEditTarget(null);
    } catch (e: any) {
      Alert.alert("Error", e.message || "Failed to update");
    }
  };

  const handleComplianceDocumentUpload = async (target: ComplianceEditTarget, uri: string) => {
    if (!vehicle) return;
    const docMap: Record<ComplianceEditTarget, string> = {
      insurance: 'insurance',
      puc: 'puc',
      registration: 'insurance',  // Reuse insurance doc type for registration
      service: 'service',
    };
    const docType = docMap[target];
    try {
      setUploadingCompliance(target);
      const url = await firebaseService.uploadComplianceDocument(vehicle.userId, vehicle.id, docType as any, uri);
      // Update vehicle state in Firebase
      const urlKey = target === 'insurance' ? 'insuranceDocumentUrl' : target === 'puc' ? 'pucDocumentUrl' : target === 'registration' ? 'registrationDocumentUrl' : 'serviceDocumentUrl';
      await firebaseService.updateVehicle(vehicle.id, { [urlKey]: url } as any);
      // Update local vehicle state
      setVehicle(prev => {
        if (!prev) return prev;
        const updated: Partial<Vehicle> = { ...prev };
        (updated as any)[urlKey] = url;
        return updated as Vehicle;
      });
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to upload document');
    } finally {
      setUploadingCompliance(null);
    }
  };

  const handleViewDocument = async (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await (await import('expo-web-browser')).openBrowserAsync(url, {
      presentationStyle: Platform.OS === 'ios' ? (await import('expo-web-browser')).WebBrowserPresentationStyle.PAGE_SHEET : (await import('expo-web-browser')).WebBrowserPresentationStyle.FULL_SCREEN,
    });
  };

  const handleSaveServiceRecord = async (data: Record<string, any>) => {
    if (!vehicle) return;
    // Upload receipt image if provided
    let receiptUrl = undefined;
    if (data.receiptUri && vehicle) {
      try {
        receiptUrl = await firebaseService.uploadVehicleImage(data.receiptUri, vehicle.id);
      } catch (e) {
        console.error('Failed to upload receipt:', e);
      }
    }
    const payload = {
      vehicleId: vehicle.id,
      serviceDate: data.serviceDate || new Date(),
      receiptUrl,
      ...data,
    } as any;
    delete payload.receiptUri; // Remove local URI, use receiptUrl instead
    if (editingServiceRecord) {
      await firebaseService.updateServiceRecord(
        editingServiceRecord.id,
        payload,
      );
      setServiceRecords((prev) =>
        prev.map((r) =>
          r.id === editingServiceRecord.id ? { ...r, ...payload } : r,
        ),
      );
    } else {
      const newRecordId = await firebaseService.addVehicleServiceRecord(vehicle.id, payload);
      if (newRecordId) {
        setServiceRecords((prev) => [{ id: newRecordId, ...payload, createdAt: new Date() }, ...prev]);
      }
      // Update vehicle's lastServiceDate and nextServiceDue
      await firebaseService.updateVehicle(vehicle.id, {
        lastServiceDate: payload.serviceDate,
        nextServiceDue: payload.nextServiceDue || payload.serviceDate,
      });
      setVehicle((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lastServiceDate: payload.serviceDate,
          nextServiceDue: payload.nextServiceDue || payload.serviceDate,
        } as Vehicle;
      });
    }
  };

  const handleDeleteServiceRecord = (record: ServiceRecord) => {
    Alert.alert("Delete Service Record", "Delete this record?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await firebaseService.deleteServiceRecord(record.id);
            setServiceRecords((prev) => prev.filter((r) => r.id !== record.id));
          } catch (e: any) {
            Alert.alert("Error", e.message);
          }
        },
      },
    ]);
  };

  const switchTab = (tab: typeof activeTab) => {
    Haptics.selectionAsync();
    setActiveTab(tab);
    tabFade.value = 0;
    tabSlideY.value = 12;
    tabFade.value = withDelay(80, withTiming(1, { duration: 200 }));
    tabSlideY.value = withDelay(80, withSpring(0, { damping: 22 }));
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDark ? "#050510" : "#F8FAFC" },
      ]}
    >
      <SafeAreaView style={{ flex: 1, paddingTop: Math.max(insets.top, 8) }}>
        {/* ── Sticky Header ── */}
        <Animated.View
          style={[
            styles.stickyHeader,
            { backgroundColor: isDark ? "#0A0A1A" : "#FFFFFF" },
            headerOpacityStyle,
          ]}
        >
          <TouchableOpacity
            style={[
              styles.iconBtn,
              { backgroundColor: isDark ? "#2C2C2E" : "#F2F2F7" },
            ]}
            onPress={() => router.back()}
          >
            <ChevronLeft size={20} color={isDark ? "#F8FAFC" : "#1E293B"} />
          </TouchableOpacity>
          <Animated.Text
            numberOfLines={1}
            style={[
              styles.stickyHeaderTitle,
              { color: isDark ? "#F8FAFC" : "#1E293B" },
              headerTextStyle,
            ]}
          >
            {vehicle.name}
          </Animated.Text>
          <View style={{ width: 38 }} />
        </Animated.View>

        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {/* ── Hero Image ── */}
          <View style={styles.heroImageWrap}>
            <VehicleImageHeader vehicle={vehicle} size="detail" />
          </View>

          {/* ── Hero Card ── */}
          <View
            style={[
              styles.heroCard,
              {
                backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF",
                marginTop: -30,
              },
            ]}
          >
            <View style={styles.heroTop}>
              <View style={styles.heroInfo}>
                <Text
                  style={[
                    styles.heroName,
                    { color: isDark ? "#F8FAFC" : "#1E293B" },
                  ]}
                >
                  {vehicle.name}
                </Text>
                <Text
                  style={[
                    styles.heroMake,
                    { color: isDark ? "#94A3B8" : "#6B7280" },
                  ]}
                >
                  {vehicle.make} {vehicle.model} · {vehicle.year}
                </Text>
                {vehicle.registrationNumber && (
                  <Text
                    style={[
                      styles.heroReg,
                      { color: isDark ? "#71717A" : "#9CA3AF" },
                    ]}
                  >
                    {vehicle.registrationNumber}
                  </Text>
                )}
              </View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 10,
                  gap: 4,
                  backgroundColor: vehicle.isActive
                    ? "rgba(16,185,129,0.1)"
                    : "rgba(148,163,184,0.08)",
                }}
              >
                <View
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: vehicle.isActive ? "#10B981" : "#94A3B8",
                  }}
                />
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: "700",
                    letterSpacing: 0.5,
                    color: vehicle.isActive ? "#10B981" : "#94A3B8",
                  }}
                >
                  {vehicle.isActive ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>
            <View
              style={[styles.accentLine, { backgroundColor: accentColor }]}
            />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <View style={styles.heroStats}>
              <QuickStat
                icon={FUEL_EMOJI_MAP[vehicle.fuelType] || "⛽"}
                label="Fuel"
                value={capitalize(vehicle.fuelType)}
              />
              {vehicle.mileage && (
                <QuickStat
                  icon="📊"
                  label="Mileage"
                  value={`${vehicle.mileage} km/l`}
                />
              )}
              {vehicle.odometerReading && (
                <QuickStat
                  icon="🛣️"
                  label="Odometer"
                  value={formatOdometer(vehicle.odometerReading)}
                />
              )}
              {vehicle.fuelTankCapacity && (
                <QuickStat
                  icon="🪣"
                  label="Tank"
                  value={`${vehicle.fuelTankCapacity} L`}
                />
              )}
            </View>
          </View>

          {/* ── Compliance Status Tiles (tap to edit) ── */}
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F8FAFC" : "#1E293B" },
            ]}
          >
            Compliance Status
          </Text>
          <View style={styles.statusGrid}>
            <StatusTile
              icon={
                <Shield
                  size={18}
                  color={getExpiryColor(vehicle.insuranceExpiry)}
                />
              }
              label="Insurance"
              date={formatExpiryDate(vehicle.insuranceExpiry)}
              onPress={() => router.push({
                pathname: '/compliance-detail',
                params: { type: 'insurance', label: 'Insurance', date: safeToIso(vehicle.insuranceExpiry), docUrl: `${(vehicle as any)?.insuranceDocumentUrl || ''}`, vehicleId: vehicle.id, userId: vehicle.userId },
              } as any)}
              isDark={isDark}
              hasDocument={!!(vehicle as any)?.insuranceDocumentUrl}
              onDocumentPress={() => {
                if ((vehicle as any)?.insuranceDocumentUrl) handleViewDocument((vehicle as any).insuranceDocumentUrl);
              }}
            />
            <StatusTile
              icon={
                <FileText size={18} color={getExpiryColor(vehicle.pucExpiry)} />
              }
              label="PUC"
              date={formatExpiryDate(vehicle.pucExpiry)}
              onPress={() => router.push({
                pathname: '/compliance-detail',
                params: { type: 'puc', label: 'PUC', date: safeToIso(vehicle.pucExpiry), docUrl: `${(vehicle as any)?.pucDocumentUrl || ''}`, vehicleId: vehicle.id, userId: vehicle.userId },
              } as any)}
              isDark={isDark}
              hasDocument={!!(vehicle as any)?.pucDocumentUrl}
              onDocumentPress={() => {
                if ((vehicle as any)?.pucDocumentUrl) handleViewDocument((vehicle as any).pucDocumentUrl);
              }}
            />
            <StatusTile
              icon={
                <Calendar
                  size={18}
                  color={getExpiryColor(vehicle.registrationExpiry)}
                />
              }
              label="Registration"
              date={formatExpiryDate(vehicle.registrationExpiry)}
              onPress={() => router.push({
                pathname: '/compliance-detail',
                params: { type: 'registration', label: 'Registration', date: safeToIso(vehicle.registrationExpiry), docUrl: `${(vehicle as any)?.registrationDocumentUrl || ''}`, vehicleId: vehicle.id, userId: vehicle.userId },
              } as any)}
              isDark={isDark}
              hasDocument={!!(vehicle as any)?.registrationDocumentUrl}
              onDocumentPress={() => {
                if ((vehicle as any)?.registrationDocumentUrl) handleViewDocument((vehicle as any).registrationDocumentUrl);
              }}
            />
            <StatusTile
              icon={
                <Wrench
                  size={18}
                  color={
                    vehicle.nextServiceDue
                      ? getExpiryColor(vehicle.nextServiceDue)
                      : "#71717A"
                  }
                />
              }
              label="Service"
              date={
                vehicle.nextServiceDue
                  ? formatExpiryDate(vehicle.nextServiceDue)
                  : "Not Scheduled"
              }
              onPress={() => handleComplianceEdit("service")}
              isDark={isDark}
              hasDocument={!!(vehicle as any)?.serviceDocumentUrl}
              onDocumentPress={() => {
                if ((vehicle as any)?.serviceDocumentUrl) handleViewDocument((vehicle as any).serviceDocumentUrl);
              }}
            />
          </View>

          {/* ── Service History ── */}
          <Text
            style={[
              styles.sectionTitle,
              { color: isDark ? "#F8FAFC" : "#1E293B" },
            ]}
          >
            Service History{" "}
            {serviceRecords.length > 0 && (
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "500",
                  color: isDark ? "#94A3B8" : "#6B7280",
                }}
              >
                ({serviceRecords.length})
              </Text>
            )}
          </Text>
          <View style={{ paddingHorizontal: 16 }}>
            <ServiceHistoryList
              records={serviceRecords}
              loading={loadingRecords}
              onEdit={setEditingServiceRecord}
              onDelete={handleDeleteServiceRecord}
              onView={(rec) => router.push({
                pathname: '/service-detail',
                params: { vehicleId: vehicle.id, userId: vehicle.userId, recordData: encodeURIComponent(JSON.stringify(rec)) },
              } as any)}
            />
          </View>

          {/* ── Tabs ── */}
          <View style={styles.tabBar}>
            <TabButton
              label="Overview"
              active={activeTab === "overview"}
              onPress={() => switchTab("overview")}
            />
            <TabButton
              label="Compliance"
              active={activeTab === "compliance"}
              onPress={() => switchTab("compliance")}
            />
            <TabButton
              label="Specs"
              active={activeTab === "specs"}
              onPress={() => switchTab("specs")}
            />
          </View>

          {/* ── Tab Content ── */}
          <Animated.View style={tabAnimatedStyle}>
            {activeTab === "overview" && (
              <OverviewTab vehicle={vehicle} rowBorder={rowBorder} />
            )}
            {activeTab === "compliance" && (
              <ComplianceTab
                vehicle={vehicle}
                rowBorder={rowBorder}
                router={router}
                onEdit={handleComplianceEdit}
              />
            )}
            {activeTab === "specs" && (
              <SpecsTab vehicle={vehicle} rowBorder={rowBorder} />
            )}
          </Animated.View>

          {/* ── Action Buttons ── */}
          <View style={styles.actionsRow}>
            <ActionButton
              icon={<Wrench size={18} color={Colors.warning} />}
              label="Log Service"
              onPress={() => {
                setEditingServiceRecord(null);
                setServiceModalVisible(true);
              }}
            />
            <ActionButton
              icon={<Edit3 size={18} color="#3B82F6" />}
              label="Edit Info"
              onPress={() => {
                const vehicleData = encodeURIComponent(JSON.stringify(vehicle));
                router.push({
                  pathname: "/vehicle-edit",
                  params: { edit: "true", vehicleData },
                } as any);
              }}
            />
            <ActionButton
              icon={<Trash2 size={18} color="#EF4444" />}
              label="Delete"
              danger
              onPress={() => confirmDelete(router, vehicle)}
            />
          </View>
        </Animated.ScrollView>
      </SafeAreaView>

      {/* ── Modals ── */}
      <ComplianceEditModal
        visible={editTarget !== null}
        target={editTarget}
        date={editDate}
        label={editTarget ? COMPLIANCE_LABEL_MAP[editTarget] : ""}
        isDark={isDark}
        onChange={setEditDate}
        onSave={handleSaveCompliance}
        onClose={() => setEditTarget(null)}
        documentUrl={editTarget ? (vehicle as any)?.[`${editTarget}DocumentUrl`] : undefined}
        onDocumentUpload={async (uri) => {
          if (editTarget) {
            await handleComplianceDocumentUpload(editTarget, uri);
          }
        }}
      />
      <ServiceRecordModal
        visible={serviceModalVisible && !editingServiceRecord}
        isEdit={false}
        record={null}
        isDark={isDark}
        onSave={handleSaveServiceRecord}
        onClose={() => {
          setServiceModalVisible(false);
          setEditingServiceRecord(null);
        }}
      />
      <ServiceRecordModal
        visible={!!editingServiceRecord}
        isEdit={true}
        record={editingServiceRecord}
        isDark={isDark}
        onSave={handleSaveServiceRecord}
        onClose={() => setEditingServiceRecord(null)}
      />
    </View>
  );
}

/* ─── Tab Content ─── */

function OverviewTab({
  vehicle,
  rowBorder,
}: {
  vehicle: Vehicle;
  rowBorder: string;
}) {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.tabCard,
        { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
      ]}
    >
      <Text
        style={[styles.cardTitle, { color: isDark ? "#F8FAFC" : "#1E293B" }]}
      >
        Summary
      </Text>
      <DetailRow
        label="Vehicle Type"
        value={capitalize(vehicle.type)}
        border={rowBorder}
      />
      <DetailRow
        label="Fuel Type"
        value={vehicle.fuelType.toUpperCase()}
        border={rowBorder}
      />
      <DetailRow label="Make" value={vehicle.make || "—"} border={rowBorder} />
      <DetailRow
        label="Model"
        value={vehicle.model || "—"}
        border={rowBorder}
      />
      <DetailRow label="Year" value={String(vehicle.year)} border={rowBorder} />
      <DetailRow
        label="Location"
        value={capitalize(vehicle.location)}
        border={rowBorder}
      />
      {vehicle.notes && (
        <>
          <View style={[styles.cardDivider, { backgroundColor: rowBorder }]} />
          <Text
            style={[
              styles.cardTitle,
              { color: isDark ? "#F8FAFC" : "#1E293B" },
            ]}
          >
            Notes
          </Text>
          <Text
            style={{
              fontSize: 14,
              lineHeight: 22,
              color: isDark ? "#CBD5E1" : "#475569",
            }}
          >
            {vehicle.notes}
          </Text>
        </>
      )}
    </View>
  );
}

function ComplianceTab({
  vehicle,
  rowBorder,
  router,
  onEdit,
}: {
  vehicle: Vehicle;
  rowBorder: string;
  router: ReturnType<typeof useRouter>;
  onEdit: (t: ComplianceEditTarget) => void;
}) {
  const { isDark } = useTheme();
  return (
    <View
      style={[
        styles.tabCard,
        { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
      ]}
    >
      <Text
        style={[styles.cardTitle, { color: isDark ? "#F8FAFC" : "#1E293B" }]}
      >
        Documents & Identifiers
      </Text>
      <ComplianceItem
        label="Insurance"
        date={vehicle.insuranceExpiry}
        border={rowBorder}
        onPress={() => {
          const url = `${vehicle.insuranceDocumentUrl || ''}`;
          router.push({
            pathname: '/compliance-detail',
            params: {
              type: 'insurance',
              label: 'Insurance',
              date: safeToIso(vehicle.insuranceExpiry),
              docUrl: url,
              vehicleId: vehicle.id,
              userId: vehicle.userId,
            },
          } as any);
        }}
      />
      <ComplianceItem
        label="PUC Certificate"
        date={vehicle.pucExpiry}
        border={rowBorder}
        onPress={() => {
          const url = `${vehicle.pucDocumentUrl || ''}`;
          router.push({
            pathname: '/compliance-detail',
            params: {
              type: 'puc',
              label: 'PUC Certificate',
              date: safeToIso(vehicle.pucExpiry),
              docUrl: url,
              vehicleId: vehicle.id,
              userId: vehicle.userId,
            },
          } as any);
        }}
      />
      <ComplianceItem
        label="Registration"
        date={vehicle.registrationExpiry}
        border={rowBorder}
        onPress={() => {
          const url = `${vehicle.registrationDocumentUrl || ''}`;
          router.push({
            pathname: '/compliance-detail',
            params: {
              type: 'registration',
              label: 'Registration',
              date: safeToIso(vehicle.registrationExpiry),
              docUrl: url,
              vehicleId: vehicle.id,
              userId: vehicle.userId,
            },
          } as any);
        }}
      />
      <View style={[styles.cardDivider, { backgroundColor: rowBorder }]} />
      {vehicle.vin && (
        <DetailRow label="VIN" value={vehicle.vin} border={rowBorder} />
      )}
      {vehicle.engineNumber && (
        <DetailRow
          label="Engine No."
          value={vehicle.engineNumber}
          border={rowBorder}
        />
      )}
      {vehicle.chassisNumber && (
        <DetailRow
          label="Chassis No."
          value={vehicle.chassisNumber}
          border={rowBorder}
        />
      )}
      {vehicle.color && (
        <DetailRow label="Color" value={vehicle.color} border={rowBorder} />
      )}
    </View>
  );
}

function SpecsTab({
  vehicle,
  rowBorder,
}: {
  vehicle: Vehicle;
  rowBorder: string;
}) {
  const { isDark } = useTheme();
  return (
    <>
      {(vehicle.fuelType ||
        vehicle.mileage ||
        vehicle.fuelTankCapacity ||
        vehicle.odometerReading ||
        vehicle.color) && (
        <View
          style={[
            styles.tabCard,
            { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: isDark ? "#F8FAFC" : "#1E293B" },
            ]}
          >
            Specifications
          </Text>
          {vehicle.fuelType && (
            <DetailRow
              label="Fuel Type"
              value={capitalize(vehicle.fuelType)}
              border={rowBorder}
            />
          )}
          {vehicle.mileage && (
            <DetailRow
              label="Mileage"
              value={`${vehicle.mileage} km/l`}
              border={rowBorder}
            />
          )}
          {vehicle.fuelTankCapacity && (
            <DetailRow
              label="Tank Capacity"
              value={`${vehicle.fuelTankCapacity} L`}
              border={rowBorder}
            />
          )}
          {vehicle.odometerReading && (
            <DetailRow
              label="Odometer"
              value={`${vehicle.odometerReading.toLocaleString()} km`}
              border={rowBorder}
            />
          )}
          {vehicle.color && (
            <DetailRow label="Color" value={vehicle.color} border={rowBorder} />
          )}
        </View>
      )}
      {(vehicle.purchasePrice ||
        vehicle.currentValue ||
        vehicle.purchaseDate) && (
        <View
          style={[
            styles.tabCard,
            { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: isDark ? "#F8FAFC" : "#1E293B" },
            ]}
          >
            Financial
          </Text>
          {vehicle.purchasePrice && (
            <DetailRow
              label="Purchase Price"
              value={`₹${vehicle.purchasePrice.toLocaleString()}`}
              border={rowBorder}
            />
          )}
          {vehicle.currentValue && (
            <DetailRow
              label="Current Value"
              value={`₹${vehicle.currentValue.toLocaleString()}`}
              border={rowBorder}
            />
          )}
          {vehicle.purchaseDate && (
            <DetailRow
              label="Purchase Date"
              value={formatExpiryDate(vehicle.purchaseDate)}
              border={rowBorder}
            />
          )}
        </View>
      )}
    </>
  );
}

/* ─── Sub-Components ─── */

function QuickStat({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  const { isDark } = useTheme();
  return (
    <View style={styles.statRow}>
      <Text style={{ fontSize: 16 }}>{icon}</Text>
      <View style={{ flex: 1, marginLeft: 10 }}>
        <Text
          style={[
            styles.statRowLabel,
            { color: isDark ? "#94A3B8" : "#6B7280" },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.statRowValue,
            { color: isDark ? "#F8FAFC" : "#1E293B" },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}

function StatusTile({
  icon,
  label,
  date,
  onPress,
  onDocumentPress,
  hasDocument,
  isDark,
}: {
  icon: React.ReactNode;
  label: string;
  date: string;
  onPress: () => void;
  onDocumentPress?: () => void;
  hasDocument?: boolean;
  isDark: boolean;
}) {
  return (
    <View
      style={[
        styles.statusTile,
        { backgroundColor: isDark ? "#27272A" : "#F8F9FA" },
      ]}
    >
      <TouchableOpacity
        style={{ flex: 1 }}
        onPress={onPress}
        activeOpacity={0.6}
      >
        <View
          style={[
            styles.statusTileIcon,
            { backgroundColor: "rgba(124,58,237,0.1)" },
          ]}
        >
          {icon}
        </View>
        <Text
          style={[styles.tileLabel, { color: isDark ? "#A1A1AA" : "#6B7280" }]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.tileDate,
            { color: isDark ? "#F5F5F5" : "#1F2937", fontWeight: "600" },
          ]}
        >
          {date}
        </Text>
      </TouchableOpacity>
      <View style={[styles.tileActions, { borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
        <View
          style={[
            styles.tileIconBtn,
            { backgroundColor: isDark ? "#3A3A3C" : "#E5E5EA" },
          ]}
          onStartShouldSetResponder={() => true}
        >
          <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.7}
            hitSlop={8}
          >
            <Edit3 size={10} color={isDark ? "#A1A1AA" : "#6B7280"} />
          </TouchableOpacity>
        </View>
        {hasDocument && onDocumentPress && (
          <View
            style={[
              styles.tileIconBtn,
              { backgroundColor: `${Colors.warning}20`, marginLeft: 4 },
            ]}
          >
            <TouchableOpacity
              onPress={onDocumentPress}
              activeOpacity={0.7}
              hitSlop={8}
            >
              <ExternalLink size={10} color={Colors.warning} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.tabBtn,
        {
          backgroundColor: active
            ? `${Colors.warning}18`
            : isDark
              ? "#2C2C2E"
              : "#F2F2F7",
        },
      ]}
      onPress={onPress}
    >
      {label === "Overview" && (
        <Info
          size={13}
          color={active ? Colors.warning : isDark ? "#71717A" : "#9CA3AF"}
        />
      )}
      {label === "Compliance" && (
        <Shield
          size={13}
          color={active ? Colors.warning : isDark ? "#71717A" : "#9CA3AF"}
        />
      )}
      {label === "Specs" && (
        <Gauge
          size={13}
          color={active ? Colors.warning : isDark ? "#71717A" : "#9CA3AF"}
        />
      )}
      <Text
        style={[
          styles.tabLabel,
          { color: active ? Colors.warning : isDark ? "#71717A" : "#9CA3AF" },
        ]}
      >
        {label}
      </Text>
      {active && <View style={styles.activeIndicator} />}
    </TouchableOpacity>
  );
}

function DetailRow({
  label,
  value,
  border,
}: {
  label: string;
  value: string;
  border: string;
}) {
  const { isDark } = useTheme();
  return (
    <View style={[styles.detailRow, { borderBottomColor: border }]}>
      <Text
        style={[styles.detailLabel, { color: isDark ? "#94A3B8" : "#6B7280" }]}
      >
        {label}
      </Text>
      <Text
        style={[styles.detailValue, { color: isDark ? "#F8FAFC" : "#1E293B" }]}
      >
        {value}
      </Text>
    </View>
  );
}

function ComplianceItem({
  label,
  date,
  border,
  onPress,
}: {
  label: string;
  date?: Date;
  border: string;
  onPress: () => void;
}) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.complianceItem, { borderBottomColor: border }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.complianceLabel,
            { color: isDark ? "#F8FAFC" : "#1E293B" },
          ]}
        >
          {label}
        </Text>
        <Text
          style={[
            styles.complianceDate,
            { color: isDark ? "#94A3B8" : "#6B7280" },
          ]}
        >
          {formatExpiryDate(date)}
        </Text>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <StatusBadge
          type={
            label.toLowerCase().includes("insurance")
              ? "insurance"
              : label.toLowerCase().includes("puc")
                ? "puc"
                : "registration"
          }
          date={date || new Date(2099, 0, 1)}
        />
        <Edit3 size={14} color={isDark ? "#94A3B8" : "#6B7280"} />
      </View>
    </TouchableOpacity>
  );
}

function ActionButton({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.actionBtn,
        { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
        danger && { borderColor: "rgba(239,68,68,0.15)", borderWidth: 1 },
      ]}
      onPress={onPress}
    >
      {icon}
      <Text
        style={[
          styles.actionLabel,
          { color: danger ? "#EF4444" : isDark ? "#CBD5E1" : "#475569" },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/* ─── Helpers ─── */

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getVehicleAccentColor(type: string): string {
  const map: Record<string, string> = {
    car: "#3B82F6",
    bike: "#10B981",
    truck: "#F59E0B",
    other: "#7C3AED",
  };
  return map[type] || "#3B82F6";
}

function confirmDelete(router: ReturnType<typeof useRouter>, vehicle: Vehicle) {
  Alert.alert("Delete Vehicle", `Delete "${vehicle.name}" permanently?`, [
    { text: "Cancel", style: "cancel" },
    {
      text: "Delete",
      style: "destructive",
      onPress: async () => {
        try {
          await firebaseService.deleteVehicle(vehicle.id, vehicle.location);
          router.back();
        } catch (e: any) {
          Alert.alert("Error", e.message);
        }
      },
    },
  ]);
}

/* ─── Styles ── */

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  stickyHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    height: 52,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
  iconBtn: { padding: 8, borderRadius: 12 },
  stickyHeaderTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
    textAlign: "center",
  },
  heroImageWrap: { overflow: "hidden" },
  heroCard: {
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 14,
      },
      android: { elevation: 5 },
    }),
  },
  heroTop: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroInfo: { flex: 1, minWidth: 0 },
  heroName: { fontSize: 20, fontWeight: "800" },
  heroMake: { fontSize: 13, marginTop: 2 },
  heroReg: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "SF Mono" : "monospace",
    marginTop: 2,
  },
  accentLine: { height: 3, marginVertical: 6, borderRadius: 2 },
  divider: { height: 0.5, marginVertical: 14 },
  heroStats: { gap: 4 },
  statRow: { flexDirection: "row", alignItems: "center", paddingVertical: 5 },
  statRowLabel: { fontSize: 11, fontWeight: "500" },
  statRowValue: { fontSize: 13, fontWeight: "700" },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingHorizontal: 16,
  },
  statusTile: {
    width: "47%",
    padding: 14,
    borderRadius: 20,
    position: "relative",
  },
  statusTileSpacer: { width: "6%" },
  statusTileIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tileDate: { fontSize: 12 },
  tileActions: { flexDirection: "row", marginTop: 6, paddingTop: 6, borderTopWidth: 0.5 },
  tileIconBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: "center",
    alignItems: "center",
  },
  tabBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 24,
    marginBottom: 12,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 16,
    position: "relative",
  },
  tabLabel: { fontSize: 13, fontWeight: "700" },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    transform: [{ translateX: -8 }],
    width: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.warning,
  },
  tabCard: { paddingHorizontal: 16, marginBottom: 12, paddingVertical: 4 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 10 },
  cardDivider: { height: 0.5, marginVertical: 12 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
  },
  detailLabel: { fontSize: 14, fontWeight: "500" },
  detailValue: { fontSize: 14, fontWeight: "600" },
  complianceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  complianceLabel: { fontSize: 14, fontWeight: "600" },
  complianceDate: { fontSize: 12, marginTop: 2 },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 8,
    marginBottom: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 18,
  },
  actionLabel: { fontSize: 13, fontWeight: "700" },
});
