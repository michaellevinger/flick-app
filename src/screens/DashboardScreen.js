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
  const [hiddenUsers, setHiddenUsers] = useState(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [currentFestival, setCurrentFestival] = useState(null);
  const [countdown, setCountdown] = useState('');
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
      const users = await findUsersInFestival(user.festival_id, user.id);
      const filteredUsers = users.filter(u => u.id !== user.id);

      console.log('Current user ID:', user.id);
      console.log('Festival:', user.festival_id);
      console.log('Users in festival:', filteredUsers.length);

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

    const canInitiateFlick = !(
      user.gender === 'male' &&
      user.lookingFor === 'female' &&
      targetUser.gender === 'female' &&
      !theyFlickdMe
    );

    if (!canInitiateFlick && !iFlickdThem) {
      Alert.alert(
        'Cannot Initiate',
        'Based on your preferences, you cannot send the first flick. Wait for them to flick you first.'
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
        const matchedUser = await getMatchedUserInfo(targetUser.id);
        navigation.navigate('GreenLight', { matchedUser });
      } else {
        const isMutual = await checkMutualMatch(user.id, targetUser.id);

        if (isMutual) {
          const matchedUser = await getMatchedUserInfo(targetUser.id);
          navigation.navigate('GreenLight', { matchedUser });
        }
      }
    } catch (error) {
      console.error('Error sending flick:', error);
      Alert.alert('Error', 'Failed to send flick. Please try again.');
    }
  };

  const renderUserCard = ({ item: nearbyUser }) => {
    const theyFlickdMe = usersWhoFlickedMe.has(nearbyUser.id);
    const iFlickdThem = flickedUsers.has(nearbyUser.id);

    return (
      <TouchableOpacity
        style={[
          styles.gridCard,
          theyFlickdMe && styles.gridCardInterested,
        ]}
        onPress={() => navigation.navigate('UserProfile', {
          user: nearbyUser,
          onFlick: handleFlick,
        })}
        onLongPress={() => setSelectedPhoto(nearbyUser.selfie_url)}
        activeOpacity={0.8}
      >
        {nearbyUser.selfie_url ? (
          <Image
            source={{ uri: nearbyUser.selfie_url }}
            style={styles.gridPhoto}
          />
        ) : (
          <View style={styles.gridPhotoPlaceholder}>
            <Text style={styles.placeholderText}>?</Text>
          </View>
        )}

        {/* Gradient overlay for name visibility */}
        <View style={styles.nameOverlay}>
          <Text style={styles.gridName} numberOfLines={1}>
            {nearbyUser.name}
          </Text>
        </View>

        {/* Flicked indicator */}
        {iFlickdThem && (
          <View style={styles.flickedBadge}>
            <Text style={styles.flickedBadgeText}>✓</Text>
          </View>
        )}

        {/* They flicked me indicator */}
        {theyFlickdMe && !iFlickdThem && (
          <View style={styles.interestedBadge}>
            <Text style={styles.interestedBadgeText}>♥</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (!user) {
    return null;
  }

  const visibleUsers = nearbyUsers.filter((u) => !hiddenUsers.has(u.id));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>♥ flick</Text>
      </View>

      {/* Title Section */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>
          {currentFestival ? `Singles at ${currentFestival.name}` : 'Discover'}
        </Text>
        {countdown ? (
          <Text style={styles.subtitle}>Everything expires in {countdown}</Text>
        ) : (
          <Text style={styles.subtitle}>{visibleUsers.length} people nearby</Text>
        )}
      </View>

      {/* Grid */}
      <FlatList
        data={visibleUsers}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.gridContainer}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#C44CE0"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateEmoji}>👀</Text>
            <Text style={styles.emptyStateText}>No one here yet</Text>
            <Text style={styles.emptyStateSubtext}>Pull down to refresh</Text>
          </View>
        }
      />

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    paddingHorizontal: GRID_PADDING,
    paddingTop: 8,
    paddingBottom: 8,
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#C44CE0',
  },
  titleSection: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: '#888888',
  },
  gridContainer: {
    paddingHorizontal: GRID_PADDING,
    paddingBottom: 80,
  },
  gridRow: {
    justifyContent: 'flex-start',
    gap: CARD_GAP,
    marginBottom: CARD_GAP,
  },
  gridCard: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 1.3,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
  },
  gridCardInterested: {
    borderWidth: 3,
    borderColor: '#FF6B9D',
    shadowColor: '#FF6B9D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridPhotoPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#CCCCCC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
    color: '#888888',
  },
  nameOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  gridName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  flickedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C44CE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flickedBadgeText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  interestedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF4466',
    justifyContent: 'center',
    alignItems: 'center',
  },
  interestedBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#888888',
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
