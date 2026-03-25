# 🎯 Pulsebox - Firebase-Powered Dashboard App

A modern, feature-rich React Native app built with Expo, Firebase, and cutting-edge technologies for managing bills, tracking metrics, and monitoring system performance in real-time.

## 🌟 Key Features

✨ **Real-time Data Sync**
- Live Firestore synchronization
- Instant updates across devices
- Real-time metrics and bills tracking

🔐 **Secure Authentication**
- Email/Password login
- Google Sign-in support
- Automatic user profile creation

📊 **Dashboard & Analytics**
- Live system metrics
- Bill management with status tracking
- Performance analytics
- Event logging

💰 **Bill Management**
- Track bills with due dates
- Status indicators (Paid/Pending/Overdue)
- Amount calculations
- Bill history

📈 **System Monitoring**
- Power consumption tracking
- Water usage metrics
- Gas usage monitoring
- CPU/System load tracking

🎨 **Professional Design System**
- Business dashboard aesthetic
- Reusable component library
- Data visualization (Charts & Tables)
- Responsive layouts
- Dark/Light theme ready

📱 **Component Library**
- Navbar with search & notifications
- Sidebar navigation
- Widget cards for metrics
- Featured carousel for key metrics
- Data tables with sorting
- Line & Pie charts
- Dedicated bill category screens

## 🛠️ Tech Stack

- **Frontend**: React Native (Expo)
- **Backend**: Firebase (Auth + Firestore)
- **State Management**: Zustand
- **Analytics**: Firebase Analytics
- **Icons**: Lucide React Native
- **UI**: Professional business design components
- **Language**: TypeScript

## 📱 Screenshots

```
[Dashboard]         [Bills]          [Metrics]
+───────────+      +───────────+      +───────────+
│ Welcome!  │      │ Recent    │      │ Status    │
│ ₹2,849    │      │ Bills     │      │ 12.4% CPU │
│ Pending   │      │ ₹1,450    │      │ 145L Water│
│ ₹1,450    │      │ Electricity      │ 85m³ Gas  │
+───────────+      +───────────+      +───────────+
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Firebase account

### Installation

1. **Clone and Install**
```bash
cd Pulsebox
npm install
```

2. **Configure Firebase**
```bash
cp .env.example .env
# Edit .env with your Firebase credentials
```

3. **Start Development**
```bash
npm start
```

Then press:
- `i` for iOS
- `a` for Android
- `w` for web

### First Time Setup
See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for detailed Firebase configuration.

## 📚 Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete Firebase setup instructions
- **[FIREBASE_ENHANCEMENTS.md](./FIREBASE_ENHANCEMENTS.md)** - Firebase features & API reference
- **[API Reference](#api-reference)** - Code examples below

## 🔧 Project Structure

```
Pulsebox/
├── app/                          # Expo Router screens
│   ├── (tabs)/                   # Tab navigation
│   │   ├── index.tsx             # Dashboard
│   │   └── explore.tsx           # Other screens
│   ├── login.tsx                 # Login screen
│   └── _layout.tsx               # Layout configuration
├── components/
│   ├── ui/
│   │   ├── RedesignedHome.tsx    # New dashboard with design system
│   │   ├── Navbar.tsx            # Top navigation bar
│   │   ├── Sidebar.tsx           # Navigation drawer
│   │   ├── Widget.tsx            # Metric card component
│   │   ├── Featured.tsx          # Key metrics carousel
│   │   ├── DataTable.tsx         # Reusable data table
│   │   ├── LineChart.tsx         # Trend visualization
│   │   ├── PieChart.tsx          # Distribution chart
│   │   ├── ElectricBills.tsx     # Electric bills screen
│   │   ├── WaterBills.tsx        # Water bills screen
│   │   ├── AdvancedDashboard.tsx # Legacy dashboard
│   │   ├── Cards.tsx             # Reusable card components
│   │   ├── GlassContainer.tsx    # Glass effect container
│   │   └── FeatureShowcase.tsx   # Feature showcase
│   └── ... other components
├── src/
│   ├── context/
│   │   └── AuthContext.tsx       # Firebase auth provider
│   ├── services/
│   │   └── FirebaseService.ts    # Firestore operations
│   ├── store/
│   │   └── dashboardStore.ts     # Zustand state management
│   └── utils/
│       └── firebaseSeeder.ts     # Sample data seeder
├── theme/
│   └── color.ts                  # Color palette
├── .env                          # Firebase credentials (create from .env.example)
├── .env.example                  # Environment template
├── firebase.json                 # Firebase configuration
└── README.md                     # This file
```

## 🎨 Component Library

### Navigation & Display
- **Navbar** - Top navigation with search, notifications, and user profile
- **Sidebar** - Navigation drawer with bill categories and settings
- **Widget** - Metric cards showing statistics with icons and trends
- **Featured** - Horizontal scrolling carousel for key metrics

### Data Visualization
- **LineChart** - Trend visualization with grid and legend
- **PieChart** - Distribution chart showing bill breakdown
- **DataTable** - Reusable table with sorting, filtering, and custom rendering

### Screens
- **RedesignedHome** - Main dashboard integrating all components
- **ElectricBills** - Dedicated screen for electric bills with trends and history
- **WaterBills** - Dedicated screen for water bills with consumption tracking
- *More category screens can be added following the same pattern*

### Color System
```typescript
Primary: #3B82F6 (Blue)
Secondary: #6366F1 (Indigo)  
Accent: #FDB022 (Amber)
Success: #10B981 (Green)
Danger: #EF4444 (Red)

