import { collection, addDoc, query, where, onSnapshot, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, getDoc, setDoc, collectionGroup } from 'firebase/firestore';
import { getFirebaseDb, getFirebaseStorage } from '../config/firebaseConfig';
import type { DashboardMetric, Bill, SystemLog, Vehicle, Appliance, ServiceRecord, BillStatus, ApplianceCategory } from '../types';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

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

  /**
   * Fetch appliances from both flat collection AND legacy pulsebox/appliances/{city}/
   * Merges results and deduplicates by document ID.
   */
  getAppliances(userId: string, callback: (appliances: Appliance[]) => void) {
    try {
      const db = getDb();
      let active = true;
      const unsubscribes: Array<() => void> = [];

      const parseMonthYear = (str: string): Date | null => {
        if (!str) return null;
        const match = str.trim().match(/^(\w+)\s+(\d{4})$/);
        if (!match) return parseInt(str) ? new Date(parseInt(str), 0, 1) : null;
        const [, month, year] = match;
        const m = new Date(`${month} 1, ${year}`).getMonth();
        if (isNaN(m)) return null;
        return new Date(parseInt(year), m, 1);
      };

      const guessCategory = (name: string, model: string): ApplianceCategory => {
        const text = ((name || '') + ' ' + (model || '')).toLowerCase();
        if (text.includes('fridge') || text.includes('refrigerator') || text.includes('microwave') || text.includes('mixer') || text.includes('oven') || text.includes('stove') || text.includes('grinder')) return 'kitchen';
        if (text.includes('tv') || text.includes('television') || text.includes('sound') || text.includes('speaker') || text.includes('ac ') || text.includes('heater')) return 'living';
        if (text.includes('washing') || text.includes('iron') || text.includes('fan') || text.includes('light')) return 'bedroom';
        if (text.includes('geyser') || text.includes('water heater') || text.includes('hair')) return 'bathroom';
        return 'other';
      };

      const fetchAllAndNotify = async () => {
        if (!active) return;
        const all: Appliance[] = [];

        // 1. Flat collection
        try {
          const flatQ = query(collection(db, 'appliances'), where('userId', '==', userId));
          const flatSnap = await getDocs(flatQ);
          flatSnap.forEach(docSnap => {
            const data = docSnap.data();
            all.push({
              id: docSnap.id,
              userId,
              name: data.name || `Appliance ${docSnap.id}`,
              brand: data.brand || '',
              model: data.model || '',
              modelNumber: data.modelNumber,
              serialNumber: data.serialNumber,
              category: data.category || guessCategory(data.name, data.model),
              purchaseDate: data.purchaseDate?.toDate ? data.purchaseDate.toDate() : new Date(),
              purchasePrice: data.purchasePrice || 0,
              currentValue: data.currentValue,
              warrantyExpiry: data.warrantyExpiry?.toDate ? data.warrantyExpiry.toDate() : undefined,
              amcExpiry: data.amcExpiry?.toDate ? data.amcExpiry.toDate() : undefined,
              notes: data.notes,
              isActive: data.isActive !== false,
              images: data.images || [],
              location: data.location || 'pune',
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
              updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(),
            } as Appliance);
          });
        } catch (e) {
          console.warn('Flat appliances fetch failed:', e);
        }

        // 2. Legacy nested: pulsebox/appliances/{city}/
        const legacyIds = new Set(all.map(a => a.id));
        for (const city of ['pune', 'nashik', 'jalgaon']) {
          try {
            const legacySnap = await getDocs(collection(db, 'pulsebox', 'appliances', city));
            legacySnap.forEach(docSnap => {
              if (legacyIds.has(docSnap.id)) return;
              const data = docSnap.data();
              legacyIds.add(docSnap.id);
              all.push({
                id: docSnap.id,
                userId,
                name: data.name || `Appliance ${docSnap.id}`,
                brand: String(data.brand || data.brandName || ''),
                model: String(data.model || data.modelNumber || ''),
                modelNumber: data.modelNumber ? String(data.modelNumber) : undefined,
                serialNumber: data.serialNumber,
                category: guessCategory(data.name, data.model),
                purchaseDate: parseMonthYear(data.applianceBought) || new Date(),
                purchasePrice: typeof data.priceBought === 'number' ? data.priceBought : parseFloat(String(data.priceBought || '').replace(/,/g, '')) || 0,
                currentValue: data.currentValue,
                warrantyExpiry: data.warrantyExpiry?.toDate ? data.warrantyExpiry.toDate() : undefined,
                amcExpiry: data.amcExpiry?.toDate ? data.amcExpiry.toDate() : undefined,
                notes: data.notes,
                isActive: data.isActive !== false,
                images: data.imageUrl ? [data.imageUrl] : (data.images || []),
                location: (data.applianceCity || city) as any,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as Appliance);
            });
          } catch (e) {
            console.warn(`Legacy appliances fetch failed for ${city}:`, e);
          }
        }

        if (active) {
          const sorted = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          callback(sorted);
        }
      };

      // Real-time listener on flat collection
      const flatQ = query(collection(db, 'appliances'), where('userId', '==', userId));
      const flatUnsub = onSnapshot(flatQ, () => {
        fetchAllAndNotify();
      }, (err) => {
        console.error('Flat appliances listener error:', err);
        fetchAllAndNotify();
      });
      unsubscribes.push(flatUnsub);

      // Initial fetch
      fetchAllAndNotify();

      return () => {
        active = false;
        unsubscribes.forEach(unsub => unsub());
      };
    } catch (error) {
      console.error('Error setting up appliances listener:', error);
      throw error;
    }
  }

  /**
   * Update an appliance. If city is provided, updates in legacy path.
   * Otherwise tries flat collection first, then legacy.
   */
  async updateAppliance(applianceId: string, updates: Partial<Appliance>, city?: string) {
    const db = getDb();

    // If city is known (legacy appliance), update there directly
    if (city) {
      const docRef = doc(db, 'pulsebox', 'appliances', city, applianceId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await updateDoc(docRef, { ...updates, updatedAt: new Date() });
        return;
      }
    }

    // Try flat collection
    const flatDoc = doc(db, 'appliances', applianceId);
    const flatSnap = await getDoc(flatDoc);
    if (flatSnap.exists()) {
      await updateDoc(flatDoc, { ...updates, updatedAt: serverTimestamp() });
      return;
    }

    // Check all legacy locations
    for (const c of ['pune', 'nashik', 'jalgaon']) {
      if (city && c === city) continue;
      try {
        const docRef = doc(db, 'pulsebox', 'appliances', c, applianceId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, { ...updates, updatedAt: new Date() });
          return;
        }
      } catch {}
    }

    throw new Error(`Appliance ${applianceId} not found in any collection`);
  }

  /**
   * Delete an appliance. If city is provided, deletes from legacy path.
   * Otherwise searches flat + legacy and deletes from wherever it exists.
   * deleteDoc does NOT throw for missing docs, so we must check existence first.
   */
  async deleteAppliance(applianceId: string, city?: string) {
    const db = getDb();
    let deleted = false;

    // If city is known (legacy appliance), delete there directly
    if (city) {
      const docRef = doc(db, 'pulsebox', 'appliances', city, applianceId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        await deleteDoc(docRef);
        deleted = true;
      }
    }

    // Check flat collection
    const flatDoc = doc(db, 'appliances', applianceId);
    const flatSnap = await getDoc(flatDoc);
    if (flatSnap.exists()) {
      await deleteDoc(flatDoc);
      deleted = true;
    }

    // Check remaining legacy locations
    if (!deleted) {
      for (const c of ['pune', 'nashik', 'jalgaon']) {
        if (city && c === city) continue;
        try {
          const docRef = doc(db, 'pulsebox', 'appliances', c, applianceId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            await deleteDoc(docRef);
            deleted = true;
            break;
          }
        } catch {}
      }
    }

    if (!deleted) {
      console.warn(`Appliance ${applianceId} not found in any collection to delete`);
    }
  }

  // Service Record Operations
  async addServiceRecord(applianceId: string, record: Omit<ServiceRecord, 'id' | 'createdAt'>) {
    try {
      const db = getDb();
      const docRef = await addDoc(collection(db, 'serviceRecords'), {
        ...record,
        applianceId,
        createdAt: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error adding service record:', error);
      throw error;
    }
  }

  getServiceRecordsForAppliance(applianceId: string, callback: (records: ServiceRecord[]) => void) {
    try {
      const db = getDb();
      const q = query(collection(db, 'serviceRecords'), where('applianceId', '==', applianceId));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
            serviceDate: data.serviceDate?.toDate() || new Date(),
            nextServiceDue: data.nextServiceDue?.toDate(),
            createdAt: data.createdAt?.toDate() || new Date(),
          } as ServiceRecord;
        });
        const sorted = records.sort((a, b) => new Date(b.serviceDate).getTime() - new Date(a.serviceDate).getTime());
        callback(sorted);
      });
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching service records:', error);
      throw error;
    }
  }

  async updateServiceRecord(recordId: string, updates: Partial<ServiceRecord>) {
    try {
      const db = getDb();
      await updateDoc(doc(db, 'serviceRecords', recordId), updates);
    } catch (error) {
      console.error('Error updating service record:', error);
      throw error;
    }
  }

  async deleteServiceRecord(recordId: string) {
    try {
      const db = getDb();
      await deleteDoc(doc(db, 'serviceRecords', recordId));
    } catch (error) {
      console.error('Error deleting service record:', error);
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
        path: ['pulsebox', 'propertytaxbills'],
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

  // ============================================
  // ELECTRIC BILLS OPERATIONS
  // ============================================

  /** Get consumer info from pulsebox/ebillinfo/{consumerNumber} */
  async getConsumerInfo(consumerNumber: string): Promise<{
    consumerNumber: string;
    location: string;
    billingUnitNumber: string;
    holderName: string;
    area: string;
    registeredMobile: string;
  } | null> {
    try {
      const db = getDb();
      const snap = await getDocs(collection(db, 'pulsebox', 'ebillinfo', consumerNumber));
      if (!snap.empty) {
        return snap.docs[0].data() as any;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch consumer info:', err);
      return null;
    }
  }

  /** Get consumer numbers mapped to a city from pulsebox/consumernumber */
  async getConsumersByCity(city: string): Promise<string[]> {
    try {
      const db = getDb();
      const snap = await getDoc(doc(db, 'pulsebox', 'consumernumber'));
      if (snap.exists()) {
        const data = snap.data();
        return Object.entries(data)
          .filter(([, value]) => value === city)
          .map(([key]) => key);
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch consumers by city:', err);
      return [];
    }
  }

  /** Add a new consumer */
  async addConsumer(data: {
    consumerNumber: string;
    location: string;
    billingUnitNumber: string;
    holderName: string;
    area: string;
    consumerCity: string;
    registeredMobile: string;
  }): Promise<void> {
    try {
      const db = getDb();
      // Update consumer mapping
      await setDoc(doc(db, 'pulsebox', 'consumernumber'), {
        [data.consumerNumber]: data.consumerCity,
      }, { merge: true });

      // Add consumer info
      await addDoc(collection(db, 'pulsebox', 'ebillinfo', data.consumerNumber), {
        consumerNumber: data.consumerNumber,
        location: data.location,
        billingUnitNumber: data.billingUnitNumber,
        holderName: data.holderName,
        area: data.area,
        registeredMobile: data.registeredMobile,
      });
    } catch (err) {
      console.error('Failed to add consumer:', err);
      throw err;
    }
  }

  /** Get all electric bills for a consumer */
  async getElectricBills(location: string, consumerNumber: string, callback: (bills: ElectricBillEntry[]) => void): Promise<() => void> {
    try {
      const db = getDb();
      const q = query(collection(db, 'pulsebox', 'electricbills', location));
      return onSnapshot(q, (snapshot) => {
        const bills: ElectricBillEntry[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.consumerNumber === consumerNumber) {
            bills.push({
              id: docSnap.id,
              billMonth: data.billMonth || '',
              lastReading: data.lastReading || 0,
              currentReading: data.currentReading || 0,
              totalUnits: data.totalUnits || 0,
              billAmount: data.billAmount || '0',
              billDocumentURL: data.billDocumentURL || '',
              lastDateToPay: data.lastDateToPay?.toDate ? data.lastDateToPay.toDate() : new Date(data.lastDateToPay),
              payStatus: data.payStatus || 'Pending',
              paymentMode: data.paymentMode || 'Cash',
              consumerNumber: data.consumerNumber || '',
              consumerCity: data.consumerCity || location,
            });
          }
        });
        bills.sort((a, b) => new Date(b.lastDateToPay).getTime() - new Date(a.lastDateToPay).getTime());
        callback(bills);
      });
    } catch (err) {
      console.error('Failed to setup electric bills listener:', err);
      return () => {};
    }
  }

  /** Add an electric bill with optional file upload */
  async addElectricBill(
    location: string,
    consumerNumber: string,
    billData: ElectricBillInput,
    fileUri?: string,
    onProgress?: (pct: number) => void,
  ): Promise<string> {
    const db = getDb();
    let billDocURL: string = '';

    if (fileUri) {
      billDocURL = await this.uploadBillFile(fileUri, billData.billMonth, onProgress);
    }

    const docData = {
      billMonth: billData.billMonth,
      lastReading: billData.lastReading,
      currentReading: billData.currentReading,
      totalUnits: billData.totalUnits,
      billAmount: String(billData.billAmount),
      lastDateToPay: billData.lastDateToPay,
      payStatus: billData.payStatus,
      paymentMode: billData.paymentMode,
      billDocumentURL: billDocURL,
      consumerNumber,
      consumerCity: location,
    };

    const docRef = await addDoc(collection(db, 'pulsebox', 'electricbills', location), docData);
    return docRef.id;
  }

  /** Update an electric bill */
  async updateElectricBill(
    location: string,
    billId: string,
    billData: ElectricBillInput,
    fileUri?: string,
    existingBillDocumentURL?: string,
    onProgress?: (pct: number) => void,
  ): Promise<void> {
    const db = getDb();
    let billDocURL = existingBillDocumentURL || '';

    if (fileUri) {
      billDocURL = await this.uploadBillFile(fileUri, billData.billMonth, onProgress);
    }

    const docData: Record<string, any> = {
      billMonth: billData.billMonth,
      lastReading: billData.lastReading,
      currentReading: billData.currentReading,
      totalUnits: billData.totalUnits,
      billAmount: String(billData.billAmount),
      lastDateToPay: billData.lastDateToPay,
      payStatus: billData.payStatus,
      paymentMode: billData.paymentMode,
      billDocumentURL: billDocURL,
    };

    await updateDoc(doc(db, 'pulsebox', 'electricbills', location, billId), docData);
  }

  /** Delete an electric bill and its storage file */
  async deleteElectricBill(location: string, billId: string): Promise<void> {
    const db = getDb();
    const storage = getFirebaseStorage();

    // Try to delete associated file
    try {
      const billSnap = await getDoc(doc(db, 'pulsebox', 'electricbills', location, billId));
      const data = billSnap.data();
      if (data?.billDocumentURL) {
        const fileRef = ref(storage, data.billDocumentURL);
        await deleteObject(fileRef);
      }
    } catch (e) {
      console.log('No storage file to delete or error:', e);
    }

    await deleteDoc(doc(db, 'pulsebox', 'electricbills', location, billId));
  }

  /** Upload bill file to Firebase Storage */
  private async uploadBillFile(fileUri: string, billMonth: string, onProgress?: (pct: number) => void): Promise<string> {
    const storage = getFirebaseStorage();
    const extMatch = fileUri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    const extension = extMatch ? extMatch[1].toLowerCase() : 'jpeg';
    const fileName = `${billMonth.replace(/\s+/g, '_')}_bill_${Date.now()}.${extension}`;
    const fileRef = ref(storage, `documents/electricBills/${fileName}`);

    const response = await fetch(fileUri);
    const blob = await response.blob();

    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  }

  // ============================================
  // GAS (MNGL) BILLS OPERATIONS
  // ============================================

  /** Get BP numbers mapped to a city from pulsebox/bpnumber */
  async getGasConsumersByCity(city: string): Promise<string[]> {
    try {
      const db = getDb();
      const snap = await getDoc(doc(db, 'pulsebox', 'bpnumber'));
      if (snap.exists()) {
        const data = snap.data();
        return Object.entries(data)
          .filter(([, value]) => value === city)
          .map(([key]) => key);
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch gas consumers by city:', err);
      return [];
    }
  }

  /** Get consumer info from pulsebox/mnglbillinfo/{BPNumber} */
  async getGasConsumerInfo(BPNumber: string): Promise<{
    BPNumber: string;
    BPName: string;
    registeredMobile: string;
    MeterNumber: string;
    location: string;
    city: string;
  } | null> {
    try {
      const db = getDb();
      const q = query(collection(db, 'pulsebox', 'mnglbillinfo', BPNumber));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as any;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch gas consumer info:', err);
      return null;
    }
  }

  /** Add a new BP (consumer) */
  async addGasConsumer(data: {
    BPNumber: string;
    BPName: string;
    registeredMobile: string;
    MeterNumber: string;
    location: string;
    city: string;
  }): Promise<void> {
    try {
      const db = getDb();
      // Update BP number mapping
      await setDoc(doc(db, 'pulsebox', 'bpnumber'), {
        [data.BPNumber]: data.city,
      }, { merge: true });

      // Add consumer info
      await addDoc(collection(db, 'pulsebox', 'mnglbillinfo', data.BPNumber), {
        BPNumber: data.BPNumber,
        BPName: data.BPName,
        registeredMobile: data.registeredMobile,
        MeterNumber: data.MeterNumber,
        location: data.location,
        city: data.city,
      });
    } catch (err) {
      console.error('Failed to add gas consumer:', err);
      throw err;
    }
  }

  /** Get all gas bills for a BP with real-time listener */
  async getGasBills(location: string, BPNumber: string, callback: (bills: GasBillEntry[]) => void): Promise<() => void> {
    try {
      const db = getDb();
      const q = query(collection(db, 'pulsebox', 'mnglbills', location));
      return onSnapshot(q, (snapshot) => {
        const bills: GasBillEntry[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.BPNumber === BPNumber) {
            bills.push({
              id: docSnap.id,
              billNumber: data.billNumber || '',
              billGenerationMonth: data.billGenerationMonth || '',
              previousReading: data.previousReading || 0,
              currentReading: data.currentReading || 0,
              unitPrice: data.unitPrice || 0,
              amountToBePaid: data.amountToBePaid || '0',
              billDocumentURL: data.billDocumentURL || '',
              billFileExtension: data.billFileExtension || '',
              billMimeType: data.billMimeType || '',
              lastDateToPay: data.lastDateToPay?.toDate ? data.lastDateToPay.toDate() : new Date(data.lastDateToPay),
              payStatus: data.payStatus || 'Pending',
              paymentMode: data.paymentMode || 'N/A',
              BPNumber: data.BPNumber || '',
              city: data.city || location,
            });
          }
        });
        bills.sort((a, b) => new Date(b.lastDateToPay).getTime() - new Date(a.lastDateToPay).getTime());
        callback(bills);
      });
    } catch (err) {
      console.error('Failed to setup gas bills listener:', err);
      return () => {};
    }
  }

  /** Add a gas bill with optional file upload */
  async addGasBill(
    location: string,
    BPNumber: string,
    billData: GasBillInput,
    fileUri?: string,
    onProgress?: (pct: number) => void,
  ): Promise<string> {
    const db = getDb();
    let billDocURL = '';
    let billFileExtension = '';
    let billMimeType = '';

    if (fileUri) {
      const result = await this.uploadGasBillFile(fileUri, billData.billGenerationMonth, onProgress);
      billDocURL = result.url;
      billFileExtension = result.extension;
      billMimeType = result.mimeType;
    }

    const docData = {
      billGenerationMonth: billData.billGenerationMonth,
      billNumber: String(billData.billNumber),
      previousReading: billData.previousReading,
      currentReading: billData.currentReading,
      unitPrice: billData.unitPrice,
      amountToBePaid: String(billData.amountToBePaid),
      lastDateToPay: billData.lastDateToPay,
      payStatus: billData.payStatus,
      paymentMode: billData.paymentMode,
      billDocumentURL: billDocURL,
      billFileExtension,
      billMimeType,
      city: billData.city,
      BPNumber,
    };

    const docRef = await addDoc(collection(db, 'pulsebox', 'mnglbills', location), docData);
    return docRef.id;
  }

  /** Update a gas bill */
  async updateGasBill(
    location: string,
    billId: string,
    billData: GasBillInput,
    fileUri?: string,
    existingBillDocumentURL?: string,
    onProgress?: (pct: number) => void,
  ): Promise<void> {
    const db = getDb();
    let billDocURL = existingBillDocumentURL || '';
    let billFileExtension = '';
    let billMimeType = '';

    if (fileUri) {
      const result = await this.uploadGasBillFile(fileUri, billData.billGenerationMonth, onProgress);
      billDocURL = result.url;
      billFileExtension = result.extension;
      billMimeType = result.mimeType;
    }

    const docData: Record<string, any> = {
      billGenerationMonth: billData.billGenerationMonth,
      billNumber: String(billData.billNumber),
      previousReading: billData.previousReading,
      currentReading: billData.currentReading,
      unitPrice: billData.unitPrice,
      amountToBePaid: String(billData.amountToBePaid),
      lastDateToPay: billData.lastDateToPay,
      payStatus: billData.payStatus,
      paymentMode: billData.paymentMode,
      billDocumentURL: billDocURL,
      billFileExtension,
      billMimeType,
      city: billData.city,
    };

    await updateDoc(doc(db, 'pulsebox', 'mnglbills', location, billId), docData);
  }

  /** Delete a gas bill and its storage file */
  async deleteGasBill(location: string, billId: string): Promise<void> {
    const db = getDb();
    const storage = getFirebaseStorage();

    try {
      const billSnap = await getDoc(doc(db, 'pulsebox', 'mnglbills', location, billId));
      const data = billSnap.data();
      if (data?.billDocumentURL) {
        const fileRef = ref(storage, data.billDocumentURL);
        await deleteObject(fileRef);
      }
    } catch (e) {
      console.log('No storage file to delete or error:', e);
    }

    await deleteDoc(doc(db, 'pulsebox', 'mnglbills', location, billId));
  }

  /** Upload gas bill file to Firebase Storage */
  /** Upload gas bill file to Firebase Storage. Returns { url, extension, mimeType } */
  private async uploadGasBillFile(fileUri: string, billMonth: string, onProgress?: (pct: number) => void): Promise<{ url: string; extension: string; mimeType: string }> {
    const storage = getFirebaseStorage();
    const fileName = `${billMonth.replace(/\s+/g, '_')}_gas_bill_${Date.now()}`;
    // detect extension from the original file URI
    const extMatch = fileUri.match(/\.([a-zA-Z0-9]+)(\?.*)?$/);
    const extension = extMatch ? extMatch[1].toLowerCase() : 'jpg';
    const mimeType = extension === 'pdf' ? 'application/pdf'
      : extension === 'png' ? 'image/png'
        : extension === 'gif' ? 'image/gif'
          : extension === 'webp' ? 'image/webp'
            : extension === 'heic' || extension === 'heif' ? 'image/heic'
              : extension === 'dng' ? 'image/x-adobe-dng'
                : 'image/jpeg';

    const fileRef = ref(storage, `documents/mnglBills/${fileName}.${extension}`);
    const response = await fetch(fileUri);
    const blob = await response.blob();

    await uploadBytes(fileRef, blob);
    const url = await getDownloadURL(fileRef);
    return { url, extension, mimeType };
  }

  // ============================================
  // PROPERTY TAX BILLS OPERATIONS
  // ============================================

  /** Get tax index numbers mapped to a city from pulsebox/propertytaxindexno */
  async getPropertyTaxConsumersByCity(city: string): Promise<string[]> {
    try {
      const db = getDb();
      const snap = await getDoc(doc(db, 'pulsebox', 'propertytaxindexno'));
      if (snap.exists()) {
        const data = snap.data() as Record<string, string>;
        return Object.entries(data)
          .filter(([, value]) => value === city)
          .map(([key]) => key);
      }
      return [];
    } catch (err) {
      console.error('Failed to fetch property tax consumers by city:', err);
      return [];
    }
  }

  /** Get property info from pulsebox/propertytaxinfo/{taxIndexNumber} */
  async getPropertyTaxInfo(taxIndexNumber: string): Promise<{
    taxIndexNumber: string;
    location: string;
    ownerName: string;
    area: string;
    registeredMobile: string;
  } | null> {
    try {
      const db = getDb();
      const q = query(collection(db, 'pulsebox', 'propertytaxinfo', taxIndexNumber));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as any;
      }
      return null;
    } catch (err) {
      console.error('Failed to fetch property tax info:', err);
      return null;
    }
  }

  /** Add a new property tax index (consumer) */
  async addPropertyTaxConsumer(data: {
    taxIndexNumber: string;
    location: string;
    ownerName: string;
    area: string;
    registeredMobile: string;
    taxCity: string;
  }): Promise<void> {
    try {
      const db = getDb();
      // Update tax index mapping
      await setDoc(doc(db, 'pulsebox', 'propertytaxindexno'), {
        [data.taxIndexNumber]: data.taxCity,
      }, { merge: true });

      // Add consumer info
      await addDoc(collection(db, 'pulsebox', 'propertytaxinfo', data.taxIndexNumber), {
        taxIndexNumber: data.taxIndexNumber,
        location: data.location,
        ownerName: data.ownerName,
        area: data.area,
        registeredMobile: data.registeredMobile,
      });
    } catch (err) {
      console.error('Failed to add property tax consumer:', err);
      throw err;
    }
  }

  /** Get all property tax bills for a tax index with real-time listener */
  async getPropertyTaxBills(location: string, taxIndexNumber: string, callback: (bills: PropertyTaxBillEntry[]) => void): Promise<() => void> {
    try {
      const db = getDb();
      const q = query(collection(db, 'pulsebox', 'propertytaxbills', location));
      return onSnapshot(q, (snapshot) => {
        const bills: PropertyTaxBillEntry[] = [];
        snapshot.forEach(docSnap => {
          const data = docSnap.data();
          if (data.taxIndexNumber === taxIndexNumber) {
            bills.push({
              id: docSnap.id,
              billYear: data.billYear || '',
              taxBillAmount: data.taxBillAmount || '0',
              billDocumentURL: data.billDocumentURL || '',
              lastDateToPay: data.lastDateToPay?.toDate ? data.lastDateToPay.toDate() : new Date(data.lastDateToPay),
              payStatus: data.payStatus || 'Pending',
              paymentMode: data.paymentMode || 'Cash',
              taxIndexNumber: data.taxIndexNumber || '',
              taxCity: data.taxCity || location,
            });
          }
        });
        bills.sort((a, b) => {
          const yearA = parseInt(a.billYear, 10) || 0;
          const yearB = parseInt(b.billYear, 10) || 0;
          return yearB - yearA;
        });
        callback(bills);
      });
    } catch (err) {
      console.error('Failed to setup property tax bills listener:', err);
      return () => {};
    }
  }

  /** Add a property tax bill with optional file upload */
  async addPropertyTaxBill(
    location: string,
    taxIndexNumber: string,
    billData: PropertyTaxBillInput,
    fileUri?: string,
    onProgress?: (pct: number) => void,
  ): Promise<string> {
    const db = getDb();
    let billDocURL: string = '';

    if (fileUri) {
      billDocURL = await this.uploadPropertyTaxBillFile(fileUri, billData.billYear, onProgress);
    }

    const docData = {
      billYear: billData.billYear,
      taxBillAmount: String(billData.taxBillAmount),
      lastDateToPay: billData.lastDateToPay,
      payStatus: billData.payStatus,
      paymentMode: billData.paymentMode,
      billDocumentURL: billDocURL,
      taxIndexNumber,
      taxCity: location,
    };

    const docRef = await addDoc(collection(db, 'pulsebox', 'propertytaxbills', location), docData);
    return docRef.id;
  }

  /** Update a property tax bill */
  async updatePropertyTaxBill(
    location: string,
    billId: string,
    billData: PropertyTaxBillInput,
    fileUri?: string,
    existingBillDocumentURL?: string,
    onProgress?: (pct: number) => void,
  ): Promise<void> {
    const db = getDb();
    let billDocURL = existingBillDocumentURL || '';

    if (fileUri) {
      billDocURL = await this.uploadPropertyTaxBillFile(fileUri, billData.billYear, onProgress);
    }

    const docData: Record<string, any> = {
      billYear: billData.billYear,
      taxBillAmount: String(billData.taxBillAmount),
      lastDateToPay: billData.lastDateToPay,
      payStatus: billData.payStatus,
      paymentMode: billData.paymentMode,
      billDocumentURL: billDocURL,
    };

    await updateDoc(doc(db, 'pulsebox', 'propertytaxbills', location, billId), docData);
  }

  /** Delete a property tax bill and its storage file */
  async deletePropertyTaxBill(location: string, billId: string): Promise<void> {
    const db = getDb();
    const storage = getFirebaseStorage();

    try {
      const billSnap = await getDoc(doc(db, 'pulsebox', 'propertytaxbills', location, billId));
      const data = billSnap.data();
      if (data?.billDocumentURL) {
        const fileRef = ref(storage, data.billDocumentURL);
        await deleteObject(fileRef);
      }
    } catch (e) {
      console.log('No storage file to delete or error:', e);
    }

    await deleteDoc(doc(db, 'pulsebox', 'propertytaxbills', location, billId));
  }

  /** Upload property tax bill file to Firebase Storage */
  private async uploadPropertyTaxBillFile(fileUri: string, billYear: string, onProgress?: (pct: number) => void): Promise<string> {
    const storage = getFirebaseStorage();
    const fileName = `${billYear}_property_tax_bill`;
    const fileRef = ref(storage, `documents/propertyTaxBills/${fileName}`);

    const response = await fetch(fileUri);
    const blob = await response.blob();

    await uploadBytes(fileRef, blob);
    return await getDownloadURL(fileRef);
  }
}

