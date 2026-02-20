import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function MessageInput({ onSendText, onSendImage, disabled = false }) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendText = async () => {
    if (!text.trim() || sending || disabled) return;

    setSending(true);
    try {
      await onSendText(text.trim());
      setText('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCameraPress = async () => {
    if (sending || disabled) return;

    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Camera permission is required to take photos.');
        return;
      }

      Alert.alert('Send Image', 'Choose an option', [
        {
          text: 'Take Photo',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: false,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                setSending(true);
                await onSendImage(result.assets[0].uri);
                setSending(false);
              }
            } catch (error) {
              console.error('Camera error:', error);
              setSending(false);
              Alert.alert('Error', 'Failed to send image. Please try again.');
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                quality: 0.7,
                allowsEditing: false,
              });

              if (!result.canceled && result.assets && result.assets[0]) {
                setSending(true);
                await onSendImage(result.assets[0].uri);
                setSending(false);
              }
            } catch (error) {
              console.error('Gallery error:', error);
              setSending(false);
              Alert.alert('Error', 'Failed to send image. Please try again.');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    } catch (error) {
      console.error('Permission error:', error);
      Alert.alert('Error', 'Camera permission error. Please check your settings.');
    }
  };

  return (
    <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, SPACING.md) }, disabled && styles.containerDisabled]}>
      {/* Camera Button */}
      <TouchableOpacity
        style={[styles.iconButton, disabled && styles.iconButtonDisabled]}
        onPress={handleCameraPress}
        disabled={sending || disabled}
      >
        <Text style={[styles.iconText, disabled && styles.iconTextDisabled]}>📷</Text>
      </TouchableOpacity>

      {/* Text Input */}
      <TextInput
        style={[styles.input, disabled && styles.inputDisabled]}
        value={text}
        onChangeText={setText}
        placeholder={disabled ? "Message limit reached" : "Type a message..."}
        placeholderTextColor={disabled ? '#CCC' : COLORS.gray}
        multiline
        maxLength={500}
        editable={!sending && !disabled}
      />

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || sending || disabled) && styles.sendButtonDisabled]}
        onPress={handleSendText}
        disabled={!text.trim() || sending || disabled}
      >
        {sending ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Text style={styles.sendText}>Send</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.grayLight,
  },
  containerDisabled: {
    opacity: 0.6,
  },
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  iconText: {
    fontSize: 24,
  },
  iconTextDisabled: {
    opacity: 0.4,
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    backgroundColor: COLORS.grayLight,
    borderRadius: 20,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginRight: SPACING.sm,
    maxHeight: 100,
  },
  inputDisabled: {
    backgroundColor: '#F0F0F0',
    color: '#999',
  },
  sendButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: COLORS.gray,
    opacity: 0.5,
  },
  sendText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: 'bold',
  },
});
