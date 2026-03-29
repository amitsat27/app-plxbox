import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { Alert, Platform } from 'react-native';

const BIOMETRIC_ENROLLED_KEY = 'biometric_enrolled';
const BIOMETRIC_EMAIL_KEY = 'biometric_email';
const BIOMETRIC_PASSWORD_KEY = 'biometric_password';

/**
 * Biometric Authentication Service
 * Handles Face ID / Touch ID enrollment and auto-login
 */
export interface BiometricAuthService {
  // Check availability
  isAvailable(): Promise<boolean>;
  getBiometricType(): Promise<'face' | 'touch' | 'none'>;

  // Enrollment
  isEnrolled(): Promise<boolean>;
  enrollCredentials(email: string, password: string): Promise<boolean>;
  removeCredentials(): Promise<void>;

  // Authentication
  authenticateAndLogin(): Promise<{ email: string; password: string } | null>;
}

const BIOMETRIC_AUTH: BiometricAuthService = {
  /**
   * Check if device supports biometric authentication
   */
  async isAvailable(): Promise<boolean> {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return false;

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return types.length > 0;
    } catch (error) {
      console.error('Biometric availability check failed:', error);
      return false;
    }
  },

  /**
   * Get the type of biometric available
   */
  async getBiometricType(): Promise<'face' | 'touch' | 'none'> {
    try {
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        return 'face';
      }
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        return 'touch';
      }
      return 'none';
    } catch {
      return 'none';
    }
  },

  /**
   * Check if user has already enrolled credentials
   */
  async isEnrolled(): Promise<boolean> {
    try {
      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);
      const enrolled = await SecureStore.getItemAsync(BIOMETRIC_ENROLLED_KEY);

      return !!(email && password && enrolled === 'true');
    } catch (error) {
      console.error('Biometric enrollment check failed:', error);
      return false;
    }
  },

  /**
   * Store credentials after successful login (user opts in)
   */
  async enrollCredentials(email: string, password: string): Promise<boolean> {
    try {
      // First, authenticate the user with biometric to enroll
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable Biometric Login',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
      });

      if (!authResult.success) {
        if (authResult.error !== 'user_cancel') {
          Alert.alert('Failed', 'Biometric authentication failed. Please try again.');
        }
        return false;
      }

      // Store credentials securely
      await SecureStore.setItemAsync(BIOMETRIC_EMAIL_KEY, email);
      await SecureStore.setItemAsync(BIOMETRIC_PASSWORD_KEY, password);
      await SecureStore.setItemAsync(BIOMETRIC_ENROLLED_KEY, 'true');

      return true;
    } catch (error) {
      console.error('Biometric enrollment failed:', error);
      Alert.alert('Error', 'Failed to enable biometric login. Please try again.');
      return false;
    }
  },

  /**
   * Remove stored credentials (logout from biometric)
   */
  async removeCredentials(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_EMAIL_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_PASSWORD_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENROLLED_KEY);
    } catch (error) {
      console.error('Failed to remove biometric credentials:', error);
    }
  },

  /**
   * Authenticate with biometric and return stored credentials
   * Use for auto-login flow
   */
  async authenticateAndLogin(): Promise<{ email: string; password: string } | null> {
    try {
      // Check if enrolled
      const isEnrolled = await this.isEnrolled();
      if (!isEnrolled) {
        return null;
      }

      // Authenticate with biometric
      const authResult = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Sign in with Biometrics',
        fallbackLabel: 'Use Password',
        cancelLabel: 'Cancel',
      });

      if (!authResult.success) {
        return null;
      }

      // Retrieve credentials
      const email = await SecureStore.getItemAsync(BIOMETRIC_EMAIL_KEY);
      const password = await SecureStore.getItemAsync(BIOMETRIC_PASSWORD_KEY);

      if (!email || !password) {
        return null;
      }

      return { email, password };
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return null;
    }
  },
};

export const biometricAuth = BIOMETRIC_AUTH;
