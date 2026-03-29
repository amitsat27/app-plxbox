// app/(tabs)/index.tsx
import React from 'react';
import { View } from 'react-native';
import { RedesignedHome } from '../../components/ui/RedesignedHome';
import { Colors } from '../../theme/color';

export default function Dashboard() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <RedesignedHome />
    </View>
  );
}