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
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function Setup2Screen({ route, navigation }) {
  const { festivalId, name, gender, lookingFor, age, height } = route.params;
  const [phoneNumber, setPhoneNumber] = useState('');
  const [bio, setBio] = useState('');

  // Phone and bio are optional, so always valid
  const isValid = true;

  const handleNext = () => {
    navigation.navigate('Photos', {
      festivalId,
      name,
      gender,
      lookingFor,
      age,
      height,
      phoneNumber: phoneNumber.trim(),
      bio: bio.trim(),
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
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                {/* Progress */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressDot} />
                  <View style={[styles.progressDot, styles.progressDotActive]} />
                  <View style={styles.progressDot} />
                </View>

                {/* Phone Number (Optional) */}
                <Text style={styles.title}>What's your number?</Text>
                <Text style={styles.subtitle}>Optional - helps people reach you after matching</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.inputText}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="+1 (555) 123-4567"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    keyboardType="phone-pad"
                    maxLength={20}
                    returnKeyType="next"
                  />
                </View>

                {/* Bio (Optional) */}
                <Text style={styles.title}>Tell us about yourself</Text>
                <Text style={styles.subtitle}>Optional - a quick bio to stand out</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={[styles.inputText, styles.textArea]}
                    value={bio}
                    onChangeText={setBio}
                    placeholder="I love music festivals and meeting new people..."
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    multiline
                    numberOfLines={4}
                    maxLength={200}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  <Text style={styles.charCount}>{bio.length}/200</Text>
                </View>

                <TouchableOpacity
                  style={[styles.button, !isValid && styles.buttonDisabled]}
                  onPress={handleNext}
                  disabled={!isValid}
                >
                  <Text style={styles.buttonText}>Next</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputText: {
    fontSize: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 12,
    color: '#FFFFFF',
  },
  textArea: {
    borderBottomWidth: 0,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'right',
    marginTop: 4,
  },
  button: {
    marginTop: 40,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
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
