import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';

export default function Setup3Screen({ route, navigation }) {
  const { photoUri, name, gender, lookingFor, age, height } = route.params;
  const [bio, setBio] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const { createUser } = useUser();

  const handleFinish = async () => {
    if (isCreating) return;

    setIsCreating(true);

    try {
      const festivalId = await AsyncStorage.getItem('festivalId');

      await createUser({
        name,
        age,
        height,
        photoUri,
        phoneNumber: phoneNumber.trim() || null,
        gender,
        lookingFor,
        festivalId,
        bio: bio.trim() || null,
      });

      navigation.replace('Dashboard');
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Failed to create your profile. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
          <View style={[styles.progressDot, styles.progressDotActive]} />
        </View>

        <Text style={styles.title}>About you</Text>
        <Text style={styles.subtitle}>Optional but helps you stand out!</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={styles.bioInput}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell others something interesting about yourself..."
            placeholderTextColor="#999"
            multiline
            maxLength={150}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/150</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <Text style={styles.helperText}>For sharing after you match</Text>
          <TextInput
            style={styles.input}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            placeholder="(555) 123-4567"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
            maxLength={20}
          />
        </View>

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.button, isCreating && styles.buttonDisabled]}
          onPress={handleFinish}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Let's Go!</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleFinish}
          disabled={isCreating}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 40,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#DDDDDD',
  },
  progressDotActive: {
    backgroundColor: COLORS.green,
    width: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 8,
  },
  bioInput: {
    fontSize: 16,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#000000',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  input: {
    fontSize: 18,
    borderWidth: 2,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#000000',
  },
  spacer: {
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  skipButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  skipButtonText: {
    fontSize: 16,
    color: '#888888',
  },
});
