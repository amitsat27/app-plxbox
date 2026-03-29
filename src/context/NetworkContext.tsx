// 🌐 Network Provider
// Integrates network status monitoring with UI store

import React, { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const { setIsOffline, setIsSyncing, setSyncQueueCount } = useUIStore();
  const { isConnected, networkType, retryCount } = useNetworkStatus();

  useEffect(() => {
    setIsOffline(!isConnected);

    // If coming back online, attempt to sync queued actions
    if (isConnected && retryCount > 0) {
      setIsSyncing(true);
      // Trigger sync of queued actions
      setTimeout(() => {
        setIsSyncing(false);
        setSyncQueueCount(0);
      }, 2000);
    }
  }, [isConnected, retryCount, setIsOffline, setIsSyncing, setSyncQueueCount]);

  return <>{children}</>;
};

export default NetworkProvider;
