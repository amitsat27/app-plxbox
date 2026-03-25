# 🎯 Pulsebox Firebase Setup - Quick Start Guide

## 📋 Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Firebase Project created
- Google Cloud Project for OAuth

## 🚀 Step-by-Step Setup

### Step 1: Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Go to Project Settings → General
4. Scroll down to "Your apps" section
5. Click "Web" to create a web app
6. Copy the Firebase config object

Your config should look like:
```javascript
{
  apiKey: "AIzaSyD...",
  authDomain: "myapp.firebaseapp.com",
  projectId: "myapp-12345",
  storageBucket: "myapp-12345.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123def456"
}
```

### Step 2: Configure Google Sign-in (Optional but Recommended)

#### For iOS:
1. In Firebase Console, go to Authentication → Sign-in methods
2. Enable Google
3. Go to Google Cloud Console
4. Create OAuth 2.0 Client ID for iOS
5. Copy the **iOS Client ID**

#### For Android:
1. Get your Android app's SHA-1 fingerprint
2. Create OAuth 2.0 Client ID for Android in Google Cloud Console
3. Copy the **Android Client ID**

### Step 3: Set Up Environment Variables

1. Copy `.env.example` to `.env` in the project root:
```bash
cp .env.example .env
```

2. Fill in all the values with your Firebase credentials:
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyD...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=myapp.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=myapp-12345
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=myapp-12345.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123def456
EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID=xyz...apps.googleusercontent.com
```

### Step 4: Set Up Firestore Database

1. In Firebase Console, go to Firestore Database
2. Create a new database in **production mode**
3. Choose a region (preferably closest to you)
4. Click "Create"

### Step 5: Configure Firestore Security Rules

1. Go to Firestore Database → Rules
2. Replace the default rules with the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - each user can only access their own document
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Metrics collection - each user can only access their own metrics
    match /metrics/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Bills collection - each user can only access their own bills
    match /bills/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
    
    // Logs collection - each user can only access their own logs
    match /logs/{document=**} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId;
    }
  }
}
```

3. Click "Publish"

### Step 6: Enable Authentication Methods

1. Go to Authentication → Sign-in method
2. Enable:
   - ✅ Email/Password
   - ✅ Google (recommended)

### Step 7: Install Dependencies

```bash
npm install
# or
yarn install
```

### Step 8: Start the App

```bash
npm start
# or
expo start
```

Then press:
- `i` for iOS
- `a` for Android
- `w` for web

### Step 9: Test Firebase Connection

After the app starts:

1. **Sign up** with email and password
2. Check Firebase Console → Authentication to verify user was created
3. Check Firestore → users collection to see your user document

### Step 10: Seed Sample Data (Optional)

In your app, you can programmatically seed sample data:

```typescript
import { seedSampleData } from './src/utils/firebaseSeeder';
import { useAuth } from './src/context/AuthContext';

// In your component:
const { user } = useAuth();

const handleSeedData = async () => {
  if (user?.uid) {
    await seedSampleData(user.uid);
    console.log('✅ Sample data added!');
  }
};

// Then call handleSeedData() to populate sample data
```

## 📱 Features Now Available

✅ **Real-time Dashboard**
- Live metrics from Firestore
- Real-time bill updates
- System logs tracking

✅ **Authentication**
- Email/Password login
- Google Sign-in
- Secure user profiles

✅ **Data Management**
- Add bills
- Track metrics
- View system logs
- Update preferences

✅ **Analytics**
- Automatic event tracking
- User activity logs
- Performance metrics

## 🔧 Troubleshooting

### Error: "Cannot find module 'zustand'"
```bash
npm install zustand
```

### Error: "Firebase app not initialized"
- Check if `.env` file exists and has all required variables
- Verify Firebase project ID is correct
- Check network connectivity

### Error: "User not found in Firestore"
- It may take a few seconds to sync
- Try signing out and in again
- Check Firestore → users collection

### Firestore Rules Rejected?
- Check that you published the security rules
- Verify user is authenticated (check auth.uid)
- Check that user ID matches in the document

### Google Sign-in Not Working?
- Verify iOS Client ID is correct
- Check Firebase Console → Authentication → Sign-in methods → Google is enabled
- Try signing out completely and back in

## 📚 Useful Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)
- [Expo Firebase Setup](https://docs.expo.dev/guides/setup/)

## 🆘 Need Help?

1. **Check Firebase Console** for error messages
2. **Review Firestore Rules** for permission issues
3. **Check Network Tab** in browser DevTools
4. **Enable Firestore Debugging** in Firebase Console
5. **Check app logs** with `adb logcat` (Android) or Xcode (iOS)

## ✅ Checklist

- [ ] Firebase project created
- [ ] Firestore database created
- [ ] `.env` file configured with Firebase credentials
- [ ] Security rules published
- [ ] Authentication methods enabled
- [ ] Dependencies installed (`npm install`)
- [ ] App starts without errors (`npm start`)
- [ ] User can sign up with email/password
- [ ] User data appears in Firestore
- [ ] Google Sign-in working (if configured)
- [ ] Sample data seeded and visible in app

## 🎉 You're All Set!

Your Pulsebox app is now connected to Firebase and ready for development!

Next steps:
- Customize themes in `theme/color.ts`
- Add more metrics/bill categories
- Build custom screens
- Deploy to Firebase Hosting or Expo
