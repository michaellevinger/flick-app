import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING } from '../constants/theme';

function formatEventDate(festival) {
  if (!festival?.start_date) return '';
  const date = new Date(festival.start_date);
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function EventBanner({ festival }) {
  if (!festival) return null;

  return (
    <View style={styles.eventCard}>
      <Text style={styles.eventName}>{festival.name}</Text>
      <Text style={styles.eventDate}>{formatEventDate(festival)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 20,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.9,
  },
});
