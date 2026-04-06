/**
 * WiFi Bills — Premium Bill Card (Groww/Zerodha inspired)
 * Clean financial card with ISP brand logo, status indicators, and subtle animations
 */

import React, { useEffect, useRef } from "react";
import {
  Animated, Image, Platform, StyleSheet, Text, TouchableOpacity, View,
} from "react-native";
import * as Haptics from "expo-haptics";
import {
  Building2, ChevronRight, Clock, CreditCard,
} from "lucide-react-native";
import { Spacing, Typography, BorderRadius } from "@/constants/designTokens";
import { getColorScheme } from "@/theme/color";
import { useTheme } from "@/theme/themeProvider";
import { formatNumberIndian } from "@/src/utils/numberFormat";
import type { WifiBillEntry } from "@/src/hooks/useWifiBillsManager";

// ISP brand mapping with domains for logo fetch
const ISP_BRANDS: Record<string, { letter: string; brandColor: string; domain: string }> = {
  airtel:     { letter: "A", brandColor: "#E40046", domain: "airtel.in" },
  jio:        { letter: "J", brandColor: "#0A3D91", domain: "jio.com" },
  "vi":       { letter: "Vi", brandColor: "#E41C38", domain: "myvi.in" },
  vodafone:   { letter: "Vi", brandColor: "#E41C38", domain: "vodafone.com" },
  bsnl:       { letter: "B", brandColor: "#005BA9", domain: "bsnl.co.in" },
  act:        { letter: "A", brandColor: "#F58220", domain: "actcorp.in" },
  hathway:    { letter: "H", brandColor: "#003DA5", domain: "hathway.com" },
  excitel:    { letter: "E", brandColor: "#00C853", domain: "excitel.com" },
  spectra:    { letter: "S", brandColor: "#6B21A8", domain: "spectra.co.in" },
  tata:       { letter: "T", brandColor: "#4B0082", domain: "tata.com" },
  den:        { letter: "D", brandColor: "#F7941D", domain: "dencable.tv" },
  gtpl:       { letter: "G", brandColor: "#0D7377", domain: "gtpl.net" },
  tikona:     { letter: "Tk", brandColor: "#2196F3", domain: "tikona.in" },
};

function getIspBranding(ispName: string) {
  const n = ispName.toLowerCase().trim();
  for (const [key, val] of Object.entries(ISP_BRANDS)) {
    if (n.includes(key)) return val;
  }
  return { letter: ispName.charAt(0).toUpperCase(), brandColor: "#6366F1", domain: "" };
}

function formatDue(raw: string): { label: string; sub?: string; isOverdue: boolean; color: string } {
  if (!raw) return { label: "No date", isOverdue: false, color: "#8E8E93" };
  const due = new Date(raw);
  if (isNaN(due.getTime())) return { label: raw, isOverdue: false, color: "#8E8E93" };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(raw);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d.getTime() - today.getTime()) / 86400000);

  if (diff < 0) return { label: `${Math.abs(diff)} day${Math.abs(diff) !== 1 ? "s" : ""} overdue`, sub: "Pay now", isOverdue: true, color: "#EF4444" };
  if (diff === 0) return { label: "Due today", sub: "Don't miss it", isOverdue: true, color: "#EF4444" };
  if (diff === 1) return { label: "Due tomorrow", sub: "Almost time", isOverdue: false, color: "#F59E0B" };
  if (diff <= 5) return { label: `${diff} days left`, sub: "Soon", isOverdue: false, color: "#F59E0B" };
  return {
    label: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
    sub: d.toLocaleDateString("en-IN", { year: "numeric" }),
    isOverdue: false,
    color: "#8E8E93",
  };
}

interface Props {
  bill: WifiBillEntry;
  onEdit: () => void;
  onDelete: () => void;
  onPress: () => void;
  idx: number;
}

