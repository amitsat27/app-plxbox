import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  signOut,
  GoogleAuthProvider,
  signInWithCredential,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { 
  initializeFirebase, 
  getFirebaseAuth, 
  getFirebaseDb, 
  trackAnalyticsEvent 
} from '../config/firebaseConfig';

// Required for Google Sign-in to work on mobile browsers
WebBrowser.maybeCompleteAuthSession();

// Initialize Firebase on module load
let firebaseReady = false;
let initError: Error | null = null;

initializeFirebase().then(() => {
  firebaseReady = true;
  console.log('🔥 Firebase is ready');
}).catch((error) => {
  initError = error;
  console.error('❌ Firebase initialization failed:', error);
});

const AuthContext = createContext<any>(null);

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
  lastLogin: Date;
  preferences?: {
    theme: 'light' | 'dark';
    notifications: boolean;
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: process.env.EXPO_PUBLIC_FIREBASE_GOOGLE_IOS_CLIENT_ID,
  });

  // Handle Google Login Response
  useEffect(() => {
    if (response?.type === 'success' && firebaseReady) {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      const auth = getFirebaseAuth();
      signInWithCredential(auth, credential)
        .then(() => {
          trackAnalyticsEvent('login', { method: 'google' });
        })
        .catch((error) => {
          console.error('Google sign in error:', error);
        });
    }
  }, [response]);

  // Monitor User State and sync with Firestore
  useEffect(() => {
    if (!firebaseReady) return;

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      
      if (u) {
        try {
          // Update last login
          await updateDoc(doc(db, 'users', u.uid), {
            lastLogin: new Date(),
          }).catch(() => {
            // Create user doc if doesn't exist
            return setDoc(doc(db, 'users', u.uid), {
              uid: u.uid,
              email: u.email,
              displayName: u.displayName || 'User',
              photoURL: u.photoURL,
              createdAt: new Date(),
              lastLogin: new Date(),
              preferences: {
                theme: 'light',
                notifications: true,
              },
            });
          });

          // Fetch user profile
          const docSnap = await getDoc(doc(db, 'users', u.uid));
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
          }

          await trackAnalyticsEvent('user_logged_in', { uid: u.uid });
        } catch (error) {
          console.error('Error syncing user profile:', error);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    if (!firebaseReady) throw initError || new Error('Firebase not ready');

    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCred.user, { displayName });
    
    // Create Firestore document
    await setDoc(doc(db, 'users', userCred.user.uid), {
      uid: userCred.user.uid,
      email,
      displayName,
      photoURL: null,
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: 'light',
        notifications: true,
      },
    });

    await trackAnalyticsEvent('sign_up', { email });
    return userCred;
  };

  const login = async (email: string, pass: string) => {
    if (!firebaseReady) throw initError || new Error('Firebase not ready');

    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await trackAnalyticsEvent('login', { method: 'email' });
    return result;
  };

  const logout = async () => {
    if (!firebaseReady) throw initError || new Error('Firebase not ready');

    const auth = getFirebaseAuth();
    await signOut(auth);
    await trackAnalyticsEvent('logout');
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !firebaseReady) return;

    const db = getFirebaseDb();
    
    await updateDoc(doc(db, 'users', user.uid), updates);
    setUserProfile({ ...userProfile, ...updates } as UserProfile);
    await trackAnalyticsEvent('profile_updated');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile,
      login, 
      logout, 
      signup,
      loading, 
      promptAsync, 
      request,
      updateUserProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hooks to use Auth in any screen
export const useAuth = () => useContext(AuthContext);
export const useFirebase = () => useContext(AuthContext);