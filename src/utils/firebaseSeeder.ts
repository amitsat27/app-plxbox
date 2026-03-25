/**
 * Firebase Data Seeder for Development
 * 
 * Usage: Run this in your Firebase console or integrate with your app initialization
 * This creates sample data for testing the Pulsebox app
 */

import { 
  getFirestore, 
  collection, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  deleteDoc,
  doc
} from 'firebase/firestore';

const db = getFirestore();

export const seedSampleData = async (userId: string) => {
  try {
    console.log('🌱 Starting to seed sample data...');

    // Sample metrics
    const metricsData = [
      {
        userId,
        title: 'Power Consumption',
        value: 2450,
        unit: 'kWh',
        icon: 'zap',
        color: '#F59E0B',
        category: 'utility',
        trend: 5.2,
        timestamp: serverTimestamp(),
      },
      {
        userId,
        title: 'Water Usage',
        value: 145,
        unit: 'L',
        icon: 'droplet',
        color: '#3B82F6',
        category: 'utility',
        trend: -2.1,
        timestamp: serverTimestamp(),
      },
      {
        userId,
        title: 'Gas Usage',
        value: 85,
        unit: 'm³',
        icon: 'flame',
        color: '#EF4444',
        category: 'utility',
        trend: 8.5,
        timestamp: serverTimestamp(),
      },
      {
        userId,
        title: 'System Load',
        value: 12.4,
        unit: '%',
        icon: 'activity',
        color: '#6366F1',
        category: 'system',
        trend: 1.2,
        timestamp: serverTimestamp(),
      },
    ];

    // Add metrics
    for (const metric of metricsData) {
      await addDoc(collection(db, 'metrics'), metric);
      console.log(`✅ Added metric: ${metric.title}`);
    }

    // Sample bills
    const billsData = [
      {
        userId,
        title: 'Electricity Bill - March 2026',
        amount: 1450,
        dueDate: new Date('2026-04-10'),
        status: 'pending',
        category: 'utilities',
        notes: 'March consumption - 245 kWh',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        userId,
        title: 'Water Bill - March 2026',
        amount: 320,
        dueDate: new Date('2026-04-05'),
        status: 'pending',
        category: 'utilities',
        notes: 'Water consumption - 145 L',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        userId,
        title: 'Internet Bill - March 2026',
        amount: 599,
        dueDate: new Date('2026-03-28'),
        status: 'paid',
        category: 'utilities',
        notes: 'Monthly internet subscription',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        userId,
        title: 'Gas Bill - March 2026',
        amount: 480,
        dueDate: new Date('2026-03-25'),
        status: 'overdue',
        category: 'utilities',
        notes: 'Gas consumption - 85 m³ (OVERDUE)',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
      {
        userId,
        title: 'Vehicle Maintenance',
        amount: 2500,
        dueDate: new Date('2026-04-15'),
        status: 'pending',
        category: 'vehicle',
        notes: 'Quarterly maintenance check',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      },
    ];

    // Add bills
    for (const bill of billsData) {
      await addDoc(collection(db, 'bills'), bill);
      console.log(`✅ Added bill: ${bill.title}`);
    }

    // Sample logs
    const logsData = [
      {
        userId,
        action: 'system_update',
        description: 'System updated to latest version v2.1.0',
        severity: 'info',
        timestamp: serverTimestamp(),
      },
      {
        userId,
        action: 'bill_payment',
        description: 'Paid Internet Bill - March 2026 (₹599)',
        severity: 'info',
        timestamp: serverTimestamp(),
      },
      {
        userId,
        action: 'warning_threshold',
        description: 'Power consumption exceeded threshold by 5.2%',
        severity: 'warning',
        timestamp: serverTimestamp(),
      },
      {
        userId,
        action: 'maintenance_due',
        description: 'Vehicle maintenance check is due',
        severity: 'warning',
        timestamp: serverTimestamp(),
      },
      {
        userId,
        action: 'connection_restored',
        description: 'System connection restored after brief outage',
        severity: 'info',
        timestamp: serverTimestamp(),
      },
    ];

    // Add logs
    for (const log of logsData) {
      await addDoc(collection(db, 'logs'), log);
      console.log(`✅ Added log: ${log.action}`);
    }

    console.log('🎉 Sample data seeding completed successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
};

/**
 * Clear all user data from Firestore
 * Use with caution!
 */
export const clearUserData = async (userId: string) => {
  try {
    console.log('⚠️ Clearing all data for user:', userId);

    const collectionNames = ['metrics', 'bills', 'logs'];

    for (const collectionName of collectionNames) {
      const q = query(collection(db, collectionName), where('userId', '==', userId));
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        await deleteDoc(doc(db, collectionName, docSnap.id));
      }
      console.log(`✅ Cleared ${collectionName}`);
    }

    console.log('🎉 All user data cleared!');
  } catch (error) {
    console.error('❌ Error clearing data:', error);
    throw error;
  }
};

/**
 * Example usage in your app:
 * 
 * import { seedSampleData } from './utils/firebaseSeeder';
 * import { useAuth } from './src/context/AuthContext';
 * 
 * function MyComponent() {
 *   const { user } = useAuth();
 *   
 *   const handleSeedData = async () => {
 *     if (user?.uid) {
 *       await seedSampleData(user.uid);
 *     }
 *   };
 *   
 *   return (
 *     <Button title="Seed Sample Data" onPress={handleSeedData} />
 *   );
 * }
 */
