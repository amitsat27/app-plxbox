import { create } from 'zustand';
import { DashboardMetric, Bill, SystemLog, firebaseService } from '../services/FirebaseService';

interface DashboardState {
  metrics: DashboardMetric[];
  bills: Bill[];
  logs: SystemLog[];
  loading: boolean;
  error: string | null;
  
  // Actions
  setMetrics: (metrics: DashboardMetric[]) => void;
  setBills: (bills: Bill[]) => void;
  setLogs: (logs: SystemLog[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Async operations
  fetchMetrics: (userId: string) => Promise<void>;
  fetchBills: (userId: string) => Promise<void>;
  fetchLogs: (userId: string) => Promise<void>;
  addNewMetric: (userId: string, metric: Omit<DashboardMetric, 'id'>) => Promise<void>;
  addNewBill: (userId: string, bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateMetricData: (metricId: string, updates: Partial<DashboardMetric>) => Promise<void>;
  updateBillData: (billId: string, updates: Partial<Bill>) => Promise<void>;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  metrics: [],
  bills: [],
  logs: [],
  loading: false,
  error: null,

  setMetrics: (metrics) => set({ metrics }),
  setBills: (bills) => set({ bills }),
  setLogs: (logs) => set({ logs }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  fetchMetrics: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      firebaseService.getMetrics(userId, (metrics) => {
        set({ metrics, loading: false });
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchBills: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      firebaseService.getBills(userId, (bills) => {
        set({ bills, loading: false });
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  fetchLogs: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      firebaseService.getLogs(userId, (logs) => {
        set({ logs, loading: false });
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addNewMetric: async (userId: string, metric: Omit<DashboardMetric, 'id'>) => {
    try {
      await firebaseService.addMetric(userId, metric);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  addNewBill: async (userId: string, bill: Omit<Bill, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await firebaseService.addBill(userId, bill);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateMetricData: async (metricId: string, updates: Partial<DashboardMetric>) => {
    try {
      await firebaseService.updateMetric(metricId, updates);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },

  updateBillData: async (billId: string, updates: Partial<Bill>) => {
    try {
      await firebaseService.updateBill(billId, updates);
    } catch (error) {
      set({ error: (error as Error).message });
    }
  },
}));
