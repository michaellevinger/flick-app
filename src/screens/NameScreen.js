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
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function NameScreen({ route, navigation }) {
  const { festivalId } = route.params;
  const [name, setName] = useState('');

  const isValid = name.trim().length > 0;

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('BirthdayScreen', {
      festivalId,
      name: name.trim(),
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={['#FFD166', '#FFB84D']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '0%' }]} />
              </View>

              {/* Title */}
              <Text style={styles.title}>What's your{'\n'}first name?</Text>

              {/* Name Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your first name"
                  placeholderTextColor="#999"
                  autoCapitalize="words"
                  maxLength={20}
                  returnKeyType="next"
                  onSubmitEditing={handleNext}
                  autoFocus
                />
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>👁</Text>
                <Text style={styles.infoText}>
                  We only show your first name to potential matches.
                </Text>
              </View>

              <View style={styles.spacer} />

              {/* Next Button */}
              <TouchableOpacity
                style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
                onPress={handleNext}
                disabled={!isValid}
              >
                <Text style={styles.nextButtonText}>→</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2,
    marginBottom: 40,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 40,
    lineHeight: 40,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  input: {
    fontSize: 18,
    color: '#000000',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 40,
  },
  nextButtonDisabled: {
    opacity: 0.3,
  },
  nextButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
