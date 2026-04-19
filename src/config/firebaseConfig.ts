import { FirebaseApp, initializeApp } from "firebase/app";
import {
  Auth,
  getAuth,
  inMemoryPersistence,
  setPersistence
} from "firebase/auth";
import { Firestore, getFirestore, setLogLevel as setFirestoreLogLevel } from "firebase/firestore";
import { FirebaseStorage, getStorage } from "firebase/storage";
import { Platform } from "react-native";

// Detect platform
const isWeb = !Platform.OS || Platform.OS === "web";
const isReactNative = Platform.OS === "ios" || Platform.OS === "android";

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase (only once)
let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export const initializeFirebase = async () => {
  try {
    if (app) return { app, auth, db, storage };

    // Initialize app
    app = initializeApp(firebaseConfig);

    // Initialize Auth
    auth = getAuth(app);

    // Set persistence based on platform
    if (isWeb) {
      // Web uses browser localStorage by default
      console.log(
        "✅ Firebase Auth initialized (web - localStorage persistence)",
      );
    } else {
      // React Native uses in-memory persistence by default
      // This means auth state will NOT persist across app restarts
      // For persistence, you'd need to implement a custom persistence layer
      try {
        await setPersistence(auth, inMemoryPersistence);
        console.log(
          "✅ Firebase Auth initialized (React Native - in-memory persistence)",
        );
      } catch (error) {
        console.warn("Failed to set in-memory persistence:", error);
      }
    }

    // Initialize Firestore and Storage
    // Firestore may emit transient BloomFilter warnings that are recovered internally.
    // Keep native logs clean by surfacing only errors.
    if (isReactNative) {
      setFirestoreLogLevel("error");
    }
    db = getFirestore(app);
    storage = getStorage(app);

    console.log("✅ Firebase initialized successfully");
    return { app, auth, db, storage };
  } catch (error) {
    console.error("❌ Firebase initialization error:", error);
    throw error;
  }
};

// Lazy export functions
export const getFirebaseApp = () => {
  if (!app) {
    throw new Error(
      "Firebase not initialized. Call initializeFirebase() first.",
    );
  }
  return app;
};

export const getFirebaseAuth = () => {
  if (!auth) {
    throw new Error(
      "Firebase Auth not initialized. Call initializeFirebase() first.",
    );
  }
  return auth;
};

export const getFirebaseDb = () => {
  if (!db) {
    throw new Error(
      "Firebase Firestore not initialized. Call initializeFirebase() first.",
    );
  }
  return db;
};

export const getFirebaseStorage = () => {
  if (!storage) {
    throw new Error(
      "Firebase Storage not initialized. Call initializeFirebase() first.",
    );
  }
  return storage;
};

/**
 * Safe analytics tracking - only for web
 */
export const trackAnalyticsEvent = async (
  eventName: string,
  eventParams?: Record<string, any>,
) => {
  if (!isWeb) {
    console.log(
      `[Analytics] Event (skipped on native): ${eventName}`,
      eventParams,
    );
    return;
  }

  try {
    const { logEvent } = await import("firebase/analytics");
    const { getAnalytics } = await import("firebase/analytics");
    const firebaseApp = getFirebaseApp();
    const analytics = getAnalytics(firebaseApp);
    logEvent(analytics, eventName, eventParams);
    console.log(`✅ Tracked event: ${eventName}`);
  } catch (error) {
    console.warn(`Failed to track event: ${eventName}`, error);
  }
};

export default {
  isWeb,
  isReactNative,
  initializeFirebase,
  getFirebaseApp,
  getFirebaseAuth,
  getFirebaseDb,
  getFirebaseStorage,
  trackAnalyticsEvent,
};
