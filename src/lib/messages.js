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

    // Upload image to Supabase Storage
    const fileName = `${matchId}_${Date.now()}.jpg`;
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('chat-images')
      .upload(fileName, decode(base64), {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('chat-images')
      .getPublicUrl(fileName);

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

    if (error) throw error;

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

    // Fetch other users' data
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, age, selfie_url')
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

/**
 * Helper to decode base64 for image upload
 */
function decode(base64) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let bufferLength = base64.length * 0.75;
  const len = base64.length;
  let p = 0;
  let encoded1, encoded2, encoded3, encoded4;

  if (base64[base64.length - 1] === '=') {
    bufferLength--;
    if (base64[base64.length - 2] === '=') {
      bufferLength--;
    }
  }

  const bytes = new Uint8Array(bufferLength);

  for (let i = 0; i < len; i += 4) {
    encoded1 = chars.indexOf(base64[i]);
    encoded2 = chars.indexOf(base64[i + 1]);
    encoded3 = chars.indexOf(base64[i + 2]);
    encoded4 = chars.indexOf(base64[i + 3]);

    bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }

  return bytes;
}
