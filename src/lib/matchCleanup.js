import { getFlicksSentByUser, getFlicksForUser } from './flicks';

/**
 * Match cleanup utilities
 *
 * Note: In event-based model, matches persist regardless of physical distance.
 * Users are locked to their festival/event room.
 *
 * Messages work like normal dating apps:
 * - Persist indefinitely until explicit unmatch
 * - CASCADE deleted only when match record is deleted
 * - Survive user logout (unless both users logout)
 *
 * Future: Add manual "Unmatch" feature to delete conversations
 */

/**
 * Get count of active mutual matches for a user
 */
export async function getActiveMutualMatchesCount(userId) {
  try {
    const sentFlicks = await getFlicksSentByUser(userId);
    const receivedFlicks = await getFlicksForUser(userId);

    const mutualMatches = sentFlicks.filter((sent) =>
      receivedFlicks.some((received) => received.from_user_id === sent.to_user_id)
    );

    return mutualMatches.length;
  } catch (error) {
    console.error('Error getting mutual matches count:', error);
    return 0;
  }
}
