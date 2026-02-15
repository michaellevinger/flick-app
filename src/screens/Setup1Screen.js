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
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function Setup1Screen({ route, navigation }) {
  const { photoUri } = route.params;
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');

  const isValid = name.trim().length > 0 && gender;

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('Setup2', {
      photoUri,
      name: name.trim(),
      gender,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Progress */}
        <View style={styles.progressContainer}>
          <View style={[styles.progressDot, styles.progressDotActive]} />
          <View style={styles.progressDot} />
          <View style={styles.progressDot} />
        </View>

        <Text style={styles.title}>What's your name?</Text>

        <View style={styles.inputGroup}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your first name"
            placeholderTextColor="#999"
            autoCapitalize="words"
            maxLength={20}
            autoFocus
          />
        </View>

        <Text style={styles.title}>I am a...</Text>

        <View style={styles.optionButtons}>
          <TouchableOpacity
            style={[styles.optionButton, gender === 'male' && styles.optionButtonSelected]}
            onPress={() => setGender('male')}
          >
            <Text style={[styles.optionButtonText, gender === 'male' && styles.optionButtonTextSelected]}>
              Man
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.optionButton, gender === 'female' && styles.optionButtonSelected]}
            onPress={() => setGender('female')}
          >
            <Text style={[styles.optionButtonText, gender === 'female' && styles.optionButtonTextSelected]}>
              Woman
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

        <View style={styles.spacer} />

        <TouchableOpacity
          style={[styles.button, !isValid && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={!isValid}
        >
          <Text style={styles.buttonText}>Next</Text>
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
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 32,
  },
  input: {
    fontSize: 24,
    borderBottomWidth: 2,
    borderBottomColor: '#EEEEEE',
    paddingVertical: 12,
    color: '#000000',
  },
  optionButtons: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  optionButtonSelected: {
    backgroundColor: COLORS.green,
    borderColor: COLORS.green,
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
  },
  optionButtonTextSelected: {
    color: '#FFFFFF',
  },
  spacer: {
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.green,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonDisabled: {
    backgroundColor: '#DDDDDD',
  },
  buttonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
