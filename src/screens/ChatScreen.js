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
  Modal,
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
  sendSystemMessage,
} from '../lib/messages';
import {
  requestNumberExchange,
  subscribeToExchanges,
  acceptExchangeRequest,
  declineExchangeRequest,
  getUserPhoneNumber,
} from '../lib/vault';
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
  const [exchangeRequest, setExchangeRequest] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
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

  // Show limit modal when user reaches 10 messages
  useEffect(() => {
    if (myMessageCount >= MESSAGE_LIMIT && !exchangeRequest) {
      setShowLimitModal(true);
    }
  }, [myMessageCount, exchangeRequest]);

  // Subscribe to exchange requests
  useEffect(() => {
    if (!user) return;

    const exchangeSub = subscribeToExchanges(user.id, async (exchangeUpdate) => {
      if (exchangeUpdate.status === 'pending') {
        // Someone requested your number
        setExchangeRequest(exchangeUpdate);

        // Show alert
        Alert.alert(
          'Number Exchange Request',
          `${otherUser.name} wants to exchange phone numbers. Accept?`,
          [
            {
              text: 'Decline',
              style: 'cancel',
              onPress: () => handleDeclineExchange(exchangeUpdate.id),
            },
            {
              text: 'Accept',
              onPress: () => handleAcceptExchange(exchangeUpdate.id),
            },
          ]
        );
      }

      if (exchangeUpdate.status === 'accepted') {
        // Exchange accepted - navigate to vault
        Alert.alert(
          'Exchange Accepted!',
          'Check your vault to see phone numbers.',
          [
            {
              text: 'View Vault',
              onPress: () => navigation.navigate('Vault'),
            },
          ]
        );
      }
    });

    return () => {
      exchangeSub?.unsubscribe();
    };
  }, [user, otherUser]);

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

  const handleRequestNumber = async () => {
    if (!user) return;

    // Check if user has phone number set
    const myPhone = await getUserPhoneNumber(user.id);

    if (!myPhone) {
      Alert.alert(
        'Phone Number Required',
        'Please add your phone number in profile settings first.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Confirm request
    Alert.alert(
      'Request Phone Number?',
      `Ask ${otherUser.name} to exchange phone numbers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              // Get their phone number (if they have one)
              const theirPhone = await getUserPhoneNumber(otherUser.id);

              if (!theirPhone) {
                Alert.alert(
                  'Cannot Request',
                  `${otherUser.name} hasn't set a phone number yet.`,
                  [{ text: 'OK' }]
                );
                return;
              }

              // Create exchange request
              const result = await requestNumberExchange(
                user.id,
                otherUser.id,
                myPhone,
                theirPhone
              );

              if (result.alreadyExists) {
                Alert.alert(
                  'Request Pending',
                  'You already have a pending exchange request.',
                  [{ text: 'OK' }]
                );
                return;
              }

              // Send system message to both chats
              await sendSystemMessage(
                matchId,
                `${user.name} requested to exchange phone numbers`,
                { type: 'exchange_request', exchange_id: result.exchange.id }
              );

              Alert.alert(
                'Request Sent',
                `Waiting for ${otherUser.name} to accept.`,
                [{ text: 'OK' }]
              );

              // Close limit modal if open
              setShowLimitModal(false);
            } catch (error) {
              console.error('Error requesting number exchange:', error);
              Alert.alert('Error', 'Failed to send request. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleAcceptExchange = async (exchangeId) => {
    try {
      await acceptExchangeRequest(exchangeId);

      // Send system message
      await sendSystemMessage(
        matchId,
        'Number exchange accepted! Check your vault.',
        { type: 'exchange_accepted' }
      );

      // Navigate to vault
      navigation.navigate('Vault');
    } catch (error) {
      console.error('Error accepting exchange:', error);
      Alert.alert('Error', 'Failed to accept. Please try again.');
    }
  };

  const handleDeclineExchange = async (exchangeId) => {
    try {
      await declineExchangeRequest(exchangeId);

      // Send system message
      await sendSystemMessage(
        matchId,
        'Number exchange declined.',
        { type: 'exchange_declined' }
      );

      setExchangeRequest(null);
    } catch (error) {
      console.error('Error declining exchange:', error);
    }
  };

  const renderMessage = ({ item, index }) => {
    // Calculate message number for this sender
    const isSender = item.sender_id === user?.id;
    let messageNumber = null;

    if (isSender && (item.message_type === 'text' || item.message_type === 'image')) {
      // Count how many text/image messages this sender has sent up to this point
      const messagesToThisPoint = messages.slice(0, index + 1);
      messageNumber = messagesToThisPoint.filter(
        msg => msg.sender_id === item.sender_id &&
               (msg.message_type === 'text' || msg.message_type === 'image')
      ).length;
    }

    return (
      <MessageBubble
        message={item}
        isSender={isSender}
        onLongPress={handleLongPress}
        messageNumber={messageNumber}
        totalLimit={MESSAGE_LIMIT}
      />
    );
  };

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
        onRequestNumber={handleRequestNumber}
        disabled={myMessageCount >= MESSAGE_LIMIT}
        messageCount={myMessageCount}
      />

      {/* Show modal when message limit reached */}
      {showLimitModal && (
        <Modal
          visible={true}
          transparent
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Message Limit Reached</Text>
              <Text style={styles.modalText}>
                You've sent {MESSAGE_LIMIT} messages.{'\n'}
                Request {otherUser.name}'s number to continue?
              </Text>
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButtonSecondary}
                  onPress={() => setShowLimitModal(false)}
                >
                  <Text style={styles.modalButtonTextSecondary}>Not Now</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalButtonPrimary}
                  onPress={() => {
                    setShowLimitModal(false);
                    handleRequestNumber();
                  }}
                >
                  <Text style={styles.modalButtonText}>Request Number</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    marginHorizontal: SPACING.xl,
    alignItems: 'center',
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  modalText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButtonPrimary: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 24,
  },
  modalButtonSecondary: {
    backgroundColor: COLORS.grayLight,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 24,
  },
  modalButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  modalButtonTextSecondary: {
    color: COLORS.gray,
    fontWeight: '600',
    fontSize: 16,
  },
});
