import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  handleNotificationTap,
} from '../lib/notifications';

/**
 * Initializes push notifications for the app lifecycle.
 * - Registers for push permission + saves token to DB (on every user?.id change)
 * - Sets up notification tap listener for deep linking
 *
 * Mount this inside UserProvider so it has access to the user.
 *
 * @param {object} user          Current user from UserContext (or null)
 * @param {object} navigationRef createNavigationContainerRef() from App.js
 */
export function useNotifications(user, navigationRef) {
  useEffect(() => {
    if (!user?.id) return;

    // Register and save token (safe to call on every mount)
    registerForPushNotifications(user.id);

    // Handle notification taps for deep linking
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => handleNotificationTap(response, navigationRef)
    );

    return () => subscription.remove();
  }, [user?.id]);
}
