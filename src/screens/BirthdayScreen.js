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

export default function BirthdayScreen({ route, navigation }) {
  const { festivalId, name } = route.params;
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const calculateAge = () => {
    if (!day || !month || !year) return null;
    const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge();
  const isValid = age !== null && age >= 18;

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('GenderScreen', {
      festivalId,
      name,
      age,
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
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.content}>
              {/* Progress Bar */}
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '14%' }]} />
              </View>

              {/* Title */}
              <Text style={styles.title}>When's your{'\n'}birthday?</Text>

              {/* Date Inputs */}
              <View style={styles.dateInputs}>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Day</Text>
                  <TextInput
                    style={styles.dateField}
                    value={day}
                    onChangeText={(text) => setDay(text.replace(/[^0-9]/g, ''))}
                    placeholder="DD"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Month</Text>
                  <TextInput
                    style={styles.dateField}
                    value={month}
                    onChangeText={(text) => setMonth(text.replace(/[^0-9]/g, ''))}
                    placeholder="MM"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>
                <View style={styles.dateInput}>
                  <Text style={styles.dateLabel}>Year</Text>
                  <TextInput
                    style={styles.dateField}
                    value={year}
                    onChangeText={(text) => setYear(text.replace(/[^0-9]/g, ''))}
                    placeholder="YYYY"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Info Text */}
              <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>👁</Text>
                <Text style={styles.infoText}>
                  We only show your age to potential matches, not your birthday.
                </Text>
              </View>

              {age !== null && age < 18 && (
                <Text style={styles.errorText}>You must be 18 or older</Text>
              )}

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
  dateInputs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  dateInput: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  dateField: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: "rgba(255,255,255,0.15)",
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
    color: "#FFFFFF",
    lineHeight: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  spacer: {
    flex: 1,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFFFFF",
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
    color: '#C44CE0',
    fontWeight: 'bold',
  },
});
