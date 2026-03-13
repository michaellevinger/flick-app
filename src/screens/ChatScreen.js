import React, { useState, useEffect } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY, MESSAGE_LIMIT } from '../constants/theme';
import { useUser } from '../lib/userContext';
import { useChatMessages } from '../hooks/useChatMessages';
import { sendSystemMessage } from '../lib/chatService';
import {
  requestNumberExchange,
  subscribeToExchanges,
  acceptExchangeRequest,
  declineExchangeRequest,
  getUserPhoneNumber,
} from '../lib/vault';
import MessageBubble from '../components/MessageBubble';
import MessageInput from '../components/MessageInput';

export default function ChatScreen({ route, navigation }) {
  const { matchId, otherUser } = route.params;
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const {
    messages,
    loading,
    myMessageCount,
    theirMessageCount,
    flatListRef,
    handleSendText,
    handleSendImage,
    markRead,
  } = useChatMessages(matchId, user?.id, otherUser?.id);

  const [exchangeRequest, setExchangeRequest] = useState(null);
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Mark as read when screen regains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      markRead();
    });
    return () => unsubscribe();
  }, [matchId]);

  // Show limit modal when user reaches the message cap
  useEffect(() => {
    if (myMessageCount >= MESSAGE_LIMIT && !exchangeRequest) {
      setShowLimitModal(true);
    }
  }, [myMessageCount, exchangeRequest]);

  // Subscribe to exchange requests for this match
  useEffect(() => {
    if (!user) return;

    const exchangeSub = subscribeToExchanges(user.id, async (exchangeUpdate) => {
      if (exchangeUpdate.status === 'pending') {
        setExchangeRequest(exchangeUpdate);
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
        Alert.alert('Exchange Accepted!', 'Check your vault to see phone numbers.', [
          { text: 'View Vault', onPress: () => navigation.navigate('Vault') },
        ]);
      }
    });

    return () => exchangeSub?.unsubscribe();
  }, [user, otherUser]);

  const handleRequestNumber = async () => {
    if (!user) return;

    const myPhone = await getUserPhoneNumber(user.id);

    if (!myPhone) {
      Alert.alert(
        'Phone Number Required',
        'Please add your phone number in profile settings first.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Request Phone Number?',
      `Ask ${otherUser.name} to exchange phone numbers?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request',
          onPress: async () => {
            try {
              const theirPhone = await getUserPhoneNumber(otherUser.id);

              if (!theirPhone) {
                Alert.alert(
                  'Cannot Request',
                  `${otherUser.name} hasn't set a phone number yet.`,
                  [{ text: 'OK' }]
                );
                return;
              }

              const result = await requestNumberExchange(
                user.id,
                otherUser.id,
                myPhone,
                theirPhone
              );

              if (result.alreadyExists) {
                Alert.alert('Request Pending', 'You already have a pending exchange request.', [
                  { text: 'OK' },
                ]);
                return;
              }

              await sendSystemMessage(
                matchId,
                `${user.name} requested to exchange phone numbers`,
                { type: 'exchange_request', exchange_id: result.exchange.id }
              );

              Alert.alert('Request Sent', `Waiting for ${otherUser.name} to accept.`, [
                { text: 'OK' },
              ]);

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
      await sendSystemMessage(matchId, 'Number exchange accepted! Check your vault.', {
        type: 'exchange_accepted',
      });
      navigation.navigate('Vault');
    } catch (error) {
      console.error('Error accepting exchange:', error);
      Alert.alert('Error', 'Failed to accept. Please try again.');
    }
  };

  const handleDeclineExchange = async (exchangeId) => {
    try {
      await declineExchangeRequest(exchangeId);
      await sendSystemMessage(matchId, 'Number exchange declined.', {
        type: 'exchange_declined',
      });
      setExchangeRequest(null);
    } catch (error) {
      console.error('Error declining exchange:', error);
    }
  };

  const renderMessage = ({ item, index }) => {
    const isSender = item.sender_id === user?.id;
    let messageNumber = null;

    if (isSender && (item.message_type === 'text' || item.message_type === 'image')) {
      const messagesToThisPoint = messages.slice(0, index + 1);
      messageNumber = messagesToThisPoint.filter(
        (msg) =>
          msg.sender_id === item.sender_id &&
          (msg.message_type === 'text' || msg.message_type === 'image')
      ).length;
    }

    return (
      <MessageBubble
        message={item}
        isSender={isSender}
        onLongPress={() => {}}
        messageNumber={messageNumber}
        totalLimit={MESSAGE_LIMIT}
      />
    );
  };

  const renderHeader = () => {
    const isLimitReached =
      myMessageCount >= MESSAGE_LIMIT || theirMessageCount >= MESSAGE_LIMIT;
    const messagesRemaining = MESSAGE_LIMIT - myMessageCount;

    return (
      <>
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerUser}
            onPress={() =>
              navigation.navigate('UserProfile', { user: otherUser, onFlick: null })
            }
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
                  {messagesRemaining}{' '}
                  {messagesRemaining === 1 ? 'message' : 'messages'} left
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
        {isLimitReached && (
          <View style={styles.limitBanner}>
            <Text style={styles.limitEmoji}>🤝</Text>
            <Text style={styles.limitText}>Message limit reached! Time to meet in person.</Text>
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

      {showLimitModal && (
        <Modal visible transparent animationType="fade">
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
