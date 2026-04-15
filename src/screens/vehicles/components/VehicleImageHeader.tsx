/**
 * Vehicle Image Header — premium image display with gradient fallback
 */

import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme } from '@/theme/color';
import { getVehicleImageUrl, getVehicleFallbackGradient } from '../utils/vehicleImages';
import type { Vehicle, VehicleType } from '@/src/types';

const SIZES = {
  card: { height: 100, radius: 20 },
  detail: { height: 200, radius: 0 },
  empty: { height: 160, radius: 80, width: 160 },
};

interface Props {
  vehicle?: Vehicle;
  type?: VehicleType;
  size: 'card' | 'detail' | 'empty';
  imageIndex?: number;
  uploadedImageUrl?: string;
  showCameraIcon?: boolean;
  onCameraPress?: () => void;
}

export default function VehicleImageHeader({ vehicle, type, size, imageIndex, uploadedImageUrl, showCameraIcon, onCameraPress }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const config = SIZES[size];
  const vType: VehicleType = vehicle?.type || type || 'other';
  const [c1, c2] = getVehicleFallbackGradient(vType);
  const imageUrl = useMemo(() => {
    if (vehicle) return getVehicleImageUrl(vehicle.type, imageIndex);
    if (type) return getVehicleImageUrl(type, imageIndex);
    return null;
  }, [vehicle, type, imageIndex]);

  if (size === 'empty') {
    return (
      <View style={[styles.emptyWrap, { width: SIZES.empty.width, height: SIZES.empty.height }]}>
        <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFill} />
        {imageUrl && (
          <Image
            source={{ uri: imageUrl }}
            style={StyleSheet.absoluteFill}
            cachePolicy="memory-disk"
            transition={300}
          />
        )}
      </View>
    );
  }

  if (size === 'detail') {
    return (
      <View style={[styles.detailWrap, { height: config.height }]}>
        <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFill} />
        {uploadedImageUrl ? (
          <Image
            source={{ uri: uploadedImageUrl }}
            style={styles.detailImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={400}
          />
        ) : imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.detailImage}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={400}
          />
        ) : null}
        <View style={[styles.detailOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.35)' }]} />
        {showCameraIcon && (
          <TouchableOpacity
            style={styles.cameraBadge}
            onPress={onCameraPress}
            activeOpacity={0.7}
          >
            <Camera size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  // Card size
  return (
    <View style={[styles.cardWrap, {
      height: config.height,
      borderRadius: config.radius,
      backgroundColor: `${c1}10`,
      borderColor: `${c1}20`,
    }]}>
      <LinearGradient colors={[c1, c2]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
      {uploadedImageUrl ? (
        <Image
          source={{ uri: uploadedImageUrl }}
          style={[styles.cardImage, { borderRadius: config.radius }]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      ) : imageUrl && (
        <Image
          source={{ uri: imageUrl }}
          style={[styles.cardImage, { borderRadius: config.radius }]}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={300}
        />
      )}
      {showCameraIcon && (
        <TouchableOpacity
          style={styles.cameraBadge}
          onPress={onCameraPress}
          activeOpacity={0.7}
        >
          <Camera size={20} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  emptyWrap: { borderRadius: 80, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  detailWrap: { width: '100%', overflow: 'hidden', position: 'relative' },
  detailImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    height: '100%',
    ...Platform.select({ ios: { backdropFilter: 'blur(2px)' as any } }),
  },
  cardWrap: { overflow: 'hidden', borderWidth: 1 },
  cardImage: { width: '100%', height: '100%' },
  cameraBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
});
