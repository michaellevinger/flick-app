import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

export default function BirthdayScreen({ route, navigation }) {
  const { festivalId, name } = route.params;
  const [selectedMonth, setSelectedMonth] = useState(5); // June (index 5)
  const [selectedDay, setSelectedDay] = useState(15);
  const [selectedYear, setSelectedYear] = useState(1998);

  const calculateAge = () => {
    const birthDate = new Date(selectedYear, selectedMonth, selectedDay);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const age = calculateAge();
  const isValid = age >= 18;

  const handleNext = () => {
    if (!isValid) return;
    navigation.navigate('GenderScreen', {
      festivalId,
      name,
      age,
    });
  };

  const renderPickerItem = (item, isSelected, type) => {
    let displayText = item;
    if (type === 'month') {
      displayText = MONTHS[item];
    }

    return (
      <Text style={[styles.pickerItem, isSelected && styles.pickerItemSelected]}>
        {displayText}
      </Text>
    );
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
              <View style={[styles.progressFill, { width: '14%' }]} />
            </View>

            {/* Title */}
            <Text style={styles.title}>When's your{'\n'}birthday?</Text>

            <View style={styles.spacer} />

            {/* Date Picker Container */}
            <View style={styles.pickerContainer}>
              <View style={styles.pickerOverlay}>
                <View style={styles.pickerHighlight} />
              </View>

              <View style={styles.pickersRow}>
                {/* Month Picker */}
                <View style={styles.pickerColumn}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                    snapToInterval={40}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.y / 40);
                      setSelectedMonth(index);
                    }}
                  >
                    {MONTHS.map((month, index) => (
                      <TouchableOpacity
                        key={month}
                        onPress={() => setSelectedMonth(index)}
                        style={styles.pickerItemContainer}
                      >
                        {renderPickerItem(index, index === selectedMonth, 'month')}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Day Picker */}
                <View style={styles.pickerColumn}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                    snapToInterval={40}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.y / 40);
                      setSelectedDay(DAYS[index]);
                    }}
                  >
                    {DAYS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => setSelectedDay(day)}
                        style={styles.pickerItemContainer}
                      >
                        {renderPickerItem(day, day === selectedDay, 'day')}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Year Picker */}
                <View style={styles.pickerColumn}>
                  <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.pickerScrollContent}
                    snapToInterval={40}
                    decelerationRate="fast"
                    onMomentumScrollEnd={(e) => {
                      const index = Math.round(e.nativeEvent.contentOffset.y / 40);
                      setSelectedYear(YEARS[index]);
                    }}
                  >
                    {YEARS.map((year) => (
                      <TouchableOpacity
                        key={year}
                        onPress={() => setSelectedYear(year)}
                        style={styles.pickerItemContainer}
                      >
                        {renderPickerItem(year, year === selectedYear, 'year')}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>
            </View>

            {age < 18 && (
              <Text style={styles.errorText}>You must be 18 or older</Text>
            )}

            <View style={styles.spacer} />

            {/* Done Button */}
            <TouchableOpacity
              style={[styles.doneButton, !isValid && styles.doneButtonDisabled]}
              onPress={handleNext}
              disabled={!isValid}
            >
              <Text style={styles.doneButtonText}>Done</Text>
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
    color: '#FFFFFF',
    marginBottom: 20,
    lineHeight: 40,
  },
  pickerContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 16,
    height: 200,
    overflow: 'hidden',
    position: 'relative',
    marginVertical: 20,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    pointerEvents: 'none',
  },
  pickerHighlight: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  pickersRow: {
    flexDirection: 'row',
    height: '100%',
  },
  pickerColumn: {
    flex: 1,
    height: '100%',
  },
  pickerScrollContent: {
    paddingVertical: 80,
  },
  pickerItemContainer: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItem: {
    fontSize: 18,
    color: '#999999',
    fontWeight: '400',
  },
  pickerItemSelected: {
    fontSize: 20,
    color: '#000000',
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  doneButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginBottom: 40,
  },
  doneButtonDisabled: {
    opacity: 0.5,
  },
  doneButtonText: {
    fontSize: 18,
    color: '#C44CE0',
    fontWeight: 'bold',
  },
});
