/**
 * Bill Alerts Service
 * Monitors bills and sends timely alerts to users
 * Inspired by pulsebox-alerts system
 */

import { collection, query, where, onSnapshot, Firestore } from 'firebase/firestore';
import { trackAnalyticsEvent } from '../config/firebaseConfig';

export interface BillAlert {
  id: string;
  userId: string;
  billId: string;
  billType: 'electric' | 'water' | 'gas' | 'wifi' | 'vehicle' | 'property';
  alertType: 'due_soon' | 'overdue' | 'payment_reminder' | 'unusual_consumption';
  message: string;
  severity: 'info' | 'warning' | 'critical';
  dueDate: Date;
  amount: number;
  isResolved: boolean;
  createdAt: Date;
}

class BillAlertsService {
  private db: Firestore | null = null;
  private unsubscribers: Map<string, () => void> = new Map();

  setDatabase(db: Firestore) {
    this.db = db;
  }

  /**
   * Subscribe to bill alerts for a user
   */
  subscribeToAlerts(userId: string, callback: (alerts: BillAlert[]) => void) {
    if (!this.db) {
      console.error('Database not initialized');
      return;
    }

    try {
      const q = query(
        collection(this.db, 'alerts'),
        where('userId', '==', userId),
        where('isResolved', '==', false)
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const alerts = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        } as BillAlert));

        // Sort by severity and due date
        const sorted = alerts.sort((a, b) => {
          const severityOrder = { critical: 0, warning: 1, info: 2 };
          if (severityOrder[a.severity] !== severityOrder[b.severity]) {
            return severityOrder[a.severity] - severityOrder[b.severity];
          }
          return a.dueDate.getTime() - b.dueDate.getTime();
        });

        callback(sorted);
      });

      // Store unsubscriber for cleanup
      this.unsubscribers.set(`alerts_${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error('Error subscribing to alerts:', error);
      throw error;
    }
  }

  /**
   * Check bill and generate alert if needed
   */
  async checkBillAlerts(
    userId: string,
    bills: Array<{
      id: string;
      title: string;
      amount: number;
      dueDate: Date;
      status: 'paid' | 'pending' | 'overdue';
      category: string;
    }>,
    sendNotification?: (title: string, body: string) => Promise<void>
  ): Promise<void> {
    try {
      const now = new Date();

      for (const bill of bills) {
        const daysUntilDue = Math.ceil((bill.dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Overdue alert
        if (bill.status === 'overdue' && daysUntilDue < 0) {
          const message = `Your ${bill.title} is overdue by ${Math.abs(daysUntilDue)} days`;
          await this.logAlert(userId, bill.id, 'overdue', message, 'critical', bill.dueDate, bill.amount);

          if (sendNotification) {
            await sendNotification('Bill Overdue! ⚠️', message);
          }
        }

        // Due soon alert (3 days before)
        if (bill.status === 'pending' && daysUntilDue > 0 && daysUntilDue <= 3) {
          const message = `Your ${bill.title} is due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
          await this.logAlert(userId, bill.id, 'due_soon', message, 'warning', bill.dueDate, bill.amount);

          if (sendNotification) {
            await sendNotification('Bill Due Soon 🔔', message);
          }
        }

        // Payment reminder (day before)
        if (bill.status === 'pending' && daysUntilDue === 1) {
          const message = `Reminder: ${bill.title} is due tomorrow`;
          await this.logAlert(userId, bill.id, 'payment_reminder', message, 'warning', bill.dueDate, bill.amount);

          if (sendNotification) {
            await sendNotification('Payment Reminder 📝', message);
          }
        }
      }

      await trackAnalyticsEvent('bill_alerts_checked', {
        userId,
        billCount: bills.length,
      });
    } catch (error) {
      console.error('Error checking bill alerts:', error);
    }
  }

  /**
   * Check for unusual consumption patterns
   */
  async checkConsumptionAlerts(
    userId: string,
    currentUsage: number,
    averageUsage: number,
    threshold: number = 1.2, // 20% threshold
    billType: string = 'electric',
    sendNotification?: (title: string, body: string) => Promise<void>
  ): Promise<void> {
    try {
      const percentageChange = currentUsage / averageUsage;

      if (percentageChange > threshold) {
        const increase = Math.round((percentageChange - 1) * 100);
        const message = `Your ${billType} usage increased by ${increase}% (${currentUsage} vs avg ${averageUsage})`;

        await this.logAlert(
          userId,
          `consumption_${billType}`,
          'unusual_consumption',
          message,
          'info',
          new Date(),
          0
        );

        if (sendNotification) {
          await sendNotification(`High ${billType} Usage 📊`, message);
        }
      }

      await trackAnalyticsEvent('consumption_alert_checked', {
        userId,
        billType,
        percentageChange: Math.round(percentageChange * 100),
      });
    } catch (error) {
      console.error('Error checking consumption alerts:', error);
    }
  }

  /**
   * Log an alert to the database
   */
  private async logAlert(
    userId: string,
    billId: string,
    alertType: 'due_soon' | 'overdue' | 'payment_reminder' | 'unusual_consumption',
    message: string,
    severity: 'info' | 'warning' | 'critical',
    dueDate: Date,
    amount: number
  ): Promise<void> {
    // This would be called from your cloud functions or backend
    console.log(`[ALERT] ${severity.toUpperCase()}: ${message}`);
  }

  /**
   * Mark alert as resolved
   */
  async resolveAlert(userId: string, alertId: string): Promise<void> {
    try {
      // This would update the alert in Firestore via backend
      console.log(`Alert ${alertId} marked as resolved`);
      await trackAnalyticsEvent('alert_resolved', { userId, alertId });
    } catch (error) {
      console.error('Error resolving alert:', error);
    }
  }

  /**
   * Cleanup subscriptions
   */
  unsubscribeAll(): void {
    this.unsubscribers.forEach((unsubscribe) => {
      try {
        unsubscribe();
      } catch (error) {
        console.warn('Error unsubscribing:', error);
      }
    });
    this.unsubscribers.clear();
  }
}

export const billAlertsService = new BillAlertsService();
