import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

/**
 * ColorPicker Component
 * Allows users to select colors from presets or enter custom hex codes
 *
 * @param {Object} props
 * @param {string} props.selectedColor - Currently selected color (hex)
 * @param {function} props.onColorChange - Callback when color changes
 * @param {string} props.label - Label for the color picker
 * @param {Array} props.presetColors - Array of preset hex colors
 */
export default function ColorPicker({
  selectedColor,
  onColorChange,
  label = 'Color',
  presetColors = ['#C44CE0', '#FF6B9D', '#00FF00', '#4A90E2', '#E94B3C', '#F39C12', '#8E44AD', '#16A085']
}) {
  const [hexInput, setHexInput] = useState(selectedColor || '#C44CE0');

  const handlePresetSelect = (color) => {
    setHexInput(color);
    onColorChange(color);
  };

  const handleHexInput = (text) => {
    // Auto-add # if not present
    let formattedText = text;
    if (!text.startsWith('#')) {
      formattedText = '#' + text;
    }

    setHexInput(formattedText);

    // Validate hex format before calling onChange
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(formattedText)) {
      onColorChange(formattedText);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      {/* Preset Color Swatches */}
      <View style={styles.presetsContainer}>
        {presetColors.map((color) => (
          <TouchableOpacity
            key={color}
            style={[
              styles.colorSwatch,
              { backgroundColor: color },
              selectedColor === color && styles.selectedSwatch
            ]}
            onPress={() => handlePresetSelect(color)}
          >
            {selectedColor === color && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Hex Input */}
      <View style={styles.hexInputContainer}>
        <Text style={styles.hexLabel}>Hex Code:</Text>
        <TextInput
          style={styles.hexInput}
          value={hexInput}
          onChangeText={handleHexInput}
          placeholder="#C44CE0"
          placeholderTextColor={COLORS.gray}
          maxLength={7}
          autoCapitalize="characters"
        />
        <View style={[styles.previewCircle, { backgroundColor: selectedColor }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedSwatch: {
    borderColor: COLORS.black,
    borderWidth: 3,
  },
  checkmark: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hexInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  hexLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
  hexInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: COLORS.gray,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    ...TYPOGRAPHY.body,
    color: COLORS.black,
  },
  previewCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
});
