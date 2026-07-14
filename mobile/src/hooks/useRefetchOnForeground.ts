/**
 * Calls `refetch` when the app returns to the foreground (background →
 * active) while the current screen is focused. Screens' own staleness
 * guards (`isFresh`) dedupe redundant fetches.
 */

import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export function useRefetchOnForeground(refetch: () => void) {
  const isFocused = useIsFocused();
  const focusedRef = useRef(isFocused);
  focusedRef.current = isFocused;
  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;
  const prevState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    const sub = AppState.addEventListener('change', (next: AppStateStatus) => {
      const prev = prevState.current;
      prevState.current = next;
      if (next === 'active' && prev !== 'active' && focusedRef.current) {
        refetchRef.current();
      }
    });

    return () => sub.remove();
  }, []);
}
