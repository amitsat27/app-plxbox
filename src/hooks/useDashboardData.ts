/**
 * Unified Dashboard Data Hook
 * Aggregates data from legacy pulsebox Firestore collections for the home dashboard
 */

import { useEffect, useState } from 'react';
import { firebaseService } from '@/src/services/FirebaseService';
import type { Bill, Vehicle, Appliance, BillCategory } from '@/src/types';

export interface CategorySummary {
  category: BillCategory;
  totalAmount: number;
  count: number;
  label: string;
  icon: string;
}

export function useDashboardData(uid?: string) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<CategorySummary[]>([]);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [appliances, setAppliances] = useState<Appliance[]>([]);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await firebaseService.getAllPulseboxData(uid);

        if (cancelled) return;

        const { bills, vehicles: vehs, appliances: apps } = result;

        // Compute category summaries (fresh copy each time)
        const configs = [
          { category: 'electric' as const, label: 'Electric', icon: 'zap' },
          { category: 'gas' as const, label: 'Gas (MNGL)', icon: 'flame' },
          { category: 'wifi' as const, label: 'WiFi', icon: 'wifi' },
          { category: 'property' as const, label: 'Property Tax', icon: 'home' },
        ];

        const cats: CategorySummary[] = configs.map((cfg) => {
          const items = bills.filter((b) => b.category === cfg.category);
          return {
            category: cfg.category,
            label: cfg.label,
            icon: cfg.icon,
            totalAmount: items.reduce((sum, b) => sum + (b.amount || 0), 0),
            count: items.length,
          };
        });

        setCategories(cats);
        setAllBills(bills);
        setVehicles(vehs);
        setAppliances(apps);

        setLoading(false);
      } catch (err: any) {
        if (cancelled) return;
        console.error('Error loading dashboard data:', err);
        setError(err?.message || 'Failed to load dashboard data');
        setLoading(false);
      }
    };

    loadData();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  return {
    categories,
    allBills,
    vehicles,
    appliances,
    totalBillsAmount: categories.reduce((s, c) => s + c.totalAmount, 0),
    totalBillsCount: categories.reduce((s, c) => s + c.count, 0),
    pendingBills: allBills.filter((b) => b.status === 'pending'),
    overdueBills: allBills.filter((b) => b.status === 'overdue'),
    loading,
    error,
  };
}
