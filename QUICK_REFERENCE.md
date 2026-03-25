# 📖 Pulsebox Firebase - Quick Reference

## 🔐 Authentication

```typescript
// Sign up
const { signup } = useAuth();
await signup('user@mail.com', 'pass123', 'John');

// Login
const { login } = useAuth();
await login('user@mail.com', 'pass123');

// Logout
const { logout } = useAuth();
await logout();

// Google Sign-in
const { promptAsync } = useAuth();
await promptAsync();

// Get current user
const { user, userProfile } = useAuth();
console.log(user.email); // 'user@mail.com'
```

## 💾 Firestore Operations

```typescript
import { firebaseService } from './src/services/FirebaseService';

// Add Metric
await firebaseService.addMetric(userId, {
  title: 'Power Usage',
  value: 2450,
  unit: 'kWh',
  color: '#F59E0B',
  category: 'utility'
});

// Subscribe to Metrics
const unsubscribe = firebaseService.getMetrics(userId, (metrics) => {
  console.log('Updated metrics:', metrics);
});
// Cleanup: unsubscribe();

// Add Bill
await firebaseService.addBill(userId, {
  title: 'Electricity',
  amount: 1450,
  dueDate: new Date('2026-04-10'),
  status: 'pending',
  category: 'utilities'
});

// Update Bill
await firebaseService.updateBill(billId, {
  status: 'paid'
});

// Add Log
await firebaseService.addLog(userId, {
  action: 'payment_made',
  description: 'Paid electricity bill',
  severity: 'info'
});
```

## 📊 State Management (Zustand)

```typescript
import { useDashboardStore } from './src/store/dashboardStore';

// Get state
const metrics = useDashboardStore((state) => state.metrics);
const bills = useDashboardStore((state) => state.bills);
const loading = useDashboardStore((state) => state.loading);

// Fetch data
const store = useDashboardStore();
await store.fetchMetrics(userId);
await store.fetchBills(userId);
await store.fetchLogs(userId);

// Add data
await store.addNewBill(userId, billData);
await store.addNewMetric(userId, metricData);

// Update data
await store.updateBillData(billId, { status: 'paid' });
await store.updateMetricData(metricId, { value: 2500 });
```

## 🎨 Components

```typescript
import { AdvancedDashboard } from './components/ui/AdvancedDashboard';
import { StatCard, BillCard, EmptyState } from './components/ui/Cards';
import { FeatureShowcase } from './components/ui/FeatureShowcase';

// Dashboard
<AdvancedDashboard />

// Stat Card
<StatCard
  title="Power"
  value={2450}
  unit="kWh"
  color="#F59E0B"
  trend={5.2}
/>

// Bill Card
<BillCard
  title="Electricity"
  amount={1450}
  dueDate={new Date('2026-04-10')}
  status="pending"
/>

// Empty State
<EmptyState
  title="No Bills"
  description="All paid up!"
  actionLabel="Add Bill"
  onAction={() => {}}
/>

// Features
<FeatureShowcase />
```

## 🌍 Firestore Collections

### users
```
/users/{userId}
├── email: string
├── displayName: string
├── photoURL: string?
├── createdAt: timestamp
├── lastLogin: timestamp
└── preferences: { theme, notifications }
```

### metrics
```
/metrics/{metricId}
├── userId: string (index)
├── title: string
├── value: number|string
├── unit: string
├── color: string
├── category: 'utility'|'vehicle'|'system'|'custom'
├── trend: number?
└── timestamp: timestamp (index)
```

### bills
```
/bills/{billId}
├── userId: string (index)
├── title: string
├── amount: number
├── dueDate: timestamp
├── status: 'paid'|'pending'|'overdue'
├── category: string
├── notes: string?
├── createdAt: timestamp
└── updatedAt: timestamp
```

### logs
```
/logs/{logId}
├── userId: string (index)
├── action: string
├── description: string
├── severity: 'info'|'warning'|'error'
└── timestamp: timestamp
```

## 🛡️ Security Rules

```javascript
// Copy to Firestore Rules tab
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /metrics/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /bills/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    match /logs/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

## 🔄 Common Workflows

### Add Bill and Refresh
```typescript
const { addNewBill, fetchBills } = useDashboardStore();
const { user } = useAuth();

