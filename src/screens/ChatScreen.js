import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';
import {
  fetchMessages,
  subscribeToMessages,
  markMessagesAsRead,
  sendTextMessage,
  sendImageMessage,
  sendEmojiReaction,
  getMessageCount,
} from '../lib/messages';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';

const MESSAGE_LIMIT = 10; // Maximum messages per person

export default function ChatScreen({ route, navigation }) {
  const { matchId, otherUser } = route.params;
  const { user } = useUser();
  const insets = useSafeAreaInsets();
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
    markAsRead();

    // Mark as read when screen regains focus
    const unsubscribe = navigation.addListener('focus', () => {
      markAsRead();
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      unsubscribe();
    };
  }, [matchId]);

  const loadMessages = async () => {
    try {
      const data = await fetchMessages(matchId);
      // Reverse for FlatList (newest at bottom)
      setMessages(data.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessageCounts = async () => {
    if (!user) return;
    try {
      const myCount = await getMessageCount(matchId, user.id);
      const theirCount = await getMessageCount(matchId, otherUser.id);
      setMyMessageCount(myCount);
      setTheirMessageCount(theirCount);
    } catch (error) {
      console.error('Error loading message counts:', error);
    }
  };

  const setupSubscription = () => {
    subscriptionRef.current = subscribeToMessages(matchId, (newMessage) => {
      setMessages((prev) => {
        // Check if this message is already in the list (from optimistic update)
        const exists = prev.some((msg) => msg.id === newMessage.id);
        if (exists) {
          // Replace temp message with real one
          return prev.map((msg) =>
            msg.sender_id === newMessage.sender_id &&
            msg.message_type === newMessage.message_type &&
            msg.sending
              ? newMessage
              : msg
          );
        }
        // New message from other user
        return [...prev, newMessage];
      });
      // Update message counts
      loadMessageCounts();
      // Mark as read when receiving new messages while chat is open
      markAsRead();
      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });
  };

  const markAsRead = async () => {
    if (!user) return;
    try {
      await markMessagesAsRead(matchId, user.id);
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleSendText = async (text) => {
    if (!user) return;

    // Check if limit already reached
    if (myMessageCount >= MESSAGE_LIMIT) {
      Alert.alert(
        'Message Limit Reached',
        `You've sent ${MESSAGE_LIMIT} messages. Time to meet in person! 🤝`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Optimistic update - add message to UI immediately
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      match_id: matchId,
      sender_id: user.id,
      recipient_id: otherUser.id,
      message_type: 'text',
      content: text,
      created_at: new Date().toISOString(),
      sending: true, // Flag to show sending state
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Scroll immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const sentMessage = await sendTextMessage(user.id, otherUser.id, text);

      // Replace optimistic message with real one
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? sentMessage : msg))
      );

      // Update message count
      loadMessageCounts();
    } catch (error) {
      console.error('Failed to send message:', error);

      // Check if it's the limit error
      if (error.message === 'MESSAGE_LIMIT_REACHED') {
        Alert.alert(
          'Message Limit Reached',
          `You've sent ${MESSAGE_LIMIT} messages. Time to meet in person! 🤝`,
          [{ text: 'OK' }]
        );
      }

      // Remove failed message
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const handleSendImage = async (imageUri) => {
    if (!user) return;

    // Check if limit already reached
    if (myMessageCount >= MESSAGE_LIMIT) {
      Alert.alert(
        'Message Limit Reached',
        `You've sent ${MESSAGE_LIMIT} messages. Time to meet in person! 🤝`,
        [{ text: 'OK' }]
      );
      return;
    }

    // Optimistic update - show image immediately
    const tempId = `temp_${Date.now()}`;
    const optimisticMessage = {
      id: tempId,
      match_id: matchId,
      sender_id: user.id,
      recipient_id: otherUser.id,
      message_type: 'image',
      image_url: imageUri, // Show local URI temporarily
      created_at: new Date().toISOString(),
      sending: true,
    };

    setMessages((prev) => [...prev, optimisticMessage]);

    // Scroll immediately
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 50);

    try {
      const sentMessage = await sendImageMessage(user.id, otherUser.id, imageUri);

      // Replace with uploaded image URL
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? sentMessage : msg))
      );

      // Update message count
      loadMessageCounts();
    } catch (error) {
      console.error('Failed to send image:', error);

      // Check if it's the limit error
      if (error.message === 'MESSAGE_LIMIT_REACHED') {
        Alert.alert(
          'Message Limit Reached',
          `You've sent ${MESSAGE_LIMIT} messages. Time to meet in person! 🤝`,
          [{ text: 'OK' }]
        );
      }

      // Remove failed message
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    }
  };

  const handleLongPress = (message) => {
    // TODO: Implement emoji reactions
    console.log('Long press on message:', message.id);
  };

  const renderMessage = ({ item }) => (
    <MessageBubble
      message={item}
      isSender={item.sender_id === user?.id}
      onLongPress={handleLongPress}
    />
  );

  const handleProfilePress = () => {
    navigation.navigate('UserProfile', {
      user: otherUser,
      onFlick: null, // Already matched, no need to flick
    });
  };

  const renderHeader = () => {
    const isLimitReached = myMessageCount >= MESSAGE_LIMIT || theirMessageCount >= MESSAGE_LIMIT;
    const messagesRemaining = MESSAGE_LIMIT - myMessageCount;

    return (
      <>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerUser}
            onPress={handleProfilePress}
            activeOpacity={0.7}
          >
            {otherUser.selfie_url ? (
              <Image source={{ uri: otherUser.selfie_url }} style={styles.headerAvatar} />
            ) : (
              <View style={styles.headerAvatarPlaceholder}>
                <Text style={styles.headerInitial}>{otherUser.name[0]}</Text>
              </View>
            )}
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{otherUser.name}</Text>
              {!isLimitReached && (
                <Text style={styles.messageCount}>
                  {messagesRemaining} {messagesRemaining === 1 ? 'message' : 'messages'} left
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        {isLimitReached && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitEmoji}>🤝</Text>
            <Text style={styles.limitText}>
              Message limit reached! Time to meet in person.
            </Text>
          </View>
        )}
      </>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.green} />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {renderHeader()}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>👋</Text>
            <Text style={styles.emptyText}>Start the conversation!</Text>
          </View>
        }
      />

      <MessageInput
        onSendText={handleSendText}
        onSendImage={handleSendImage}
        disabled={myMessageCount >= MESSAGE_LIMIT}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  centerContent: {
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  backButton: {
    marginRight: SPACING.md,
  },
  backText: {
    fontSize: 28,
    color: COLORS.black,
  },
  headerUser: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: SPACING.sm,
  },
  headerAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.green,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  headerInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 20,
  },
  messageCount: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 2,
  },
  limitBanner: {
    backgroundColor: '#FFE4E1',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFB6B6',
  },
  limitEmoji: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  limitText: {
    flex: 1,
    fontSize: 14,
    color: '#D32F2F',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
});
