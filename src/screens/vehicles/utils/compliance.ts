/**
 * Compliance helpers — centralizes date/expiry logic shared across vehicle components
 */

export type ExpiryStatus = 'valid' | 'expiring' | 'expired' | 'unknown';

export interface ComplianceItem {
  type: 'insurance' | 'puc' | 'registration' | 'service';
  label: string;
  date?: Date;
  daysLeft: number;
  status: ExpiryStatus;
  color: string;
}

const EXPIRY_COLORS = {
  valid: '#10B981',
  expiring: '#F59E0B',
  expired: '#EF4444',
  unknown: '#71717A',
};

function toDate(date: Date | string | undefined): Date | undefined {
  if (!date) return undefined;
  return date instanceof Date ? date : new Date(date);
}

export function getDaysUntilExpiry(date?: Date | string): number {
  const d = toDate(date);
  if (!d) return Infinity;
  return Math.ceil((d.getTime() - new Date().getTime()) / 86400000);
}

export function getExpiryStatus(date?: Date | string): ExpiryStatus {
  const d = toDate(date);
  if (!d) return 'unknown';
  const days = getDaysUntilExpiry(d);
  if (days < 0) return 'expired';
  if (days < 30) return 'expiring';
  return 'valid';
}

export function getExpiryColor(date?: Date | string): string {
  return EXPIRY_COLORS[getExpiryStatus(date)];
}

export function formatExpiryDate(date?: Date | string): string {
  const d = toDate(date);
  if (!d) return 'Not Set';
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export const COMPLIANCE_LABELS: Record<ComplianceItem['type'], string> = {
  insurance: 'Insurance',
  puc: 'PUC',
  registration: 'Registration',
  service: 'Service',
};
