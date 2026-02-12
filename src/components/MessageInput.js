import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function MessageInput({ onSendText, onSendImage, onSendLocation }) {
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  const handleSendText = async () => {
    if (!text.trim() || sending) return;

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
    if (sending) return;

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
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
          });

          if (!result.canceled && result.assets[0]) {
            setSending(true);
            try {
              await onSendImage(result.assets[0].uri);
            } catch (error) {
              Alert.alert('Error', 'Failed to send image');
            } finally {
              setSending(false);
            }
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.7,
            allowsEditing: true,
          });

          if (!result.canceled && result.assets[0]) {
            setSending(true);
            try {
              await onSendImage(result.assets[0].uri);
            } catch (error) {
              Alert.alert('Error', 'Failed to send image');
            } finally {
              setSending(false);
            }
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleLocationPress = async () => {
    if (sending) return;

    setSending(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Location permission is required to share location.');
        setSending(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await onSendLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to get location');
    } finally {
      setSending(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Camera Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleCameraPress}
        disabled={sending}
      >
        <Text style={styles.iconText}>📷</Text>
      </TouchableOpacity>

      {/* Location Button */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={handleLocationPress}
        disabled={sending}
      >
        <Text style={styles.iconText}>📍</Text>
      </TouchableOpacity>

      {/* Text Input */}
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message..."
        placeholderTextColor={COLORS.gray}
        multiline
        maxLength={500}
        editable={!sending}
      />

      {/* Send Button */}
      <TouchableOpacity
        style={[styles.sendButton, (!text.trim() || sending) && styles.sendButtonDisabled]}
        onPress={handleSendText}
        disabled={!text.trim() || sending}
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
  iconButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  iconText: {
    fontSize: 24,
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
  sendButton: {
    backgroundColor: COLORS.green,
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
