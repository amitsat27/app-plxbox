import React from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react-native';

export const CITIES = ['pune', 'nashik', 'jalgaon'];
export const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020].map(String);

export const STATUS_CONFIG: Record<string, { color: string; bgTint: { light: string; dark: string }; icon: React.ComponentType<any> }> = {
  Paid: { color: '#10B981', bgTint: { light: 'rgba(16,185,129,0.1)', dark: 'rgba(16,185,129,0.2)' }, icon: CheckCircle },
  Pending: { color: '#F59E0B', bgTint: { light: 'rgba(245,158,11,0.1)', dark: 'rgba(245,158,11,0.2)' }, icon: Clock },
  Overdue: { color: '#EF4444', bgTint: { light: 'rgba(239,68,68,0.1)', dark: 'rgba(239,68,68,0.2)' }, icon: AlertCircle },
};