await addNewBill(user.uid, {
  title: 'Water',
  amount: 320,
  dueDate: new Date('2026-04-05'),
  status: 'pending',
  category: 'utilities'
});

// Real-time auto-updates, but can manually refresh:
await fetchBills(user.uid);
```

### Subscribe to Metrics in Component
```typescript
import { useEffect } from 'react';

export function MetricsDisplay() {
  const { user } = useAuth();
  const metrics = useDashboardStore(state => state.metrics);
  const fetchMetrics = useDashboardStore(state => state.fetchMetrics);

  useEffect(() => {
    if (user?.uid) {
      fetchMetrics(user.uid);
    }
  }, [user?.uid]);

  return (
    <View>
      {metrics.map(m => (
        <StatCard key={m.id} {...m} />
      ))}
    </View>
  );
}
```

### Seed Test Data
```typescript
import { seedSampleData } from './src/utils/firebaseSeeder';
import { useAuth } from './src/context/AuthContext';

export function DevTools() {
  const { user } = useAuth();

  const handleSeed = async () => {
    if (user?.uid) {
      await seedSampleData(user.uid);
      console.log('✅ Sample data added');
    }
  };

  return <Button title="Seed Data" onPress={handleSeed} />;
}
```

## 🌈 Colors

```typescript
import { Colors } from './theme/color';

Colors.primary     // '#3B82F6'
Colors.secondary   // '#6366F1'
Colors.accent      // '#F59E0B'
Colors.success     // '#10B981'
Colors.danger      // '#EF4444'
Colors.textPrimary // '#1E293B'
Colors.textSecondary // '#64748B'
Colors.background  // '#F8FAFC'
Colors.glass       // 'rgba(255, 255, 255, 0.7)'
```

## ⚙️ Environment Setup

```bash
# 1. Copy template
cp .env.example .env

# 2. Fill with Firebase credentials
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_KEY
EXPO_PUBLIC_FIREBASE_PROJECT_ID=YOUR_PROJECT
# ... (fill all 8 variables)

# 3. Start app
npm start

# 4. Seed test data (optional)
# - Use DevTools button or call seedSampleData()

# 5. Check Firebase Console
# - Browse collections
# - Verify data syncing
```

## 📞 Debugging

```typescript
// Enable console logging
// Firestore is already logging errors

// Check auth state
const { user, loading } = useAuth();
console.log('User:', user?.email);
console.log('Loading:', loading);

// Check store state
const state = useDashboardStore.getState();
console.log('Metrics:', state.metrics);
console.log('Bills:', state.bills);
console.log('Error:', state.error);

// Monitor Firestore
// - Open Firebase Console
// - Go to Firestore Database
// - Watch collections in real-time
```

## 🚀 Deployment Checklist

- [ ] `.env` configured with production Firebase keys
- [ ] Firestore security rules are published
- [ ] Authentication methods enabled
- [ ] Storage bucket (if using images) configured
- [ ] FCM setup (if using notifications)
- [ ] Build tested on iOS and Android
- [ ] All sensitive data removed from code
- [ ] Analytics enabled (optional)

## 📚 Files Quick Links

| File | Purpose |
|------|---------|
| `src/context/AuthContext.tsx` | Auth & Firebase init |
| `src/services/FirebaseService.ts` | Firestore CRUD |
| `src/store/dashboardStore.ts` | State management |
| `components/ui/AdvancedDashboard.tsx` | Main UI |
| `.env` | Credentials (not in git!) |
| `SETUP_GUIDE.md` | Setup instructions |
| `FIREBASE_ENHANCEMENTS.md` | Feature docs |

## 💡 Pro Tips

1. **Real-time updates are automatic** - Just use store data
2. **Always unsubscribe listeners** - Done automatically in useEffect
3. **Security rules matter** - Test in Firebase Console simulator
4. **Monitor read/writes** - Check Firebase Console usage
5. **Use timestamps** - Firestore serverTimestamp() for consistency
6. **Index queries** - Firestore suggests indexes automatically
7. **Paginate large lists** - Use .limit() and .offset() in queries

---

**Last Updated**: March 25, 2026

Need help? Check SETUP_GUIDE.md or FIREBASE_ENHANCEMENTS.md
