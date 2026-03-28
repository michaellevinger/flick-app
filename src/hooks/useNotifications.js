import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotifications,
  handleNotificationTap,
} from '../lib/notifications';

/**
 * Initializes push notifications for the app lifecycle.
 * - Registers for push permission + saves token to DB
 * - Sets up notification tap listener for deep linking
 * - Sets up foreground notification listener for in-app banner
 *
 * @param {object}   user                        Current user from UserContext
 * @param {object}   navigationRef               React Navigation ref
 * @param {function} onForegroundNotification     Called with notification when received in foreground
 */
export function useNotifications(user, navigationRef, onForegroundNotification) {
  useEffect(() => {
    if (!user?.id) return;

    registerForPushNotifications(user.id);

    // Handle notification taps (background → app opened)
    const tapSub = Notifications.addNotificationResponseReceivedListener(
      (response) => handleNotificationTap(response, navigationRef)
    );

    // Handle foreground notifications (show in-app banner)
    const receivedSub = Notifications.addNotificationReceivedListener(
      (notification) => onForegroundNotification?.(notification)
    );

    return () => {
      tapSub.remove();
      receivedSub.remove();
    };
  }, [user?.id]);
}
