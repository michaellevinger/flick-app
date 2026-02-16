import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function GenderScreen({ route, navigation }) {
  const { festivalId, name, age } = route.params;
  const [gender, setGender] = useState('');

  const isValid = gender.length > 0;

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('LookingForScreen', {
      festivalId,
      name,
      age,
      gender,
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
          <View style={styles.content}>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '28%' }]} />
            </View>

            {/* Title */}
            <Text style={styles.title}>What's your{'\n'}gender?</Text>

            {/* Options */}
            <View style={styles.options}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => setGender('female')}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.radio, gender === 'female' && styles.radioSelected]}>
                    {gender === 'female' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionText}>Woman</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => setGender('male')}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.radio, gender === 'male' && styles.radioSelected]}>
                    {gender === 'male' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionText}>Man</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.option}
                onPress={() => setGender('other')}
              >
                <View style={styles.optionContent}>
                  <View style={[styles.radio, gender === 'other' && styles.radioSelected]}>
                    {gender === 'other' && <View style={styles.radioInner} />}
                  </View>
                  <Text style={styles.optionText}>Nonbinary</Text>
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
              <Text style={styles.nextButtonText}>→</Text>
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
  options: {
    gap: 12,
  },
  option: {
    backgroundColor: '#FFFFFF',
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
    borderColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: '#FFD166',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFD166',
  },
  optionText: {
    fontSize: 18,
    color: '#000000',
    fontWeight: '500',
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
