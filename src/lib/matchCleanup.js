import { getFlicksSentByUser, getFlicksForUser, deleteFlick } from './flicks';
import { supabase } from './supabase';
import { calculateDistance, parseGeographyPoint } from './location';
import { PROXIMITY_RADIUS } from '../constants/theme';

/**
 * Check all active matches and delete flicks if users are too far apart
 * Call this during heartbeat to maintain proximity-based matches
 */
export async function cleanupDistantMatches(userId, currentLocation) {
  if (!currentLocation) return;

  try {
    // Get all users we've flickd
    const sentFlicks = await getFlicksSentByUser(userId);

    // Get all users who flickd us
    const receivedFlicks = await getFlicksForUser(userId);

    // Find mutual matches (users in both lists)
    const mutualMatches = sentFlicks
      .filter((sent) =>
        receivedFlicks.some((received) => received.from_user_id === sent.to_user_id)
      )
      .map((flick) => flick.to_user_id);

    if (mutualMatches.length === 0) {
      return; // No matches to check
    }

    // Fetch locations of matched users
    const { data: matchedUsers, error } = await supabase
      .from('users')
      .select('id, location')
      .in('id', mutualMatches);

    if (error) throw error;

    // Check distance for each matched user
    for (const matchedUser of matchedUsers) {
      if (!matchedUser.location) continue;

      const matchedLocation = parseGeographyPoint(matchedUser.location);
      if (!matchedLocation) continue;

      const distance = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        matchedLocation.latitude,
        matchedLocation.longitude
      );

      // If distance exceeds proximity radius, dissolve the match
      if (distance > PROXIMITY_RADIUS) {
        console.log(
          `Match with ${matchedUser.id} dissolved: ${distance}m > ${PROXIMITY_RADIUS}m`
        );

        // Delete both directions of the flick
        await deleteFlick(userId, matchedUser.id);
        await deleteFlick(matchedUser.id, userId);
      }
    }
  } catch (error) {
    console.error('Error cleaning up distant matches:', error);
  }
}

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
