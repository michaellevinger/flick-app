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

export default function BioScreen({ route, navigation }) {
  const { festivalId, name, age, gender, lookingFor } = route.params;
  const [bio, setBio] = useState('');

  // Bio is optional, so always valid
  const isValid = true;

  const handleNext = () => {
    navigation.navigate('Photos', {
      festivalId,
      name,
      age,
      gender,
      lookingFor,
      bio: bio.trim(),
      phoneNumber: '', // Optional, not collected in this flow
      height: null, // Optional, not collected in this flow
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
                <View style={[styles.progressFill, { width: '56%' }]} />
              </View>

              {/* Title */}
              <Text style={styles.title}>Tell us about{'\n'}yourself</Text>
              <Text style={styles.subtitle}>Optional - but recommended!</Text>

              {/* Bio Input */}
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="I love music festivals and meeting new people..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={150}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{bio.length}/150</Text>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>💡</Text>
                <Text style={styles.infoText}>
                  Profiles with bios get 3x more matches!
                </Text>
              </View>

              <View style={styles.spacer} />

              {/* Next Button */}
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNext}
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
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#000000',
    opacity: 0.6,
    marginBottom: 32,
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  bioInput: {
    fontSize: 16,
    color: '#000000',
    minHeight: 120,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
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
  nextButtonText: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
