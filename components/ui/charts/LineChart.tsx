// @ts-nocheck
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Path, G, Circle, Line, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Animated, {
  useSharedValue,
  withTiming,
  withSpring,
  runOnJS,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '@/theme/color';
import { Spacing, Typography, BorderRadius, Elevation, Animation } from '@/constants/designTokens';
import { ChartContainer } from './ChartContainer';

interface ChartDataPoint {
  month: string;
  value: number;
}

interface LineDataset {
  key: string;
  label: string;
  color: string;
}

interface LineChartProps {
  title?: string;
  data: ChartDataPoint[];
  lines: LineDataset[];
  yAxisLabel?: string;
  height?: number;
  testID?: string;
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

/**
 * Premium animated Line Chart with iOS 18+ design
 * Features: gradient fill, animated line drawing, interactive data points, tooltip
 */
export const LineChart: React.FC<LineChartProps> = ({
  title,
  data,
  lines,
  yAxisLabel = 'Amount',
  height = 280,
  testID,
}) => {
  const [tooltip, setTooltip] = useState<{
    x: number;
    y: number;
    value: number;
    month: string;
    visible: boolean;
  } | null>(null);

  const animatedProgress = useSharedValue(0);
  const chartWidth = Dimensions.get('window').width - 60; // Account for padding

  const {
    maxValue,
    yScale,
    xStep,
    gridLines,
    linePath,
    dataPoints,
  } = useMemo(() => {
    if (data.length === 0) {
      return {
        maxValue: 0,
        yScale: 1,
        xStep: 0,
        gridLines: [],
        linePath: '',
        dataPoints: [],
      };
    }

    const padding = 40; // Padding for y-axis labels
    const innerWidth = chartWidth - padding * 2;
    const innerHeight = height - 40 - 30; // Leave room for x-axis labels

    const values = data.map(d => d.value);
    const maxValue = Math.max(...values) * 1.1; // 10% padding

    const xStep = innerWidth / Math.max(data.length - 1, 1);
    const yScale = innerHeight / maxValue;

    // Generate grid lines (5 horizontal lines)
    const gridLines = [];
    for (let i = 0; i <= 4; i++) {
      const y = innerHeight - (i * innerHeight / 4);
      gridLines.push({ y, value: (i * maxValue / 4).toFixed(0) });
    }

    // Build line path
    let pathData = '';
    const dataPoints = data.map((point, index) => {
      const x = padding + index * xStep;
      const y = innerHeight - point.value * yScale;

      if (index === 0) {
        pathData += `M ${x} ${y}`;
      } else {
        // Smooth curve using quadratic bezier
        const prevX = padding + (index - 1) * xStep;
        const prevY = innerHeight - data[index - 1].value * yScale;
        const cpX = (prevX + x) / 2;
        const cpY = prevY;
        pathData += ` Q ${cpX} ${cpY}, ${x} ${y}`;
      }

      return { x, y, value: point.value, month: point.month };
    });

    return { maxValue, yScale, xStep, gridLines, linePath: pathData, dataPoints };
  }, [data, chartWidth, height]);

  // Animate line drawing on mount
  useEffect(() => {
    animatedProgress.value = 0;
    animatedProgress.value = withTiming(1, {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
    });
  }, [data]);

  // Calculate animated stroke properties directly from shared value
  const getStrokeDashoffset = () => {
    const strokeDasharray = Math.sqrt(chartWidth * chartWidth + height * height);
    return strokeDasharray * (1 - animatedProgress.value);
  };

  const handleDataPointPress = (index: number, point: typeof dataPoints[0]) => {
    setTooltip({
      x: point.x,
      y: point.y,
      value: point.value,
      month: point.month,
      visible: true,
    });

    // Auto-hide after 2 seconds
    setTimeout(() => setTooltip(null), 2000);
  };

  const handleChartPress = () => {
    if (tooltip) {
      setTooltip(null);
    }
  };

  if (!data || data.length === 0) {
    return (
      <ChartContainer title={title} isEmpty emptyMessage="No spending data yet">
        <View style={styles.emptyChartContent}>
          <Text style={styles.emptyChartText}>Add bills to see spending trends</Text>
        </View>
      </ChartContainer>
    );
  }

  const chartContentHeight = height - 40; // Space for x-axis labels

  return (
    <ChartContainer title={title} testID={testID}>
      <View style={styles.chartWrapper}>
        {/* Y-Axis Labels */}
        <View style={styles.yAxisContainer}>
          {gridLines.map((line, index) => (
            <Text key={index} style={styles.yAxisLabel}>
              {yAxisLabel}
              {formatCompactNumber(line.value)}
            </Text>
          ))}
        </View>

        {/* Chart Area */}
        <View style={[styles.chartArea, { width: chartWidth, height: chartContentHeight }]}>
          {/* Grid Lines */}
          {gridLines.map((line, index) => (
            <Line
              key={index}
              x1={40}
              y1={line.y}
              x2={chartWidth - 20}
              y2={line.y}
              stroke={Colors.border}
              strokeWidth={1}
              strokeDasharray={index === 0 ? '0' : '4,4'} // Solid bottom line, dashed others
            />
          ))}

          {/* Animated Line */}
          <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <LinearGradient id="lineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={Colors.primary} stopOpacity={0.3} />
                <Stop offset="100%" stopColor={Colors.primary} stopOpacity={0.0} />
              </LinearGradient>
            </Defs>

            {/* Gradient fill under line */}
            <Path
              d={`${linePath} L ${dataPoints[dataPoints.length - 1]?.x || 0} ${chartContentHeight} L ${dataPoints[0]?.x || 0} ${chartContentHeight} Z`}
              fill="url(#lineGradient)"
              opacity={0.3}
            />

            {/* Main line with drawing animation */}
            <AnimatedPath
              d={linePath}
              fill="none"
              stroke={Colors.primary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={Math.sqrt(chartWidth * chartWidth + height * height)}
              strokeDashoffset={getStrokeDashoffset()}
            />

            {/* Data points */}
            {dataPoints.map((point, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => handleDataPointPress(index, point)}
                activeOpacity={1}
              >
                <Circle
                  cx={point.x}
                  cy={point.y}
                  r={6}
                  fill={Colors.surface}
                  stroke={Colors.primary}
                  strokeWidth={3}
                />
              </TouchableOpacity>
            ))}
          </Svg>

          {/* Tooltip */}
          {tooltip && (
            <Animated.View
              style={[
                styles.tooltip,
                {
                  left: tooltip.x - 40,
                  top: tooltip.y - 60,
                  opacity: withTiming(1, { duration: 150 }),
                },
              ]}
            >
              <Text style={styles.tooltipMonth}>{tooltip.month}</Text>
              <Text style={styles.tooltipValue}>₹{formatCompactCurrency(tooltip.value)}</Text>
            </Animated.View>
          )}
        </View>

        {/* X-Axis Labels */}
        <View style={styles.xAxisContainer}>
          {data.map((point, index) => (
            <Text key={index} style={styles.xAxisLabel} numberOfLines={1}>
              {point.month.length > 6 ? point.month.substring(0, 3) : point.month}
            </Text>
          ))}
        </View>
      </View>
    </ChartContainer>
  );
};

const formatCompactNumber = (value: number): string => {
  if (value >= 10000000) {
    return (value / 10000000).toFixed(2) + 'Cr';
  } else if (value >= 100000) {
    return (value / 100000).toFixed(2) + 'L';
  } else if (value >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  return Math.round(value).toString();
};

const styles = StyleSheet.create({
  chartWrapper: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  yAxisContainer: {
    width: 60,
    justifyContent: 'space-between',
    paddingRight: Spacing.sm,
  },
  yAxisLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textTertiary,
    textAlign: 'right',
    lineHeight: 20,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  xAxisContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginTop: Spacing.sm,
    marginLeft: 60, // Align with chart area
  },
  xAxisLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },
  tooltip: {
    position: 'absolute',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
    minWidth: 80,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tooltipMonth: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  tooltipValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyChartContent: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    fontSize: Typography.fontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});

export default LineChart;
