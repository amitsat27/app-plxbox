/**
 * WiFi Bills — Insights Section (Utility App Inspired)
 * Mini actionable tips with icons and subtle animations
 */

import React, { useEffect, useRef } from "react";
import {
  Animated, Dimensions, Platform, StyleSheet, Text, View,
} from "react-native";
import {
  ShieldCheck, Wifi, CreditCard,
} from "lucide-react-native";
import { useTheme } from "@/theme/themeProvider";
import { getColorScheme } from "@/theme/color";
import { Spacing, Typography, BorderRadius } from "@/constants/designTokens";

const { width: W } = Dimensions.get("window");
const TILE_W = (W - Spacing.lg * 2 - Spacing.sm) / 3;

const TIPS = [
  {
    Icon: ShieldCheck,
    color: "#10B981",
    title: "Auto-Pay",
    sub: "Never miss a bill",
  },
  {
    Icon: Wifi,
    color: "#8B5CF6",
    title: "ISP Plans",
    sub: "Compare & save",
  },
  {
    Icon: CreditCard,
    color: "#F59E0B",
    title: "Track Spends",
    sub: "Monthly insights",
  },
];

export function TipsSection() {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  return (
    <View style={{ marginTop: Spacing.lg }}>
      <Text style={secTitle}>Insights</Text>
      <View style={{ flexDirection: "row", justifyContent: "space-between", gap: Spacing.sm }}>
        {TIPS.map((t, i) => (
          <TipCard
            key={i}
            Icon={t.Icon}
            color={t.color}
            title={t.title}
            sub={t.sub}
            idx={i}
            isDark={isDark}
            scheme={scheme}
          />
        ))}
      </View>
    </View>
  );
}

function TipCard({
  Icon, color, title, sub, idx, isDark, scheme,
}: {
  Icon: React.ComponentType<{ size: number; color: string }>;
  color: string; title: string; sub: string;
  idx: number; isDark: boolean; scheme: ReturnType<typeof getColorScheme>;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: 100 + idx * 80,
      useNativeDriver: true,
    }).start();
  }, [anim, idx]);

  const bg = isDark ? "#1C1C1E" : "#FFF";
  const iconBg = isDark ? `${color}18` : `${color}10`;

  return (
    <Animated.View
      style={{
        opacity: anim,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        width: TILE_W,
      }}
    >
      <View style={[tipCard.card, { backgroundColor: bg }]}>
        <View style={[tipCard.iconRing, { backgroundColor: iconBg }]}>
          <Icon size={18} color={color} />
        </View>
        <Text style={[tipCard.title, { color: scheme.textPrimary }]} numberOfLines={1}>
          {title}
        </Text>
        <Text style={[tipCard.sub, { color: scheme.textTertiary }]} numberOfLines={1}>
          {sub}
        </Text>
      </View>
    </Animated.View>
  );
}

export const secTitle = {
  fontSize: Typography.fontSize.xs,
  fontWeight: "600",
  letterSpacing: 0.8,
  textTransform: "uppercase",
  marginBottom: Spacing.sm,
  marginLeft: 4,
  color: "#8E8E93",
} as const;

const tipCard = StyleSheet.create({
  card: {
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    alignItems: "center",
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 3,
      },
      android: { elevation: 1 },
    }),
  },
  iconRing: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  sub: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 14,
  },
});
