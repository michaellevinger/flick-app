import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  FlatList,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';
import { findNearbyUsers, subscribeToNearbyUsers, getCurrentFestival, findUsersInFestival } from '../lib/database';
import { requestLocationPermission, formatDistance } from '../lib/location';
import {
  sendFlick,
  checkMutualMatch,
  subscribeToFlicks,
  getMatchedUserInfo,
  getFlicksSentByUser,
  getFlicksForUser,
  deleteFlick,
  createMatch,
} from '../lib/flicks';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_PADDING = 16;
const CARD_GAP = 8;
const CARD_WIDTH = (SCREEN_WIDTH - (GRID_PADDING * 2) - (CARD_GAP * 2)) / 3;

export default function DashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateLocation } = useUser();
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flickedUsers, setFlickdUsers] = useState(new Set());
  const [usersWhoFlickedMe, setUsersWhoFlickdMe] = useState(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentFestival, setCurrentFestival] = useState(null);
  const [countdown, setCountdown] = useState('');
  const [currentUserIndex, setCurrentUserIndex] = useState(0);
  const subscriptionRef = useRef(null);
  const flickSubscriptionRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigation.replace('Welcome');
      return;
    }

    initializeLocation();
    setupRealtimeSubscription();
    setupFlickSubscription();
    loadFlicksSent();
    loadFlicksReceived();
    loadCurrentFestival();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (flickSubscriptionRef.current) {
        flickSubscriptionRef.current.unsubscribe();
      }
    };
  }, [user]);

  useEffect(() => {
    if (user?.status && user?.location) {
      loadNearbyUsers();
    } else {
      setNearbyUsers([]);
    }
  }, [user?.status, user?.location]);

  // Countdown timer effect
  useEffect(() => {
    if (!currentFestival?.ends_at) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(currentFestival.ends_at);
      const diff = end - now;

      if (diff <= 0) {
        setCountdown('Event ended');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours}h:${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [currentFestival?.ends_at]);

  // Validate festival on mount - redirect if festival doesn't exist
  useEffect(() => {
    const validateFestival = async () => {
      // Only validate if user has a festival_id but currentFestival failed to load
      if (user?.festival_id && currentFestival === null) {
        // Give it a moment to load (avoid false positives on initial render)
        const timeoutId = setTimeout(async () => {
          try {
            const festival = await getCurrentFestival(user.id);

            if (!festival) {
              Alert.alert(
                'Event Not Found',
                'This event is no longer available. Please scan a new QR code to join an event.',
                [
                  {
                    text: 'Scan QR Code',
                    onPress: () => navigation.replace('QRScanner'),
                  },
                ],
                { cancelable: false }
              );
            }
          } catch (error) {
            console.error('Error validating festival:', error);
          }
        }, 2000); // Wait 2 seconds for initial load

        return () => clearTimeout(timeoutId);
      }
    };

    validateFestival();
  }, [user?.festival_id, currentFestival]);

  const initializeLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Location Required',
        'flick needs your location to show you people nearby. Please enable location access in settings.'
      );
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    subscriptionRef.current = subscribeToNearbyUsers(user.id, () => {
      if (user.status && user.location) {
        loadNearbyUsers();
      }
    });
  };

  const setupFlickSubscription = () => {
    if (!user) return;

    flickSubscriptionRef.current = subscribeToFlicks(user.id, async (flick) => {
      await loadFlicksReceived();

      const isMutual = await checkMutualMatch(user.id, flick.from_user_id);

      if (isMutual) {
        // Create match immediately
        await createMatch(user.id, flick.from_user_id);

        const matchedUser = await getMatchedUserInfo(flick.from_user_id);
        navigation.navigate('GreenLight', { matchedUser });
      }
    });
  };

  const loadFlicksSent = async () => {
    if (!user) return;

    try {
      const sentFlicks = await getFlicksSentByUser(user.id);
      const flickdUserIds = new Set(sentFlicks.map((n) => n.to_user_id));
      setFlickdUsers(flickdUserIds);
    } catch (error) {
      console.error('Error loading sent flicks:', error);
    }
  };

  const loadFlicksReceived = async () => {
    if (!user) return;

    try {
      const receivedFlicks = await getFlicksForUser(user.id);
      const userIdsWhoFlickdMe = new Set(receivedFlicks.map((n) => n.from_user_id));
      setUsersWhoFlickdMe(userIdsWhoFlickdMe);
    } catch (error) {
      console.error('Error loading received flicks:', error);
    }
  };

  const loadCurrentFestival = async () => {
    if (!user) return;

    try {
      const festival = await getCurrentFestival(user.id);
      setCurrentFestival(festival);
    } catch (error) {
      console.error('Error loading current festival:', error);
    }
  };

  const loadNearbyUsers = async () => {
    if (!user?.festival_id) {
      console.log('User has not joined a festival yet');
      setNearbyUsers([]);
      return;
    }

    try {
      // Log user's location for creating test profiles
      if (user.location) {
        let lat, lng;

        // Check if location is a string (PostGIS format) or object
        if (typeof user.location === 'string') {
          const match = user.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
          if (match) {
            lng = parseFloat(match[1]);
            lat = parseFloat(match[2]);
          }
        } else if (user.location.latitude && user.location.longitude) {
          // Location is an object
          lat = user.location.latitude;
          lng = user.location.longitude;
        }

        if (lat && lng) {
          console.log('📍 YOUR LOCATION:', lat, lng);
          console.log('🎪 YOUR FESTIVAL:', user.festival_id || 'none');
          console.log('💡 To create test profiles near you, run:');
          if (user.festival_id) {
            console.log(`   node create-test-profiles-nearby.js ${lat} ${lng} 5 ${user.festival_id}`);
          } else {
            console.log(`   node create-test-profiles-nearby.js ${lat} ${lng} 5`);
          }
        }
      }

      const users = await findUsersInFestival(
        user.festival_id,
        user.id,
        user.gender,
        user.lookingFor
      );
      const filteredUsers = users.filter(u => u.id !== user.id);

      console.log('Current user ID:', user.id);
      console.log('Festival:', user.festival_id);
      console.log('Gender:', user.gender, '| Looking for:', user.lookingFor);
      console.log('Compatible users in festival:', filteredUsers.length);

      setNearbyUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading festival users:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await updateLocation();
      await loadNearbyUsers();
      await loadFlicksReceived();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleFlick = async (targetUser) => {
    if (!user) return;

    const iFlickdThem = flickedUsers.has(targetUser.id);
    const theyFlickdMe = usersWhoFlickedMe.has(targetUser.id);

    // Gender-based flick rules:
    // - Females can always initiate
    // - Non-binary can always initiate
    // - Gay/lesbian/queer matches (same-gender or involving non-binary) can initiate
    // - Straight males CANNOT initiate first (must wait for female to flick)
    const isStraightMale = user.gender === 'male' && user.lookingFor === 'female';
    const targetIsFemale = targetUser.gender === 'female';
    const isStraightMatch = isStraightMale && targetIsFemale;

    const canInitiateFlick = !isStraightMatch || theyFlickdMe;

    if (!canInitiateFlick && !iFlickdThem) {
      Alert.alert(
        'Ladies First 💃',
        'In straight matches, women make the first move. Wait for her to flick you first!',
        [{ text: 'Got it' }]
      );
      return;
    }

    if (iFlickdThem) {
      try {
        await deleteFlick(user.id, targetUser.id);
        setFlickdUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(targetUser.id);
          return newSet;
        });
      } catch (error) {
        console.error('Error unflicking:', error);
        Alert.alert('Error', 'Failed to unflick. Please try again.');
      }
      return;
    }

    try {
      const result = await sendFlick(user.id, targetUser.id);

      if (result.alreadyFlicked) {
        Alert.alert('Already Flicked', `You've already flicked them!`);
        return;
      }

      setFlickdUsers((prev) => new Set([...prev, targetUser.id]));

      if (theyFlickdMe) {
        // Create match immediately
        await createMatch(user.id, targetUser.id);

        const matchedUser = await getMatchedUserInfo(targetUser.id);
        navigation.navigate('GreenLight', { matchedUser });
      } else {
        const isMutual = await checkMutualMatch(user.id, targetUser.id);

        if (isMutual) {
          // Create match immediately
          await createMatch(user.id, targetUser.id);

          const matchedUser = await getMatchedUserInfo(targetUser.id);
          navigation.navigate('GreenLight', { matchedUser });
        }
      }
    } catch (error) {
      console.error('Error sending flick:', error);
      Alert.alert('Error', 'Failed to send flick. Please try again.');
    }
  };

  if (!user) {
    return null;
  }

  const currentUser = nearbyUsers[currentUserIndex];

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => navigation.replace('Welcome') },
      ]
    );
  };

  const handlePrevUser = () => {
    if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
    }
  };

  const handleNextUser = () => {
    if (currentUserIndex < nearbyUsers.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
    }
  };

  const formatEventDate = () => {
    if (!currentFestival?.start_date) return '';
    const date = new Date(currentFestival.start_date);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // Reset index when users list changes
  useEffect(() => {
    if (currentUserIndex >= nearbyUsers.length) {
      setCurrentUserIndex(Math.max(0, nearbyUsers.length - 1));
    }
  }, [nearbyUsers.length]);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#C44CE0', '#FF6B9D']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>flick</Text>
            <TouchableOpacity onPress={handleSignOut}>
              <Text style={styles.signOutButton}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {/* Event Card */}
          {currentFestival && (
            <View style={styles.eventCard}>
              <Text style={styles.eventName}>{currentFestival.name}</Text>
              <Text style={styles.eventDate}>{formatEventDate()}</Text>
            </View>
          )}

          {/* Profile Card */}
          {currentUser ? (
            <View style={styles.profileCardContainer}>
              <View style={[
                styles.profileCard,
                usersWhoFlickedMe.has(currentUser.id) && styles.profileCardInterested
              ]}>
                <TouchableOpacity
                  style={styles.profileImageContainer}
                  onPress={() => navigation.navigate('UserProfile', { userId: currentUser.id })}
                >
                  <Image
                    source={{ uri: currentUser.selfieUrl || currentUser.selfie_url }}
                    style={styles.profileImage}
                    resizeMode="cover"
                  />
                  {usersWhoFlickedMe.has(currentUser.id) && (
                    <View style={styles.interestedBadge}>
                      <Text style={styles.interestedBadgeText}>♥</Text>
                    </View>
                  )}
                </TouchableOpacity>

                <View style={styles.profileInfo}>
                  <Text style={styles.profileName}>
                    {currentUser.name}, {currentUser.age}
                  </Text>
                  <Text style={styles.profileDistance}>
                    {currentUser.distance_meters ? `${currentUser.distance_meters}m away` : 'Nearby'}
                  </Text>
                  {usersWhoFlickedMe.has(currentUser.id) && (
                    <Text style={styles.interestedLabel}>Wants to meet you! 💫</Text>
                  )}
                </View>

                <LinearGradient
                  colors={flickedUsers.has(currentUser.id) ? ['#9CA3AF', '#6B7280'] : ['#C44CE0', '#FF6B9D']}
                  style={styles.flickButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <TouchableOpacity
                    style={styles.flickButtonInner}
                    onPress={() => handleFlick(currentUser)}
                  >
                    <Text style={styles.flickButtonText}>
                      {flickedUsers.has(currentUser.id) ? 'Flicked ✓' : 'Flick'}
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>

              {/* Navigation Arrows */}
              {nearbyUsers.length > 1 && (
                <View style={styles.navigation}>
                  <TouchableOpacity
                    style={[styles.navButton, currentUserIndex === 0 && styles.navButtonDisabled]}
                    onPress={handlePrevUser}
                    disabled={currentUserIndex === 0}
                  >
                    <Text style={styles.navButtonText}>←</Text>
                  </TouchableOpacity>
                  <Text style={styles.navCounter}>
                    {currentUserIndex + 1} / {nearbyUsers.length}
                  </Text>
                  <TouchableOpacity
                    style={[styles.navButton, currentUserIndex === nearbyUsers.length - 1 && styles.navButtonDisabled]}
                    onPress={handleNextUser}
                    disabled={currentUserIndex === nearbyUsers.length - 1}
                  >
                    <Text style={styles.navButtonText}>→</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateEmoji}>👀</Text>
              <Text style={styles.emptyStateText}>No one here yet</Text>
              <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
                <Text style={styles.refreshButtonText}>Refresh</Text>
              </TouchableOpacity>
            </View>
          )}

        </SafeAreaView>
      </LinearGradient>

      {/* Full-Screen Photo Modal */}
      <Modal
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhoto(null)}
      >
        <TouchableOpacity
          style={styles.photoModalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPhoto(null)}
        >
          <Image
            source={{ uri: selectedPhoto }}
            style={styles.photoModalImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  signOutButton: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  eventName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  profileCardContainer: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileCardInterested: {
    borderWidth: 3,
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOpacity: 0.3,
  },
  profileImageContainer: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  interestedBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B9D',
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
    color: '#FFFFFF',
  },
  profileInfo: {
    marginBottom: 16,
  },
  profileName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 4,
  },
  profileDistance: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 4,
  },
  interestedLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B9D',
    marginTop: 4,
  },
  flickButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  flickButtonInner: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flickButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
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
    color: '#C44CE0',
    fontWeight: 'bold',
  },
  navCounter: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  refreshButton: {
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#C44CE0',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoModalImage: {
    width: '100%',
    height: '100%',
  },
});
