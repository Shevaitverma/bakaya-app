/**
 * Tells TanStack Query when the app returns to foreground.
 * Stale queries will auto-refetch based on their staleTime.
 */

import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { focusManager } from '@tanstack/react-query';

export function useAppStateRefresh() {
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const subscription = AppState.addEventListener(
      'change',
      (status: AppStateStatus) => {
        focusManager.setFocused(status === 'active');
      },
    );

    return () => subscription.remove();
  }, []);
}
