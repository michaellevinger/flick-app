import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import {
  sendFlick,
  checkMutualMatch,
  subscribeToFlicks,
  getFlicksSentByUser,
  getFlicksForUser,
  deleteFlick,
  createMatch,
  getMatchedUserInfo,
  passUser,
  getPassedUsers,
} from '../lib/flicks';
import { sendPushNotification } from '../lib/notifications';
import { navigationRef } from '../lib/navigationRef';
import { getMatchId } from '../utils/matchUtils';

/**
 * Manages flick state, real-time subscription, and the complete flick flow
 * including mutual match detection and push notifications.
 *
 * @param {object} user       Current user from UserContext
 * @param {object} navigation Local navigation (kept for non-GreenLight uses)
 */
export function useFlicks(user, navigation) {
  const [flickedUsers, setFlickedUsers] = useState(new Set());
  const [usersWhoFlickedMe, setUsersWhoFlickedMe] = useState(new Set());
  const [passedUsers, setPassedUsers] = useState(new Set());
  const flickSubscriptionRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    loadFlicksSent();
    loadFlicksReceived();
    loadPassedUsers();
    setupFlickSubscription();

    return () => flickSubscriptionRef.current?.unsubscribe();
  }, [user?.id]);

  const loadFlicksSent = async () => {
    try {
      const sent = await getFlicksSentByUser(user.id);
      setFlickedUsers(new Set(sent.map((n) => n.to_user_id)));
    } catch (error) {
      console.error('Error loading sent flicks:', error);
    }
  };

  const loadFlicksReceived = async () => {
    try {
      const received = await getFlicksForUser(user.id);
      setUsersWhoFlickedMe(new Set(received.map((n) => n.from_user_id)));
    } catch (error) {
      console.error('Error loading received flicks:', error);
    }
  };

  const loadPassedUsers = async () => {
    try {
      const ids = await getPassedUsers(user.id);
      setPassedUsers(new Set(ids));
    } catch (error) {
      console.error('Error loading passed users:', error);
    }
  };

  const handlePass = async (targetUser) => {
    if (!user) return;
    setPassedUsers((prev) => new Set([...prev, targetUser.id]));
    try {
      await passUser(user.id, targetUser.id);
    } catch (error) {
      console.error('Error passing user:', error);
      setPassedUsers((prev) => {
        const next = new Set(prev);
        next.delete(targetUser.id);
        return next;
      });
    }
  };

  const navigateToGreenLight = (matchedUser) => {
    // Use navigationRef so GreenLight fires from any screen (not just Dashboard).
    // Falls back to nothing if ref isn't ready — subscription will have already
    // updated the in-app state.
    try {
      if (navigationRef?.isReady()) {
        navigationRef.navigate('GreenLight', { matchedUser });
      }
    } catch (error) {
      console.error('GreenLight navigation failed:', error);
    }
  };

  const setupFlickSubscription = () => {
    flickSubscriptionRef.current = subscribeToFlicks(user.id, async (flick) => {
      await loadFlicksReceived();

      const isMutual = await checkMutualMatch(user.id, flick.from_user_id);
      if (isMutual) {
        createMatch(user.id, flick.from_user_id).catch((err) =>
          console.error('createMatch failed:', err)
        );
        const matchedUser = await getMatchedUserInfo(flick.from_user_id);

        // Navigate to Green Light (works from any screen)
        navigateToGreenLight(matchedUser);

        // Push notification to the person who just flicked us (they triggered the match)
        // They may be in a different part of the app or backgrounded
        const subMatchId = getMatchId(user.id, flick.from_user_id);
        sendPushNotification(flick.from_user_id, 'match', user.name, {
          matchId: subMatchId,
          otherUser: { id: user.id },
        });
      }
    });
  };

  const handleFlick = async (targetUser) => {
    if (!user) return;

    const iFlickedThem = flickedUsers.has(targetUser.id);
    const theyFlickedMe = usersWhoFlickedMe.has(targetUser.id);

    // Unflick if already flicked
    if (iFlickedThem) {
      try {
        await deleteFlick(user.id, targetUser.id);
        setFlickedUsers((prev) => {
          const next = new Set(prev);
          next.delete(targetUser.id);
          return next;
        });
      } catch (error) {
        console.error('Error unflicking:', error);
        Alert.alert('Error', 'Failed to unflick. Please try again.');
      }
      return;
    }

    // Send flick
    try {
      const result = await sendFlick(user.id, targetUser.id);

      if (result.alreadyFlicked) {
        Alert.alert('Already Flicked', `You've already flicked them!`);
        return;
      }

      setFlickedUsers((prev) => new Set([...prev, targetUser.id]));

      // Notify the other person they were flicked (if they're not looking)
      sendPushNotification(targetUser.id, 'flick', user.name);

      const flickMatchId = getMatchId(user.id, targetUser.id);

      // Fast path: they already flicked us — it's a match
      if (theyFlickedMe) {
        createMatch(user.id, targetUser.id).catch((err) =>
          console.error('createMatch failed:', err)
        );
        navigateToGreenLight(targetUser);
        // Notify them of the match
        sendPushNotification(targetUser.id, 'match', user.name, { matchId: flickMatchId, otherUser: { id: user.id } });
        return;
      }

      // Slow path: check DB to confirm mutual match
      const isMutual = await checkMutualMatch(user.id, targetUser.id);
      if (isMutual) {
        createMatch(user.id, targetUser.id).catch((err) =>
          console.error('createMatch failed:', err)
        );
        navigateToGreenLight(targetUser);
        sendPushNotification(targetUser.id, 'match', user.name, { matchId: flickMatchId, otherUser: { id: user.id } });
      }
    } catch (error) {
      console.error('Error sending flick:', error);
      Alert.alert('Error', 'Failed to send flick. Please try again.');
    }
  };

  return { flickedUsers, usersWhoFlickedMe, passedUsers, handleFlick, handlePass, loadFlicksReceived, loadFlicksSent };
}
