import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

export default function LookingForScreen({ route, navigation }) {
  const { festivalId, name, age, gender } = route.params;
  const [lookingFor, setLookingFor] = useState('');

  const isValid = lookingFor.length > 0;

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('BioScreen', {
      festivalId,
      name,
      age,
      gender,
      lookingFor,
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#FF6B9D", "#C44CE0", "#7B5EE3"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '42%' }]} />
            </View>

            {/* Title */}
            <Text style={styles.title}>I'm looking{'\n'}for...</Text>

            {/* Options */}
            <View style={styles.options}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => setLookingFor('female')}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.radio, lookingFor === 'female' && styles.radioSelected]}>
                    {lookingFor === 'female' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionText}>Women</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => setLookingFor('male')}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.radio, lookingFor === 'male' && styles.radioSelected]}>
                    {lookingFor === 'male' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionText}>Men</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => setLookingFor('both')}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.radio, lookingFor === 'both' && styles.radioSelected]}>
                    {lookingFor === 'both' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionText}>Everyone</Text>
                </View>
              </TouchableOpacity>
            </View>

            <View style={styles.spacer} />

            {/* Next Button */}
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
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    marginBottom: 40,
  },
  progressFill: {
    height: '100%',
    backgroundColor: "#FFFFFF",
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: "#FFFFFF",
    marginBottom: 40,
    lineHeight: 40,
  },
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    padding: 20,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FFFFFF',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 40,
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
