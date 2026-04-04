import { useEffect, useState, useMemo, useCallback } from 'react';
import { firebaseService } from '@/src/services/FirebaseService';
import type { Appliance, ServiceRecord } from '@/src/types';
import type { ApplianceAlert, SmartInsight } from '@/components/appliances/types';
import { formatINR } from '@/components/appliances/utils';

export function useApplianceData(uid?: string) {
  const [appliances, setAppliances] = useState<Appliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = firebaseService.getAppliances(uid, (data) => {
      setAppliances(data);
      setLoading(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [uid]);

  const stats = useMemo(() => {
    const today = new Date();
    return {
      total: appliances.length,
      active: appliances.filter((a) => a.isActive).length,
      totalCost: appliances.reduce((s, a) => s + (a.purchasePrice || 0), 0),
      warrantyExpiring: appliances.filter((a) => {
        if (!a.warrantyExpiry) return false;
        const date = a.warrantyExpiry instanceof Date ? a.warrantyExpiry : new Date(a.warrantyExpiry);
        const days = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return days <= 30 && days > 0;
      }).length,
      amcExpiring: appliances.filter((a) => {
        if (!a.amcExpiry) return false;
        const date = a.amcExpiry instanceof Date ? a.amcExpiry : new Date(a.amcExpiry);
        const days = (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
        return days <= 30 && days > 0;
      }).length,
    };
  }, [appliances]);

  const alerts = useMemo((): ApplianceAlert[] => {
    const today = new Date();
    const result: ApplianceAlert[] = [];

    appliances.forEach((a) => {
      if (a.warrantyExpiry) {
        const date = a.warrantyExpiry instanceof Date ? a.warrantyExpiry : new Date(a.warrantyExpiry);
        const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 30) {
          result.push({
            id: `${a.id}-warranty`,
            type: 'warranty',
            severity: days <= 0 ? 'critical' : days <= 14 ? 'warning' : 'info',
            applianceId: a.id,
            applianceName: a.name,
            message: days <= 0 ? `Warranty expired for ${a.name}` : `Warranty expires in ${days} days for ${a.name}`,
            dueDate: date,
            daysLeft: days,
          });
        }
      }

      if (a.amcExpiry) {
        const date = a.amcExpiry instanceof Date ? a.amcExpiry : new Date(a.amcExpiry);
        const days = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (days <= 30) {
          result.push({
            id: `${a.id}-amc`,
            type: 'amc',
            severity: days <= 0 ? 'critical' : days <= 14 ? 'warning' : 'info',
            applianceId: a.id,
            applianceName: a.name,
            message: days <= 0 ? `AMC expired for ${a.name}` : `AMC expires in ${days} days for ${a.name}`,
            dueDate: date,
            daysLeft: days,
          });
        }
      }
    });

    return result.sort((a, b) => a.daysLeft - b.daysLeft);
  }, [appliances]);

  const insights = useMemo((): SmartInsight[] => {
    const result: SmartInsight[] = [];
    if (appliances.length === 0) return result;

    const today = new Date();

    // Category spending
    const categorySpending: Record<string, number> = {};
    appliances.forEach((a) => {
      categorySpending[a.category] = (categorySpending[a.category] || 0) + (a.purchasePrice || 0);
    });

    const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      const pct = Math.round((topCategory[1] / stats.totalCost) * 100);
      result.push({
        id: 'top-category',
        icon: '📊',
        title: 'Top Spending Category',
        subtitle: `${topCategory[0].charAt(0).toUpperCase() + topCategory[0].slice(1)} at ${pct}% of total`,
        color: '#7C3AED',
      });
    }

    // Average age
    const avgDays = appliances.reduce((sum, a) => {
      const d = a.purchaseDate instanceof Date ? a.purchaseDate : new Date(a.purchaseDate);
      return sum + (today.getTime() - d.getTime());
    }, 0) / (appliances.length * 1000 * 60 * 60 * 24);
    const avgYears = (avgDays / 365.25).toFixed(1);

    result.push({
      id: 'avg-age',
      icon: '⏱️',
      title: `Avg Age: ${avgYears} years`,
      subtitle: `Across ${appliances.length} appliances`,
      color: '#3B82F6',
    });

    // Warranty count
    if (stats.warrantyExpiring > 0) {
      result.push({
        id: 'warranty-alert',
        icon: '⚠️',
        title: `${stats.warrantyExpiring} warranty expiring soon`,
        subtitle: 'Check warranty details before expiry',
        color: '#F59E0B',
      });
    }

    // Total value insight
    result.push({
      id: 'total-value',
      icon: '💰',
      title: `Total portfolio: ${formatINR(stats.totalCost)}`,
      subtitle: 'All appliances combined',
      color: '#10B981',
    });

    return result;
  }, [appliances, stats]);

  const getApplianceServices = useCallback((applianceId: string): Promise<ServiceRecord[]> => {
    return new Promise((resolve) => {
      (firebaseService as any).getServiceRecordsForAppliance?.(applianceId, (records: ServiceRecord[]) => {
        resolve(records);
      });
    });
  }, []);

  return {
    appliances,
    loading,
    error,
    stats,
    alerts,
    insights,
    getApplianceServices,
  };
}
