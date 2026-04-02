import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getPendingFestivalId } from '../lib/deepLinking';

export default function NameScreen({ route, navigation }) {
  const paramFestivalId = route.params?.festivalId || null;
  const [festivalId, setFestivalId] = useState(paramFestivalId);
  const [name, setName] = useState('');

  // If no festivalId from params, check AsyncStorage (app killed mid-onboarding after deep link)
  useEffect(() => {
    if (!paramFestivalId) {
      getPendingFestivalId().then((pending) => {
        if (pending) setFestivalId(pending);
      });
    }
  }, [paramFestivalId]);

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
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#FF6B9D', '#C44CE0', '#7B5EE3']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
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
              <View style={styles.bottomRow}>
                <TouchableOpacity
                  style={styles.hostLink}
                  onPress={() => navigation.navigate('HostAuth')}
                >
                  <Text style={styles.hostLinkText}>Host an Event</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
                  onPress={handleNext}
                  disabled={!isValid}
                >
                  <View style={styles.arrowContainer}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 40,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    lineHeight: 40,
  },
  inputContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  input: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
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
    color: '#FFFFFF',
    lineHeight: 20,
  },
  spacer: {
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 40,
  },
  hostLink: {
    paddingVertical: 12,
  },
  hostLinkText: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.7)',
    textDecorationLine: 'underline',
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonDisabled: {
    opacity: 0.3,
  },
  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  arrowLine: {
    width: 20,
    height: 2.5,
    backgroundColor: '#C44CE0',
    borderRadius: 2,
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    width: 8,
    height: 8,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#C44CE0',
    transform: [{ rotate: '45deg' }],
  },
});
