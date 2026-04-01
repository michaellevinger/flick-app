import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Platform,
  StatusBar,
  PanResponder,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../lib/userContext';

const MIN_AGE = 18;
const MAX_AGE = 80;
const THUMB_SIZE = 28;

export default function AgeRangeScreen({ route, navigation }) {
  const { festivalId, name, age, gender, lookingFor } = route.params || {};
  const editMode = route.params?.editMode || false;
  const { updateUser } = useUser();

  const [ageMin, setAgeMin] = useState(route.params?.ageRangeMin ?? 20);
  const [ageMax, setAgeMax] = useState(route.params?.ageRangeMax ?? 35);
  const [editingMin, setEditingMin] = useState(false);
  const [editingMax, setEditingMax] = useState(false);
  const [minText, setMinText] = useState('');
  const [maxText, setMaxText] = useState('');
  const [layoutReady, setLayoutReady] = useState(false);
  const trackWidth = useRef(0);
  const ageMinRef = useRef(ageMin);
  const ageMaxRef = useRef(ageMax);
  const dragStartPos = useRef(0);

  // Keep refs in sync with state
  ageMinRef.current = ageMin;
  ageMaxRef.current = ageMax;

  const ageToPosition = (val) => {
    if (trackWidth.current === 0) return 0;
    return ((val - MIN_AGE) / (MAX_AGE - MIN_AGE)) * trackWidth.current;
  };

  const positionToAge = (pos) => {
    if (trackWidth.current === 0) return MIN_AGE;
    const ratio = Math.max(0, Math.min(1, pos / trackWidth.current));
    return Math.round(MIN_AGE + ratio * (MAX_AGE - MIN_AGE));
  };

  const minPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartPos.current = ageToPosition(ageMinRef.current);
      },
      onPanResponderMove: (_, gestureState) => {
        const pos = dragStartPos.current + gestureState.dx;
        const newAge = positionToAge(pos);
        if (newAge >= MIN_AGE && newAge <= ageMaxRef.current) {
          setAgeMin(newAge);
        }
      },
    })
  ).current;

  const maxPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStartPos.current = ageToPosition(ageMaxRef.current);
      },
      onPanResponderMove: (_, gestureState) => {
        const pos = dragStartPos.current + gestureState.dx;
        const newAge = positionToAge(pos);
        if (newAge >= ageMinRef.current && newAge <= MAX_AGE) {
          setAgeMax(newAge);
        }
      },
    })
  ).current;

  const handleTrackLayout = (e) => {
    trackWidth.current = e.nativeEvent.layout.width;
    if (!layoutReady) setLayoutReady(true);
  };

  const commitMinEdit = () => {
    const val = parseInt(minText, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(MIN_AGE, Math.min(ageMax, val));
      setAgeMin(clamped);
    }
    setEditingMin(false);
  };

  const commitMaxEdit = () => {
    const val = parseInt(maxText, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(ageMin, Math.min(MAX_AGE, val));
      setAgeMax(clamped);
    }
    setEditingMax(false);
  };

  const handleNext = async () => {
    if (editMode) {
      try {
        await updateUser({ ageRangeMin: ageMin, ageRangeMax: ageMax });
      } catch (error) {
        console.error('Error saving age filter:', error);
      }
      navigation.goBack();
      return;
    }

    navigation.navigate('BioScreen', {
      festivalId,
      name,
      age,
      gender,
      lookingFor,
      ageRangeMin: ageMin,
      ageRangeMax: ageMax,
    });
  };

  const leftPos = ageToPosition(ageMin);
  const rightPos = ageToPosition(ageMax);

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
              {/* Progress Bar - only in onboarding */}
              {!editMode && (
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: '49%' }]} />
                </View>
              )}

              {/* Back button in edit mode */}
              {editMode && (
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                  <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
              )}

              <Text style={styles.title}>Age range</Text>
              <Text style={styles.subtitle}>What ages are you interested in?</Text>

              {/* Age Display - tappable to edit */}
              <View style={styles.ageDisplay}>
                {editingMin ? (
                  <TextInput
                    style={styles.ageInput}
                    value={minText}
                    onChangeText={setMinText}
                    keyboardType="number-pad"
                    maxLength={3}
                    autoFocus
                    onBlur={commitMinEdit}
                    onSubmitEditing={commitMinEdit}
                    selectTextOnFocus
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => { setMinText(String(ageMin)); setEditingMin(true); }}
                  >
                    <Text style={styles.ageValue}>{ageMin}</Text>
                  </TouchableOpacity>
                )}

                <Text style={styles.ageSeparator}>—</Text>

                {editingMax ? (
                  <TextInput
                    style={styles.ageInput}
                    value={maxText}
                    onChangeText={setMaxText}
                    keyboardType="number-pad"
                    maxLength={3}
                    autoFocus
                    onBlur={commitMaxEdit}
                    onSubmitEditing={commitMaxEdit}
                    selectTextOnFocus
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => { setMaxText(String(ageMax)); setEditingMax(true); }}
                  >
                    <Text style={styles.ageValue}>{ageMax}</Text>
                  </TouchableOpacity>
                )}
              </View>

              <Text style={styles.tapHint}>Tap a number to type it</Text>

              {/* Range Slider */}
              <View style={styles.sliderContainer}>
                <View style={styles.track} onLayout={handleTrackLayout}>
                  {/* Active range highlight */}
                  <View
                    style={[
                      styles.activeTrack,
                      { left: leftPos, width: Math.max(0, rightPos - leftPos) },
                    ]}
                  />

                  {/* Min thumb */}
                  <View
                    style={[styles.thumb, { left: leftPos - THUMB_SIZE / 2 }]}
                    {...minPanResponder.panHandlers}
                  />

                  {/* Max thumb */}
                  <View
                    style={[styles.thumb, { left: rightPos - THUMB_SIZE / 2 }]}
                    {...maxPanResponder.panHandlers}
                  />
                </View>

                {/* Scale labels */}
                <View style={styles.scaleLabels}>
                  <Text style={styles.scaleLabel}>{MIN_AGE}</Text>
                  <Text style={styles.scaleLabel}>{MAX_AGE}</Text>
                </View>
              </View>

              {/* Info Box */}
              <View style={styles.infoBox}>
                <Text style={styles.infoText}>
                  You can always change this later in your profile settings.
                </Text>
              </View>

              <View style={styles.spacer} />

              {/* Next / Save Button */}
              {editMode ? (
                <TouchableOpacity style={styles.saveButton} onPress={handleNext}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                  <View style={styles.arrowContainer}>
                    <View style={styles.arrowLine} />
                    <View style={styles.arrowHead} />
                  </View>
                </TouchableOpacity>
              )}
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    marginLeft: -10,
  },
  backIcon: {
    fontSize: 36,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.6,
    marginBottom: 40,
  },
  ageDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    gap: 20,
  },
  ageValue: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
    minWidth: 70,
    textAlign: 'center',
  },
  ageInput: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
    minWidth: 70,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#FFFFFF',
    padding: 0,
  },
  ageSeparator: {
    fontSize: 32,
    color: '#FFFFFF',
    opacity: 0.5,
    fontWeight: '300',
  },
  tapHint: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.5,
    textAlign: 'center',
    marginBottom: 32,
  },
  sliderContainer: {
    paddingHorizontal: THUMB_SIZE / 2,
  },
  track: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    position: 'relative',
    justifyContent: 'center',
  },
  activeTrack: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    top: -(THUMB_SIZE - 6) / 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  scaleLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.5,
  },
  infoBox: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    marginTop: 32,
  },
  infoText: {
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
    textAlign: 'center',
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
  saveButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#C44CE0',
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
