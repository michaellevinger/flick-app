import { supabase } from './supabase';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';

const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Generate match ID (alphabetically sorted)
 */
export function getMatchId(userId1, userId2) {
  return userId1 < userId2 ? `${userId1}|${userId2}` : `${userId2}|${userId1}`;
}

/**
 * Count messages sent by a user in a match
 */
export async function getMessageCount(matchId, senderId) {
  try {
    const { count, error } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('match_id', matchId)
      .eq('sender_id', senderId)
      .in('message_type', ['text', 'image']); // Only count text and image messages

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

    // Check message limit (10 messages per person)
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

    // Update match last_message_at and increment unread count
    await updateMatchMetadata(matchId, senderId, recipientId);

    return data;
  } catch (error) {
    console.error('Error sending text message:', error);
    throw error;
  }
}

/**
 * Send an image message using XMLHttpRequest (more reliable than FormData in React Native)
 */
export async function sendImageMessage(senderId, recipientId, imageUri) {
  try {
    const matchId = getMatchId(senderId, recipientId);

    // Check message limit (10 messages per person)
    const messageCount = await getMessageCount(matchId, senderId);
    if (messageCount >= 10) {
      throw new Error('MESSAGE_LIMIT_REACHED');
    }

    // Replace pipe character with hyphen for safe filename
    const safeMatchId = matchId.replace(/\|/g, '-');
    const fileName = `${safeMatchId}_${Date.now()}.jpg`;

    console.log('Starting image upload for:', fileName);
    console.log('Image URI:', imageUri);

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    console.log('File read successfully, converting to binary...');

    // Convert base64 to binary
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    console.log('Binary conversion complete, uploading to Supabase...');

    // Upload using XMLHttpRequest (more reliable than fetch for binary data)
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/chat-images/${fileName}`;

    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.timeout = 60000; // 60 second timeout

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 201) {
          console.log('Upload successful');
          resolve();
        } else {
          console.error('Upload failed:', xhr.status, xhr.responseText);
          reject(new Error(`Upload failed: ${xhr.status} - ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => {
        console.error('Upload network error');
        reject(new Error('Network error during upload'));
      };

      xhr.ontimeout = () => {
        console.error('Upload timeout');
        reject(new Error('Upload timeout - please try again'));
      };

      xhr.open('POST', uploadUrl);
      xhr.setRequestHeader('apikey', SUPABASE_ANON_KEY);
      xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
      xhr.setRequestHeader('Content-Type', 'image/jpeg');
      xhr.send(bytes.buffer);
    });

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
    // Validate location has valid coordinates
    if (!location ||
        typeof location.latitude !== 'number' ||
        typeof location.longitude !== 'number' ||
        isNaN(location.latitude) ||
        isNaN(location.longitude)) {
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

    // If match doesn't exist, create it (safety fallback)
    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('Match not found, creating:', matchId);
      const [user1Id, user2Id] = matchId.split('|');
      await supabase
        .from('matches')
        .insert({
          id: matchId,
          user1_id: user1Id,
          user2_id: user2Id,
          unread_count_user1: 0,
          unread_count_user2: 0,
          last_message_at: new Date().toISOString(),
        });

      // Now update with unread count
      const isRecipientUser1 = user1Id === recipientId;
      const unreadColumn = isRecipientUser1 ? 'unread_count_user1' : 'unread_count_user2';

      await supabase
        .from('matches')
        .update({
          [unreadColumn]: 1,
        })
        .eq('id', matchId);

      return;
    }

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

