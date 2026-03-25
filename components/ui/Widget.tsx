import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../../theme/color';

interface WidgetProps {
  title: string;
  count: string | number;
  amount: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  isMoney?: boolean;
  onPress?: () => void;
  trending?: boolean;
  trendValue?: number;
}

export const Widget: React.FC<WidgetProps> = ({
  title,
  count,
  amount,
  icon,
  iconColor = Colors.primary,
  isMoney = false,
  onPress,
  trending = false,
  trendValue = 0,
}) => {
  const handlePress = () => {
    onPress?.();
  };

  return (
    <TouchableOpacity
      style={styles.widget}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Left Content */}
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{count}</Text>
        {trending && (
          <View style={styles.trendContainer}>
            <Text style={[
              styles.trendText,
              { color: trendValue > 0 ? Colors.danger : Colors.success }
            ]}>
              {trendValue > 0 ? '↑' : '↓'} {Math.abs(trendValue)}%
            </Text>
          </View>
        )}
      </View>

      {/* Right Content */}
      <View style={styles.right}>
        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {isMoney ? '₹' : ''}{amount}
          </Text>
        </View>
        <View style={[styles.iconWrapper, { backgroundColor: `${iconColor}20` }]}>
          {icon}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  widget: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginVertical: 8,
    marginHorizontal: 8,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    minHeight: 120,
  },
  left: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  subtitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  trendContainer: {
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  right: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  amountContainer: {
    marginBottom: 8,
  },
  amount: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
