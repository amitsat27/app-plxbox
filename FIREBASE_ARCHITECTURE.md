# PulseBox Architecture - Firebase-Only

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     PulseBox Mobile App                      │
│                   (React Native + Expo)                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   UI Layer                           │   │
│  │  ├── Login.tsx (Sleek Material Design)              │   │
│  │  ├── AdvancedDashboard.tsx (Alerts + Notifications) │   │
│  │  ├── Tab Navigation (Material Design 3)            │   │
│  │  └── 10+ UI Components                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Service Layer                           │   │
│  │  ├── BackendService (NEW: System metrics)            │   │
│  │  ├── BillAlertsService (Electric bill monitoring)    │   │
│  │  ├── NotificationContext (Push notifications)        │   │
│  │  └── AuthProvider (Firebase Auth)                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │          State Management Layer                      │   │
│  │  ├── Zustand (Global state)                          │   │
│  │  ├── React Context (Notifications)                   │   │
│  │  └── Firebase real-time listeners                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │        Styling & Theme                               │   │
│  │  ├── React Native Paper (Material Design 3)          │   │
│  │  ├── expo-linear-gradient (Backgrounds)              │   │
│  │  ├── lucide-react-native (Icons)                     │   │
│  │  └── Dark theme throughout                           │   │
│  └──────────────────────────────────────────────────────┘   │
│                         ↓                                     │
└────────────────┬───────────────────────┬──────────────────────┘
                 │                       │
        ┌────────┘                       └─────────┐
        ↓                                           ↓
   ┌─────────────────────────┐          ┌──────────────────────┐
   │  Firebase Authentication │          │  Firebase Realtime DB │
   │  ├── Email/Password      │          │  ├── Device Metrics   │
   │  ├── Google OAuth        │          │  ├── Cron Jobs       │
   │  └── User Management     │          │  ├── Service Status  │
   └─────────────────────────┘          │  ├── Device Logs     │
                                         │  ├── Configuration  │
   ┌─────────────────────────┐          │  └── Health Checks   │
   │  Firestore Database      │          └──────────────────────┘
   │  ├── Electric Bills      │
   │  ├── Bill History        │
   │  ├── User Profile        │
   │  └── Real-time Listeners │
   └─────────────────────────┘

        ┌────────────────────────────────┐
        │    Firebase Cloud Storage       │
        │  (For future file uploads)      │
        └────────────────────────────────┘

        ┌────────────────────────────────┐
        │  Firebase Cloud Functions      │
        │  (Optional: for complex ops)   │
        └────────────────────────────────┘
```

## Component Dependency Graph

```
                    ┌─────────────────┐
                    │  Root (_layout)  │
                    ├─────────────────┤
                    │ - PaperProvider │
                    │ - AuthProvider  │
                    │ - Notif.Cont.   │
                    └────────┬────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ↓                 ↓                 ↓
    ┌────────────┐   ┌──────────────┐   ┌──────────────┐
    │   Login    │   │ Tab Nav      │   │   Modal      │
    │  (Public)  │   │ (Protected)  │   │ (Protected)  │
    └────────────┘   └──────┬───────┘   └──────────────┘
                             │
           ┌─────────────────┼─────────────────┐
           │                 │                 │
           ↓                 ↓                 ↓
    ┌────────────┐   ┌──────────────┐   ┌──────────────┐
    │ Dashboard  │   │  Explore     │   │   Index      │
    │  (Home)    │   │   (Browse)   │   │  (Profile)   │
    └────────────┘   └──────────────┘   └──────────────┘
           │
           ├─ AdvancedDashboard
           │  ├─ Alert Banners
           │  ├─ Notification Badges
           │  └─ Real-time Status
           │
           ├─ BackendService calls
           │  ├─ System Health
           │  ├─ Service Status
           │  └─ Device Logs
           │
           └─ BillAlertsService calls
              ├─ Bill Summary
              ├─ Alert Severity
              └─ Notification Trigger
```

## Technology Stack

```
┌─────────────────────────────────────┐
│         Frontend                     │
├─────────────────────────────────────┤
│ React Native v0.76 (Expo v54)       │
│ TypeScript 5.3+                     │
│ React Navigation 7.x                │
│ React Native Paper 5.x              │
│ expo-linear-gradient                │
│ lucide-react-native                 │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│         State Management             │
├─────────────────────────────────────┤
│ Zustand (Global state)              │
│ React Context (Notifications)       │
│ Firebase real-time listeners        │
└─────────────────────────────────────┘
           ↓
┌─────────────────────────────────────┐
│         Backend (Firebase)           │
├─────────────────────────────────────┤
│ Firebase Auth                       │
│ Firestore Database                  │
│ Firebase Realtime Database          │
│ Firebase Cloud Functions (Optional) │
│ Firebase Storage (Optional)         │
│ Firebase Analytics                  │
└─────────────────────────────────────┘
```

## Service Architecture

### BackendService (Firebase Realtime DB)
```typescript
class BackendService {
  ├── System Health Monitoring
  │   ├─ getSystemHealth()
  │   ├─ logDeviceMetric()
  │   └─ getDeviceLogs()
  │
  ├── Cron Job Management
  │   ├─ getCronJobs()
  │   ├─ upsertCronJob()
  │   └─ deleteCronJob()
  │
  ├── Service Management
  │   ├─ getServiceStatus()
  │   ├─ updateServiceHeartbeat()
  │   ├─ subscribeToServiceStatus() [Real-time]
  │   └─ triggerService()
  │
  ├── Configuration Management
  │   ├─ getDeviceConfig()
  │   └─ updateDeviceConfig()
  │
  └── Health & Status
      └─ healthCheck()
}
```

### BillAlertsService (Firestore)
```typescript
class BillAlertsService {
  ├── Bill Monitoring
  │   ├─ fetchBillData()
  │   └─ compareWithThreshold()
  │
  ├── Alert Generation
  │   ├─ createAlert()
  │   └─ setSeverity()
  │
  ├── Real-time Listeners
  │   ├─ onAlertChange()
  │   └─ onBillUpdate()
  │
  └── Notification Integration
      └─ triggerNotification()
}
```

---

**Firebase-only architecture complete! 🚀**
