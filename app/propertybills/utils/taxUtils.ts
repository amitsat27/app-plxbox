/**
 * Property Tax — utils
 * Shared utilities for the property tax module
 */
import { PropertyTaxBillEntry } from '@/src/services/FirebaseService';

export interface TaxNotif {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'overdue';
  timestamp: Date;
  read: boolean;
}

export function buildNotifs(bills: PropertyTaxBillEntry[], _info: any): TaxNotif[] {
  const ns: TaxNotif[] = [];
  const now = new Date();
  bills.filter(b => b.payStatus !== 'Paid').forEach(b => {
    const due = new Date(b.lastDateToPay);
    const days = Math.ceil((due.getTime() - now.getTime()) / 864e5);
    if (due < now) {
      ns.push({
        id: `o-${b.id}`,
        title: 'Payment Overdue',
        message: `FY ${b.billYear} of ₹${parseFloat(b.taxBillAmount).toLocaleString('en-IN')} past due.`,
        type: 'overdue',
        timestamp: due,
        read: false,
      });
    } else if (days <= 30) {
      ns.push({
        id: `u-${b.id}`,
        title: 'Due Soon',
        message: `FY ${b.billYear} due ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}.`,
        type: 'warning',
        timestamp: due,
        read: false,
      });
    }
  });
  bills.filter(b => b.payStatus === 'Paid').slice(0, 2).forEach(b => ns.push({
    id: `p-${b.id}`,
    title: 'Payment Confirmed',
    message: `FY ${b.billYear} paid ₹${parseFloat(b.taxBillAmount).toLocaleString('en-IN')}.`,
    type: 'success',
    timestamp: new Date(b.lastDateToPay),
    read: true,
  }));
  return ns.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function calculateStats(bills: PropertyTaxBillEntry[]) {
  const total = bills.reduce((s, b) => {
    const a = typeof b.taxBillAmount === 'string' ? parseFloat(b.taxBillAmount.replace(/,/g, '')) : b.taxBillAmount;
    return s + (isFinite(a) ? a : 0);
  }, 0);
  const paid = bills.filter(b => b.payStatus === 'Paid').length;
  const pending = bills.filter(b => b.payStatus === 'Pending').length;
  const paidAmt = bills.filter(b => b.payStatus === 'Paid').reduce((s, b) => {
    const a = typeof b.taxBillAmount === 'string' ? parseFloat(b.taxBillAmount.replace(/,/g, '')) : b.taxBillAmount;
    return s + (isFinite(a) ? a : 0);
  }, 0);
  return { total, paid, pending, paidAmt, billCount: bills.length };
}
