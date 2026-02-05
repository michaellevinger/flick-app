import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';

export default function SetupScreen({ route, navigation }) {
  const { photoUri } = route.params;
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gender, setGender] = useState(''); // 'male', 'female', 'other'
  const [lookingFor, setLookingFor] = useState(''); // 'male', 'female', 'both'
  const [isCreating, setIsCreating] = useState(false);
  const { createUser } = useUser();

  const isValid = name.trim().length > 0 && age.length > 0 && parseInt(age) >= 18 && gender && lookingFor;

  const handleContinue = async () => {
    if (!isValid || isCreating) return;

    setIsCreating(true);

    try {
      await createUser({
        name: name.trim(),
        age: parseInt(age),
        photoUri,
        phoneNumber: phoneNumber.trim() || null,
        gender,
        lookingFor,
      });

      navigation.navigate('Dashboard');
    } catch (error) {
      console.error('Error creating user:', error);

      // Show specific error message if available
      const errorMessage = error.message || 'Failed to create your profile. Please check your internet connection and try again.';

      Alert.alert(
        'Error',
        errorMessage
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.title}>Almost There</Text>
        <Text style={styles.subtitle}>Just the basics</Text>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Alex"
              placeholderTextColor={COLORS.gray}
              autoCapitalize="words"
              maxLength={20}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>I am</Text>
            <View style={styles.optionButtons}>
              <TouchableOpacity
                style={[styles.optionButton, gender === 'male' && styles.optionButtonSelected]}
                onPress={() => setGender('male')}
              >
                <Text style={[styles.optionButtonText, gender === 'male' && styles.optionButtonTextSelected]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, gender === 'female' && styles.optionButtonSelected]}
                onPress={() => setGender('female')}
              >
                <Text style={[styles.optionButtonText, gender === 'female' && styles.optionButtonTextSelected]}>
                  Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, gender === 'other' && styles.optionButtonSelected]}
                onPress={() => setGender('other')}
              >
                <Text style={[styles.optionButtonText, gender === 'other' && styles.optionButtonTextSelected]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Looking for</Text>
            <View style={styles.optionButtons}>
              <TouchableOpacity
                style={[styles.optionButton, lookingFor === 'male' && styles.optionButtonSelected]}
                onPress={() => setLookingFor('male')}
              >
                <Text style={[styles.optionButtonText, lookingFor === 'male' && styles.optionButtonTextSelected]}>
                  Male
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, lookingFor === 'female' && styles.optionButtonSelected]}
                onPress={() => setLookingFor('female')}
              >
                <Text style={[styles.optionButtonText, lookingFor === 'female' && styles.optionButtonTextSelected]}>
                  Female
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.optionButton, lookingFor === 'both' && styles.optionButtonSelected]}
                onPress={() => setLookingFor('both')}
              >
                <Text style={[styles.optionButtonText, lookingFor === 'both' && styles.optionButtonTextSelected]}>
                  Both
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Age</Text>
            <TextInput
              style={styles.input}
              value={age}
              onChangeText={setAge}
              placeholder="25"
              placeholderTextColor={COLORS.gray}
              keyboardType="number-pad"
              maxLength={2}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              Phone Number <Text style={styles.optionalLabel}>(Optional)</Text>
            </Text>
            <Text style={styles.helperText}>
              For number exchange after matching
            </Text>
            <TextInput
              style={styles.input}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="(555) 123-4567"
              placeholderTextColor={COLORS.gray}
              keyboardType="phone-pad"
              maxLength={20}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, (!isValid || isCreating) && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={!isValid || isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color={COLORS.black} />
          ) : (
            <Text style={styles.buttonText}>Continue</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.notice}>
          No bios. No chat. Proximity only.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  title: {
    ...TYPOGRAPHY.title,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    textAlign: 'center',
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  form: {
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  inputGroup: {
    gap: SPACING.sm,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  optionalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    fontWeight: '400',
  },
  helperText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  input: {
    ...TYPOGRAPHY.subtitle,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
  },
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.gray,
  },
  buttonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  notice: {
    ...TYPOGRAPHY.caption,
    textAlign: 'center',
    color: COLORS.gray,
  },
  optionButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  optionButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 8,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: COLORS.white,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.green,
  },
  optionButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.gray,
  },
  optionButtonTextSelected: {
    color: COLORS.black,
  },
});
