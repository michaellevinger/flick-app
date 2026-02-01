import { supabase } from './supabase';

/**
 * Send a nudge from one user to another
 */
export async function sendNudge(fromUserId, toUserId) {
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
      // If error is due to duplicate (already nudged), that's okay
      if (error.code === '23505') {
        console.log('Already nudged this user');
        return { alreadyNudged: true };
      }
      throw error;
    }

    return { success: true, nudge: data };
  } catch (error) {
    console.error('Error sending nudge:', error);
    throw error;
  }
}

/**
 * Get all nudges received by a user
 */
export async function getNudgesForUser(userId) {
  try {
    const { data, error } = await supabase
      .from('nudges')
      .select('from_user_id, created_at')
      .eq('to_user_id', userId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching nudges:', error);
    throw error;
  }
}

/**
 * Get all nudges sent by a user
 */
export async function getNudgesSentByUser(userId) {
  try {
    const { data, error } = await supabase
      .from('nudges')
      .select('to_user_id, created_at')
      .eq('from_user_id', userId);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching sent nudges:', error);
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
 * Delete a nudge (for cleanup when users move apart)
 */
export async function deleteNudge(fromUserId, toUserId) {
  try {
    const { error } = await supabase
      .from('nudges')
      .delete()
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting nudge:', error);
    throw error;
  }
}

/**
 * Delete all nudges for a user (cleanup on signout)
 */
export async function deleteAllNudgesForUser(userId) {
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
    console.error('Error deleting all nudges:', error);
    throw error;
  }
}

/**
 * Subscribe to nudges in real-time
 * Callback receives payload with eventType and new nudge data
 */
export function subscribeToNudges(userId, onNudgeReceived) {
  const subscription = supabase
    .channel(`nudges_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'nudges',
        filter: `to_user_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New nudge received:', payload);
        onNudgeReceived(payload.new);
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

    return data;
  } catch (error) {
    console.error('Error fetching matched user info:', error);
    throw error;
  }
}
