import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// Configure how notifications are presented when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Requests push notification permission, gets the Expo push token,
 * and saves it to the user's DB record.
 *
 * Safe to call on every app open — token is refreshed if it changed
 * (e.g. after app reinstall). Returns early silently on denial.
 */
export async function registerForPushNotifications(userId) {
  try {
    // Android requires a notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'flick',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#C44CE0',
      });
    }

    // Check / request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[notifications] Push permission denied');
      return null;
    }

    // Get the Expo push token
    // projectId is required for production; reads from app.json extra.eas.projectId
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const token = tokenData.data;

    console.log('[notifications] Push token:', token);

    // Save token to DB
    const { error } = await supabase
      .from('users')
      .update({ expo_push_token: token })
      .eq('id', userId);

    if (error) {
      console.error('[notifications] Failed to save push token:', error.message);
    }

    return token;
  } catch (error) {
    console.error('[notifications] registerForPushNotifications error:', error.message);
    return null;
  }
}

/**
 * Sends a push notification to another user via the Supabase Edge Function.
 * Fire-and-forget — never throws, never blocks the caller.
 *
 * @param {string} toUserId     Recipient user ID
 * @param {string} type         'flick' | 'match' | 'message' | 'exchange_request' | 'exchange_accepted'
 * @param {string} fromName     Sender's display name (used in notification body)
 * @param {object} data         Extra data for deep linking on notification tap
 */
export async function sendPushNotification(toUserId, type, fromName, data = {}) {
  try {
    await supabase.functions.invoke('push-notification', {
      body: { toUserId, type, fromName, data },
    });
  } catch (error) {
    // Silent — push is supplementary to real-time subscriptions
    console.log('[notifications] sendPushNotification failed (non-critical):', error.message);
  }
}

/**
 * Handles a notification tap and deep-links to the relevant screen.
 * Called from the Notifications.addNotificationResponseReceivedListener.
 *
 * @param {object} response       Expo notification response object
 * @param {object} navigationRef  React Navigation ref (createNavigationContainerRef)
 */
export function handleNotificationTap(response, navigationRef) {
  try {
    const data = response?.notification?.request?.content?.data;
    if (!data || !navigationRef?.isReady()) return;

    const { type, matchId, otherUser } = data;

    switch (type) {
      case 'flick':
      case 'match':
        navigationRef.navigate('Dashboard');
        break;
      case 'message':
      case 'exchange_request':
      case 'exchange_accepted':
        if (matchId && otherUser) {
          navigationRef.navigate('Chat', { matchId, otherUser });
        } else {
          navigationRef.navigate('Dashboard');
        }
        break;
      default:
        navigationRef.navigate('Dashboard');
    }
  } catch (error) {
    console.error('[notifications] handleNotificationTap error:', error.message);
  }
}
