import React from 'react';
import { Stack } from 'expo-router';

export default function PasswordStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 180,
      }}
    />
  );
}
