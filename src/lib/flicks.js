import { supabase } from './supabase';

/**
 * Normalize user data to ensure correct types
 */
function normalizeUserData(user) {
  if (!user) return null;
  return {
    ...user,
    status: user.status !== undefined ? Boolean(user.status) : undefined,
    age: user.age !== undefined ? Number(user.age) : undefined,
  };
}

/**
 * Send a flick from one user to another
 */
export async function sendFlick(fromUserId, toUserId) {
  try {
    const { data, error } = await supabase
      .from('nudges')
      .insert({
        from_user_id: fromUserId,
        to_user_id: toUserId,
      })
      .select()
      .single();

    if (error) {
      // If error is due to duplicate (already flicked), that's okay
      if (error.code === '23505') {
        console.log('Already flicked this user');
        return { alreadyFlicked: true };
      }
      throw error;
    }

    return { success: true, flick: data };
  } catch (error) {
    console.error('Error sending flick:', error);
    throw error;
  }
}

/**
 * Get all flicks received by a user
 */
export async function getFlicksForUser(userId) {
  try {
    const { data, error } = await supabase
      .from('nudges')
      .select('from_user_id, created_at')
      .eq('to_user_id', userId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching flicks:', error);
    throw error;
  }
}

/**
 * Get all flicks sent by a user
 */
export async function getFlicksSentByUser(userId) {
  try {
    const { data, error } = await supabase
      .from('nudges')
      .select('to_user_id, created_at')
      .eq('from_user_id', userId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching sent flicks:', error);
    throw error;
  }
}

/**
 * Check if there's a mutual match between two users
 */
export async function checkMutualMatch(userAId, userBId) {
  try {
    const { data, error } = await supabase.rpc('check_mutual_nudge', {
      user_a: userAId,
      user_b: userBId,
    });

    if (error) throw error;

    return data === true;
  } catch (error) {
    console.error('Error checking mutual match:', error);
    throw error;
  }
}

/**
 * Delete a flick (for cleanup when users move apart)
 */
export async function deleteFlick(fromUserId, toUserId) {
  try {
    const { error } = await supabase
      .from('nudges')
      .delete()
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting flick:', error);
    throw error;
  }
}

/**
 * Delete all flicks for a user (cleanup on signout)
 */
export async function deleteAllFlicksForUser(userId) {
  try {
    const { error: error1 } = await supabase
      .from('nudges')
      .delete()
      .eq('from_user_id', userId);

    const { error: error2 } = await supabase
      .from('nudges')
      .delete()
      .eq('to_user_id', userId);

    if (error1 || error2) throw error1 || error2;
  } catch (error) {
    console.error('Error deleting all flicks:', error);
    throw error;
  }
}

/**
 * Subscribe to flicks in real-time
 * Callback receives payload with eventType and new flick data
 */
export function subscribeToFlicks(userId, onFlickReceived) {
  const subscription = supabase
    .channel(`flicks_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'nudges',
        filter: `to_user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New flick received:', payload);
        onFlickReceived(payload.new);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Get user info for a matched user
 */
export async function getMatchedUserInfo(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, name, age, selfie_url')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return normalizeUserData(data);
  } catch (error) {
    console.error('Error fetching matched user info:', error);
    throw error;
  }
}
