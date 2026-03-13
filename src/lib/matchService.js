import { supabase } from './supabase';

/**
 * Fetch all matches for a user, with other user's profile info
 */
export async function fetchMatches(userId) {
  try {
    const { data: matchesData, error: matchesError } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (matchesError) throw matchesError;

    if (!matchesData || matchesData.length === 0) {
      return [];
    }

    // Get other user IDs
    const otherUserIds = matchesData.map((match) =>
      match.user1_id === userId ? match.user2_id : match.user1_id
    );

    // Fetch other users' profiles
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, age, selfie_url, photos, gender, looking_for, height, bio')
      .in('id', otherUserIds);

    if (usersError) throw usersError;

    // Combine matches with user data
    return matchesData.map((match) => {
      const otherUserId = match.user1_id === userId ? match.user2_id : match.user1_id;
      const otherUser = usersData.find((u) => u.id === otherUserId);
      const unreadCount =
        match.user1_id === userId ? match.unread_count_user1 : match.unread_count_user2;

      return {
        matchId: match.id,
        otherUser: otherUser || null,
        lastMessageAt: match.last_message_at,
        unreadCount: unreadCount || 0,
      };
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
}

/**
 * Subscribe to new matches for a user in real-time
 */
export function subscribeToMatches(userId, callback) {
  const subscription = supabase
    .channel(`matches_${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user1_id=eq.${userId}`,
      },
      (payload) => callback(payload.new)
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user2_id=eq.${userId}`,
      },
      (payload) => callback(payload.new)
    )
    .subscribe();

  return subscription;
}

/**
 * Mark all messages in a match as read for a user (resets unread badge)
 */
export async function markMessagesAsRead(matchId, userId) {
  try {
    const { data: matchData, error: fetchError } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('id', matchId)
      .single();

    if (fetchError) throw fetchError;

    const columnToReset =
      matchData.user1_id === userId ? 'unread_count_user1' : 'unread_count_user2';

    const { error } = await supabase
      .from('matches')
      .update({ [columnToReset]: 0 })
      .eq('id', matchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error marking messages as read:', error);
    throw error;
  }
}
