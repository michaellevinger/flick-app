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

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
              // Go back to matches list
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

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % allPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + allPhotos.length) % allPhotos.length);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Photo Carousel */}
      <View style={styles.photoContainer}>
        {allPhotos.length > 0 ? (
          <>
            <Image
              source={{ uri: allPhotos[currentPhotoIndex] }}
              style={styles.photo}
              resizeMode="cover"
            />

            {/* Photo Navigation */}
            {allPhotos.length > 1 && (
              <>
                <TouchableOpacity
                  style={[styles.photoNav, styles.photoNavLeft]}
                  onPress={prevPhoto}
                >
                  <Text style={styles.photoNavText}>‹</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.photoNav, styles.photoNavRight]}
                  onPress={nextPhoto}
                >
                  <Text style={styles.photoNavText}>›</Text>
                </TouchableOpacity>

                {/* Photo Indicators */}
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
              </>
            )}

            {/* Gradient Overlay */}
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
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

      {/* Profile Info */}
      <SafeAreaView style={styles.infoContainer} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Name & Age */}
          <View style={styles.header}>
            <Text style={styles.name}>
              {user.name}, {user.age}
            </Text>
          </View>

          {/* Basic Info */}
          <View style={styles.infoSection}>
            {user.gender && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>
                  {user.gender === 'male'
                    ? 'Man'
                    : user.gender === 'female'
                    ? 'Woman'
                    : 'Nonbinary'}
                </Text>
              </View>
            )}

            {user.height && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Height</Text>
                <Text style={styles.infoValue}>{user.height} cm</Text>
              </View>
            )}

            {user.looking_for && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Looking for</Text>
                <Text style={styles.infoValue}>
                  {user.looking_for === 'male'
                    ? 'Men'
                    : user.looking_for === 'female'
                    ? 'Women'
                    : 'Everyone'}
                </Text>
              </View>
            )}

            {user.distance_meters !== undefined && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Distance</Text>
                <Text style={styles.infoValue}>
                  {user.distance_meters < 1000
                    ? `${Math.round(user.distance_meters)}m away`
                    : `${(user.distance_meters / 1000).toFixed(1)}km away`}
                </Text>
              </View>
            )}
          </View>

          {/* Bio */}
          {user.bio && (
            <View style={styles.bioSection}>
              <Text style={styles.bioLabel}>About</Text>
              <Text style={styles.bioText}>{user.bio}</Text>
            </View>
          )}

          {/* Action Buttons */}
          {isMatched ? (
            // Matched user - show Close button with Unmatch link
            <View style={styles.matchedActions}>
              <TouchableOpacity style={styles.closeButton} onPress={handlePass}>
                <LinearGradient
                  colors={['#FF6B9D', '#C44CE0']}
                  style={styles.closeButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.unmatchLink, { paddingBottom: insets.bottom + 20 }]}
                onPress={handleUnmatch}
              >
                <Text style={styles.unmatchLinkText}>Unmatch</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Not matched - show flick/pass buttons
            <View style={[styles.actions, { paddingBottom: insets.bottom + 20 }]}>
              <TouchableOpacity style={styles.passButton} onPress={handlePass}>
                <Text style={styles.passButtonText}>✕</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.flickButton} onPress={handleFlick}>
                <LinearGradient
                  colors={['#FF6B9D', '#C44CE0']}
                  style={styles.flickGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.flickButtonText}>♥</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
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
    height: SCREEN_WIDTH * 1.2,
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
  photoNav: {
    position: 'absolute',
    top: '50%',
    width: 50,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoNavLeft: {
    left: 0,
  },
  photoNavRight: {
    right: 0,
  },
  photoNavText: {
    fontSize: 48,
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    height: 100,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  infoContainer: {
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
    paddingBottom: 0,
  },
  header: {
    marginBottom: 24,
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  infoSection: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  infoLabel: {
    fontSize: 16,
    color: '#888888',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  bioSection: {
    marginBottom: 32,
  },
  bioLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  bioText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333333',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 24,
  },
  passButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#DDDDDD',
  },
  passButtonText: {
    fontSize: 32,
    color: '#888888',
  },
  flickButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    shadowColor: '#C44CE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  flickGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flickButtonText: {
    fontSize: 36,
    color: '#FFFFFF',
  },
  matchedActions: {
    paddingTop: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  closeButton: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#C44CE0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  closeButtonGradient: {
    width: '100%',
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  unmatchLink: {
    paddingTop: 16,
    paddingBottom: 20,
  },
  unmatchLinkText: {
    fontSize: 16,
    color: '#888888',
    textDecorationLine: 'underline',
  },
});
