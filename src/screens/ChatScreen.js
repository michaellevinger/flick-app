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
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';
import {
  fetchMessages,
  subscribeToMessages,
  markMessagesAsRead,
  sendTextMessage,
  sendImageMessage,
  sendLocationMessage,
  sendEmojiReaction,
} from '../lib/messages';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';

export default function ChatScreen({ route, navigation }) {
  const { matchId, otherUser } = route.params;
  const { user } = useUser();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    loadMessages();
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

  const setupSubscription = () => {
    subscriptionRef.current = subscribeToMessages(matchId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
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
    await sendTextMessage(user.id, otherUser.id, text);
    // Scroll to bottom after sending
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendImage = async (imageUri) => {
    if (!user) return;
    await sendImageMessage(user.id, otherUser.id, imageUri);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const handleSendLocation = async (location) => {
    if (!user) return;
    await sendLocationMessage(user.id, otherUser.id, location);
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
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

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <Text style={styles.backText}>←</Text>
      </TouchableOpacity>
      <View style={styles.headerUser}>
        {otherUser.selfie_url ? (
          <Image source={{ uri: otherUser.selfie_url }} style={styles.headerAvatar} />
        ) : (
          <View style={styles.headerAvatarPlaceholder}>
            <Text style={styles.headerInitial}>{otherUser.name[0]}</Text>
          </View>
        )}
        <Text style={styles.headerName}>{otherUser.name}</Text>
      </View>
    </View>
  );

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
        onSendLocation={handleSendLocation}
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
    paddingTop: 60,
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
  headerName: {
    ...TYPOGRAPHY.subtitle,
    fontSize: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    flexGrow: 1,
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
