/**
 * Consumer Info Section — BP details cards
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { IdCard, User, Flame, Phone, MapPin } from 'lucide-react-native';
import { Spacing } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';
import { InfoItem } from './DropdownRow';

interface GasConsumerInfo {
  BPNumber: string;
  BPName: string;
  registeredMobile: string;
  MeterNumber: string;
  location: string;
  city: string;
}

export default function GasInfoSection({ info }: { info: GasConsumerInfo }) {
  const { isDark } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#FFFFFF' }]}>
      <View style={styles.grid}>
        <InfoItem icon={<IdCard size={18} color="#EF4444" />} label="BP Number" value={info.BPNumber} />
        <InfoItem icon={<User size={18} color="#A78BFA" />} label="BP Name" value={info.BPName} />
        <InfoItem icon={<Flame size={18} color="#F59E0B" />} label="Meter No." value={info.MeterNumber} />
        <InfoItem icon={<Phone size={18} color="#10B981" />} label="Mobile" value={info.registeredMobile} />
        <InfoItem icon={<MapPin size={18} color="#06B6D4" />} label="Location" value={info.city} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    borderRadius: 20,
    padding: Spacing.lg + 2,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-evenly' },
});
