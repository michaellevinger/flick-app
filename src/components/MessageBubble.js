import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

const { width: screenWidth } = Dimensions.get('window');

export default function MessageBubble({ message, isSender, onLongPress }) {
  const [showImageModal, setShowImageModal] = useState(false);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

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

      case 'location':
        const locationData = JSON.parse(message.content);
        return (
          <View style={styles.locationContainer}>
            <Text style={[styles.text, isSender && styles.textSender]}>📍 Location shared</Text>
            <Text style={[styles.locationText, isSender && styles.textSender]}>
              {locationData.latitude.toFixed(4)}, {locationData.longitude.toFixed(4)}
            </Text>
          </View>
        );

      case 'emoji_reaction':
        return (
          <Text style={styles.emoji}>{message.content}</Text>
        );

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
        <View style={[styles.bubble, isSender ? styles.senderBubble : styles.recipientBubble]}>
          {renderContent()}
        </View>
        <Text style={styles.timestamp}>{formatTimestamp(message.created_at)}</Text>
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
    backgroundColor: COLORS.green,
    borderBottomRightRadius: 4,
  },
  recipientBubble: {
    backgroundColor: COLORS.grayLight,
    borderBottomLeftRadius: 4,
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
  image: {
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
    borderRadius: 12,
  },
  locationContainer: {
    paddingVertical: SPACING.xs,
  },
  locationText: {
    ...TYPOGRAPHY.caption,
    fontSize: 12,
    marginTop: SPACING.xs,
    color: COLORS.black,
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
});
