/**
 * Vehicles Hook — computed stats, alerts, and insights
 */

import { useMemo } from 'react';
import type { Vehicle } from '@/src/types';

export interface VehicleAlert {
  id: string;
  type: 'insurance' | 'puc' | 'registration' | 'service';
  severity: 'critical' | 'warning' | 'info';
  vehicleId: string;
  vehicleName: string;
  message: string;
  dueDate: Date;
  daysLeft: number;
}

export interface VehicleStats {
  total: number;
  active: number;
  inactive: number;
  alerts: VehicleAlert[];
  expiringInsurances: Vehicle[];
  expiringPUCs: Vehicle[];
  expiringRegistrations: Vehicle[];
  overview: { label: string; value: string; icon: string; color: string }[];
}

export function useVehicles(vehicles: Vehicle[]): VehicleStats {
  const stats = useMemo(() => {
    const now = new Date();
    const THIRTY_DAYS = 30;
    const alerts: VehicleAlert[] = [];

    const expiringInsurances: Vehicle[] = [];
    const expiringPUCs: Vehicle[] = [];
    const expiringRegistrations: Vehicle[] = [];

    const active = vehicles.filter((v) => v.isActive).length;

    vehicles.forEach((v) => {
      if (!v.isActive) return;

      // Insurance
      if (v.insuranceExpiry) {
        const days = Math.ceil((v.insuranceExpiry.getTime() - now.getTime()) / 86400000);
        if (days < 0) {
          alerts.push({
            id: `ins-${v.id}`, type: 'insurance', severity: 'critical',
            vehicleId: v.id, vehicleName: v.name,
            message: 'Insurance has expired', dueDate: v.insuranceExpiry, daysLeft: days,
          });
          expiringInsurances.push(v);
        } else if (days < THIRTY_DAYS) {
          alerts.push({
            id: `ins-${v.id}`, type: 'insurance', severity: 'warning',
            vehicleId: v.id, vehicleName: v.name,
            message: 'Insurance expires soon', dueDate: v.insuranceExpiry, daysLeft: days,
          });
          expiringInsurances.push(v);
        }
      }

      // PUC
      if (v.pucExpiry) {
        const days = Math.ceil((v.pucExpiry.getTime() - now.getTime()) / 86400000);
        if (days < 0) {
          alerts.push({
            id: `puc-${v.id}`, type: 'puc', severity: 'critical',
            vehicleId: v.id, vehicleName: v.name,
            message: 'PUC has expired', dueDate: v.pucExpiry, daysLeft: days,
          });
          expiringPUCs.push(v);
        } else if (days < THIRTY_DAYS) {
          alerts.push({
            id: `puc-${v.id}`, type: 'puc', severity: 'warning',
            vehicleId: v.id, vehicleName: v.name,
            message: 'PUC expires soon', dueDate: v.pucExpiry, daysLeft: days,
          });
          expiringPUCs.push(v);
        }
      }

      // Registration
      if (v.registrationExpiry) {
        const days = Math.ceil((v.registrationExpiry.getTime() - now.getTime()) / 86400000);
        if (days < 0 || days < THIRTY_DAYS) {
          alerts.push({
            id: `reg-${v.id}`, type: 'registration', severity: days < 0 ? 'critical' : 'warning',
            vehicleId: v.id, vehicleName: v.name,
            message: days < 0 ? 'Registration has expired' : 'Registration expiry approaching',
            dueDate: v.registrationExpiry, daysLeft: days,
          });
          expiringRegistrations.push(v);
        }
      }

      // Service due
      if (v.nextServiceDue && daysUntil(v.nextServiceDue) < 7) {
        const days = Math.ceil((v.nextServiceDue.getTime() - now.getTime()) / 86400000);
        alerts.push({
          id: `svc-${v.id}`, type: 'service', severity: days < 0 ? 'warning' : 'info',
          vehicleId: v.id, vehicleName: v.name,
          message: days < 0 ? 'Service is overdue' : 'Service coming up',
          dueDate: v.nextServiceDue, daysLeft: days,
        });
      }
    });

    alerts.sort((a, b) => {
      const order = { critical: 0, warning: 1, info: 2 };
      return order[a.severity] - order[b.severity];
    });

    const overdueCount = alerts.filter((a) => a.severity === 'critical').length;
    const warningCount = alerts.filter((a) => a.severity === 'warning').length;
    const infoCount = alerts.filter((a) => a.severity === 'info').length;

    const overview = [
      { label: 'Total', value: String(vehicles.length), icon: 'garage', color: '#7C3AED' },
      { label: 'Active', value: String(active), icon: 'check', color: '#10B981' },
      { label: 'Alerts', value: String(alerts.length), icon: 'alert', color: overdueCount > 0 ? '#EF4444' : '#F59E0B' },
      { label: 'Upcoming', value: String(infoCount), icon: 'calendar', color: '#3B82F6' },
    ];

    return {
      total: vehicles.length,
      active,
      inactive: vehicles.length - active,
      alerts,
      expiringInsurances,
      expiringPUCs,
      expiringRegistrations,
      overview,
    };
  }, [vehicles]);

  return stats;
}

function daysUntil(date: Date): number {
  const now = new Date();
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}
