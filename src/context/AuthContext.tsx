import * as LocalAuthentication from "expo-local-authentication";
import {
    createUserWithEmailAndPassword,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import React, { createContext, useContext, useEffect, useState } from "react";
import {
    getFirebaseAuth,
    getFirebaseDb,
    initializeFirebase,
    trackAnalyticsEvent,
} from "../config/firebaseConfig";
import { logger } from "../services/Logger";

// Initialize Firebase on module load
let firebaseReady = false;
let initError: Error | null = null;

initializeFirebase()
  .then(() => {
    firebaseReady = true;
    logger.info("🔥 Firebase is ready");
  })
  .catch((error) => {
    initError = error;
    logger.error("❌ Firebase initialization failed:", error);
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
    theme: "light" | "dark";
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
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        return firebaseReady;
      };

      const ready = await waitForFirebase();

      if (!mounted) return;

      if (!ready) {
        const error = initError || new Error("Firebase initialization timeout");
        setInitError(error);
        console.error("❌ Firebase not ready:", error);
        setLoading(false);
        return;
      }

      try {
        const auth = getFirebaseAuth();
        const db = getFirebaseDb();

        const unsubscribe = onAuthStateChanged(auth, async (u) => {
          if (!mounted) return;
          logger.debug("Auth state changed", {
            user: u ? { uid: u.uid, email: u.email } : null,
          });
          setUser(u);

          if (u) {
            try {
              // Update last login
              await updateDoc(doc(db, "users", u.uid), {
                lastLogin: new Date(),
              }).catch(() => {
                // Create user doc if doesn't exist
                return setDoc(doc(db, "users", u.uid), {
                  uid: u.uid,
                  email: u.email,
                  displayName: u.displayName || "User",
                  photoURL: u.photoURL,
                  createdAt: new Date(),
                  lastLogin: new Date(),
                  preferences: {
                    theme: "light",
                    notifications: true,
                  },
                });
              });

              // Fetch user profile
              const docSnap = await getDoc(doc(db, "users", u.uid));
              if (docSnap.exists()) {
                setUserProfile(docSnap.data() as UserProfile);
              }

              await trackAnalyticsEvent("user_logged_in", { uid: u.uid });
              logger.info("User logged in", { uid: u.uid, email: u.email });
            } catch (error) {
              logger.error("Error syncing user profile:", error as Error);
            }
          } else {
            logger.info("User logged out (auth state null)");
            setUserProfile(null);
          }

          setLoading(false);
        });

        return () => {
          mounted = false;
          unsubscribe();
        };
      } catch (error) {
        console.error("Failed to set up auth listener:", error);
        setInitError(error as Error);
        setLoading(false);
      }
    };

    setupAuth();
  }, []);

  const signup = async (
    email: string,
    password: string,
    displayName: string,
  ) => {
    if (!firebaseReady) throw initError || new Error("Firebase not ready");

    logger.info("Signup attempt", { email, displayName });
    const auth = getFirebaseAuth();
    const db = getFirebaseDb();

    const userCred = await createUserWithEmailAndPassword(
      auth,
      email,
      password,
    );
    await updateProfile(userCred.user, { displayName });

    // Create Firestore document
    await setDoc(doc(db, "users", userCred.user.uid), {
      uid: userCred.user.uid,
      email,
      displayName,
      photoURL: null,
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: "light",
        notifications: true,
      },
    });

    await trackAnalyticsEvent("sign_up", { email });
    logger.info("Signup successful", { email, uid: userCred.user.uid });
    return userCred;
  };

  const login = async (email: string, pass: string) => {
    if (!firebaseReady) throw initError || new Error("Firebase not ready");

    logger.info("Login attempt", { email });
    const auth = getFirebaseAuth();

    try {
      const result = await signInWithEmailAndPassword(auth, email, pass);
      await trackAnalyticsEvent("login", { method: "email" });
      logger.info("Login successful", { email, uid: result.user.uid });
      return result;
    } catch (error: any) {
      // Map Firebase error codes to friendly messages
      let friendlyMessage = "Login failed. Please try again.";

      if (error.code === "auth/user-not-found") {
        friendlyMessage =
          "Email address not found. Please check and try again.";
      } else if (error.code === "auth/wrong-password") {
        friendlyMessage = "Password is incorrect. Please try again.";
      } else if (error.code === "auth/invalid-email") {
        friendlyMessage = "Please enter a valid email address.";
      } else if (error.code === "auth/user-disabled") {
        friendlyMessage = "This account has been disabled.";
      } else if (error.code === "auth/too-many-requests") {
        friendlyMessage =
          "Too many failed login attempts. Please try again later.";
      } else if (error.message?.includes("Firebase not ready")) {
        friendlyMessage =
          "Unable to connect. Please check your internet connection.";
      }

      logger.error("Login error", undefined, {
        email,
        code: error.code,
        message: error.message,
      });
      throw new Error(friendlyMessage);
    }
  };

  const loginWithPin = async (pin: string) => {
    // Get configured PIN from env
    const configuredPin = process.env.EXPO_PUBLIC_APP_PIN?.trim();

    logger.info("PIN Login Attempt", {
      configuredPin: configuredPin ? "***" : "NOT SET",
      userPin: pin,
    });

    if (!configuredPin) {
      throw new Error("PIN login not configured. Please contact support.");
    }

    // Validate PIN - trim and compare
    const trimmedPin = pin.trim();
    if (trimmedPin !== configuredPin) {
      logger.warn("Incorrect PIN attempt", {
        entered: trimmedPin,
        expected: configuredPin,
      });
      throw new Error("The PIN you entered is incorrect. Please try again.");
    }

    // PIN is correct - create mock authenticated user
    logger.info("PIN login successful");

    const pinUser = {
      uid: "pin-user",
      email: "pin@access.app",
      displayName: "PIN User",
      metadata: {
        creationTime: new Date().toISOString(),
        lastSignInTime: new Date().toISOString(),
      },
    };

    // Update user state to mark as authenticated
    setUser(pinUser);
    setUserProfile({
      uid: "pin-user",
      email: "pin@access.app",
      displayName: "PIN User",
      createdAt: new Date(),
      lastLogin: new Date(),
      preferences: {
        theme: "light",
        notifications: true,
      },
    });

    await trackAnalyticsEvent("login", { method: "pin" });
    setLoading(false);

    return { user: pinUser };
  };

  const loginWithFaceId = async () => {
    try {
      logger.info("Face ID login attempt");

      // Check if device has biometric capability
      const compatible = await LocalAuthentication.hasHardwareAsync();
      logger.info("Biometric hardware compatible:", { compatible });

      if (!compatible) {
        throw new Error(
          "This device does not support Face ID or biometric authentication.",
        );
      }

      // Check available authentication types
      const authTypes =
        await LocalAuthentication.supportedAuthenticationTypesAsync();
      logger.info("Supported authentication types:", {
        authTypes,
        types: authTypes.map((t) => LocalAuthentication.AuthenticationType[t]),
      });

      const hasFaceId = authTypes.includes(
        LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
      );
      const hasFingerprint = authTypes.includes(
        LocalAuthentication.AuthenticationType.FINGERPRINT,
      );

      logger.info("Biometric availability:", { hasFaceId, hasFingerprint });

      if (!hasFaceId && !hasFingerprint) {
        throw new Error(
          "No biometric authentication available on this device.",
        );
      }

      // Check if biometric is enrolled
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      logger.info("Biometric enrolled:", { enrolled });

      if (!enrolled) {
        throw new Error(
          "No biometric data enrolled on this device. Please set up Face ID/Fingerprint in device settings.",
        );
      }

      // Authenticate with biometric (Face ID on iOS, fingerprint/face on Android)
      logger.info("Starting biometric authentication");
      const result = await LocalAuthentication.authenticateAsync({
        disableDeviceFallback: false, // Allow fallback for better compatibility
      });

      logger.info("Biometric authentication result:", {
        success: result.success,
        error: (result as any).error,
      });

      if (!result.success) {
        const error = (result as any).error;

        if (
          error === "user_cancel" ||
          error === "system_cancel" ||
          error === "invalid_context"
        ) {
          throw new Error("Face ID authentication was cancelled.");
        }
        if (error === "timeout" || error === "unable_to_process") {
          throw new Error("Authentication timed out. Please try again.");
        }
        if (error === "not_enrolled" || error === "passcode_not_set") {
          throw new Error(
            "No biometric data enrolled. Please set up Face ID in device settings.",
          );
        }
        if (error === "not_available" || error === "no_space") {
          throw new Error(
            "Biometric authentication is not available on this device.",
          );
        }

        throw new Error(
          `Face ID authentication failed. Please try again or use another login method.`,
        );
      }

      logger.info("Face ID authentication successful");

      // Create mock authenticated user for Face ID
      const faceIdUser = {
        uid: "face-id-user",
        email: "face-id@access.app",
        displayName: "Face ID User",
        metadata: {
          creationTime: new Date().toISOString(),
          lastSignInTime: new Date().toISOString(),
        },
      };

      // Update user state to mark as authenticated
      setUser(faceIdUser);
      setUserProfile({
        uid: "face-id-user",
        email: "face-id@access.app",
        displayName: "Face ID User",
        createdAt: new Date(),
        lastLogin: new Date(),
        preferences: {
          theme: "light",
          notifications: true,
        },
      });

      await trackAnalyticsEvent("login", { method: "face_id" });
      setLoading(false);

      return { user: faceIdUser };
    } catch (error: any) {
      logger.error("Face ID login error", undefined, {
        message: error.message,
        code: error.code,
      });
      throw new Error(
        error.message || "Face ID authentication failed. Please try again.",
      );
    }
  };

  const logout = async () => {
    // Check if it's a PIN user or Face ID user
    if (user?.uid === "pin-user" || user?.uid === "face-id-user") {
      // Clear user state
      setUser(null);
      setUserProfile(null);
      setLoading(false);
      logger.info("Biometric user logged out", { uid: user?.uid });
      return;
    }

    if (!firebaseReady) throw initError || new Error("Firebase not ready");

    const auth = getFirebaseAuth();
    const currentUser = auth.currentUser;
    await signOut(auth);
    await trackAnalyticsEvent("logout");
    logger.info("User logged out", { uid: currentUser?.uid });
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!user || !firebaseReady) return;

    const db = getFirebaseDb();

    await updateDoc(doc(db, "users", user.uid), updates);
    setUserProfile({ ...userProfile, ...updates } as UserProfile);
    await trackAnalyticsEvent("profile_updated");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        login,
        loginWithPin,
        loginWithFaceId,
        logout,
        signup,
        loading,
        updateUserProfile,
        initError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Custom hooks to use Auth in any screen
export const useAuth = () => useContext(AuthContext);
export const useFirebase = () => useContext(AuthContext);
