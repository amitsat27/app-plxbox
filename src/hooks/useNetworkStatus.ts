// 📡 Network Status Hook (Simplified)
// Monitors connectivity - for full implementation, install @react-native-community/netinfo

import { useState, useEffect } from 'react';
import { Platform } from 'react-native';

// Define network status type
export type NetworkStatus = 'connected' | 'disconnected' | 'unknown';

interface UseNetworkStatusReturn {
  isConnected: boolean;
  isDisconnected: boolean;
  networkStatus: NetworkStatus;
  networkType: 'wifi' | 'cellular' | 'none' | 'unknown';
  retryCount: number;
}

// Simple hook - in production, integrate with NetInfo or expo-network
export const useNetworkStatus = (): UseNetworkStatusReturn => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [networkType, setNetworkType] = useState<'wifi' | 'cellular' | 'none' | 'unknown'>('wifi');
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    // For development/Expo Go, assume connected
    // In production, use NetInfo from '@react-native-community/netinfo'
    const checkConnectivity = async () => {
      try {
        // Simple connectivity check using fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        // Try to fetch a small resource (Google's 204 response)
        await fetch('https://clients3.google.com/generate_204', {
          signal: controller.signal,
          method: 'HEAD',
        });
        clearTimeout(timeoutId);
        setIsConnected(true);
        setNetworkType('wifi'); // Could be detected more accurately
      } catch (error) {
        setIsConnected(false);
        setNetworkType('none');
      }
    };

    // Check initially
    checkConnectivity();

    // Set up interval to check periodically (every 30 seconds)
    const interval = setInterval(checkConnectivity, 30000);

    return () => clearInterval(interval);
  }, []);

  // Listen to online/offline events (basic) - React Native only
  useEffect(() => {
    const handleOnline = () => {
      setIsConnected(true);
      setNetworkType('wifi');
    };

    const handleOffline = () => {
      setIsConnected(false);
      setNetworkType('none');
    };

    // Only add window event listeners for web platform
    if (Platform.OS === 'web') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      // Also check navigator.connection for web
      // eslint-disable-next-line no-restricted-globals
      if (typeof navigator !== 'undefined' && (navigator as any).connection) {
        setNetworkType(
          (navigator as any).connection.effectiveType === 'cellular' ? 'cellular' : 'wifi'
        );
      }
    }

    return () => {
      if (Platform.OS === 'web') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
    };
  }, []);

  const networkStatus: NetworkStatus = isConnected ? 'connected' : 'disconnected';

  return {
    isConnected,
    isDisconnected: !isConnected,
    networkStatus,
    networkType,
    retryCount,
  };
};

// Helper to show network-dependent UI
export const useNetworkAwareAction = () => {
  const { isConnected } = useNetworkStatus();

  const execute = async <T>(action: () => Promise<T>): Promise<{ data: T; offline: boolean } | null> => {
    if (!isConnected) {
      // Could queue action for later sync
      console.warn('Network unavailable - action queued');
      return null;
    }

    try {
      const data = await action();
      return { data, offline: false };
    } catch (error) {
      console.error('Network action failed:', error);
      throw error;
    }
  };

  return { execute, isConnected };
};

export default useNetworkStatus;
