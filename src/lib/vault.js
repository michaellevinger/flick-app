import { supabase } from './supabase';
import { PROXIMITY_RADIUS } from '../constants/theme';

/**
 * Request to exchange numbers with another user
 */
export async function requestNumberExchange(fromUserId, toUserId, myPhone, theirPhone) {
  try {
    const { data, error } = await supabase
      .from('exchanges')
      .insert({
        user_a_id: fromUserId,
        user_b_id: toUserId,
        user_a_phone: myPhone,
        user_b_phone: theirPhone,
        requested_by: fromUserId,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      // If already exists, return existing
      if (error.code === '23505') {
        const existing = await getExchangeRequest(fromUserId, toUserId);
        return { alreadyExists: true, exchange: existing };
      }
      throw error;
    }

    return { success: true, exchange: data };
  } catch (error) {
    console.error('Error requesting number exchange:', error);
    throw error;
  }
}

/**
 * Get pending exchange request between two users
 */
export async function getExchangeRequest(userAId, userBId) {
  try {
    const { data, error } = await supabase
      .from('exchanges')
      .select('*')
      .or(`and(user_a_id.eq.${userAId},user_b_id.eq.${userBId}),and(user_a_id.eq.${userBId},user_b_id.eq.${userAId})`)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return data;
  } catch (error) {
    console.error('Error getting exchange request:', error);
    return null;
  }
}

/**
 * Accept a number exchange request
 */
export async function acceptExchangeRequest(exchangeId) {
  try {
    const { data, error } = await supabase
      .from('exchanges')
      .update({ status: 'accepted' })
      .eq('id', exchangeId)
      .select()
      .single();

    if (error) throw error;

    return { success: true, exchange: data };
  } catch (error) {
    console.error('Error accepting exchange request:', error);
    throw error;
  }
}

/**
 * Decline a number exchange request
 */
export async function declineExchangeRequest(exchangeId) {
  try {
    const { error } = await supabase
      .from('exchanges')
      .delete()
      .eq('id', exchangeId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error declining exchange request:', error);
    throw error;
  }
}

/**
 * Get active (accepted) exchange for current user
 */
export async function getActiveExchange(userId) {
  try {
    const { data, error } = await supabase.rpc('get_active_exchange', {
      current_user_id: userId,
    });

    if (error) throw error;

    return data && data.length > 0 ? data[0] : null;
  } catch (error) {
    console.error('Error getting active exchange:', error);
    return null;
  }
}

/**
 * Delete an exchange (manual cleanup or proximity wipe)
 */
export async function deleteExchange(exchangeId) {
  try {
    const { error } = await supabase
      .from('exchanges')
      .delete()
      .eq('id', exchangeId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error deleting exchange:', error);
    throw error;
  }
}

/**
 * Subscribe to exchange updates in real-time
 */
export function subscribeToExchanges(userId, onUpdate) {
  const subscription = supabase
    .channel(`exchanges_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'exchanges',
        filter: `user_a_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Exchange update (as user_a):', payload);
        onUpdate(payload);
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'exchanges',
        filter: `user_b_id=eq.${userId}`,
      },
      (payload) => {
        console.log('Exchange update (as user_b):', payload);
        onUpdate(payload);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Check if distance exceeds PROXIMITY_RADIUS for an exchange (proximity wipe)
 */
export async function checkExchangeProximity(userId, currentLocation, exchangeId) {
  try {
    // Get the exchange to find the other user
    const { data: exchange, error: exchangeError } = await supabase
      .from('exchanges')
      .select('user_a_id, user_b_id')
      .eq('id', exchangeId)
      .single();

    if (exchangeError || !exchange) return { shouldWipe: false };

    // Determine the other user's ID
    const otherUserId = exchange.user_a_id === userId ? exchange.user_b_id : exchange.user_a_id;

    // Get the other user's location
    const { data: otherUser, error: userError } = await supabase
      .from('users')
      .select('location')
      .eq('id', otherUserId)
      .single();

    if (userError || !otherUser || !otherUser.location) {
      return { shouldWipe: false };
    }

    // Calculate distance (using location helper)
    const { calculateDistance, parseGeographyPoint } = require('./location');
    const otherLocation = parseGeographyPoint(otherUser.location);

    if (!otherLocation) return { shouldWipe: false };

    const distance = calculateDistance(
      currentLocation.latitude,
      currentLocation.longitude,
      otherLocation.latitude,
      otherLocation.longitude
    );

    // If distance > PROXIMITY_RADIUS, should wipe
    return {
      shouldWipe: distance > PROXIMITY_RADIUS,
      distance,
    };
  } catch (error) {
    console.error('Error checking exchange proximity:', error);
    return { shouldWipe: false };
  }
}

/**
 * Update user's phone number
 */
export async function updateUserPhoneNumber(userId, phoneNumber) {
  try {
    const { error } = await supabase
      .from('users')
      .update({ phone_number: phoneNumber })
      .eq('id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Error updating phone number:', error);
    throw error;
  }
}

/**
 * Get user's phone number
 */
export async function getUserPhoneNumber(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('phone_number')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data?.phone_number || null;
  } catch (error) {
    console.error('Error getting phone number:', error);
    return null;
  }
}
