import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SmartInsight } from './types';
import { useTheme } from '@/theme/themeProvider';
import { getColorScheme } from '@/theme/color';
import { BorderRadius } from '@/constants/designTokens';

interface Props {
  insights: SmartInsight[];
}

export default function SmartInsightsSection({ insights }: Props) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  if (!insights.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>Smart Insights</Text>
        <View style={[styles.headerLine, { backgroundColor: '#F59E0B', opacity: 0.5 }]} />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={280}
        decelerationRate="fast"
      >
        {insights.map((insight) => (
          <TouchableOpacity
            key={insight.id}
            style={[styles.insightCard, { backgroundColor: scheme.cardBackground }]}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrap, { backgroundColor: `${insight.color}15` }]}>
              <Text style={{ fontSize: 22 }}>{insight.icon}</Text>
            </View>
            <Text style={[styles.insightTitle, { color: scheme.textPrimary }]} numberOfLines={2}>
              {insight.title}
            </Text>
            <Text style={[styles.insightSub, { color: scheme.textTertiary }]} numberOfLines={2}>
              {insight.subtitle}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  header: { paddingHorizontal: 4, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.5 },
  headerLine: { height: 3, borderRadius: 2, width: 30, marginTop: 6 },
  scrollContent: { gap: 12, paddingHorizontal: 2 },
  insightCard: {
    width: 260,
    padding: 16,
    borderRadius: BorderRadius.card,
    gap: 8,
    marginRight: 4,
  },
  iconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  insightTitle: { fontSize: 14, fontWeight: '700' },
  insightSub: { fontSize: 12, fontWeight: '400' },
});
