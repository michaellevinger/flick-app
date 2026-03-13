import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { MESSAGE_LIMIT } from '../constants/theme';
import {
  fetchMessages,
  subscribeToMessages,
  sendTextMessage,
  sendImageMessage,
  getMessageCount,
} from '../lib/chatService';
import { markMessagesAsRead } from '../lib/matchService';

/**
 * Manages the full chat message flow for a single match:
 * - Loads message history and per-sender counts
 * - Real-time subscription (with optimistic update reconciliation)
 * - Sends text and image messages with optimistic UI updates
 * - Enforces the 10-message limit
 * - Marks messages as read on open and on new incoming messages
 *
 * @param {string} matchId     The match ID (pipe-separated user IDs)
 * @param {string} userId      Current user's ID
 * @param {string} otherUserId The other user's ID
 */
export function useChatMessages(matchId, userId, otherUserId) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myMessageCount, setMyMessageCount] = useState(0);
  const [theirMessageCount, setTheirMessageCount] = useState(0);
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    loadMessages();
    loadMessageCounts();
    setupSubscription();
    markRead();

    return () => subscriptionRef.current?.unsubscribe();
  }, [matchId]);

  const loadMessages = async () => {
    try {
      const data = await fetchMessages(matchId);
      setMessages(data.reverse()); // Reverse for FlatList (newest at bottom)
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessageCounts = async () => {
    if (!userId || !otherUserId) return;
    try {
      const myCount = await getMessageCount(matchId, userId);
      const theirCount = await getMessageCount(matchId, otherUserId);
      setMyMessageCount(myCount);
      setTheirMessageCount(theirCount);
    } catch (error) {
      console.error('Error loading message counts:', error);
    }
  };

  const setupSubscription = () => {
    subscriptionRef.current = subscribeToMessages(matchId, (newMessage) => {
      setMessages((prev) => {
        const exists = prev.some((msg) => msg.id === newMessage.id);
        if (exists) {
          // Replace the optimistic placeholder with the confirmed message
          return prev.map((msg) =>
            msg.sender_id === newMessage.sender_id &&
            msg.message_type === newMessage.message_type &&
            msg.sending
              ? newMessage
              : msg
          );
        }
        return [...prev, newMessage];
      });
      loadMessageCounts();
      markRead();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });
  };

  const markRead = async () => {
    if (!userId) return;
    try {
      await markMessagesAsRead(matchId, userId);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendText = async (text) => {
    if (!userId) return;

    if (myMessageCount >= MESSAGE_LIMIT) {
      Alert.alert(
        'Message Limit Reached',
        `You've sent ${MESSAGE_LIMIT} messages. Time to meet in person! 🤝`,
        [{ text: 'OK' }]
      );
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      match_id: matchId,
      sender_id: userId,
      recipient_id: otherUserId,
      message_type: 'text',
      content: text,
      created_at: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const sentMessage = await sendTextMessage(userId, otherUserId, text);
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? sentMessage : msg)));
      loadMessageCounts();
    } catch (error) {
      console.error('Failed to send message:', error);
      if (error.message === 'MESSAGE_LIMIT_REACHED') {
        Alert.alert(
          'Message Limit Reached',
          `You've sent ${MESSAGE_LIMIT} messages. Time to meet in person! 🤝`,
          [{ text: 'OK' }]
        );
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const handleSendImage = async (imageUri) => {
    if (!userId) return;

    if (myMessageCount >= MESSAGE_LIMIT) {
      Alert.alert(
        'Message Limit Reached',
        `You've sent ${MESSAGE_LIMIT} messages. Time to meet in person! 🤝`,
        [{ text: 'OK' }]
      );
      return;
    }

    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      match_id: matchId,
      sender_id: userId,
      recipient_id: otherUserId,
      message_type: 'image',
      image_url: imageUri,
      created_at: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);

    try {
      const sentMessage = await sendImageMessage(userId, otherUserId, imageUri);
      setMessages((prev) => prev.map((msg) => (msg.id === tempId ? sentMessage : msg)));
      loadMessageCounts();
    } catch (error) {
      console.error('Failed to send image:', error);
      if (error.message === 'MESSAGE_LIMIT_REACHED') {
        Alert.alert(
          'Message Limit Reached',
          `You've sent ${MESSAGE_LIMIT} messages. Time to meet in person! 🤝`,
          [{ text: 'OK' }]
        );
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  return {
    messages,
    loading,
    myMessageCount,
    theirMessageCount,
    flatListRef,
    handleSendText,
    handleSendImage,
    markRead,
    loadMessageCounts,
  };
}
