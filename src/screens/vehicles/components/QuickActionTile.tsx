/**
 * Quick Action Tile — bottom section quick access buttons
 */

import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme/themeProvider';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

interface Props {
  icon: React.ReactNode;
  label: string;
  color: string;
  onPress?: () => void;
}

export default function QuickActionTile({ icon, label, color, onPress }: Props) {
  const { isDark } = useTheme();
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.92, { damping: 18 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 18 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={1}
      onPress={onPress}
    >
      <View style={[styles.iconBox, { backgroundColor: `${color}${isDark ? '15' : '12' }` }]}>
        {icon}
      </View>
      <Text style={[styles.label, { color: isDark ? '#94A3B8' : '#6B7280' }]}>{label}</Text>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 6 },
  iconBox: {
    width: 52, height: 52, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },
});
