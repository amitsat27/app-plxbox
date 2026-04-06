/**
 * Vehicle Type Icon — colored icon circle for vehicle type display
 */

import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Car, Bike, Truck, HelpCircle, type LucideIcon } from 'lucide-react-native';
import { getVehicleTypeColor } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import type { VehicleType } from '@/src/types';

const ICON_MAP: Record<VehicleType, LucideIcon> = {
  car: Car,
  bike: Bike,
  truck: Truck,
  other: HelpCircle,
};

const EMOJI_MAP: Record<VehicleType, string> = {
  car: '🚗',
  bike: '🏍️',
  truck: '🚛',
  other: '🚘',
};

interface Props {
  type: VehicleType;
  size?: number;
  showEmoji?: boolean;
  onPress?: () => void;
}

export default function VehicleTypeIcon({ type, size = 48, showEmoji = false, onPress }: Props) {
  const { isDark } = useTheme();
  const color = getVehicleTypeColor(type);
  const Icon = ICON_MAP[type] || HelpCircle;

  const content = (
    <View style={[styles.container, { width: size, height: size, backgroundColor: `${color}12` }]}>
      {showEmoji ? (
        <Text style={{ fontSize: size * 0.55 }}>{EMOJI_MAP[type]}</Text>
      ) : (
        <Icon size={size * 0.45} color={color} />
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => { Haptics.selectionAsync(); onPress(); }}
        style={{
          borderRadius: size / 3,
          ...Platform.select({ ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4 }, android: { elevation: 2 } }),
        }}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: { borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
});
