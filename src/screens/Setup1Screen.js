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

export default function Setup1Screen({ route, navigation }) {
  const { festivalId } = route.params;
  const [name, setName] = useState('');
  const [gender, setGender] = useState('');
  const [lookingFor, setLookingFor] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');

  const isValid =
    name.trim().length > 0 &&
    gender &&
    lookingFor &&
    age.length > 0 &&
    parseInt(age) >= 18 &&
    height.length > 0;

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('Setup2', {
      festivalId,
      name: name.trim(),
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
                  <View style={[styles.progressDot, styles.progressDotActive]} />
                  <View style={styles.progressDot} />
                  <View style={styles.progressDot} />
                </View>

                {/* Name */}
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
                    returnKeyType="next"
                  />
                </View>

                {/* Gender */}
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

                {/* Looking For */}
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

                {/* Age and Height */}
                <View style={styles.rowInputs}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.label}>Age</Text>
                    <TextInput
                      style={styles.inputSmall}
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
                      style={styles.inputSmall}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    marginTop: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  input: {
    fontSize: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(255,255,255,0.5)',
    paddingVertical: 12,
    color: '#FFFFFF',
  },
  optionButtons: {
    gap: 12,
    marginBottom: 8,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 30,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  optionButtonSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
  },
  optionButtonText: {
    fontSize: 16,
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
    marginTop: 8,
    marginBottom: 16,
  },
  inputHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  inputSmall: {
    fontSize: 20,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  errorText: {
    color: '#FFCCCC',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  button: {
    marginTop: 32,
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 20,
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
