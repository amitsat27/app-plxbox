import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Appliance } from '@/src/types';
import { useTheme } from '@/theme/themeProvider';
import { Colors, getColorScheme, getApplianceCategoryColor } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import { getApplianceImage, getCategoryEmoji, getCategoryLabel, formatINR, daysBetween } from './utils';
import { Shield, AlertTriangle, Package } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ApplianceCardProps {
  appliance: Appliance;
}

export default function ApplianceCard({ appliance }: ApplianceCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const catColor = getApplianceCategoryColor(appliance.category);
  const imageUrl = getApplianceImage(appliance);

  const onPressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, damping: 24, stiffness: 300 }).start();
  };

  const onPressOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 24, stiffness: 300 }).start();
    router.push(`/appliance-detail?applianceId=${appliance.id}`);
  };

  const warrantyDays = appliance.warrantyExpiry ? daysBetween(new Date(), appliance.warrantyExpiry) : null;
  const amcDays = appliance.amcExpiry ? daysBetween(new Date(), appliance.amcExpiry) : null;

  const warrantyStatus = warrantyDays !== null
    ? warrantyDays > 60 ? 'active' : warrantyDays > 0 ? 'expiring' : 'expired'
    : null;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, {
          backgroundColor: scheme.cardBackground,
        }]}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="cover"
              onError={() => {
              }}
            />
          ) : (
            <View style={[styles.imagePlaceholder, { backgroundColor: `${catColor}15` }]}>
              <Text style={{ fontSize: 32 }}>{getCategoryEmoji(appliance.category)}</Text>
            </View>
          )}
          {/* Category Pill */}
          <View style={[styles.categoryPill, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.9)' }]}>
            <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
            <Text style={[styles.categoryText, { color: scheme.textSecondary }]}>
              {getCategoryLabel(appliance.category)}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: scheme.textPrimary }]} numberOfLines={1}>
            {appliance.name}
          </Text>
          <Text style={[styles.brandModel, { color: scheme.textTertiary }]} numberOfLines={1}>
            {appliance.brand} · {appliance.model}
          </Text>
        </View>

        {/* Status Badges Row */}
        {(warrantyStatus || amcDays !== null) && (
          <View style={styles.badgesRow}>
            {warrantyStatus && (
              <View style={[styles.badge, {
                backgroundColor: warrantyStatus === 'active' ? `${Colors.success}15` :
                  warrantyStatus === 'expiring' ? `${Colors.warning}15` :
                  `${Colors.error}15`,
              }]}>
                {warrantyStatus === 'active' ? (
                  <Shield size={12} color={Colors.success} />
                ) : (
                  <AlertTriangle size={12} color={warrantyStatus === 'expiring' ? Colors.warning : Colors.error} />
                )}
                <Text style={[styles.badgeText, {
                  color: warrantyStatus === 'active' ? Colors.success :
                    warrantyStatus === 'expiring' ? Colors.warning : Colors.error,
                }]}>
                  {warrantyStatus === 'active' ? `${warrantyDays}d left` :
                    warrantyStatus === 'expiring' ? `Expires in ${warrantyDays}d` :
                    'Expired'}
                </Text>
              </View>
            )}

            {amcDays !== null && (
              <View style={[styles.badge, {
                backgroundColor: amcDays > 30 ? `${Colors.info}15` :
                  amcDays > 0 ? `${Colors.warning}15` :
                  `${Colors.error}15`,
              }]}>
                <Package size={12} color={amcDays > 30 ? Colors.info : amcDays > 0 ? Colors.warning : Colors.error} />
                <Text style={[styles.badgeText, {
                  color: amcDays > 30 ? Colors.info : amcDays > 0 ? Colors.warning : Colors.error,
                }]}>
                  AMC {amcDays > 0 ? `${amcDays}d` : 'Expired'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.price, { color: scheme.textPrimary }]}>
            {formatINR(appliance.purchasePrice)}
          </Text>
          <View style={[styles.locationBadge, { backgroundColor: `${catColor}10` }]}>
            <Text style={[styles.locationText, { color: catColor }]}>
              {appliance.location.charAt(0).toUpperCase() + appliance.location.slice(1)}
            </Text>
          </View>
        </View>

        {/* Active/Inactive indicator */}
        {!appliance.isActive && (
          <View style={[styles.inactiveOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.6)' }]}>
            <Text style={[styles.inactiveText, { color: scheme.textTertiary }]}>Inactive</Text>
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.card,
    overflow: 'hidden',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: { position: 'relative', height: 160 },
  image: { width: '100%', height: '100%' },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryText: { fontSize: 11, fontWeight: '600' },
  info: { padding: 14, paddingBottom: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  brandModel: { fontSize: 13, marginTop: 2 },
  badgesRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  badgeText: { fontSize: 11, fontWeight: '600' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10 },
  price: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  locationBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  locationText: { fontSize: 12, fontWeight: '600' },
  inactiveOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inactiveText: { fontSize: 18, fontWeight: '700' },
});
