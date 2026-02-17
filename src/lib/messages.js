import { supabase } from './supabase';
import * as FileSystem from 'expo-file-system';

/**
 * Generate match ID (alphabetically sorted)
 */
export function getMatchId(userId1, userId2) {
  return userId1 < userId2 ? `${userId1}|${userId2}` : `${userId2}|${userId1}`;
}

/**
 * Send a text message
 */
export async function sendTextMessage(senderId, recipientId, content) {
  try {
    const matchId = getMatchId(senderId, recipientId);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        recipient_id: recipientId,
        message_type: 'text',
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    // Update match last_message_at and increment unread count
    await updateMatchMetadata(matchId, senderId, recipientId);

    return data;
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

/**
 * Send an image message
 */
export async function sendImageMessage(senderId, recipientId, imageUri) {
  try {
    const matchId = getMatchId(senderId, recipientId);
    const fileName = `${matchId}_${Date.now()}.jpg`;

    console.log('Starting image upload for:', fileName);
    console.log('Image URI:', imageUri);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('Base64 length:', base64.length);

    // Decode base64 to byte array manually (no atob in RN)
    const binaryString = base64.replace(/[^A-Za-z0-9+/]/g, '');
    const len = binaryString.length;
    const bytes = new Uint8Array(Math.ceil(len * 3 / 4));

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let p = 0;
    for (let i = 0; i < len; i += 4) {
      const enc1 = chars.indexOf(binaryString[i]);
      const enc2 = chars.indexOf(binaryString[i + 1]);
      const enc3 = chars.indexOf(binaryString[i + 2]);
      const enc4 = chars.indexOf(binaryString[i + 3]);

      bytes[p++] = (enc1 << 2) | (enc2 >> 4);
      if (enc3 !== 64) bytes[p++] = ((enc2 & 15) << 4) | (enc3 >> 2);
      if (enc4 !== 64) bytes[p++] = ((enc3 & 3) << 6) | enc4;
    }

    console.log('Decoded bytes length:', bytes.length);

    // Upload binary data
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(fileName, bytes.buffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    console.log('Upload successful:', uploadData);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

    console.log('Public URL:', urlData.publicUrl);

    // Create message record
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        recipient_id: recipientId,
        message_type: 'image',
        image_url: urlData.publicUrl,
      })
      .select()
      .single();

    if (error) {
      console.error('Message insert error:', error);
      throw error;
    }

    console.log('Message saved:', data);

    // Update match metadata
    await updateMatchMetadata(matchId, senderId, recipientId);

    return data;
  } catch (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
}

/**
 * Send location message
 */
export async function sendLocationMessage(senderId, recipientId, location) {
  try {
    const matchId = getMatchId(senderId, recipientId);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        recipient_id: recipientId,
        message_type: 'location',
        location: `POINT(${location.longitude} ${location.latitude})`,
        content: JSON.stringify({
          latitude: location.latitude,
          longitude: location.longitude,
        }),
      })
      .select()
      .single();

    if (error) throw error;

    // Update match metadata
    await updateMatchMetadata(matchId, senderId, recipientId);

    return data;
  } catch (error) {
    console.error('Error sending location message:', error);
    throw error;
  }
}

/**
 * Send emoji reaction to a message
 */
export async function sendEmojiReaction(senderId, recipientId, messageId, emoji) {
  try {
    const matchId = getMatchId(senderId, recipientId);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        recipient_id: recipientId,
        message_type: 'emoji_reaction',
        content: emoji,
        reaction_to_message_id: messageId,
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  } catch (error) {
    console.error('Error sending emoji reaction:', error);
    throw error;
  }
}

/**
 * Fetch messages for a match
 */
export async function fetchMessages(matchId, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
}

/**
 * Fetch all matches for a user with other user info
 */
export async function fetchMatches(userId) {
  try {
    // Get all matches where user is either user1 or user2
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

    // Fetch other users' data with full profile info
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, age, selfie_url, photos, gender, looking_for, height, bio')
      .in('id', otherUserIds);

    if (usersError) throw usersError;

    // Combine matches with user data
    const matches = matchesData.map((match) => {
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

    return matches;
  } catch (error) {
    console.error('Error fetching matches:', error);
    throw error;
  }
}

/**
 * Subscribe to new messages in a match
 */
export function subscribeToMessages(matchId, callback) {
  const subscription = supabase
    .channel(`messages_${matchId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`,
      },
      (payload) => {
        console.log('New message received:', payload);
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Subscribe to new matches for a user
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
      (payload) => {
        console.log('New match (as user1):', payload);
        callback(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'matches',
        filter: `user2_id=eq.${userId}`,
      },
      (payload) => {
        console.log('New match (as user2):', payload);
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Mark messages as read for a user in a match
 */
export async function markMessagesAsRead(matchId, userId) {
  try {
    // Determine which unread count to reset
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

/**
 * Update match metadata (last message time and unread count)
 */
async function updateMatchMetadata(matchId, senderId, recipientId) {
  try {
    // Get match to determine which user is which
    const { data: matchData, error: fetchError } = await supabase
      .from('matches')
      .select('user1_id, user2_id, unread_count_user1, unread_count_user2')
      .eq('id', matchId)
      .single();

    if (fetchError) throw fetchError;

    // Increment unread count for recipient
    const isRecipientUser1 = matchData.user1_id === recipientId;
    const unreadColumn = isRecipientUser1 ? 'unread_count_user1' : 'unread_count_user2';
    const currentUnread = isRecipientUser1
      ? matchData.unread_count_user1
      : matchData.unread_count_user2;

    const { error } = await supabase
      .from('matches')
      .update({
        last_message_at: new Date().toISOString(),
        [unreadColumn]: currentUnread + 1,
      })
      .eq('id', matchId);

    if (error) throw error;
  } catch (error) {
    console.error('Error updating match metadata:', error);
    // Don't throw - this is non-critical
  }
}

