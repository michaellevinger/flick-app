import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createEvent, validateEventData } from '../lib/events';
import { useUser } from '../lib/userContext';

export default function CreateEventScreen({ navigation }) {
  const { user } = useUser();
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [sponsorName, setSponsorName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 1 week from now
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errors, setErrors] = useState({});

  // Validate form
  const validation = validateEventData({
    name: eventName,
    venue,
    startDate,
    endDate,
  });

  const isValid = validation.isValid;

  const handleStartDateChange = (event, selectedDate) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      // Auto-adjust end date if it's before new start date
      if (endDate <= selectedDate) {
        setEndDate(new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000));
      }
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  };

  const handleCreateEvent = async () => {
    if (!isValid || isCreating) return;

    // Validate again before submission
    const finalValidation = validateEventData({
      name: eventName,
      venue,
      startDate,
      endDate,
    });

    if (!finalValidation.isValid) {
      setErrors(finalValidation.errors);
      return;
    }

    setIsCreating(true);
    setErrors({});

    try {
      const event = await createEvent({
        name: eventName,
        venue: venue.trim(),
        startDate,
        endDate,
        sponsorName: sponsorName.trim() || null,
        hostUserId: user?.id || null,
      });

      // Navigate to customization screen
      navigation.replace('CustomizeEvent', { festivalId: event.id, event });
    } catch (error) {
      console.error('Failed to create event:', error);
      Alert.alert(
        'Error Creating Event',
        'Something went wrong. Please try again.',
        [{ text: 'Retry', onPress: () => setIsCreating(false) }]
      );
    }
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
                <Text style={styles.title}>Create Your Event</Text>

                {/* Event Name */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Event Name *</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    value={eventName}
                    onChangeText={setEventName}
                    placeholder="Summer Festival 2024"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    maxLength={100}
                    returnKeyType="next"
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                </View>

                {/* Venue/Location */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Venue/Location *</Text>
                  <TextInput
                    style={[styles.input, errors.venue && styles.inputError]}
                    value={venue}
                    onChangeText={setVenue}
                    placeholder="Empire Polo Club, Indio, CA"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    maxLength={200}
                    returnKeyType="next"
                  />
                  {errors.venue && <Text style={styles.errorText}>{errors.venue}</Text>}
                </View>

                {/* Start Date */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Start Date *</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, errors.startDate && styles.inputError]}
                    onPress={() => setShowStartPicker(true)}
                  >
                    <Text style={styles.dateButtonText}>{formatDate(startDate)}</Text>
                    <Text style={styles.dateButtonIcon}>📅</Text>
                  </TouchableOpacity>
                  {errors.startDate && <Text style={styles.errorText}>{errors.startDate}</Text>}
                  {showStartPicker && (
                    <DateTimePicker
                      value={startDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleStartDateChange}
                      minimumDate={new Date()}
                    />
                  )}
                </View>

                {/* End Date */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>End Date *</Text>
                  <TouchableOpacity
                    style={[styles.dateButton, errors.endDate && styles.inputError]}
                    onPress={() => setShowEndPicker(true)}
                  >
                    <Text style={styles.dateButtonText}>{formatDate(endDate)}</Text>
                    <Text style={styles.dateButtonIcon}>📅</Text>
                  </TouchableOpacity>
                  {errors.endDate && <Text style={styles.errorText}>{errors.endDate}</Text>}
                  {showEndPicker && (
                    <DateTimePicker
                      value={endDate}
                      mode="date"
                      display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                      onChange={handleEndDateChange}
                      minimumDate={startDate}
                    />
                  )}
                </View>

                {/* Sponsor Name (Optional) */}
                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Sponsor Name (Optional)</Text>
                  <TextInput
                    style={styles.input}
                    value={sponsorName}
                    onChangeText={setSponsorName}
                    placeholder="Coca-Cola"
                    placeholderTextColor="rgba(255,255,255,0.5)"
                    maxLength={100}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  style={[styles.button, (!isValid || isCreating) && styles.buttonDisabled]}
                  onPress={handleCreateEvent}
                  disabled={!isValid || isCreating}
                >
                  {isCreating ? (
                    <ActivityIndicator color="#C44CE0" />
                  ) : (
                    <Text style={styles.buttonText}>Create Event</Text>
                  )}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  input: {
    fontSize: 18,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  inputError: {
    borderColor: '#FFCCCC',
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dateButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dateButtonIcon: {
    fontSize: 20,
  },
  errorText: {
    color: '#FFCCCC',
    fontSize: 14,
    marginTop: 8,
  },
  button: {
    marginTop: 24,
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
