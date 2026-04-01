// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions, Platform } from 'react-native';
import Svg, { Circle, Path, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';

// Note: Animated.Svg components require Reanimated plugin + react-native-svg
// On web, standard SVG attributes work. On native, we need createAnimatedComponent.
let AnimatedPathComponent: any;
if (Platform.OS === 'web') {
  // On web, standard Path works with animated props through Reanimated's web adapter
  AnimatedPathComponent = Path;
} else {
  // On native, need to create animated component
  AnimatedPathComponent = Animated.createAnimatedComponent(Path);
}

const AnimatedPath = Animated.createAnimatedComponent(Path);
import { Colors } from '@/theme/color';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';

interface DonutDataPoint {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  title?: string;
  data: DonutDataPoint[];
  size?: number;
  innerRadius?: number;
  onSegmentPress?: (index: number, data: DonutDataPoint) => void;
  testID?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Premium Donut Chart with iOS 18+ animations
 * Features: animated arc drawing, center total, interactive segments, elegant legend
 */
export const DonutChart: React.FC<DonutChartProps> = ({
  title,
  data,
  size = 260,
  innerRadius = 80,
  onSegmentPress,
  testID,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const animatedProgress = useSharedValue(0);

  const total = useMemo(() => {
    return data.reduce((sum, item) => sum + item.value, 0);
  }, [data]);

  const processedData = useMemo(() => {
    if (total === 0 || !isFinite(total)) return [];

    let currentAngle = -90; // Start from top (12 o'clock position)
    const result = [];

    for (const item of data) {
      // Validate value
      const value = typeof item.value === 'number' && isFinite(item.value) ? item.value : 0;
      if (value <= 0) continue; // Skip invalid/zero values

      const percentage = value / total;
      const arcAngle = percentage * 360;

      // Guard against NaN/Infinity
      if (!isFinite(arcAngle) || isNaN(arcAngle)) continue;

      const endAngle = currentAngle + arcAngle;

      result.push({
        ...item,
        value, // use validated value
        percentage,
        startAngle: currentAngle,
        endAngle,
        midAngle: currentAngle + arcAngle / 2,
      });

      currentAngle = endAngle;
    }

    return result;
  }, [data, total]);

  // Animate on mount/data change
  useEffect(() => {
    animatedProgress.value = 0;
    animatedProgress.value = withTiming(1, {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
    });
  }, [data]);

  const radius = size / 2;
  const strokeWidth = radius - innerRadius;
  const centerX = radius;
  const centerY = radius;

  // Convert polar to cartesian coordinates
  const polarToCartesian = (cx: number, cy: number, r: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: cx + r * Math.cos(angleInRadians),
      y: cy + r * Math.sin(angleInRadians),
    };
  };

  // Create arc path
  const describeArc = (startAngle: number, endAngle: number, r: number) => {
    if (endAngle - startAngle >= 360) {
      // Full circle
      return '';
    }

    const start = polarToCartesian(centerX, centerY, r, endAngle);
    const end = polarToCartesian(centerX, centerY, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? 0 : 1;

    return [
      'M',
      start.x,
      start.y,
      'A',
      r,
      r,
      0,
      largeArcFlag,
      0,
      end.x,
      end.y,
    ].join(' ');
  };

  const handlePress = (index: number, item: typeof processedData[0]) => {
    setSelectedIndex(index);
    onSegmentPress?.(index, item);
  };

  if (!data || data.length === 0 || total === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data to display</Text>
      </View>
    );
  }

  return (
    <View style={styles.wrapper} testID={testID}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          {processedData.map((item, index) => (
            <LinearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={item.color} stopOpacity={selectedIndex === index ? 1 : 0.9} />
              <Stop offset="100%" stopColor={item.color} stopOpacity={selectedIndex === index ? 0.8 : 0.7} />
            </LinearGradient>
          ))}
        </Defs>

        <G rotation="-90" origin={centerX + ',' + centerY}>
          {processedData.map((item, index) => {
            const isSelected = selectedIndex === index;

            // Calculate static path based on current progress (no useAnimatedProps)
            const progress = animatedProgress.value;
            const currentEndAngle = item.startAngle + (item.endAngle - item.startAngle) * progress;
            const path = progress > 0 && isFinite(currentEndAngle)
              ? describeArc(item.startAngle, currentEndAngle, radius)
              : '';

            return (
              <TouchableOpacity key={index} onPress={() => handlePress(index, item)} activeOpacity={0.8}>
                <AnimatedPathComponent
                  d={path}
                  fill="none"
                  stroke={`url(#gradient-${index})`}
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  opacity={isSelected ? 1 : 0.9}
                  style={[styles.segment, selectedIndex === index && styles.selectedSegment]}
                />
              </TouchableOpacity>
            );
          })}

          {/* Inner circle for donut hole */}
          <Circle
            cx={centerX}
            cy={centerY}
            r={innerRadius - strokeWidth / 2}
            fill={Colors.surface}
          />
        </G>
      </Svg>

      {/* Center total display overlay */}
      <View style={[styles.centerOverlay, { width: innerRadius * 2, height: innerRadius * 2 }]}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>₹{formatCompactCurrency(total)}</Text>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {processedData.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.legendItem, selectedIndex === index && styles.legendItemSelected]}
            onPress={() => handlePress(index, item)}
            activeOpacity={0.7}
          >
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <View style={styles.legendContent}>
              <Text style={styles.legendName}>{item.name}</Text>
              <Text style={styles.legendValue}>
                ₹{formatCompactCurrency(item.value)} ({formatPercentage(item.percentage * 100)}%)
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const formatCompactCurrency = (value: number): string => {
  if (value >= 10000000) {
    return (value / 10000000).toFixed(2) + 'Cr';
  } else if (value >= 100000) {
    return (value / 100000).toFixed(2) + 'L';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return value.toFixed(0);
};

const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  emptyContainer: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
  },
  segment: {
    // Note: animations are handled via AnimatedProps, not CSS transitions
  },
  selectedSegment: {
    strokeWidth: 4, // Slightly thicker when selected
  },
  centerOverlay: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -90, // centerX - innerRadius + adjustment
    marginTop: -50, // centerY - innerRadius + adjustment
    justifyContent: 'center',
    alignItems: 'center',
    // Will be positioned relative to parent
  },
  totalLabel: {
    fontSize: Typography.presets.caption1.fontSize,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  totalValue: {
    fontSize: Typography.fontSize.xxl,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  legend: {
    width: '100%',
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    ...Platform.select({
      ios: {
        shadowColor: Colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  legendItemSelected: {
    backgroundColor: Colors.selected,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
    marginRight: Spacing.sm,
  },
  legendContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  legendName: {
    fontSize: Typography.fontSize.md,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  legendValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
});


export default DonutChart;
