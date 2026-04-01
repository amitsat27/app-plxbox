import { collection, addDoc, query, where, onSnapshot, getDocs, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { getFirebaseDb } from '../config/firebaseConfig';
import type { DashboardMetric, Bill, SystemLog, Vehicle, Appliance, ServiceRecord, BillStatus } from '../types';

// Get Firestore instance lazily
const getDb = () => getFirebaseDb();

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
      console.log('🔍 FirebaseService: Fetching bills for userId:', userId);
      const db = getDb();
      console.log('✅ Firestore DB instance:', db);
      const q = query(collection(db, 'bills'), where('userId', '==', userId));
      console.log('✅ Query created, setting up onSnapshot listener');

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('📋 Snapshot received:', snapshot.size, 'documents');
        const bills = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`  Bill ${doc.id}:`, JSON.stringify(data, null, 2));
          return {
            id: doc.id,
            ...data,
            dueDate: data.dueDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Bill;
        });
        const sorted = bills.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        console.log('✅ Processed bills:', sorted.length, 'items');
        callback(sorted);
      }, (error) => {
        console.error('❌ onSnapshot error for bills:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up bills listener:', error);
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

  async deleteBill(billId: string) {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'bills', billId));
    } catch (error) {
      console.error('Error deleting bill:', error);
      throw error;
    }
  }

  // Vehicle Operations
  async addVehicle(userId: string, vehicle: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const db = getDb();
      const docRef = await addDoc(collection(db, 'vehicles'), {
        ...vehicle,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding vehicle:', error);
      throw error;
    }
  }

  getVehicles(userId: string, callback: (vehicles: Vehicle[]) => void) {
    try {
      console.log('🔍 FirebaseService: Fetching vehicles for userId:', userId);
      const db = getDb();
      const q = query(collection(db, 'vehicles'), where('userId', '==', userId));
      console.log('✅ Query created, setting up onSnapshot listener');

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('🚗 Snapshot received:', snapshot.size, 'documents');
        const vehicles = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`  Vehicle ${doc.id}:`, JSON.stringify(data, null, 2));
          return {
            id: doc.id,
            ...data,
            lastServiceDate: data.lastServiceDate?.toDate(),
            nextServiceDue: data.nextServiceDue?.toDate(),
            insuranceExpiry: data.insuranceExpiry?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Vehicle;
        });
        const sorted = vehicles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        console.log('✅ Processed vehicles:', sorted.length, 'items');
        callback(sorted);
      }, (error) => {
        console.error('❌ onSnapshot error for vehicles:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up vehicles listener:', error);
      throw error;
    }
  }

  async updateVehicle(vehicleId: string, updates: Partial<Vehicle>) {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'vehicles', vehicleId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  }

  async deleteVehicle(vehicleId: string) {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'vehicles', vehicleId));
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  }

  // Appliance Operations
  async addAppliance(userId: string, appliance: Omit<Appliance, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const db = getDb();
      const docRef = await addDoc(collection(db, 'appliances'), {
        ...appliance,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding appliance:', error);
      throw error;
    }
  }

  getAppliances(userId: string, callback: (appliances: Appliance[]) => void) {
    try {
      console.log('🔍 FirebaseService: Fetching appliances for userId:', userId);
      const db = getDb();
      const q = query(collection(db, 'appliances'), where('userId', '==', userId));
      console.log('✅ Query created, setting up onSnapshot listener');

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('🔌 Snapshot received:', snapshot.size, 'documents');
        const appliances = snapshot.docs.map((doc) => {
          const data = doc.data();
          console.log(`  Appliance ${doc.id}:`, JSON.stringify(data, null, 2));
          return {
            id: doc.id,
            ...data,
            purchaseDate: data.purchaseDate?.toDate() || new Date(),
            warrantyExpiry: data.warrantyExpiry?.toDate(),
            amcExpiry: data.amcExpiry?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as Appliance;
        });
        const sorted = appliances.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        console.log('✅ Processed appliances:', sorted.length, 'items');
        callback(sorted);
      }, (error) => {
        console.error('❌ onSnapshot error for appliances:', error);
      });

      return unsubscribe;
    } catch (error) {
      console.error('❌ Error setting up appliances listener:', error);
      throw error;
    }
  }

  async updateAppliance(applianceId: string, updates: Partial<Appliance>) {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'appliances', applianceId), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error updating appliance:', error);
      throw error;
    }
  }

  async deleteAppliance(applianceId: string) {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'appliances', applianceId));
    } catch (error) {
      console.error('Error deleting appliance:', error);
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

  /**
   * Fetch all data from legacy Pulsebox nested collections (reference: D:\Project\NewApp\pulsebox)
   * Returns unified data model for home dashboard
   */
  async getAllPulseboxData(userId: string): Promise<{
    bills: Bill[];
    vehicles: Vehicle[];
    appliances: Appliance[];
  }> {
    const bills: Bill[] = [];
    const vehicles: Vehicle[] = [];
    const appliances: Appliance[] = [];
    const db = getDb();
    const cities = ['nashik', 'pune', 'jalgaon'] as const;

    // Bill collections mapping (category, amount field, status field, date field)
    const billCollections = [
      {
        path: ['pulsebox', 'electricbills'],
        category: 'electric' as const,
        amountField: 'billAmount',
        statusField: 'payStatus',
        dateField: 'lastDateToPay'
      },
      {
        path: ['pulsebox', 'mnglbills'],
        category: 'gas' as const,
        amountField: 'billAmount',
        statusField: 'payStatus',
        dateField: 'lastDateToPay'
      },
      {
        path: ['pulsebox', 'wifibills'],
        category: 'wifi' as const,
        amountField: 'billAmount',
        statusField: 'payStatus',
        dateField: 'lastDateToPay'
      },
      {
        path: ['pulsebox', 'propertybills'],
        category: 'property' as const,
        amountField: 'taxBillAmount',
        statusField: 'payStatus',
        dateField: 'dueDate'
      }
    ];

    // Fetch Bills from nested collections
    for (const city of cities) {
      for (const col of billCollections) {
        try {
          const snapshot = await getDocs(collection(db, ...(col.path as [string, string]), city));
          snapshot.forEach(doc => {
            const data = doc.data();

            // Parse amount (handle string with commas)
            const amountRaw = data[col.amountField];
            let amount = 0;
            if (typeof amountRaw === 'string') {
              amount = parseFloat(amountRaw.replace(/,/g, '')) || 0;
            } else if (typeof amountRaw === 'number') {
              amount = amountRaw;
            }
            // Validate amount
            if (!isFinite(amount) || isNaN(amount)) {
              console.warn('Invalid bill amount, defaulting to 0:', doc.id, amountRaw);
              amount = 0;
            }

            // Parse status (map to BillStatus)
            const statusRaw = data[col.statusField];
            let status: BillStatus = 'pending';
            if (statusRaw) {
              const s = String(statusRaw).toLowerCase();
              if (['paid', 'pending', 'overdue', 'draft'].includes(s)) {
                status = s as BillStatus;
              }
            }

            // Parse due date
            let dueDate = new Date();
            const dateRaw = data[col.dateField];
            if (dateRaw) {
              if (dateRaw.toDate) {
                dueDate = dateRaw.toDate();
              } else if (typeof dateRaw === 'string' || typeof dateRaw === 'number') {
                dueDate = new Date(dateRaw);
              }
            }
            // Validate dueDate
            if (isNaN(dueDate.getTime())) {
              console.warn('Invalid bill due date, defaulting to today:', doc.id, dateRaw);
              dueDate = new Date();
            }

            bills.push({
              id: doc.id,
              userId,
              title: `${col.category} bill - ${city}`,
              amount,
              dueDate,
              status,
              category: col.category,
              createdAt: new Date(),
              updatedAt: new Date(),
              isRecurring: false,
            } as Bill);
          });
        } catch (err) {
          console.error(`Failed to fetch ${col.path.join('/')}/${city}:`, err);
        }
      }
    }

    // Fetch Vehicles from pulsebox/vehicles/{city}
    for (const city of cities) {
      try {
        const snapshot = await getDocs(collection(db, 'pulsebox', 'vehicles', city));
        snapshot.forEach(doc => {
          const data = doc.data();
          vehicles.push({
            id: doc.id,
            userId,
            name: data.name || data.vehicleName || `Vehicle ${doc.id}`,
            type: (data.type as any) || 'other',
            make: data.make || '',
            model: data.model || '',
            year: data.year || new Date().getFullYear(),
            registrationNumber: data.registrationNumber || doc.id,
            registrationExpiry: data.registrationExpiry?.toDate ? data.registrationExpiry.toDate() : new Date(2099, 11, 31),
            insuranceExpiry: data.insuranceExpiry?.toDate ? data.insuranceExpiry.toDate() : new Date(2099, 11, 31),
            pucExpiry: data.pucExpiry?.toDate ? data.pucExpiry.toDate() : undefined,
            fuelType: (data.fuelType as any) || 'petrol',
            mileage: data.mileage,
            odometerReading: data.odometerReading,
            fuelTankCapacity: data.fuelTankCapacity,
            color: data.color,
            vin: data.vin,
            engineNumber: data.engineNumber,
            chassisNumber: data.chassisNumber,
            purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : undefined,
            purchasePrice: data.purchasePrice,
            currentValue: data.currentValue,
            notes: data.notes,
            isActive: data.isActive !== false,
            images: data.images || [],
            location: (data.location as any) || 'pune',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Vehicle);
        });
      } catch (err) {
        console.error('Failed to fetch vehicles:', err);
      }
    }

    // Fetch Appliances from pulsebox/appliances/{city}
    for (const city of cities) {
      try {
        const snapshot = await getDocs(collection(db, 'pulsebox', 'appliances', city));
        snapshot.forEach(doc => {
          const data = doc.data();
          appliances.push({
            id: doc.id,
            userId,
            name: data.name || `Appliance ${doc.id}`,
            brand: data.brand || '',
            model: data.model || '',
            modelNumber: data.modelNumber,
            serialNumber: data.serialNumber,
            category: (data.category as any) || 'other',
            purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : new Date(),
            purchasePrice: data.purchasePrice || 0,
            currentValue: data.currentValue,
            warrantyExpiry: data.warrantyExpiry?.toDate ? data.warrantyExpiry.toDate() : undefined,
            amcExpiry: data.amcExpiry?.toDate ? data.amcExpiry.toDate() : undefined,
            notes: data.notes,
            isActive: data.isActive !== false,
            images: data.images || [],
            location: (data.location as any) || 'pune',
            createdAt: new Date(),
            updatedAt: new Date(),
          } as Appliance);
        });
      } catch (err) {
        console.error('Failed to fetch appliances:', err);
      }
    }

    return { bills, vehicles, appliances };
  }
}

export const firebaseService = new FirebaseService();
