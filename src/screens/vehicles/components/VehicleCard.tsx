/**
 * Vehicle Card — premium card with vehicle image, compliance badges, press animation
 */

import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getVehicleTypeColor } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { getDaysUntilExpiry } from '../utils/compliance';
import { getVehicleImageUrl } from '../utils/vehicleImages';
import { formatOdometer, formatMileage } from '../utils/formatNumbers';
import { FUEL_EMOJI_MAP } from '../utils/vehicleImages';
import type { Vehicle } from '@/src/types';
import StatusBadge from './StatusBadge';
import VehicleImageHeader from './VehicleImageHeader';
import VehicleTypeIcon from './VehicleTypeIcon';

interface Props {
  vehicle: Vehicle;
  onPress: () => void;
  index?: number;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export default function VehicleCard({ vehicle, onPress, index = 0 }: Props) {
  const { isDark } = useTheme();
  const scale = useSharedValue(0.96);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(index * 80, withTiming(1, { duration: 350 }));
  }, []);

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.97, { damping: 14 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 14 });
  }, []);

  const accentColor = getVehicleTypeColor(vehicle.type);
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';
  const fuelEmoji = FUEL_EMOJI_MAP[vehicle.fuelType] || '⛽';

  return (
    <AnimatedTouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, {
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      }, cardAnimatedStyle]}>
        {/* ── Accent border ── */}
        <View style={[styles.accentBorder, { backgroundColor: accentColor }]} />

        {/* ── Image Header ── */}
        <VehicleImageHeader vehicle={vehicle} size="card" imageIndex={index} />

        {/* ── Content ── */}
        <View style={styles.content}>
          <View style={styles.header}>
            <VehicleTypeIcon type={vehicle.type} size={40} />
            <View style={styles.info}>
              <Text style={[styles.name, { color: isDark ? '#F8FAFC' : '#1E293B' }]} numberOfLines={1}>{vehicle.name}</Text>
              <Text style={[styles.type, { color: isDark ? '#94A3B8' : '#6B7280' }]} numberOfLines={1}>{vehicle.make} {vehicle.model} · {vehicle.year}</Text>
              {vehicle.registrationNumber && (
                <Text style={[styles.reg, { color: isDark ? '#71717A' : '#9CA3AF' }]} numberOfLines={1}>{vehicle.registrationNumber}</Text>
              )}
            </View>
            <View style={[
              styles.statusPill,
              { backgroundColor: vehicle.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.08)' }
            ]}>
              <View style={[styles.statusDot, { backgroundColor: vehicle.isActive ? '#10B981' : '#94A3B8' }]} />
              <Text style={[
                styles.statusText,
                { color: vehicle.isActive ? '#10B981' : '#94A3B8' }
              ]} numberOfLines={1}>{vehicle.isActive ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>

          {/* ── Divider ── */}
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />

          {/* ── Footer Stats ── */}
          <View style={styles.footer}>
            <View style={[styles.fuelBadge, { backgroundColor: isDark ? '#27272A' : '#F5F5F5' }]}>
              <Text style={{ fontSize: 12 }}>{fuelEmoji}</Text>
              <Text style={[styles.fuelText, { color: isDark ? '#A1A1AA' : '#6B7280', textTransform: 'capitalize' }]}>{vehicle.fuelType}</Text>
            </View>

            {vehicle.mileage && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{vehicle.mileage}</Text>
                <Text style={[styles.statLabel, { color: isDark ? '#94A3B8' : '#6B7280' }]}>km/l</Text>
              </View>
            )}

            {vehicle.odometerReading && (
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{formatOdometer(vehicle.odometerReading)}</Text>
              </View>
            )}

            {/* Compliance badges */}
            <View style={styles.badges}>
              {vehicle.insuranceExpiry && (
                <StatusBadge type="insurance" date={vehicle.insuranceExpiry} compact showDot />
              )}
              {vehicle.pucExpiry && (
                <StatusBadge type="puc" date={vehicle.pucExpiry} compact showDot />
              )}
            </View>
          </View>
        </View>
      </Animated.View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24, overflow: 'hidden', marginBottom: 12,
    position: 'relative',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12 },
      android: { elevation: 4 },
    }),
  },
  accentBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 3, zIndex: 10 },
  content: { padding: 14, paddingTop: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700' },
  type: { fontSize: 12, marginTop: 2 },
  reg: { fontSize: 11, marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace' },
  statusPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, gap: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  divider: { height: 0.5, marginVertical: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'nowrap' },
  fuelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  fuelText: { fontSize: 11, fontWeight: '700' },
  statItem: { alignItems: 'center', paddingHorizontal: 4 },
  statValue: { fontSize: 13, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600' },
  badges: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
});
