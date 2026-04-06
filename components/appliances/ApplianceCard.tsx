import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Appliance, ServiceRecord } from '@/src/types';
import { useTheme } from '@/theme/themeProvider';
import { Colors, getColorScheme, getApplianceCategoryColor } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import { getCategoryEmoji, getCategoryLabel, formatINR, daysBetween, formatDate } from './utils';
import ImageMiniCarousel from '@/components/ui/ImageMiniCarousel';
import { Shield, AlertTriangle, Package, Wrench, Edit2, Plus, List, Eye } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface ApplianceCardProps {
  appliance: Appliance;
  lastServiceRecord?: ServiceRecord;
}

export default function ApplianceCard({ appliance, lastServiceRecord }: ApplianceCardProps) {
  const router = useRouter();
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const catColor = getApplianceCategoryColor(appliance.category);
  const hasImages = appliance.images && appliance.images.length > 0;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, damping: 24, stiffness: 300 }).start(() => {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, damping: 24, stiffness: 300 }).start();
    });
  };

  const handleView = () => {
    handlePress();
    router.push(`/appliance-detail?applianceId=${appliance.id}`);
  };

  const handleEdit = () => {
    Haptics.selectionAsync();
    router.push(`/add-appliance?mode=edit&applianceId=${appliance.id}`);
  };

  const handleServiceHistory = () => {
    Haptics.selectionAsync();
    router.push(`/appliance-detail?applianceId=${appliance.id}`);
  };

  const handleAddService = () => {
    Haptics.selectionAsync();
    router.push(`/add-service-record?applianceId=${appliance.id}&applianceName=${encodeURIComponent(appliance.name)}`);
  };

  const warrantyDays = appliance.warrantyExpiry ? daysBetween(new Date(), appliance.warrantyExpiry) : null;
  const amcDays = appliance.amcExpiry ? daysBetween(new Date(), appliance.amcExpiry) : null;

  // Warranty status color indicator (for the dot on brand/model)
  const warrantyDotColor = warrantyDays !== null
    ? warrantyDays > 60 ? Colors.success
    : warrantyDays > 30 ? Colors.warning
    : Colors.error
    : null;

  // Warranty status for badges
  const warrantyStatus = warrantyDays !== null
    ? warrantyDays > 30 ? 'active' : warrantyDays > 0 ? 'expiring' : 'expired'
    : null;

  const showWarrantyWarning = warrantyStatus === 'expiring' || warrantyStatus === 'expired';

  const lastServicedFormatted = lastServiceRecord
    ? (() => {
        const d = lastServiceRecord.serviceDate instanceof Date ? lastServiceRecord.serviceDate : new Date(lastServiceRecord.serviceDate);
        return formatDate(d);
      })()
    : null;

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <View style={[styles.card, { backgroundColor: scheme.cardBackground }]}>
        {/* Image Section */}
        <View style={styles.imageContainer}>
          {hasImages ? (
            <ImageMiniCarousel
              images={appliance.images.slice(0, 5)}
              width={180}
              height={160}
              borderRadius={0}
              showDots={appliance.images.length > 1}
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
          {/* Warranty Warning Badge */}
          {showWarrantyWarning && (
            <View style={[styles.warningBadge, {
              backgroundColor: warrantyStatus === 'expired' ? Colors.error : Colors.warning,
            }]}>
              <Text style={styles.warningBadgeText}>!</Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={styles.info}>
          <Text style={[styles.name, { color: scheme.textPrimary }]} numberOfLines={1}>
            {appliance.name}
          </Text>
          <View style={[styles.brandModelRow, { backgroundColor: scheme.cardBackground }]}>
            {warrantyDotColor && (
              <View style={[styles.warrantyDot, { backgroundColor: warrantyDotColor }]} />
            )}
            <Text style={[styles.brandModel, { color: scheme.textTertiary }]} numberOfLines={1}>
              {appliance.brand} · {appliance.model}
            </Text>
          </View>
          {lastServicedFormatted && (
            <View style={styles.lastServicedRow}>
              <Wrench size={12} color={Colors.success} />
              <Text style={[styles.lastServicedText, { color: scheme.textTertiary }]}>
                Last serviced: {lastServicedFormatted}
              </Text>
            </View>
          )}
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

        {/* Quick Actions */}
        <View style={styles.quickActionsRow}>
          <TouchableOpacity
            style={[styles.actionButton, styles.viewButton, { backgroundColor: Colors.primary }]}
            onPress={handleView}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Eye size={14} color="#FFF" />
            <Text style={[styles.actionButtonText, { color: '#FFF' }]}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPress={handleEdit}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Edit2 size={14} color={scheme.textSecondary} />
            <Text style={[styles.actionButtonText, { color: scheme.textSecondary }]}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' }]}
            onPress={handleAddService}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Plus size={14} color={Colors.success} />
            <Text style={[styles.actionButtonText, { color: Colors.success }]}>Service</Text>
          </TouchableOpacity>
        </View>

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
      </View>
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
  warningBadge: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningBadgeText: { fontSize: 13, fontWeight: '800', color: '#FFF' },
  info: { padding: 14, paddingBottom: 4 },
  name: { fontSize: 16, fontWeight: '700' },
  brandModelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  brandModel: { fontSize: 13 },
  warrantyDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  lastServicedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  lastServicedText: { fontSize: 11, fontWeight: '500' },
  badgesRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 14, paddingTop: 6 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full },
  badgeText: { fontSize: 11, fontWeight: '600' },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 6,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingVertical: 7,
    paddingHorizontal: 2,
    borderRadius: BorderRadius.md,
    minWidth: 0,
    overflow: 'hidden',
  },
  viewButton: {
    flex: 1.1,
  },
  actionButtonText: { fontSize: 10, fontWeight: '600', flexShrink: 1 },
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
