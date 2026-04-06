/**
 * WiFi Bills — Summary Section (Finance App Inspired)
 * Rich visual breakdown with gradient hero card + detail tiles
 */

import React, { useEffect, useRef } from "react";
import {
  Animated, Dimensions, Platform, StyleSheet, Text, View,
} from "react-native";
import { TrendingUp, Wallet, Clock } from "lucide-react-native";
import { useTheme } from "@/theme/themeProvider";
import { getColorScheme, Colors } from "@/theme/color";
import { Spacing, Typography, BorderRadius } from "@/constants/designTokens";
import { formatNumberIndian } from "@/src/utils/numberFormat";

const { width: W } = Dimensions.get("window");

interface StatsData {
  totalAmount: number;
  pendingAmount: number;
  paidAmount: number;
  totalCount: number;
  paidCount: number;
  pendingCount: number;
}

const iconW = W * 0.06;

export function SummarySection({ stats }: { stats: StatsData }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  // Calculate pending percentage
  const pendingPct = stats.totalAmount > 0
    ? Math.round((stats.pendingAmount / stats.totalAmount) * 100)
    : 0;

  return (
    <Animated.View style={{ opacity: fade }}>
      {/* Hero Summary Card */}
      <View
        style={[
          styles.heroCard,
          { backgroundColor: isDark ? "#1C1C1E" : "#FFFFFF" },
        ]}
      >
        {/* Top accent gradient bar */}
        <View style={styles.accentBar} />

        {/* Total amount */}
        <View style={styles.heroHeader}>
          <TrendingUp size={16} color={Colors.primary} />
          <Text style={[styles.heroLabel, { color: scheme.textTertiary }]}>
            Total WiFi Bills
          </Text>
        </View>
        <Text
          style={[styles.heroAmount, { color: scheme.textPrimary }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
        >
          ₹{formatNumberIndian(stats.totalAmount)}
        </Text>

        {/* Progress bar: paid vs pending */}
        {stats.totalAmount > 0 && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: "#10B981",
                    width: `${100 - pendingPct}%`,
                  },
                ]}
              />
              {pendingPct > 0 && (
                <View
                  style={[
                    styles.progressFillPending,
                    {
                      backgroundColor: "#F59E0B",
                      width: `${pendingPct}%`,
                    },
                  ]}
                />
              )}
            </View>
            <Text style={[styles.progressLabel, { color: scheme.textTertiary }]}>
              {100 - pendingPct}% paid · {pendingPct}% pending
            </Text>
          </View>
        )}
      </View>

      {/* Detail Tiles */}
      <View style={styles.tilesRow}>
        <StatTile
          label="Paid"
          value={stats.paidAmount}
          count={stats.paidCount}
          accent="#10B981"
          AccentIcon={Wallet}
          isDark={isDark}
          scheme={scheme}
        />
        <StatTile
          label="Pending"
          value={stats.pendingAmount}
          count={stats.pendingCount}
          accent={pendingPct > 50 ? "#EF4444" : "#F59E0B"}
          AccentIcon={Clock}
          isDark={isDark}
          scheme={scheme}
        />
      </View>
    </Animated.View>
  );
}

function StatTile({
  label, value, count, accent, AccentIcon, isDark, scheme,
}: {
  label: string; value: number; count: number; accent: string;
  AccentIcon: React.ComponentType<{ size: number; color: string }>;
  isDark: boolean; scheme: ReturnType<typeof getColorScheme>;
}) {
  const formatted = `₹${formatNumberIndian(value)}`;

  return (
    <View style={[styles.tile, { backgroundColor: isDark ? "#1C1C1E" : "#FFF" }]}>
      <View style={[styles.tileIcon, { backgroundColor: `${accent}15` }]}>
        <AccentIcon size={iconW} color={accent} />
      </View>
      <Text style={[styles.tileAmount, { color: scheme.textPrimary }]}>
        {formatted}
      </Text>
      <Text style={[styles.tileLabel, { color: scheme.textTertiary }]}>
        {label} · {count} bill{count !== 1 ? "s" : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    borderRadius: BorderRadius.card,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 3 },
    }),
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  heroHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -1,
    lineHeight: 38,
  },
  progressBarContainer: {
    marginTop: 16,
    gap: 8,
  },
  progressBar: {
    flexDirection: "row",
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    backgroundColor: "rgba(142,142,147,0.1)",
  },
  progressFill: {
    borderRadius: 3,
    height: "100%",
  },
  progressFillPending: {
    borderRadius: 3,
    height: "100%",
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: "500",
  },
  tilesRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: 4,
  },
  tile: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: { elevation: 1 },
    }),
  },
  tileIcon: {
    width: iconW + 10,
    height: iconW + 10,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  tileAmount: {
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: "500",
    lineHeight: 14,
  },
});
