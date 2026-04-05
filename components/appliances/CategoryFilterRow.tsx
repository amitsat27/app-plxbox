import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Animated } from 'react-native';
import { ApplianceCategory } from '@/src/types';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme, getApplianceCategoryColor } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';
import { Utensils, Armchair, Bed, Bath, Home } from 'lucide-react-native';

const CATEGORIES: { key: string; label: string; Icon: React.ComponentType<any> }[] = [
  { key: 'all', label: 'All', Icon: Home },
  { key: 'kitchen', label: 'Kitchen', Icon: Utensils },
  { key: 'living', label: 'Living', Icon: Armchair },
  { key: 'bedroom', label: 'Bedroom', Icon: Bed },
  { key: 'bathroom', label: 'Bathroom', Icon: Bath },
];

interface Props {
  selected: string;
  onSelect: (key: string) => void;
}

export default function CategoryFilterRow({ selected, onSelect }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);
  const scrollRef = useRef<ScrollView>(null);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={80}
        decelerationRate="fast"
      >
        {CATEGORIES.map((cat) => {
          const isActive = selected === cat.key;
          const catColor = cat.key !== 'all' ? getApplianceCategoryColor(cat.key as ApplianceCategory) : '#7C3AED';
          return (
            <CategoryChip
              key={cat.key}
              label={cat.label}
              Icon={cat.Icon}
              isActive={isActive}
              color={catColor}
              onPress={() => onSelect(cat.key)}
              isDark={isDark}
              scheme={scheme}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function CategoryChip({ label, Icon, isActive, color, onPress, isDark, scheme }: any) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      damping: 16,
      stiffness: 400,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      damping: 16,
      stiffness: 400,
    }).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], marginRight: 8 }}>
      <CategoryChipContent label={label} Icon={Icon} isActive={isActive} color={color} onPressIn={onPressIn} onPressOut={onPressOut} isDark={isDark} scheme={scheme} />
    </Animated.View>
  );
}

function CategoryChipContent({ label, Icon, isActive, color, onPressIn, onPressOut, isDark, scheme }: any) {
  const content = (
    <View style={[styles.chip, isActive && styles.chipActive, {
      backgroundColor: isActive ? color : (isDark ? 'rgba(28,28,30,0.8)' : '#FFF'),
      borderColor: isActive ? color : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'),
    }]}>
      <Icon size={16} color={isActive ? '#FFF' : scheme.textTertiary} />
      <Text style={[styles.chipText, {
        color: isActive ? '#FFF' : scheme.textTertiary,
      }]}>{label}</Text>
    </View>
  );

  return (
    <View onTouchStart={onPressIn} onTouchEnd={onPressOut}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  scrollContent: { paddingHorizontal: 16, gap: 0 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
  chipActive: {},
  chipText: { fontSize: 13, fontWeight: '600' },
});
