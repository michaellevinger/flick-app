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
import { LinearGradient } from 'expo-linear-gradient';

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
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#FF6B9D', '#C44CE0', '#7B5EE3']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressDot, styles.progressDotActive]} />
            <View style={styles.progressDot} />
            <View style={styles.progressDot} />
          </View>

          <Text style={styles.title}>What's your name?</Text>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your first name"
              placeholderTextColor="rgba(255,255,255,0.5)"
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
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
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
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressDotActive: {
    backgroundColor: '#FFFFFF',
    width: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 32,
  },
  input: {
    fontSize: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 12,
    color: '#FFFFFF',
  },
  optionButtons: {
    gap: 12,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  optionButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  optionButtonTextSelected: {
    color: '#C44CE0',
  },
  spacer: {
    flex: 1,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 18,
    color: '#C44CE0',
    fontWeight: 'bold',
  },
});
