/**
 * Vehicle Card — premium card with vehicle info, compliance badges, press animation
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import type { Vehicle } from '@/src/types';
import StatusBadge from './StatusBadge';

interface Props {
  vehicle: Vehicle;
  onPress: () => void;
}

export default function VehicleCard({ vehicle, onPress }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.7)).current;

  React.useEffect(() => {
    Animated.timing(opacityAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, []);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 0.97, damping: 14, useNativeDriver: true }),
    ]).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, damping: 14, useNativeDriver: true }).start();
  };

  const vehicleEmoji = () => {
    switch (vehicle.type) { case 'car': return '🚗'; case 'bike': return '🏍️'; case 'truck': return '🚛'; default: return '🚘'; }
  };
  const fuelEmoji = () => {
    switch (vehicle.fuelType) { case 'electric': return '⚡'; case 'cng': case 'lpg': return '🔵'; case 'hybrid': return '🌿'; default: return '⛽'; }
  };

  const cardBg = isDark ? '#1C1C1E' : '#FFFFFF';
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <TouchableOpacity activeOpacity={1} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, {
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim,
        backgroundColor: cardBg,
      }]}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)' }]}>
            <Text style={{ fontSize: 26 }}>{vehicleEmoji()}</Text>
          </View>
          <View style={styles.info}>
            <Text style={[styles.name, { color: scheme.textPrimary }]} numberOfLines={1}>{vehicle.name}</Text>
            <Text style={[styles.type, { color: scheme.textTertiary }]} numberOfLines={1}>{vehicle.make} {vehicle.model} · {vehicle.year}</Text>
            {vehicle.registrationNumber && (
              <Text style={[styles.reg, { color: scheme.textTertiary }]} numberOfLines={1}>{vehicle.registrationNumber}</Text>
            )}
          </View>
          <View style={[
            styles.tag,
            { backgroundColor: vehicle.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.08)' }
          ]}>
            <Text style={[
              styles.tagText,
              { color: vehicle.isActive ? '#10B981' : '#94A3B8' }
            ]}>{vehicle.isActive ? 'ON' : 'OFF'}</Text>
          </View>
        </View>

        {/* ── Divider ── */}
        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        {/* ── Footer stats ── */}
        <View style={styles.footer}>
          <View style={[styles.fuelBadge, { backgroundColor: isDark ? '#27272A' : '#F5F5F5' }]}>
            <Text style={{ fontSize: 12 }}>{fuelEmoji()}</Text>
            <Text style={[styles.fuelText, { color: scheme.textSecondary, textTransform: 'capitalize' }]}>{vehicle.fuelType}</Text>
          </View>

          {vehicle.mileage && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: scheme.textPrimary }]}>{vehicle.mileage}</Text>
              <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>km/l</Text>
            </View>
          )}

          {vehicle.odometerReading && (
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: scheme.textPrimary }]}>{(vehicle.odometerReading / 1000).toFixed(0)}k</Text>
              <Text style={[styles.statLabel, { color: scheme.textTertiary }]}>km</Text>
            </View>
          )}

          {/* Compliance badges */}
          <View style={styles.badges}>
            {vehicle.insuranceExpiry && (
              <StatusBadge type="insurance" date={vehicle.insuranceExpiry} compact />
            )}
            {vehicle.pucExpiry && (
              <StatusBadge type="puc" date={vehicle.pucExpiry} compact />
            )}
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14, borderRadius: 20,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 8 },
      android: { elevation: 3 },
    }),
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '700' },
  type: { fontSize: 12, marginTop: 2 },
  reg: { fontSize: 11, marginTop: 1, fontFamily: Platform.OS === 'ios' ? 'SF Mono' : 'monospace' },
  tag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  tagText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8 },
  divider: { height: 0.5, marginVertical: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'nowrap' },
  fuelBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12,
  },
  fuelText: { fontSize: 11, fontWeight: '700' },
  statItem: { alignItems: 'center', paddingHorizontal: 4 },
  statValue: { fontSize: 15, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600' },
  badges: { flexDirection: 'row', gap: 6, marginLeft: 'auto' },
});
