import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/theme/themeProvider';
import { BorderRadius } from '@/constants/designTokens';

interface ShimmerCardProps {
  variant?: 'appliance' | 'summary' | 'insight';
}

export default function ShimmerCard({ variant = 'appliance' }: ShimmerCardProps) {
  const { isDark } = useTheme();
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const bgColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  if (variant === 'summary') {
    return (
      <View style={[styles.card, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#FFF' }]}>
        <Animated.View style={[styles.row, styles.summaryRow, { opacity: anim }]}>
          <View style={[styles.placeholder, { width: 44, height: 44, borderRadius: 12, backgroundColor: bgColor }]} />
          <View style={[styles.placeholder, { width: 80, height: 16, borderRadius: 4, backgroundColor: bgColor }]} />
        </Animated.View>
        <Animated.View style={[styles.row, { opacity: anim }]}>
          <View style={[styles.placeholder, { width: 60, height: 28, borderRadius: 8, backgroundColor: bgColor }]} />
          <View style={[styles.placeholder, { width: 60, height: 12, borderRadius: 4, backgroundColor: bgColor }]} />
        </Animated.View>
      </View>
    );
  }

  if (variant === 'insight') {
    return (
      <View style={[styles.insightShimmer, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#FFF' }]}>
        <Animated.View style={[styles.row, { opacity: anim }]}>
          <View style={[styles.placeholder, { width: 40, height: 40, borderRadius: 12, backgroundColor: bgColor }]} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={[styles.placeholder, { width: '70%', height: 14, borderRadius: 4, backgroundColor: bgColor }]} />
            <View style={[styles.placeholder, { width: '90%', height: 10, borderRadius: 4, backgroundColor: bgColor, marginTop: 6 }]} />
          </View>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={[styles.card, styles.row, { backgroundColor: isDark ? 'rgba(28,28,30,0.8)' : '#FFF' }]}>
      <Animated.View style={[styles.imageShimmer, { backgroundColor: bgColor, opacity: anim }]} />
      <View style={styles.info}>
        <Animated.View style={[styles.placeholder, { width: '60%', height: 16, borderRadius: 4, backgroundColor: bgColor, opacity: anim }]} />
        <Animated.View style={[styles.placeholder, { width: '40%', height: 12, borderRadius: 4, backgroundColor: bgColor, marginTop: 8 }]} />
        <Animated.View style={[styles.placeholder, { width: '30%', height: 10, borderRadius: 4, backgroundColor: bgColor, marginTop: 12 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: BorderRadius.card, padding: 16, gap: 10, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  summaryRow: { gap: 12, flex: 1 },
  insightShimmer: { borderRadius: BorderRadius.md, padding: 14 },
  imageShimmer: { width: 72, height: 72, borderRadius: 16 },
  placeholder: {},
  info: { flex: 1, marginLeft: 14, gap: 6 },
});
