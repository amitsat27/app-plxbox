// components/ui/GlassContainer.tsx
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '../../theme/color';

interface GlassProps {
  children: React.ReactNode;
  intensity?: number;
  style?: any;
}

export const GlassContainer = ({ children, intensity = 30, style }: GlassProps) => {
  return (
    <View style={[styles.wrapper, style]}>
      {Platform.OS === 'ios' ? (
        <BlurView intensity={intensity} tint="extraLight" style={styles.blur}>
          {children}
        </BlurView>
      ) : (
        <View style={styles.androidFallback}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  blur: {
    padding: 20,
  },
  androidFallback: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});