/**
 * Empty State Illustrated — refreshed with cleaner typography and spacing
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withTiming, withDelay } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Plus, Search } from 'lucide-react-native';
import { Colors } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import VehicleImageHeader from './VehicleImageHeader';

interface Props {
  type: 'no-vehicles' | 'no-results';
  onAddVehicle?: () => void;
  onClearFilters?: () => void;
}

export default function EmptyStateIllustrated({ type, onAddVehicle, onClearFilters }: Props) {
  const { isDark } = useTheme();

  const floatY = useSharedValue(0);
  const floatOpacity = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(withTiming(-6, { duration: 2200 }), -1, true);
    floatOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
    opacity: floatOpacity.value,
  }));

  const isNoResults = type === 'no-results';
  const bgColor = isDark ? '#1C1C1E' : '#FFFFFF';

  return (
    <View style={styles.container}>
      <Animated.View style={floatStyle}>
        <VehicleImageHeader type={isNoResults ? 'other' : 'car'} size="empty" />
      </Animated.View>

      <Text style={[styles.title, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
        {isNoResults ? 'No Vehicles Found' : 'Your Garage is Empty'}
      </Text>
      <Text style={[styles.desc, { color: isDark ? '#94A3B8' : '#64748B' }]}>
        {isNoResults
          ? 'Try a different filter or search query.'
          : 'Add vehicles to track insurance, PUC, registration and service history — all in one place.'}
      </Text>

      {!isNoResults && (
        <>
          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onAddVehicle?.(); }}
          >
            <Plus size={18} color="#000" />
            <Text style={styles.ctaText}>Add Vehicle</Text>
          </TouchableOpacity>

          <View style={styles.featuresList}>
            <FeatureItem emoji="📋" text="Track insurance & PUC expiry dates" isDark={isDark} />
            <FeatureItem emoji="🔧" text="Monitor service history & reminders" isDark={isDark} />
            <FeatureItem emoji="⛽" text="Manage fuel & mileage records" isDark={isDark} />
          </View>
        </>
      )}

      {isNoResults && onClearFilters && (
        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: Colors.warning }]}
          onPress={onClearFilters}
        >
          <Search size={18} color="#000" />
          <Text style={styles.ctaText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function FeatureItem({ emoji, text, isDark }: { emoji: string; text: string; isDark: boolean }) {
  return (
    <View style={[styles.featureRow, { borderBottomColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}>
      <Text style={{ fontSize: 14 }}>{emoji}</Text>
      <Text style={[styles.featureText, { color: isDark ? '#CBD5E1' : '#475569' }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 32,
    paddingHorizontal: 20,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginTop: 20,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  desc: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.warning,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    marginTop: 18,
    ...Platform.select({
      ios: { shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 12 },
      android: { elevation: 5 },
    }),
  },
  ctaText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  featuresList: {
    marginTop: 24,
    width: '100%',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    flex: 1,
  },
});