export function BillCard({ bill, onEdit, onDelete, onPress, idx }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const brand = getIspBranding(bill.ispName);
  const isPaid = bill.payStatus === "Paid";
  const due = formatDue(bill.lastDateToPay);

  // Staggered entrance animation
  const scale = useRef(new Animated.Value(0.95)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        delay: idx * 60,
        damping: 26,
        stiffness: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        delay: idx * 60,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, [idx, scale, opacity]);

  const tapIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(pressScale, {
      toValue: 0.97,
      damping: 18,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const tapOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      damping: 18,
      stiffness: 300,
      useNativeDriver: true,
    }).start();
  };

  const bg = isDark ? "#1C1C1E" : "#FFFFFF";
  const accentBg = isDark ? `${brand.brandColor}15` : `${brand.brandColor}08`;

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Animated.View style={{ transform: [{ scale: pressScale }] }}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: bg }]}
          activeOpacity={0.7}
          onPressIn={tapIn}
          onPressOut={tapOut}
          onPress={onPress}
        >
          {/* Left accent stripe with brand color */}
          <View style={[styles.accentStripe, { backgroundColor: isPaid ? "#10B981" : brand.brandColor }]} />

          <View style={styles.cardContent}>
            {/* Top row: ISP brand + Name + Amount */}
            <View style={styles.mainRow}>
              {/* ISP Brand Avatar */}
              <View style={[styles.brandAvatar, { backgroundColor: accentBg }]}>
                <IspLogo brand={brand} size={40} />
              </View>
              <View style={styles.infoCol}>
                <Text style={[styles.ispName, { color: scheme.textPrimary }]} numberOfLines={1}>
                  {bill.ispName}
                </Text>
                <View style={styles.metaChips}>
                  {/* Payment Status Chip */}
                  <View style={[
                    styles.statusChip,
                    {
                      backgroundColor: isPaid
                        ? (isDark ? "rgba(16,185,129,0.15)" : "rgba(16,185,129,0.1)")
                        : (isDark ? "rgba(245,158,11,0.15)" : "rgba(245,158,11,0.1)"),
                    },
                  ]}>
                    {isPaid
                      ? <Clock size={10} color="#10B981" />
                      : <Clock size={10} color={due.isOverdue ? "#EF4444" : "#F59E0B"} />
                    }
                    <Text style={[
                      styles.statusText,
                      { color: isPaid ? "#10B981" : (due.isOverdue ? "#EF4444" : "#F59E0B") },
                    ]}>
                      {bill.payStatus}
                    </Text>
                  </View>
                  {/* City Chip */}
                  <View style={[styles.locationChip, {
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.03)",
                  }]}>
                    <Building2 size={10} color={scheme.textTertiary} />
                    <Text style={[styles.locationText, { color: scheme.textTertiary }]}>
                      {bill.city.charAt(0).toUpperCase() + bill.city.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Right: Amount + Chevron */}
              <View style={styles.rightCol}>
                <Text style={[styles.amount, { color: scheme.textPrimary }]}>
                  ₹{formatNumberIndian(bill.billAmount)}
                </Text>
                {bill.paymentMode && (
                  <View style={styles.modeRow}>
                    <CreditCard size={9} color={scheme.textTertiary} />
                    <Text style={[styles.paymentMode, { color: scheme.textTertiary }]}>
                      {bill.paymentMode}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Bottom row: Due date / Paid info + Edit/Delete */}
            <View style={styles.footerRow}>
              {isPaid ? (
                <View style={styles.footerLeft}>
                  <Text style={[styles.footerLabel, { color: scheme.textTertiary }]}>
                    Bill month
                  </Text>
                  <Text style={[styles.footerValue, { color: scheme.textSecondary }]}>
                    {bill.lastPaidBillMonth}
                  </Text>
                </View>
              ) : (
                <View style={styles.footerLeft}>
                  <Text style={[styles.footerLabel, { color: scheme.textTertiary }]}>
                    Due
                  </Text>
                  <Text style={[styles.footerValue, { color: due.color }]}>
                    {due.label}
                  </Text>
                  {due.sub && (
                    <Text style={[styles.footerSub, { color: due.color }]}>
                      {due.sub}
                    </Text>
                  )}
                </View>
              )}

              {/* Edit & Delete */}
              <View style={styles.actionGroup}>
                <TouchableOpacity
                  style={[styles.actionBtn, {
                    backgroundColor: isDark ? "rgba(99,102,241,0.15)" : "rgba(99,102,241,0.08)",
                  }]}
                  onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onEdit(); }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.actionBtnText, { color: "#6366F1" }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, {
                    backgroundColor: isDark ? "rgba(239,68,68,0.12)" : "rgba(239,68,68,0.06)",
                  }]}
                  onPress={(e) => { e.stopPropagation(); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onDelete(); }}
                  activeOpacity={0.6}
                >
                  <Text style={[styles.actionBtnText, { color: "#EF4444" }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Subtle right chevron */}
          <View style={styles.chevronContainer}>
            <ChevronRight size={16} color={scheme.textTertiary} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

/** ISP brand logo — uses Google Favicon API with letter fallback */
function IspLogo({ brand, size = 36 }: { brand: ReturnType<typeof getIspBranding>; size?: number }) {
  const [showImg, setShowImg] = React.useState(true);

  // Google Favicon API — free, no token needed
  const logoUrl = brand.domain
    ? `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`
    : null;

  if (!logoUrl || !showImg) {
    return (
      <Text style={{
        fontWeight: "700",
        color: brand.brandColor,
        fontSize: brand.letter.length > 1 ? size * 0.3 : size * 0.4,
      }}>
        {brand.letter}
      </Text>
    );
  }

  return (
    <Image
      source={{ uri: logoUrl }}
      style={{ width: size - 12, height: size - 12, borderRadius: 6 }}
      resizeMode="contain"
      onError={() => setShowImg(false)}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.md,
    overflow: "hidden",
    padding: Spacing.md + 2,
    flexDirection: "row",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 2 },
    }),
  },
  accentStripe: {
    position: "absolute",
    left: 0,
    top: 12,
    bottom: 12,
    width: 3.5,
    borderRadius: 2,
  },
  cardContent: {
    flex: 1,
  },
  mainRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  brandAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  infoCol: {
    flex: 1,
    minWidth: 0,
  },
  ispName: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  metaChips: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.badge,
  },
  statusText: {
    fontSize: 9.5,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.badge,
  },
  locationText: {
    fontSize: 9.5,
    fontWeight: "500",
  },
  rightCol: {
    alignItems: "flex-end",
    gap: 4,
    paddingLeft: 8,
  },
  amount: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 22,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  paymentMode: {
    fontSize: 9.5,
    fontWeight: "500",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm + 2,
    paddingTop: Spacing.sm,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(142,142,147,0.15)",
  },
  footerLeft: {
    gap: 1,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  footerValue: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  footerSub: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: -1,
  },
  actionGroup: {
    flexDirection: "row",
    gap: 6,
  },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: "600",
  },
  chevronContainer: {
    justifyContent: "center",
    paddingLeft: Spacing.xs,
    alignSelf: "center",
  },
});
