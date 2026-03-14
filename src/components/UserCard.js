import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING } from '../constants/theme';

/**
 * Displays a single user card with profile info, flick button, and carousel navigation.
 *
 * Props:
 *   user          - User object to display
 *   isFlicked     - Whether current user has already flicked this person
 *   hasFlickedMe  - Whether this person has flicked the current user
 *   onFlick       - Called when the Flick button is pressed
 *   onViewProfile - Called when the profile photo is tapped
 *   onPrev        - Navigate to previous user in carousel
 *   onNext        - Navigate to next user in carousel
 *   currentIndex  - Current position in the user list (0-based)
 *   totalCount    - Total number of users in the list
 */
export default function UserCard({
  user,
  isFlicked,
  hasFlickedMe,
  onFlick,
  onViewProfile,
  onPrev,
  onNext,
  currentIndex,
  totalCount,
}) {
  return (
    <View style={styles.container}>
      <View style={[styles.card, hasFlickedMe && styles.cardInterested]}>
        <TouchableOpacity style={styles.photoContainer} onPress={onViewProfile}>
          <Image
            source={{ uri: user.selfieUrl || user.selfie_url }}
            style={styles.photo}
            resizeMode="cover"
          />
          {hasFlickedMe && (
            <View style={styles.interestedBadge}>
              <Text style={styles.interestedBadgeText}>♥</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={styles.name}>
            {user.name}, {user.age}
          </Text>
          <Text style={styles.distance}>
            {user.distance_meters ? `${user.distance_meters}m away` : 'Nearby'}
          </Text>
          {hasFlickedMe && <Text style={styles.interestedLabel}>Wants to meet you! 💫</Text>}
        </View>

        <LinearGradient
          colors={isFlicked ? [COLORS.grayFlicked, COLORS.grayFlickedDark] : [COLORS.purple, COLORS.pink]}
          style={styles.flickButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <TouchableOpacity style={styles.flickButtonInner} onPress={() => onFlick(user)}>
            <Text style={styles.flickButtonText}>{isFlicked ? 'Flicked ✓' : 'Flick'}</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {totalCount > 1 && (
        <View style={styles.navigation}>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === 0 && styles.navButtonDisabled]}
            onPress={onPrev}
            disabled={currentIndex === 0}
          >
            <Text style={styles.navButtonText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.navCounter}>
            {currentIndex + 1} / {totalCount}
          </Text>
          <TouchableOpacity
            style={[styles.navButton, currentIndex === totalCount - 1 && styles.navButtonDisabled]}
            onPress={onNext}
            disabled={currentIndex === totalCount - 1}
          >
            <Text style={styles.navButtonText}>→</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  cardInterested: {
    borderWidth: 3,
    borderColor: COLORS.pink,
    shadowColor: COLORS.pink,
    shadowOpacity: 0.3,
  },
  photoContainer: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  interestedBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.pink,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  interestedBadgeText: {
    fontSize: 24,
    color: COLORS.white,
  },
  info: {
    marginBottom: SPACING.md,
  },
  name: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: 4,
  },
  distance: {
    fontSize: 16,
    color: COLORS.grayMedium,
    marginBottom: 4,
  },
  interestedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.pink,
    marginTop: 4,
  },
  flickButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  flickButtonInner: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flickButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.lg,
    gap: 50,
  },
  navButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  navButtonDisabled: {
    opacity: 0.4,
  },
  navButtonText: {
    fontSize: 28,
    color: COLORS.purple,
    fontWeight: 'bold',
  },
  navCounter: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
  },
});
