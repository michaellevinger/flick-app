import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { PRESET_QUESTIONS } from '../lib/customization';

/**
 * CustomQuestionsEditor Component
 * Allows users to select preset questions and add custom ones
 *
 * @param {Object} props
 * @param {Array} props.questions - Array of selected questions
 * @param {function} props.onQuestionsChange - Callback when questions change
 * @param {number} props.maxQuestions - Maximum number of questions allowed
 */
export default function CustomQuestionsEditor({
  questions = [],
  onQuestionsChange,
  maxQuestions = 10
}) {
  const [customQuestionText, setCustomQuestionText] = useState('');

  const isPresetSelected = (presetId) => {
    return questions.some(q => q.id === presetId);
  };

  const togglePresetQuestion = (preset) => {
    if (isPresetSelected(preset.id)) {
      // Remove preset
      const updated = questions.filter(q => q.id !== preset.id);
      onQuestionsChange(updated);
    } else {
      // Add preset
      if (questions.length >= maxQuestions) {
        Alert.alert('Maximum Reached', `You can add up to ${maxQuestions} questions.`);
        return;
      }
      onQuestionsChange([...questions, preset]);
    }
  };

  const addCustomQuestion = () => {
    if (!customQuestionText.trim()) {
      Alert.alert('Empty Question', 'Please enter a question before adding.');
      return;
    }

    if (customQuestionText.length > 100) {
      Alert.alert('Too Long', 'Questions must be 100 characters or less.');
      return;
    }

    if (questions.length >= maxQuestions) {
      Alert.alert('Maximum Reached', `You can add up to ${maxQuestions} questions.`);
      return;
    }

    const newQuestion = {
      id: `custom_${Date.now()}`,
      text: customQuestionText.trim(),
      type: 'custom',
      icon: '💬'
    };

    onQuestionsChange([...questions, newQuestion]);
    setCustomQuestionText('');
  };

  const removeQuestion = (questionId) => {
    const updated = questions.filter(q => q.id !== questionId);
    onQuestionsChange(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Icebreaker Questions</Text>
      <Text style={styles.subtitle}>
        Choose from pre-made questions or create your own ({questions.length}/{maxQuestions})
      </Text>

      {/* Preset Questions */}
      <View style={styles.presetsSection}>
        <Text style={styles.label}>Pre-made Questions</Text>
        <View style={styles.presetGrid}>
          {PRESET_QUESTIONS.map((preset) => (
            <TouchableOpacity
              key={preset.id}
              style={[
                styles.presetButton,
                isPresetSelected(preset.id) && styles.presetButtonSelected
              ]}
              onPress={() => togglePresetQuestion(preset)}
            >
              <Text style={styles.presetIcon}>{preset.icon}</Text>
              <Text
                style={[
                  styles.presetText,
                  isPresetSelected(preset.id) && styles.presetTextSelected
                ]}
                numberOfLines={2}
              >
                {preset.text}
              </Text>
              {isPresetSelected(preset.id) && (
                <View style={styles.checkBadge}>
                  <Text style={styles.checkIcon}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Custom Question Input */}
      <View style={styles.customSection}>
        <Text style={styles.label}>Add Custom Question</Text>
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            value={customQuestionText}
            onChangeText={setCustomQuestionText}
            placeholder="e.g., Let's take a photo together"
            placeholderTextColor={COLORS.gray}
            maxLength={100}
            multiline
          />
          <TouchableOpacity style={styles.addButton} onPress={addCustomQuestion}>
            <Text style={styles.addButtonText}>Add</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.charCounter}>
          {customQuestionText.length}/100 characters
        </Text>
      </View>

      {/* Selected Questions List */}
      {questions.length > 0 && (
        <View style={styles.selectedSection}>
          <Text style={styles.label}>Selected Questions</Text>
          <ScrollView style={styles.selectedList} nestedScrollEnabled>
            {questions.map((question) => (
              <View key={question.id} style={styles.selectedItem}>
                <Text style={styles.selectedIcon}>{question.icon}</Text>
                <Text style={styles.selectedText} numberOfLines={2}>
                  {question.text}
                </Text>
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => removeQuestion(question.id)}
                >
                  <Text style={styles.removeIcon}>×</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.small,
    color: COLORS.gray,
    marginBottom: SPACING.md,
  },
  presetsSection: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  presetButton: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.grayLight,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    position: 'relative',
  },
  presetButtonSelected: {
    borderColor: COLORS.purple,
    backgroundColor: '#F3E5F5',
  },
  presetIcon: {
    fontSize: 24,
    marginBottom: SPACING.xs,
  },
  presetText: {
    ...TYPOGRAPHY.small,
    color: COLORS.black,
    textAlign: 'center',
  },
  presetTextSelected: {
    fontWeight: '600',
    color: COLORS.purple,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIcon: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  customSection: {
    marginBottom: SPACING.lg,
  },
  customInputContainer: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  customInput: {
    flex: 1,
    minHeight: 60,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    textAlignVertical: 'top',
  },
  addButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 70,
  },
  addButtonText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 16,
  },
  charCounter: {
    ...TYPOGRAPHY.small,
    color: COLORS.gray,
    marginTop: SPACING.xs,
    textAlign: 'right',
  },
  selectedSection: {
    marginBottom: SPACING.md,
  },
  selectedList: {
    maxHeight: 200,
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: 8,
    backgroundColor: COLORS.grayLight,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  selectedIcon: {
    fontSize: 20,
  },
  selectedText: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.black,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeIcon: {
    fontSize: 24,
    color: COLORS.gray,
    lineHeight: 24,
  },
});
