import { supabase } from './supabase';

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
 * Delete an exchange
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
 * Update the accepting user's phone on an exchange record if it's still 'pending'.
 */
export async function updateExchangePhone(exchangeId, userId, phone) {
  try {
    const { data, error: fetchErr } = await supabase
      .from('exchanges')
      .select('*')
      .eq('id', exchangeId)
      .single();

    if (fetchErr || !data) return;

    const isUserA = data.user_a_id === userId;
    const phoneField = isUserA ? 'user_a_phone' : 'user_b_phone';
    const currentPhone = isUserA ? data.user_a_phone : data.user_b_phone;

    if (currentPhone === 'pending') {
      await supabase.from('exchanges').update({ [phoneField]: phone }).eq('id', exchangeId);
    }
  } catch (error) {
    console.error('Error updating exchange phone:', error);
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
