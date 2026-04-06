/** Search bar for electric bills */
import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { Spacing, Typography, BorderRadius } from '@/constants/designTokens';
import { Colors, getColorScheme } from '@/theme/color';
import { useTheme } from '@/theme/themeProvider';

export default function SearchBar({ query, onChangeQuery, onClear }: {
  query: string; onChangeQuery: (text: string) => void; onClear: () => void;
}) {
  const { isDark } = useTheme();
  const scheme = getColorScheme(isDark);

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', borderColor: scheme.border }]}>
      <Search size={14} color={scheme.textTertiary} />
      <TextInput
        style={[styles.input, { color: scheme.textPrimary }]}
        placeholder="Search bills..."
        placeholderTextColor={scheme.textTertiary}
        value={query}
        onChangeText={onChangeQuery}
        autoCapitalize="none"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={onClear} style={{ padding: 4 }}>
          <X size={14} color={scheme.textTertiary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.md, borderWidth: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, minHeight: 40 },
  input: { flex: 1, fontSize: Typography.fontSize.sm, paddingHorizontal: Spacing.sm },
});
