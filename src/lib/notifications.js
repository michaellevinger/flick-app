import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';

// When the app is in the foreground, suppress system notifications.
// Real-time subscriptions already handle in-app state (badge on Matches tab,
// messages in chat, GreenLight navigation). System notifications are only
// useful when the app is backgrounded (handled natively by the OS).
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
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
export async function handleNotificationTap(response, navigationRef) {
  try {
    const data = response?.notification?.request?.content?.data;
    if (!data || !navigationRef?.isReady()) return;

    const { type, matchId } = data;

    // otherUser may arrive as a JSON string from the push payload
    let otherUser = data.otherUser;
    if (typeof otherUser === 'string') {
      try { otherUser = JSON.parse(otherUser); } catch { otherUser = null; }
    }

    const otherUserId = otherUser?.id;

    switch (type) {
      case 'flick':
        navigationRef.navigate('Dashboard');
        break;
      case 'match':
      case 'message':
      case 'exchange_request':
      case 'exchange_accepted':
        if (matchId && otherUserId) {
          const fullUser = await fetchUserForNotification(otherUserId);
          if (fullUser) {
            navigationRef.navigate('Chat', { matchId, otherUser: fullUser });
          } else {
            navigationRef.navigate('MatchesTab');
          }
        } else {
          navigationRef.navigate('MatchesTab');
        }
        break;
      default:
        navigationRef.navigate('Dashboard');
    }
  } catch (error) {
    console.error('[notifications] handleNotificationTap error:', error.message);
  }
}

/**
 * Fetches a user's full profile for notification deep linking.
 */
async function fetchUserForNotification(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, age, height, selfie_url, photos, gender, looking_for, bio')
      .eq('id', userId)
      .single();

    if (error || !data) return null;
    return data;
  } catch {
    return null;
  }
}