export const firebaseService = new FirebaseService();

// ============================================
// ELECTRIC BILL TYPES
// ============================================

export interface ElectricBillEntry {
  id: string;
  billMonth: string;
  lastReading: number;
  currentReading: number;
  totalUnits: number;
  billAmount: string;
  billDocumentURL: string;
  lastDateToPay: Date;
  payStatus: string;
  paymentMode: string;
  consumerNumber: string;
  consumerCity: string;
}

export interface ElectricBillInput {
  billMonth: string;
  lastReading: number;
  currentReading: number;
  totalUnits: number;
  billAmount: number;
  lastDateToPay: string;
  payStatus: string;
  paymentMode: string;
  billDocumentURL?: string;
}

// ============================================
// GAS (MNGL) BILL TYPES
// ============================================

export interface GasBillEntry {
  id: string;
  billNumber: string;
  billGenerationMonth: string;
  previousReading: number;
  currentReading: number;
  unitPrice: number;
  amountToBePaid: string;
  billDocumentURL: string;
  billFileExtension?: string;
  billMimeType?: string;
  lastDateToPay: Date;
  payStatus: string;
  paymentMode: string;
  BPNumber: string;
  city: string;
}

export interface GasBillInput {
  billNumber: string;
  billGenerationMonth: string;
  previousReading: number;
  currentReading: number;
  unitPrice: number;
  amountToBePaid: number;
  lastDateToPay: string;
  payStatus: string;
  paymentMode: string;
  city: string;
  billDocumentURL?: string;
}

// ============================================
// PROPERTY TAX BILL TYPES
// ============================================

export interface PropertyTaxBillEntry {
  id: string;
  billYear: string;
  taxBillAmount: string;
  billDocumentURL: string;
  lastDateToPay: Date;
  payStatus: string;
  paymentMode: string;
  taxIndexNumber: string;
  taxCity: string;
}

export interface PropertyTaxBillInput {
  billYear: string;
  taxBillAmount: number;
  lastDateToPay: string;
  payStatus: string;
  paymentMode: string;
  billDocumentURL?: string;
}
