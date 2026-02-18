import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { unmatchUser } from '../lib/flicks';
import { useUser } from '../lib/userContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function UserProfileScreen({ route, navigation }) {
  const { user, onFlick } = route.params;
  const { user: currentUser } = useUser();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const insets = useSafeAreaInsets();

  // Check if this is a matched user (viewing from chat)
  const isMatched = onFlick === null || onFlick === undefined;

  // Combine selfie and additional photos
  const allPhotos = user.selfie_url
    ? [user.selfie_url, ...(user.photos || [])]
    : user.photos || [];

  const handleFlick = () => {
    if (onFlick) {
      onFlick(user);
    }
    navigation.goBack();
  };

  const handlePass = () => {
    navigation.goBack();
  };

  const handleUnmatch = () => {
    Alert.alert(
      'Unmatch?',
      "You won't be able to see or message one another.",
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Unmatch',
          style: 'destructive',
          onPress: async () => {
            try {
              await unmatchUser(currentUser.id, user.id);
              navigation.navigate('MatchesTab');
            } catch (error) {
              console.error('Error unmatching:', error);
              Alert.alert('Error', 'Failed to unmatch. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Alert.alert(
      'Report User',
      'Why are you reporting this person?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Inappropriate Photos', onPress: () => console.log('Report: Inappropriate') },
        { text: 'Spam/Scam', onPress: () => console.log('Report: Spam') },
        { text: 'Other', onPress: () => console.log('Report: Other') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Large Photo */}
      <View style={styles.photoContainer}>
        {allPhotos.length > 0 ? (
          <>
            <Image
              source={{ uri: allPhotos[currentPhotoIndex] }}
              style={styles.photo}
              resizeMode="cover"
            />

            {/* Photo Indicators */}
            {allPhotos.length > 1 && (
              <View style={styles.photoIndicators}>
                {allPhotos.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.indicator,
                      index === currentPhotoIndex && styles.indicatorActive,
                    ]}
                  />
                ))}
              </View>
            )}

            {/* Gradient Overlay at bottom */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.6)']}
              style={styles.photoGradient}
            />
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Text style={styles.placeholderText}>No Photo</Text>
          </View>
        )}

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handlePass}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Profile Info Card - Compact */}
      <SafeAreaView style={styles.infoCard} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name, Age & Distance */}
          <View style={styles.nameSection}>
            <Text style={styles.nameText}>
              {user.name}, {user.age}
            </Text>
            {user.distance_meters !== undefined && (
              <Text style={styles.distanceText}>
                {user.distance_meters < 1000
                  ? `${Math.round(user.distance_meters)}m away`
                  : `${(user.distance_meters / 1000).toFixed(1)}km away`}
              </Text>
            )}
          </View>

          {/* Action Buttons - Right Below Name */}
          {!isMatched && (
            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.passButton} onPress={handlePass}>
                <Text style={styles.passIcon}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.likeButton} onPress={handleFlick}>
                <LinearGradient
                  colors={['#FF6B9D', '#C44CE0']}
                  style={styles.likeGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.likeIcon}>♥</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* About Me Section */}
          {user.bio && (
            <View style={styles.aboutSection}>
              <Text style={styles.aboutTitle}>About Me</Text>
              <Text style={styles.aboutText}>{user.bio}</Text>
            </View>
          )}

          {/* Additional Info (Compact) */}
          <View style={styles.infoGrid}>
            {user.height && (
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>📏</Text>
                <Text style={styles.infoText}>{user.height} cm</Text>
              </View>
            )}
            {user.gender && (
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>👤</Text>
                <Text style={styles.infoText}>
                  {user.gender === 'male' ? 'Man' : user.gender === 'female' ? 'Woman' : 'Nonbinary'}
                </Text>
              </View>
            )}
            {user.looking_for && (
              <View style={styles.infoItem}>
                <Text style={styles.infoIcon}>💭</Text>
                <Text style={styles.infoText}>
                  Looking for {user.looking_for === 'male' ? 'men' : user.looking_for === 'female' ? 'women' : 'everyone'}
                </Text>
              </View>
            )}
          </View>

          {/* Matched User Actions */}
          {isMatched && (
            <View style={styles.matchedSection}>
              <TouchableOpacity style={styles.unmatchButton} onPress={handleUnmatch}>
                <Text style={styles.unmatchText}>Unmatch</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Report Link */}
          <TouchableOpacity style={styles.reportLink} onPress={handleReport}>
            <Text style={styles.reportText}>Report User</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  photoContainer: {
    height: SCREEN_HEIGHT * 0.65, // 65% of screen height
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 20,
    color: '#888888',
  },
  photoIndicators: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  indicatorActive: {
    backgroundColor: '#FFFFFF',
    width: 24,
  },
  photoGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 26,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  nameSection: {
    marginBottom: 16,
  },
  nameText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 16,
    color: '#666666',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
    marginTop: 8,
  },
  passButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  passIcon: {
    fontSize: 28,
    color: '#888888',
  },
  likeButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#C44CE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  likeGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  likeIcon: {
    fontSize: 32,
    color: '#FFFFFF',
  },
  aboutSection: {
    marginBottom: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  aboutText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#333333',
  },
  infoGrid: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  infoText: {
    fontSize: 15,
    color: '#666666',
  },
  matchedSection: {
    marginTop: 8,
    marginBottom: 16,
  },
  unmatchButton: {
    padding: 16,
    alignItems: 'center',
  },
  unmatchText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  reportLink: {
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  reportText: {
    fontSize: 14,
    color: '#999999',
    textDecorationLine: 'underline',
  },
});
