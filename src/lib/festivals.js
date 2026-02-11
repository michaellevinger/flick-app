import { supabase } from './supabase';

/**
 * Validate festival code and optionally join festival
 */
export async function validateAndJoinFestival(userId, festivalCode) {
  try {
    // Get festival info
    const { data: festival, error: festivalError } = await supabase
      .rpc('get_festival_info', { festival_code: festivalCode })
      .single();

    if (festivalError || !festival) {
      console.error('Festival validation error:', festivalError);
      return null;
    }

    // If userId provided, update user's festival_id
    if (userId) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ festival_id: festivalCode })
        .eq('id', userId);

      if (updateError) {
        console.error('Error joining festival:', updateError);
        return null;
      }
    }

    return festival;
  } catch (error) {
    console.error('validateAndJoinFestival error:', error);
    return null;
  }
}

/**
 * Find all users in the same festival
 */
export async function findUsersInFestival(festivalId, currentUserId) {
  try {
    const { data, error } = await supabase
      .rpc('find_users_in_festival', {
        user_festival_id: festivalId,
        current_user_id: currentUserId
      });

    if (error) {
      console.error('Error finding users in festival:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('findUsersInFestival error:', error);
    return [];
  }
}

/**
 * Get current festival info for a user
 */
export async function getCurrentFestival(userId) {
  try {
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('festival_id')
      .eq('id', userId)
      .single();

    if (userError || !user?.festival_id) {
      return null;
    }

    const { data: festival, error: festivalError } = await supabase
      .rpc('get_festival_info', { festival_code: user.festival_id })
      .single();

    if (festivalError) {
      console.error('Error getting festival:', festivalError);
      return null;
    }

    return festival;
  } catch (error) {
    console.error('getCurrentFestival error:', error);
    return null;
  }
}

/**
 * Leave current festival
 */
export async function leaveFestival(userId) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ festival_id: null })
      .eq('id', userId);

    if (error) {
      console.error('Error leaving festival:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('leaveFestival error:', error);
    return false;
  }
}

/**
 * Get festival statistics (for sponsors/analytics)
 */
export async function getFestivalStats(festivalId) {
  try {
    // Count active users
    const { count: userCount, error: userError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('festival_id', festivalId)
      .eq('status', true);

    // Count matches (flicks where both users are in this festival)
    const { count: matchCount, error: matchError } = await supabase
      .from('flicks')
      .select('*', { count: 'exact', head: true })
      .in('from_user_id', 
        supabase.from('users').select('id').eq('festival_id', festivalId)
      );

    return {
      activeUsers: userCount || 0,
      totalMatches: matchCount || 0,
      festivalId
    };
  } catch (error) {
    console.error('getFestivalStats error:', error);
    return { activeUsers: 0, totalMatches: 0, festivalId };
  }
}
