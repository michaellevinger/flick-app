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
import { hasSeenTip, markTipSeen } from '../lib/tips';

/**
 * Manages flick state, real-time subscription, and the complete flick flow
 * including gender-based initiation rules and mutual match detection.
 *
 * @param {object} user - Current user from UserContext
 * @param {object} navigation - React Navigation object for navigating to GreenLight
 * @param {function} onAdvance - Called when ladies-first rule prevents a flick (advances carousel)
 */
export function useFlicks(user, navigation, onAdvance) {
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

    // Gender-based rules: in straight matches, women must initiate first
    const isStraightMale = user.gender === 'male' && user.lookingFor === 'female';
    const targetIsFemale = targetUser.gender === 'female';
    const isStraightMatch = isStraightMale && targetIsFemale;
    const canInitiate = !isStraightMatch || theyFlickedMe;

    if (!canInitiate && !iFlickedThem) {
      const seen = await hasSeenTip('ladies_first');
      if (!seen) {
        Alert.alert(
          'Ladies First',
          'In straight matches, women make the first move. Wait for her to flick you first!',
          [{
            text: 'Got it',
            onPress: async () => {
              await markTipSeen('ladies_first');
              onAdvance?.();
            },
          }]
        );
      } else {
        onAdvance?.();
      }
      return;
    }

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
