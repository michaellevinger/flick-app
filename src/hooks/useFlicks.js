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
} from '../lib/flicks';


/**
 * Manages flick state, real-time subscription, and the complete flick flow
 * including mutual match detection.
 *
 * @param {object} user - Current user from UserContext
 * @param {object} navigation - React Navigation object for navigating to GreenLight
 */
export function useFlicks(user, navigation) {
  const [flickedUsers, setFlickedUsers] = useState(new Set());
  const [usersWhoFlickedMe, setUsersWhoFlickedMe] = useState(new Set());
  const flickSubscriptionRef = useRef(null);

  useEffect(() => {
    if (!user?.id) return;

    loadFlicksSent();
    loadFlicksReceived();
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

  const setupFlickSubscription = () => {
    flickSubscriptionRef.current = subscribeToFlicks(user.id, async (flick) => {
      await loadFlicksReceived();

      const isMutual = await checkMutualMatch(user.id, flick.from_user_id);
      if (isMutual) {
        createMatch(user.id, flick.from_user_id).catch((err) =>
          console.error('createMatch failed:', err)
        );
        const matchedUser = await getMatchedUserInfo(flick.from_user_id);
        navigation.navigate('GreenLight', { matchedUser });
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

    // Send flick and check for match
    try {
      const result = await sendFlick(user.id, targetUser.id);

      if (result.alreadyFlicked) {
        Alert.alert('Already Flicked', `You've already flicked them!`);
        return;
      }

      setFlickedUsers((prev) => new Set([...prev, targetUser.id]));

      // Fast path: they already flicked us — navigate immediately, create match in background
      if (theyFlickedMe) {
        createMatch(user.id, targetUser.id).catch((err) =>
          console.error('createMatch failed:', err)
        );
        navigation.navigate('GreenLight', { matchedUser: targetUser });
        return;
      }

      // Slow path: check DB to confirm mutual match
      const isMutual = await checkMutualMatch(user.id, targetUser.id);
      if (isMutual) {
        createMatch(user.id, targetUser.id).catch((err) =>
          console.error('createMatch failed:', err)
        );
        navigation.navigate('GreenLight', { matchedUser: targetUser });
      }
    } catch (error) {
      console.error('Error sending flick:', error);
      Alert.alert('Error', 'Failed to send flick. Please try again.');
    }
  };

  return { flickedUsers, usersWhoFlickedMe, handleFlick, loadFlicksReceived, loadFlicksSent };
}
