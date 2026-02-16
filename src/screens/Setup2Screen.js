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
  const { photoUri, name, gender } = route.params;
  const [lookingFor, setLookingFor] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');

  const isValid = lookingFor && age.length > 0 && parseInt(age) >= 18 && height.length > 0;

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('Setup3', {
      photoUri,
      name,
      gender,
      lookingFor,
      age: parseInt(age),
      height: parseInt(height),
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

                <Text style={styles.title}>I'm looking for...</Text>

                <View style={styles.optionButtons}>
                  <TouchableOpacity
                    style={[styles.optionButton, lookingFor === 'male' && styles.optionButtonSelected]}
                    onPress={() => setLookingFor('male')}
                  >
                    <Text style={[styles.optionButtonText, lookingFor === 'male' && styles.optionButtonTextSelected]}>
                      Men
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, lookingFor === 'female' && styles.optionButtonSelected]}
                    onPress={() => setLookingFor('female')}
                  >
                    <Text style={[styles.optionButtonText, lookingFor === 'female' && styles.optionButtonTextSelected]}>
                      Women
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.optionButton, lookingFor === 'both' && styles.optionButtonSelected]}
                    onPress={() => setLookingFor('both')}
                  >
                    <Text style={[styles.optionButtonText, lookingFor === 'both' && styles.optionButtonTextSelected]}>
                      Everyone
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.rowInputs}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput
                      style={styles.input}
                      value={age}
                      onChangeText={setAge}
                      placeholder="25"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      keyboardType="number-pad"
                      maxLength={2}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>Height (cm)</Text>
                    <TextInput
                      style={styles.input}
                      value={height}
                      onChangeText={setHeight}
                      placeholder="170"
                      placeholderTextColor="rgba(255,255,255,0.5)"
                      keyboardType="number-pad"
                      maxLength={3}
                      returnKeyType="done"
                      onSubmitEditing={Keyboard.dismiss}
                    />
                  </View>
                </View>

                {age.length > 0 && parseInt(age) < 18 && (
                  <Text style={styles.errorText}>You must be 18 or older</Text>
                )}

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
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  optionButtons: {
    gap: 12,
    marginBottom: 32,
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
  rowInputs: {
    flexDirection: 'row',
    gap: 16,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    fontSize: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorText: {
    color: '#FFCCCC',
    fontSize: 14,
    marginTop: 8,
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
