/**
 * Vehicle Card — redesigned with cleaner layout
 */

import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { getVehicleTypeColor } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { getVehicleImageUrl } from '../utils/vehicleImages';
import { formatOdometer } from '../utils/formatNumbers';
import { FUEL_EMOJI_MAP } from '../utils/vehicleImages';
import type { Vehicle } from '@/src/types';
import StatusBadge from './StatusBadge';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  vehicle: Vehicle;
  onPress: () => void;
  index?: number;
}

export default function VehicleCard({ vehicle, onPress, index = 0 }: Props) {
  const { isDark } = useTheme();
  const scale = useSharedValue(0.97);
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
    scale.value = withSpring(0.98, { damping: 15 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15 });
  }, []);

  const accentColor = getVehicleTypeColor(vehicle.type);
  const rowBorder = isDark ? '#1E1E20' : '#E8E8ED';
  const fuelEmoji = FUEL_EMOJI_MAP[vehicle.fuelType] || '⛽';

  return (
    <AnimatedTouchableOpacity activeOpacity={0.88} onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.card, {
        backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
        ...Platform.select({
          ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: isDark ? 0.3 : 0.06, shadowRadius: 8 },
          android: { elevation: 2 },
        }),
      }, cardAnimatedStyle]}>
        {/* Accent border strip */}
        <View style={[styles.accentBorder, { backgroundColor: accentColor }]} />

        {/* Image area */}
        <View style={[styles.imageWrap, { backgroundColor: `${accentColor}10` }]}>
          <Image
            source={{ uri: getVehicleImageUrl(vehicle.type, index) }}
            style={styles.cardImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />
          <View style={[styles.statusPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.85)' }]}>
            <View style={[styles.statusDot, { backgroundColor: vehicle.isActive ? '#10B981' : '#94A3B8' }]} />
            <Text style={[styles.statusText, { color: vehicle.isActive ? '#10B981' : '#94A3B8' }]}>
              {vehicle.isActive ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.name, { color: isDark ? '#F8FAFC' : '#1E293B' }]} numberOfLines={1}>{vehicle.name}</Text>
              <Text style={[styles.subtitle, { color: isDark ? '#A1A1AA' : '#64748B' }]} numberOfLines={1}>
                {vehicle.make} {vehicle.model} {String(vehicle.year)}{vehicle.registrationNumber ? `  ${vehicle.registrationNumber}` : ''}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: rowBorder }]} />

          <View style={styles.footer}>
            <View style={[styles.fuelBadge, { backgroundColor: `${accentColor}10` }]}>
              <Text style={{ fontSize: 11 }}>{fuelEmoji}</Text>
              <Text style={[styles.fuelText, { color: accentColor, textTransform: 'capitalize' }]}>{vehicle.fuelType}</Text>
            </View>

            {vehicle.odometerReading && (
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{formatOdometer(vehicle.odometerReading)}</Text>
                <Text style={styles.statLabel}>km</Text>
              </View>
            )}

            {vehicle.mileage && (
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>{vehicle.mileage}</Text>
                <Text style={styles.statLabel}>km/l</Text>
              </View>
            )}

            <View style={styles.compliance}>
              {vehicle.insuranceExpiry && <StatusBadge type="insurance" date={vehicle.insuranceExpiry} compact showDot />}
              {vehicle.pucExpiry && <StatusBadge type="puc" date={vehicle.pucExpiry} compact showDot />}
            </View>
          </View>
        </View>
      </Animated.View>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 10,
  },
  accentBorder: { position: 'absolute', top: 0, left: 0, right: 0, height: 2, zIndex: 10 },
  imageWrap: { height: 110, overflow: 'hidden' },
  cardImage: { width: '100%', height: '100%' },
  statusPill: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12,
  },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  content: { padding: 12, gap: 0 },
  headerRow: { marginBottom: 4 },
  name: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, lineHeight: 16 },
  divider: { height: 0.5, marginVertical: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fuelBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  fuelText: { fontSize: 10, fontWeight: '700' },
  stat: { alignItems: 'center', paddingHorizontal: 4 },
  statValue: { fontSize: 12, fontWeight: '800', lineHeight: 16 },
  statLabel: { fontSize: 8, color: '#8B8B93', fontWeight: '600' },
  compliance: { flexDirection: 'row', gap: 5, marginLeft: 'auto' },
});
