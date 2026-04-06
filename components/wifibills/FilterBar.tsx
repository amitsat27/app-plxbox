/**
 * WiFi Bills — Filter Bar (Premium horizontal pills)
 * Scrollable city filter chips with subtle animations
 */

import React, { useRef, useEffect } from "react";
import {
  Animated, ScrollView, StyleSheet, Text, TouchableOpacity,
} from "react-native";
import { MapPin } from "lucide-react-native";
import { useTheme } from "@/theme/themeProvider";
import { Spacing, Typography, BorderRadius } from "@/constants/designTokens";
import type { WifiBillEntry } from "@/src/hooks/useWifiBillsManager";

export function FilterBar({ bills, filterCity, setFilterCity }: {
  bills: WifiBillEntry[];
  filterCity: string | null;
  setFilterCity: (c: string | null) => void;
}) {
  const { isDark } = useTheme();
  const cities = [...new Set(bills.map(b => b.city))].sort();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -Spacing.lg, paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}
    >
      {/* "All" chip */}
      <FilterChip
        label="All"
        icon={<MapPin size={12} color={filterCity ? "#8E8E93" : "#fff"} />}
        active={!filterCity}
        onPress={() => setFilterCity(null)}
        isDark={isDark}
      />
      {/* City chips */}
      {cities.map((c) => {
        const count = bills.filter(b => b.city === c).length;
        return (
          <FilterChip
            key={c}
            label={`${c.charAt(0).toUpperCase() + c.slice(1)} (${count})`}
            active={filterCity === c}
            onPress={() => setFilterCity(filterCity === c ? null : c)}
            isDark={isDark}
          />
        );
      })}
    </ScrollView>
  );
}

export function FilterChip({ label, icon, active, onPress, isDark }: {
  label: string; icon?: React.ReactNode; active: boolean; onPress: () => void; isDark: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(active ? 1 : 0.75)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, {
        toValue: active ? 1.04 : 1,
        damping: 20,
        stiffness: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: active ? 1 : 0.75,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, scale, opacity]);

  return (
    <Animated.View style={{ transform: [{ scale }], opacity }}>
      <TouchableOpacity
        style={[
          styles.chip,
          {
            backgroundColor: active
              ? "#8B5CF6"
              : isDark
                ? "rgba(255,255,255,0.06)"
                : "rgba(0,0,0,0.04)",
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {icon}
        <Text style={[styles.label, { color: active ? "#fff" : "#8E8E93" }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.pill,
    marginRight: 8,
  },
  label: {
    fontSize: Typography.fontSize.xs,
    fontWeight: "600",
  },
});
