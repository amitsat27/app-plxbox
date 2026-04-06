/**
 * Property Tax — NotifBell
 * Animated notification bell with unread badge
 */
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

export function NotifBell({ count, onPress }: { count: number; onPress: () => void }) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (count > 0) {
      anim = Animated.loop(Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]));
      anim.start();
    }
    return () => { anim?.stop(); };
  }, [count, pulse]);

  return (
    <TouchableOpacity style={styles.bell} onPress={onPress} activeOpacity={0.6}>
      <Animated.View style={{ transform: [{ scale: count > 0 ? pulse : 1 }] }}>
        <Bell size={20} color={scheme.textSecondary} />
      </Animated.View>
      {count > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bell: { padding: 6 },
  badge: {
    position: 'absolute', top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 8,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 3,
    backgroundColor: '#EF4444',
  },
  badgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
});
