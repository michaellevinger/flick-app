import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { saveCustomizationDraft, getCustomization, validateCustomization } from '../lib/customization';
import ColorPicker from '../components/ColorPicker';
import CustomQuestionsEditor from '../components/CustomQuestionsEditor';

export default function CustomizeEventScreen({ navigation, route }) {
  const { festivalId } = route.params;

  // State
  const [primaryColor, setPrimaryColor] = useState('#C44CE0');
  const [secondaryColor, setSecondaryColor] = useState('#FF6B9D');
  const [customTitle, setCustomTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [customQuestions, setCustomQuestions] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load existing customization if any
  useEffect(() => {
    loadCustomization();
  }, [festivalId]);

  const loadCustomization = async () => {
    try {
      const data = await getCustomization(festivalId);
      if (data) {
        setPrimaryColor(data.primary_color || '#C44CE0');
        setSecondaryColor(data.secondary_color || '#FF6B9D');
        setCustomTitle(data.custom_title || '');
        setSubtitle(data.subtitle || '');
        setCustomQuestions(data.custom_questions || []);
      }
    } catch (error) {
      console.error('Failed to load customization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (isSaving) return;

    // Validate
    const customization = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      custom_title: customTitle.trim(),
      subtitle: subtitle.trim(),
      custom_questions: customQuestions,
    };

    const validation = validateCustomization(customization);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join('\n');
      Alert.alert('Validation Error', errorMessages);
      return;
    }

    setIsSaving(true);

    try {
      await saveCustomizationDraft(festivalId, customization);
      Alert.alert(
        'Saved!',
        'Your customization has been saved as a draft.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save customization:', error);
      Alert.alert('Error', 'Failed to save customization. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleContinue = async () => {
    if (isSaving) return;

    // Validate
    const customization = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      custom_title: customTitle.trim(),
      subtitle: subtitle.trim(),
      custom_questions: customQuestions,
    };

    const validation = validateCustomization(customization);
    if (!validation.isValid) {
      const errorMessages = Object.values(validation.errors).join('\n');
      Alert.alert('Validation Error', errorMessages);
      return;
    }

    setIsSaving(true);

    try {
      await saveCustomizationDraft(festivalId, customization);
      // For MVP, just go back after saving
      // In full version, this would navigate to PreviewEventScreen
      Alert.alert(
        'Customization Complete!',
        'Your event customization has been saved.',
        [
          {
            text: 'Done',
            onPress: () => navigation.navigate('EventSuccess', { festivalId }),
          },
        ]
      );
    } catch (error) {
      console.error('Failed to save customization:', error);
      Alert.alert('Error', 'Failed to save customization. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#FF6B9D', '#C44CE0', '#7B5EE3']}
        style={styles.loadingContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ActivityIndicator size="large" color={COLORS.white} />
        <Text style={styles.loadingText}>Loading customization...</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={['#FF6B9D', '#C44CE0', '#7B5EE3']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.inner}>
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Customize Your Event</Text>
                <Text style={styles.subtitle}>
                  Personalize colors, title, and icebreaker questions
                </Text>
              </View>

              {/* Content */}
              <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.formContainer}>
                  {/* Section 1: Theme Colors */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>🎨 Theme Colors</Text>
                    <ColorPicker
                      label="Primary Color"
                      selectedColor={primaryColor}
                      onColorChange={setPrimaryColor}
                    />
                    <ColorPicker
                      label="Secondary Color"
                      selectedColor={secondaryColor}
                      onColorChange={setSecondaryColor}
                    />
                    {/* Live Preview Gradient */}
                    <View style={styles.previewContainer}>
                      <Text style={styles.previewLabel}>Preview:</Text>
                      <LinearGradient
                        colors={[primaryColor, secondaryColor]}
                        style={styles.previewGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      />
                    </View>
                  </View>

                  {/* Section 2: Event Title */}
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>💝 Event Title</Text>
                    <Text style={styles.inputLabel}>Custom Title (Optional)</Text>
                    <TextInput
                      style={styles.input}
                      value={customTitle}
                      onChangeText={setCustomTitle}
                      placeholder="e.g., Daniel & Maya's Wedding"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      maxLength={50}
                    />
                    <Text style={styles.charCounter}>{customTitle.length}/50</Text>

                    <Text style={[styles.inputLabel, { marginTop: SPACING.md }]}>
                      Subtitle (Optional)
                    </Text>
                    <TextInput
                      style={styles.input}
                      value={subtitle}
                      onChangeText={setSubtitle}
                      placeholder="e.g., June 15, 2026 • Napa Valley"
                      placeholderTextColor="rgba(255, 255, 255, 0.5)"
                      maxLength={100}
                    />
                    <Text style={styles.charCounter}>{subtitle.length}/100</Text>
                  </View>

                  {/* Section 3: Custom Questions */}
                  <View style={styles.section}>
                    <CustomQuestionsEditor
                      questions={customQuestions}
                      onQuestionsChange={setCustomQuestions}
                      maxQuestions={10}
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons */}
              <View style={styles.actionsContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.draftButton]}
                  onPress={handleSaveDraft}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={COLORS.black} />
                  ) : (
                    <Text style={styles.draftButtonText}>Save Draft</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.continueButton]}
                  onPress={handleContinue}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color={COLORS.white} />
                  ) : (
                    <Text style={styles.continueButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  inner: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    marginTop: SPACING.md,
    ...TYPOGRAPHY.body,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xl,
  },
  formContainer: {
    paddingHorizontal: SPACING.lg,
  },
  section: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    backgroundColor: COLORS.white,
  },
  charCounter: {
    ...TYPOGRAPHY.small,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  previewContainer: {
    marginTop: SPACING.md,
  },
  previewLabel: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  previewGradient: {
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  actionsContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  button: {
    flex: 1,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  draftButton: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.purple,
  },
  draftButtonText: {
    color: COLORS.purple,
    fontWeight: 'bold',
    fontSize: 16,
  },
  continueButton: {
    backgroundColor: COLORS.purple,
  },
  continueButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
