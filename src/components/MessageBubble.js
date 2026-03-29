import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,

} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function MessageBubble({ message, isSender, onLongPress, messageNumber, totalLimit, onSystemAction }) {
  const [showImageModal, setShowImageModal] = useState(false);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const showCounter = isSender && messageNumber && totalLimit &&
    (message.message_type === 'text' || message.message_type === 'image');

  const renderContent = () => {
    switch (message.message_type) {
      case 'text':
        return <Text style={[styles.text, isSender && styles.textSender]}>{message.content}</Text>;

      case 'image':
        return (
          <TouchableOpacity onPress={() => setShowImageModal(true)}>
            <Image source={{ uri: message.image_url }} style={styles.image} />
          </TouchableOpacity>
        );

      case 'emoji_reaction':
        return (
          <Text style={styles.emoji}>{message.content}</Text>
        );

      case 'system': {
        const isExchangeRequest = message.metadata?.type === 'exchange_request';
        return (
          <View style={styles.systemMessageContainer}>
            <Text style={styles.systemMessageText}>{message.content}</Text>
            {isExchangeRequest && onSystemAction && (
              <View style={styles.systemButtonsContainer}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => onSystemAction('decline', message)}
                >
                  <Text style={styles.declineButtonText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => onSystemAction('accept', message)}
                >
                  <Text style={styles.acceptButtonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.container, isSender ? styles.senderContainer : styles.recipientContainer]}
        onLongPress={() => onLongPress && onLongPress(message)}
        delayLongPress={500}
      >
        <View style={[
          styles.bubble,
          isSender ? styles.senderBubble : styles.recipientBubble,
          message.sending && styles.sendingBubble
        ]}>
          {renderContent()}
          {showCounter && (
            <Text style={styles.messageCounter}>
              {messageNumber}/{totalLimit}
            </Text>
          )}
          {message.sending && (
            <ActivityIndicator
              size="small"
              color={isSender ? COLORS.white : COLORS.gray}
              style={styles.sendingIndicator}
            />
          )}
        </View>
        <Text style={styles.timestamp}>
          {message.sending ? 'Sending...' : formatTimestamp(message.created_at)}
        </Text>
      </TouchableOpacity>

      {/* Image Full-Screen Modal */}
      {message.message_type === 'image' && (
        <Modal
          visible={showImageModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImageModal(false)}
        >
          <TouchableOpacity
            style={styles.imageModalOverlay}
            activeOpacity={1}
            onPress={() => setShowImageModal(false)}
          >
            <Image
              source={{ uri: message.image_url }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
    maxWidth: '80%',
  },
  senderContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  recipientContainer: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
    marginBottom: SPACING.xs,
  },
  senderBubble: {
    backgroundColor: COLORS.purple,
    borderBottomRightRadius: 4,
  },
  recipientBubble: {
    backgroundColor: COLORS.grayLight,
    borderBottomLeftRadius: 4,
  },
  sendingBubble: {
    opacity: 0.7,
  },
  sendingIndicator: {
    marginTop: SPACING.xs,
  },
  text: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
  },
  textSender: {
    color: COLORS.white,
  },
  timestamp: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    color: COLORS.gray,
    paddingHorizontal: SPACING.xs,
  },
  messageCounter: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'right',
  },
  image: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    borderRadius: 12,
  },
  emoji: {
    fontSize: 32,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: screenWidth,
  },
  systemMessageContainer: {
    alignSelf: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  systemMessageText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  systemButtonsContainer: {
    flexDirection: 'row',
    marginTop: SPACING.sm,
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
  },
  declineButton: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 16,
  },
  acceptButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
  declineButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 14,
  },
});
