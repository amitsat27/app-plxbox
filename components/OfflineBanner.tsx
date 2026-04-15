// 📡 Offline Banner
// Shows when user is disconnected from internet

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useUIStore } from '@/src/stores/uiStore';
import { Spacing, BorderRadius, Typography } from '@/constants/designTokens';
import { Colors } from '@/theme/color';
import { WifiOff } from 'lucide-react-native';

export const OfflineBanner: React.FC = () => {
  const isOffline = useUIStore((state) => state.isOffline);

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <WifiOff size={16} color="#FFFFFF" />
        <Text style={styles.text}>You&apos;re offline. Some features may be limited.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    backgroundColor: Colors.warning,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  text: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default OfflineBanner;
