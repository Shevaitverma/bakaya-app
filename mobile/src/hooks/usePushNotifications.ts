/**
 * Wires push notifications into the app lifecycle:
 *  - registers the device token with the server once authenticated
 *  - routes a notification tap to the relevant screen via the nav ref
 *
 * Must be rendered inside AuthProvider and NavigationContainer.
 */

import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import { registerForPush } from '../lib/push';
import { navigationRef } from '../lib/navigationRef';

function routeFromData(data: unknown): void {
  if (!navigationRef.isReady() || !data || typeof data !== 'object') return;
  const { type } = data as { type?: string };
  // We only have groupId in the payload, not the group name (a required param
  // for GroupDetail), so a group tap lands on the Groups list rather than the
  // specific group. Deep-linking to the exact group needs groupName in the push.
  if (type === 'invitation') {
    navigationRef.navigate('Main', { screen: 'InvitationsTab', params: { screen: 'Invitations' } });
  } else if (type === 'group') {
    navigationRef.navigate('Main', { screen: 'GroupsTab', params: { screen: 'GroupsList' } });
  }
}

export function usePushNotifications(): void {
  const { accessToken, isAuthenticated } = useAuth();

  // Register the device token whenever we have an authenticated session.
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      registerForPush(accessToken);
    }
  }, [isAuthenticated, accessToken]);

  // Handle taps (app foreground/background) + cold start from a notification.
  useEffect(() => {
    try {
      const sub = Notifications.addNotificationResponseReceivedListener((response) => {
        routeFromData(response.notification.request.content.data);
      });

      Notifications.getLastNotificationResponseAsync()
        .then((response) => {
          if (response) routeFromData(response.notification.request.content.data);
        })
        .catch(() => {});

      return () => sub.remove();
    } catch (err) {
      // Native module absent — skip tap handling rather than crash.
      console.warn('[PUSH] tap handler unavailable:', err instanceof Error ? err.message : err);
    }
  }, []);
}
