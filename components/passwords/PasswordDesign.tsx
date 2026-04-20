import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  SlidersHorizontal,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { BorderRadius, Spacing, Typography } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

export type ChipOption = {
  key: string;
  label: string;
};

interface PasswordHeroProps {
  title: string;
  subtitle: string;
  accent?: string;
  icon?: React.ReactNode;
  rightContent?: React.ReactNode;
  statLabel?: string;
  statValue?: string;
  style?: ViewStyle;
}

interface PasswordSearchBarProps {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  onClear?: () => void;
}

interface PasswordChipBarProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

interface PasswordSectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

interface PasswordEmptyStateProps {
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

export function PasswordHero({
  title,
  subtitle,
  accent = Colors.primary,
  icon,
  rightContent,
  statLabel,
  statValue,
  style,
}: PasswordHeroProps) {
  return (
    <LinearGradient
      colors={[`${accent}EE`, `${accent}55`, '#111111']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.hero, style]}
    >
      <View style={styles.heroGlowTop} />
      <View style={styles.heroGlowBottom} />
      <View style={styles.heroTopRow}>
        <View style={styles.heroTitleWrap}>
          <View style={[styles.heroIconBubble, { backgroundColor: 'rgba(255,255,255,0.16)' }]}>
            {icon || <Sparkles size={18} color="#FFF" />}
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSubtitle}>{subtitle}</Text>
          </View>
        </View>
        {rightContent}
      </View>
      {statLabel && statValue && (
        <View style={styles.heroStatRow}>
          <View>
            <Text style={styles.heroStatValue}>{statValue}</Text>
            <Text style={styles.heroStatLabel}>{statLabel}</Text>
          </View>
          <View style={styles.heroChevronWrap}>
            <ChevronRight size={18} color="#FFF" />
          </View>
        </View>
      )}
    </LinearGradient>
  );
}

export function PasswordSearchBar({ value, onChangeText, placeholder, onClear }: PasswordSearchBarProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={[styles.searchShell, { backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : '#F3F4F6' }]}>
      <Search size={18} color={scheme.textTertiary} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={scheme.textTertiary}
        style={[styles.searchInput, { color: scheme.textPrimary }]}
        returnKeyType="search"
      />
      {value.length > 0 && onClear ? (
        <TouchableOpacity
          onPress={onClear}
          style={[styles.searchClearBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.14)' : '#E5E7EB' }]}
        >
          <Text style={[styles.searchClearText, { color: scheme.textPrimary }]}>Clear</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function PasswordChipBar({ options, value, onChange, label }: PasswordChipBarProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.chipSection}>
      {label ? (
        <View style={styles.chipLabelRow}>
          <SlidersHorizontal size={14} color={scheme.textTertiary} />
          <Text style={[styles.chipLabel, { color: scheme.textSecondary }]}>{label}</Text>
        </View>
      ) : null}
      <View style={styles.chipRow}>
        {options.map((option) => {
          const selected = option.key === value;
          return (
            <TouchableOpacity
              key={option.key}
              onPress={() => onChange(option.key)}
              style={[
                styles.chip,
                { backgroundColor: isDark ? 'rgba(44,44,46,0.7)' : '#F3F4F6' },
                selected && styles.chipSelected,
              ]}
            >
              <Text style={[styles.chipText, { color: scheme.textPrimary }, selected && styles.chipTextSelected]}>{option.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function PasswordSectionHeader({ title, subtitle, action }: PasswordSectionHeaderProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={styles.sectionHeader}>
      <View>
        <Text style={[styles.sectionTitle, { color: scheme.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.sectionSubtitle, { color: scheme.textSecondary }]}>{subtitle}</Text> : null}
      </View>
      {action}
    </View>
  );
}

export function PasswordEmptyState({ title, subtitle, actionLabel, onAction, icon }: PasswordEmptyStateProps) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={[styles.emptyState, { backgroundColor: isDark ? 'rgba(28,28,30,0.9)' : '#F9FAFB' }]}>
      <View style={styles.emptyIconWrap}>{icon || <Sparkles size={22} color={Colors.primary} />}</View>
      <Text style={[styles.emptyTitle, { color: scheme.textPrimary }]}>{title}</Text>
      <Text style={[styles.emptySubtitle, { color: scheme.textSecondary }]}>{subtitle}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity style={styles.emptyActionBtn} onPress={onAction}>
          <Text style={styles.emptyActionText}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: 28,
    padding: Spacing.lg,
    overflow: 'hidden',
    minHeight: 160,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  heroGlowTop: {
    position: 'absolute',
    top: -36,
    right: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  heroGlowBottom: {
    position: 'absolute',
    bottom: -46,
    left: -26,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.md,
  },
  heroTitleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  heroIconBubble: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextWrap: {
    flex: 1,
  },
  heroTitle: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  heroSubtitle: {
    marginTop: 4,
    color: 'rgba(255,255,255,0.78)',
    fontSize: Typography.fontSize.sm,
    lineHeight: 19,
  },
  heroStatRow: {
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.22)',
  },
  heroStatValue: { color: '#FFF', fontSize: 24, fontWeight: '800' },
  heroStatLabel: { color: 'rgba(255,255,255,0.72)', marginTop: 2, fontSize: Typography.fontSize.xs },
  heroChevronWrap: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  searchShell: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.md,
  },
  searchClearBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E5E7EB',
  },
  searchClearText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  chipSection: {
    gap: Spacing.sm,
  },
  chipLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  chipLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
  },
  chipText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
  },
  sectionSubtitle: {
    marginTop: 2,
    fontSize: Typography.fontSize.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(124,58,237,0.10)',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: Typography.fontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyActionBtn: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primary,
  },
  emptyActionText: {
    color: '#FFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});