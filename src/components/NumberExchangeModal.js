import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

/**
 * Modal for initiating a phone number exchange request.
 * The user types their phone number and sends it to the other person.
 *
 * Props:
 *   visible        - Whether the modal is shown
 *   phoneNumber    - Current value of the phone number input
 *   onChangePhone  - Called when the text input changes
 *   otherUserName  - Other user's name (for subtitle copy)
 *   onSubmit       - Called when the user taps Send Request
 *   onCancel       - Called when the user cancels
 */
export default function NumberExchangeModal({
  visible,
  phoneNumber,
  onChangePhone,
  otherUserName,
  onSubmit,
  onCancel,
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Enter Your Phone Number</Text>
          <Text style={styles.subtitle}>
            This will be shared with {otherUserName} if they accept
          </Text>

          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={onChangePhone}
            placeholder="(555) 123-4567"
            keyboardType="phone-pad"
            autoFocus
          />

          <View style={styles.buttons}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={onSubmit}>
              <Text style={styles.buttonText}>Send Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  input: {
    ...TYPOGRAPHY.subtitle,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: COLORS.gray,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
  },
});