Categories:
- Electric: #FDB022 (Amber)
- Water: #3B82F6 (Blue)
- Gas: #EF4444 (Red)
- WiFi: #6366F1 (Indigo)
```

## 📖 API Reference

### Authentication

```typescript
import { useAuth } from './src/context/AuthContext';

const { user, userProfile, login, logout, signup, updateUserProfile } = useAuth();

// Sign up
await signup('user@example.com', 'password123', 'John Doe');

// Login
await login('user@example.com', 'password123');

// Logout
await logout();

// Update profile
await updateUserProfile({
  displayName: 'New Name',
  preferences: { theme: 'dark' }
});
```

### Dashboard Data

```typescript
import { useDashboardStore } from './src/store/dashboardStore';

const store = useDashboardStore();

// Fetch metrics
await store.fetchMetrics(userId);

// Fetch bills
await store.fetchBills(userId);

// Add bill
await store.addNewBill(userId, {
  title: 'Electricity',
  amount: 1450,
  dueDate: new Date('2026-04-10'),
  status: 'pending',
  category: 'utilities'
});

// Access data
const { metrics, bills } = useDashboardStore();
```

### Firestore Service

```typescript
import { firebaseService } from './src/services/FirebaseService';

// Add metric
await firebaseService.addMetric(userId, {
  title: 'Power Consumption',
  value: 2450,
  unit: 'kWh',
  category: 'utility'
});

// Subscribe to metrics
const unsubscribe = firebaseService.getMetrics(userId, (metrics) => {
  console.log('Metrics updated:', metrics);
});

// Cleanup
unsubscribe();
```

### Sample Data

```typescript
import { seedSampleData } from './src/utils/firebaseSeeder';

// Add test data
await seedSampleData(userId);
```

## 🎨 Theming

Update colors in `theme/color.ts`:

```typescript
export const Colors = {
  primary: '#3B82F6',      // Blue
  secondary: '#6366F1',    // Indigo
  accent: '#F59E0B',       // Amber
  success: '#10B981',      // Green
  danger: '#EF4444',       // Red
  textPrimary: '#1E293B',  // Dark
  textSecondary: '#64748B' // Gray
};
```

## 🔐 Security

✅ Firestore rules enforce user data isolation
✅ Environment variables for API keys
✅ HTTPS for all communications
✅ Automatic user authentication
✅ Secure token management

See security rules in [FIREBASE_ENHANCEMENTS.md](./FIREBASE_ENHANCEMENTS.md)

## 📊 Available Screens

| Screen | Purpose |
|--------|---------|
| Dashboard | Main hub with metrics & bills |
| Bills | Detailed bill management |
| Metrics | System metrics display |
| Explore | Additional features |
| Login | Authentication |

## 🧪 Testing

### Manual Testing
1. Sign up with email
2. Try Google Sign-in
3. Add sample data with seed
4. Verify real-time updates
5. Test bill status changes

### Firestore Testing
Monitor in Firebase Console:
- **Collection**: Users → Check your profile created
- **Collection**: Bills → Add/update bills
- **Collection**: Metrics → View metrics

## 📈 Performance

- ✅ Real-time listeners with auto-cleanup
- ✅ Lazy loading for lists
- ✅ Optimized re-renders with Zustand
- ✅ Memoized components
- ✅ Efficient Firestore queries

## 🚀 Deployment

### Build for iOS
```bash
eas build --platform ios
eas submit --platform ios
```

### Build for Android
```bash
eas build --platform android
eas submit --platform android
```

### Deploy to Firebase Hosting (Web)
```bash
firebase deploy --only hosting
```

## 🐛 Troubleshooting

**Issue**: Firebase not initialized
- **Solution**: Check `.env` file has all credentials

**Issue**: Real-time data not updating
- **Solution**: Check Firestore rules and user authentication

**Issue**: Google Sign-in fails
- **Solution**: Verify iOS Client ID in `.env`

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for more troubleshooting.

## 📞 Support & Resources

- [Firebase Docs](https://firebase.google.com/docs)
- [Expo Docs](https://docs.expo.dev)
- [React Native Docs](https://reactnative.dev)
- [Zustand Documentation](https://github.com/pmndrs/zustand)

## 📝 License

MIT License - feel free to use this project for personal or commercial purposes.

## 🎉 What's New

**v2.0.0** - Firebase Enhancement
- ✨ Complete Firebase integration
- ✨ Real-time Firestore sync
- ✨ Advanced Dashboard UI
- ✨ State management with Zustand
- ✨ Analytics integration
- ✨ Beautiful glass morphism design
- ✨ Feature showcase component

## 💡 Future Roadmap

- [ ] Push notifications (FCM)
- [ ] File uploads to Storage
- [ ] Offline support
- [ ] Advanced charts
- [ ] Export to PDF/CSV
- [ ] Dark mode toggle
- [ ] Monthly predictions
- [ ] Spending analytics
- [ ] Multi-user support
- [ ] Custom categories

## 👨‍💻 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 🙏 Acknowledgments

- Firebase team for amazing backend
- Expo for React Native tooling
- Lucide for beautiful icons
- The React Native community

---

**Made with ❤️ using Firebase & Expo**

🚀 Happy coding!

