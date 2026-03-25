/**
 * Syncs TanStack Query online status with device connectivity.
 * Queries pause when offline and auto-refetch when back online.
 */

import { useEffect } from 'react';
import { onlineManager } from '@tanstack/react-query';
import * as Network from 'expo-network';

export function useOnlineManager() {
  useEffect(() => {
    // Set initial state
    Network.getNetworkStateAsync().then((state) => {
      onlineManager.setOnline(!!state.isConnected);
    });

    const subscription = Network.addNetworkStateListener((state) => {
      onlineManager.setOnline(!!state.isConnected);
    });

    return () => {
      subscription.remove();
    };
  }, []);
}
