/** Consumer information card */
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MapPin, User, Building2, Phone, Zap } from 'lucide-react-native';
import { Spacing } from '@/constants/designTokens';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

export default function ConsumerInfoCard({ info }: { info: any }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={[styles.card, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#FFFFFF' }]}>
      <View style={styles.grid}>
        <InfoItem label="Consumer" value={info.consumerNumber} />
        <InfoItem label="Location" value={info.location} />
        <InfoItem label="Holder" value={info.holderName} />
        <InfoItem label="Billing Unit" value={info.billingUnitNumber} />
        <InfoItem label="Mobile" value={info.registeredMobile} />
        <InfoItem label="Area" value={info.area} />
      </View>
    </View>
  );
}

function InfoItem({ label, value }: { label: string; value?: string }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  const iconMap: Record<string, React.ReactNode> = {
    Consumer: <Phone size={14} color="#A78BFA" />,
    Location: <MapPin size={14} color="#F59E0B" />,
    Holder: <User size={14} color="#10B981" />,
    "Billing Unit": <Building2 size={14} color="#06B6D4" />,
    Mobile: <Phone size={14} color="#EC4899" />,
    Area: <Zap size={14} color="#7C3AED" />,
  };

  return (
    <View style={styles.item}>
      <View style={[styles.iconBg, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
        {iconMap[label]}
      </View>
      <Text style={[styles.itemLabel, { color: scheme.textTertiary }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.itemValue, { color: scheme.textPrimary }]} numberOfLines={2}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: Spacing.lg + 2,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 12 },
      android: { elevation: 3 },
    }),
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-evenly' },
  item: { width: '30%', paddingVertical: Spacing.md, alignItems: 'center', justifyContent: 'center' },
  iconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  itemLabel: { fontSize: 11, fontWeight: '500', marginBottom: 2, textAlign: 'center' },
  itemValue: { fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 20 },
});
