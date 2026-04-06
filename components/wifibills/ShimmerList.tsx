/**
 * WiFi Bills — Skeleton Loader (Premium)
 */

import React from "react";
import { StyleSheet, View } from "react-native";
import { Spacing, BorderRadius } from "@/constants/designTokens";

const shimmer = (isDark: boolean) => ({
  backgroundColor: isDark ? "#2C2C2E" : "#E5E7EB",
});

export function ShimmerList({ isDark }: { isDark: boolean }) {
  return (
    <View>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={[
            styles.card,
            { backgroundColor: isDark ? "#1C1C1E" : "#FFF" },
          ]}
        >
          {/* Brand avatar placeholder */}
          <View style={[styles.avatar, shimmer(isDark)]} />

          {/* Name + meta lines */}
          <View style={styles.textGroup}>
            <View style={[styles.line, { width: "55%", height: 14, borderRadius: 6 }, shimmer(isDark)]} />
            <View style={[styles.line, { width: "35%", height: 10, borderRadius: 6, marginTop: 6 }, shimmer(isDark)]} />
          </View>

          {/* Amount placeholder */}
          <View style={[styles.amount, { width: "25%", height: 16, borderRadius: 6 }, shimmer(isDark)]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.card,
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    flexShrink: 0,
  },
  textGroup: {
    flex: 1,
    gap: 4,
  },
  line: {
    height: 12,
    borderRadius: 6,
  },
  amount: {
    width: "25%",
    height: 16,
    borderRadius: 6,
  },
});
