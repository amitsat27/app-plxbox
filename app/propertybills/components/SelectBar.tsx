/**
 * Property Tax — SelectBar
 * Dual dropdown for City and Tax Index selection
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MapPin, Building2 } from 'lucide-react-native';
import { Spacing } from '@/constants/designTokens';
import { Colors } from '@/theme/color';
import DropdownPicker from './DropdownPicker';

export function SelectBar({
  selectedCity,
  onCitySelect,
  taxIndices,
  selectedTaxIndex,
  onTaxIndexSelect,
}: {
  selectedCity: string;
  onCitySelect: (v: string) => void;
  taxIndices: string[];
  selectedTaxIndex?: string;
  onTaxIndexSelect: (v: string) => void;
}) {
  const CITIES = ['pune', 'nashik', 'jalgaon'];
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <View style={styles.row}>
      <DropdownPicker
        label="City"
        value={selectedCity ? capitalize(selectedCity) : ''}
        options={CITIES.map(c => capitalize(c))}
        onSelect={(v) => onCitySelect(v.toLowerCase())}
        placeholder="Select City"
        icon={<MapPin size={16} color={selectedCity ? Colors.primary : '#8E8E93'} />}
      />
      <DropdownPicker
        label="Tax Index"
        value={selectedTaxIndex}
        options={taxIndices}
        onSelect={(v) => onTaxIndexSelect(v)}
        placeholder="Select Index"
        disabled={!selectedCity || taxIndices.length === 0}
        icon={<Building2 size={16} color={selectedTaxIndex ? Colors.primary : '#8E8E93'} />}
      />
    </View>
  );
}

const SelectBarExport = SelectBar;
export default SelectBarExport;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
});
