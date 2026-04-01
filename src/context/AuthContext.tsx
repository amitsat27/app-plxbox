import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import {
  initializeFirebase,
  getFirebaseAuth,
  getFirebaseDb,
  trackAnalyticsEvent
} from '../config/firebaseConfig';
import { logger } from '../services/Logger';

// Initialize Firebase on module load
let firebaseReady = false;
let initError: Error | null = null;

initializeFirebase().then(() => {
  firebaseReady = true;
  logger.info('🔥 Firebase is ready');
}).catch((error) => {
  initError = error;
  logger.error('❌ Firebase initialization failed:', error);
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
  const [initError, setInitError] = useState<Error | null>(null);

  // Monitor Firebase initialization and set up auth listener
  useEffect(() => {
    let mounted = true;

    const setupAuth = async () => {
      // Wait for Firebase to be ready (with timeout)
      const waitForFirebase = async (): Promise<boolean> => {
        const startTime = Date.now();
        while (!firebaseReady && Date.now() - startTime < 8000) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        return firebaseReady;
      };

      const ready = await waitForFirebase();

      if (!mounted) return;

      if (!ready) {
        const error = initError || new Error('Firebase initialization timeout');
        setInitError(error);
        console.error('❌ Firebase not ready:', error);
        setLoading(false);
        return;
      }

      try {
        const auth = getFirebaseAuth();
        const db = getFirebaseDb();

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
          if (!mounted) return;
          logger.debug('Auth state changed', { user: u ? { uid: u.uid, email: u.email } : null });
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
              logger.info('User logged in', { uid: u.uid, email: u.email });
            } catch (error) {
              logger.error('Error syncing user profile:', error as Error);
            }
          } else {
            logger.info('User logged out (auth state null)');
            setUserProfile(null);
          }

          setLoading(false);
        });

        return () => {
          mounted = false;
          unsubscribe();
        };
      } catch (error) {
        console.error('Failed to set up auth listener:', error);
        setInitError(error as Error);
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  const signup = async (email: string, password: string, displayName: string) => {
    if (!firebaseReady) throw initError || new Error('Firebase not ready');

    logger.info('Signup attempt', { email, displayName });
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
    logger.info('Signup successful', { email, uid: userCred.user.uid });
    return userCred;
  };

  const login = async (email: string, pass: string) => {
    if (!firebaseReady) throw initError || new Error('Firebase not ready');

    logger.info('Login attempt', { email });
    const auth = getFirebaseAuth();
    const result = await signInWithEmailAndPassword(auth, email, pass);
    await trackAnalyticsEvent('login', { method: 'email' });
    logger.info('Login successful', { email, uid: result.user.uid });
    return result;
  };

  const logout = async () => {
    if (!firebaseReady) throw initError || new Error('Firebase not ready');

    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    await signOut(auth);
    await trackAnalyticsEvent('logout');
    logger.info('User logged out', { uid: currentUser?.uid });
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
      updateUserProfile,
      initError,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hooks to use Auth in any screen
export const useAuth = () => useContext(AuthContext);
export const useFirebase = () => useContext(AuthContext);