import { collection, addDoc, query, where, onSnapshot, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebaseConfig';

// Get Firestore instance lazily
const getDb = () => getFirebaseDb();

export interface DashboardMetric {
  id: string;
  userId: string;
  title: string;
  value: number | string;
  unit: string;
  icon: string;
  color: string;
  category: 'utility' | 'vehicle' | 'system' | 'custom';
  timestamp: Date;
  trend?: number;
}

export interface Bill {
  id: string;
  userId: string;
  title: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'pending' | 'overdue';
  category: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SystemLog {
  id: string;
  userId: string;
  action: string;
  description: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: Date;
}

class FirebaseService {
  // Metrics Operations
  async addMetric(userId: string, metric: Omit<DashboardMetric, 'id'>) {
    try {
      const db = getDb();
      const docRef = await addDoc(collection(db, 'metrics'), {
        ...metric,
        userId,
        timestamp: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding metric:', error);
      throw error;
    }
  }

  getMetrics(userId: string, callback: (metrics: DashboardMetric[]) => void) {
    try {
      const db = getDb();
      const q = query(collection(db, 'metrics'), where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const metrics = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        } as DashboardMetric));
        callback(metrics);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      throw error;
    }
  }

  async updateMetric(metricId: string, updates: Partial<DashboardMetric>) {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'metrics', metricId), updates);
    } catch (error) {
      console.error('Error updating metric:', error);
      throw error;
    }
  }

  async deleteMetric(metricId: string) {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'metrics', metricId));
    } catch (error) {
      console.error('Error deleting metric:', error);
      throw error;
    }
  }

  // Bills Operations
  async addBill(userId: string, bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const db = getDb();
      const docRef = await addDoc(collection(db, 'bills'), {
        ...bill,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding bill:', error);
      throw error;
    }
  }

  getBills(userId: string, callback: (bills: Bill[]) => void) {
    try {
      const db = getDb();
      const q = query(collection(db, 'bills'), where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bills = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          dueDate: doc.data().dueDate?.toDate() || new Date(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as Bill));
        callback(bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching bills:', error);
      throw error;
    }
  }

  async updateBill(billId: string, updates: Partial<Bill>) {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'bills', billId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating bill:', error);
      throw error;
    }
  }

  // System Logs Operations
  async addLog(userId: string, log: Omit<SystemLog, 'id'>) {
    try {
      const db = getDb();
      await addDoc(collection(db, 'logs'), {
        ...log,
        userId,
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error adding log:', error);
      throw error;
    }
  }

  getLogs(userId: string, callback: (logs: SystemLog[]) => void) {
    try {
      const db = getDb();
      const q = query(collection(db, 'logs'), where('userId', '==', userId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const logs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date(),
        } as SystemLog));
        callback(logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching logs:', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
