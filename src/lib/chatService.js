import { supabase } from './supabase';
import { uploadFileToStorage } from '../utils/uploadUtils';
import { getMatchId } from '../utils/matchUtils';

export { getMatchId };

/**
 * Count messages sent by a user in a match (text and image only)
 */
export async function getMessageCount(matchId, senderId) {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('sender_id', senderId)
      .in('message_type', ['text', 'image']);

    if (error) throw error;
    return count || 0;
  } catch (error) {
    console.error('Error counting messages:', error);
    return 0;
  }
}

/**
 * Send a text message
 */
export async function sendTextMessage(senderId, recipientId, content) {
  try {
    const matchId = getMatchId(senderId, recipientId);

    const messageCount = await getMessageCount(matchId, senderId);
    if (messageCount >= 10) {
      throw new Error('MESSAGE_LIMIT_REACHED');
    }

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

    await updateMatchMetadata(matchId, senderId, recipientId);

    return data;
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

/**
 * Send an image message — uploads to chat-images bucket then creates message record
 */
export async function sendImageMessage(senderId, recipientId, imageUri) {
  try {
    const matchId = getMatchId(senderId, recipientId);

    const messageCount = await getMessageCount(matchId, senderId);
    if (messageCount >= 10) {
      throw new Error('MESSAGE_LIMIT_REACHED');
    }

    // Replace pipe character with hyphen for safe filename
    const safeMatchId = matchId.replace(/\|/g, '-');
    const fileName = `${safeMatchId}_${Date.now()}.jpg`;

    const publicUrl = await uploadFileToStorage('chat-images', fileName, imageUri);

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        recipient_id: recipientId,
        message_type: 'image',
        image_url: publicUrl,
      })
      .select()
      .single();

    if (error) throw error;

    await updateMatchMetadata(matchId, senderId, recipientId);

    return data;
  } catch (error) {
    console.error('Error sending image message:', error);
    throw error;
  }
}

/**
 * Send a location message (manual user-initiated share, not GPS tracking)
 */
export async function sendLocationMessage(senderId, recipientId, location) {
  try {
    if (
      !location ||
      typeof location.latitude !== 'number' ||
      typeof location.longitude !== 'number' ||
      isNaN(location.latitude) ||
      isNaN(location.longitude)
    ) {
      throw new Error('Invalid location: latitude and longitude must be valid numbers');
    }

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

    await updateMatchMetadata(matchId, senderId, recipientId);

    return data;
  } catch (error) {
    console.error('Error sending location message:', error);
    throw error;
  }
}

/**
 * Send an emoji reaction to a message
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
 * Send a system message (automated — e.g. number exchange events)
 */
export async function sendSystemMessage(matchId, content, metadata = null) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: null,
        recipient_id: null,
        message_type: 'system',
        content: content.trim(),
        metadata: metadata,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending system message:', error);
    throw error;
  }
}

/**
 * Fetch messages for a match (newest first for FlatList inversion)
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
 * Subscribe to new messages in a match in real-time
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
        callback(payload.new);
      }
    )
    .subscribe();

  return subscription;
}

/**
 * Update match metadata after sending a message (last_message_at + unread count).
 * Creates match record if it doesn't exist yet (safety fallback).
 */
async function updateMatchMetadata(matchId, senderId, recipientId) {
  try {
    const { data: matchData, error: fetchError } = await supabase
      .from('matches')
      .select('user1_id, user2_id, unread_count_user1, unread_count_user2')
      .eq('id', matchId)
      .single();

    // If match doesn't exist, create it (safety fallback)
    if (fetchError && fetchError.code === 'PGRST116') {
      const [user1Id, user2Id] = matchId.split('|');
      await supabase.from('matches').insert({
        id: matchId,
        user1_id: user1Id,
        user2_id: user2Id,
        unread_count_user1: 0,
        unread_count_user2: 0,
        last_message_at: new Date().toISOString(),
      });

      const isRecipientUser1 = user1Id === recipientId;
      const unreadColumn = isRecipientUser1 ? 'unread_count_user1' : 'unread_count_user2';
      await supabase.from('matches').update({ [unreadColumn]: 1 }).eq('id', matchId);
      return;
    }

    if (fetchError) throw fetchError;

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
    // Non-critical — don't throw
  }
}
