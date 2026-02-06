import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Modal,
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, SPACING, TYPOGRAPHY, PROXIMITY_RADIUS } from '../constants/theme';
import { useUser } from '../lib/userContext';
import { findNearbyUsers, subscribeToNearbyUsers } from '../lib/database';
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

export default function DashboardScreen({ navigation }) {
  const { user, toggleStatus, updateLocation, logout } = useUser();
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [flickedUsers, setFlickdUsers] = useState(new Set());
  const [usersWhoFlickedMe, setUsersWhoFlickdMe] = useState(new Set());
  const [hiddenUsers, setHiddenUsers] = useState(new Set());
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const subscriptionRef = useRef(null);
  const flickSubscriptionRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigation.replace('Camera');
      return;
    }

    initializeLocation();
    setupRealtimeSubscription();
    setupFlickSubscription();
    loadFlicksSent();
    loadFlicksReceived();

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

  const initializeLocation = async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) {
      Alert.alert(
        'Location Required',
        'SPOT needs your location to show you people nearby. Please enable location access in settings.'
      );
    }
  };

  const setupRealtimeSubscription = () => {
    if (!user) return;

    subscriptionRef.current = subscribeToNearbyUsers(user.id, () => {
      // Reload nearby users when database changes
      if (user.status && user.location) {
        loadNearbyUsers();
      }
    });
  };

  const setupFlickSubscription = () => {
    if (!user) return;

    flickSubscriptionRef.current = subscribeToFlicks(user.id, async (flick) => {
      // Someone flicked us! Reload received flicks to update UI
      await loadFlicksReceived();

      // Check if it's a mutual match
      const isMutual = await checkMutualMatch(user.id, flick.from_user_id);

      if (isMutual) {
        // It's a match! Navigate to Green Light screen
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

  const loadNearbyUsers = async () => {
    if (!user?.location) return;

    try {
      const users = await findNearbyUsers(
        user.id,
        user.location,
        user.gender,
        user.lookingFor,
        PROXIMITY_RADIUS
      );

      // Filter out current user as safety check (should be handled by SQL, but just in case)
      const filteredUsers = users.filter(u => u.id !== user.id);

      console.log('Current user ID:', user.id);
      console.log('Nearby users found:', users.length);
      console.log('After filtering self:', filteredUsers.length);

      setNearbyUsers(filteredUsers);
    } catch (error) {
      console.error('Error loading nearby users:', error);
    }
  };

  const handleToggleAvailability = async (value) => {
    try {
      await toggleStatus(value);
    } catch (error) {
      Alert.alert('Error', 'Failed to update your status. Please try again.');
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

    // Check if user can initiate first flick based on gender rules
    // Males looking for females cannot initiate first flick
    const canInitiateFlick = !(
      user.gender === 'male' &&
      user.lookingFor === 'female' &&
      targetUser.gender === 'female' &&
      !theyFlickdMe // Unless they already flicked us
    );

    // If can't initiate and they haven't flicked us, show alert
    if (!canInitiateFlick && !iFlickdThem) {
      Alert.alert(
        'Cannot Initiate',
        'Based on your preferences, you cannot send the first flick. Wait for them to flick you first.'
      );
      return;
    }

    // If already flicked, allow unflick
    if (iFlickdThem) {
      try {
        await deleteFlick(user.id, targetUser.id);
        // Update local state to remove the flick
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
      // Send the flick
      const result = await sendFlick(user.id, targetUser.id);

      if (result.alreadyFlicked) {
        Alert.alert('Already Flicked', `You've already flicked them!`);
        return;
      }

      // Update local state
      setFlickdUsers((prev) => new Set([...prev, targetUser.id]));

      // If they already flicked us, this is an instant match!
      if (theyFlickdMe) {
        const matchedUser = await getMatchedUserInfo(targetUser.id);
        navigation.navigate('GreenLight', { matchedUser });
      } else {
        // Check if it's a mutual match (in case of race condition)
        const isMutual = await checkMutualMatch(user.id, targetUser.id);

        if (isMutual) {
          // It's a match! Navigate to Green Light screen
          const matchedUser = await getMatchedUserInfo(targetUser.id);
          navigation.navigate('GreenLight', { matchedUser });
        }
        // No alert for one-way flick - just silent action
      }
    } catch (error) {
      console.error('Error sending flick:', error);
      Alert.alert('Error', 'Failed to send flick. Please try again.');
    }
  };

  const handleHideUser = (userId) => {
    setHiddenUsers((prev) => new Set([...prev, userId]));
  };

  const renderRightActions = (userId, progress, dragX) => {
    const opacity = dragX.interpolate({
      inputRange: [-80, -40, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View style={{ opacity }}>
        <TouchableOpacity
          style={styles.hideButton}
          onPress={() => handleHideUser(userId)}
        >
          <Text style={styles.hideButtonText}>Hide</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            navigation.replace('Camera');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          }
        },
      },
    ]);
  };

  if (!user) {
    return null;
  }

  return (
    <View style={[styles.container, !user.status && styles.containerOff]}>
      {/* User Profile Header */}
      <View style={styles.header}>
        <Image source={{ uri: user.selfieUrl }} style={styles.profilePhoto} />
        <Text style={styles.name}>
          {user.name}, {user.age}
        </Text>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* Availability Toggle */}
      <View style={styles.toggleSection}>
        <View style={styles.toggleLabelContainer}>
          <Text style={styles.toggleLabel}>Available</Text>
          <Text style={styles.toggleStatus}>{user.status ? 'ON' : 'OFF'}</Text>
        </View>
        <Switch
          value={Boolean(user.status)}
          onValueChange={handleToggleAvailability}
          trackColor={{ false: COLORS.gray, true: COLORS.green }}
          thumbColor={COLORS.white}
          ios_backgroundColor={COLORS.gray}
        />
      </View>

      {/* Status Message */}
      <View style={styles.statusMessage}>
        {user.status ? (
          <>
            <View style={styles.pulseIndicator} />
            <Text style={styles.statusText}>
              Visible to others within {PROXIMITY_RADIUS}m
            </Text>
          </>
        ) : (
          <Text style={styles.statusTextOff}>You're invisible</Text>
        )}
      </View>

      {/* Radar Feed */}
      {user.status && (
        <>
          <View style={styles.radarHeader}>
            <Text style={styles.radarTitle}>Nearby</Text>
            <Text style={styles.radarCount}>
              {nearbyUsers.length}{' '}
              {nearbyUsers.length === 1 ? 'person' : 'people'}
            </Text>
          </View>

          <ScrollView
            style={styles.radarFeed}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.green}
              />
            }
          >
            {nearbyUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  No one nearby yet
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Pull down to refresh
                </Text>
              </View>
            ) : (
              nearbyUsers
                .filter((u) => !hiddenUsers.has(u.id))
                .map((nearbyUser) => {
                  const theyFlickdMe = usersWhoFlickedMe.has(nearbyUser.id);
                  const iFlickdThem = flickedUsers.has(nearbyUser.id);

                  // Check if user can initiate flick (males looking for females cannot)
                  const canInitiate = !(
                    user.gender === 'male' &&
                    user.lookingFor === 'female' &&
                    nearbyUser.gender === 'female' &&
                    !theyFlickdMe
                  );

                  return (
                    <Swipeable
                      key={nearbyUser.id}
                      renderRightActions={(progress, dragX) => renderRightActions(nearbyUser.id, progress, dragX)}
                      overshootRight={false}
                      friction={2}
                      rightThreshold={40}
                    >
                      <View
                        style={[
                          styles.userCard,
                          theyFlickdMe && styles.userCardInterested,
                        ]}
                      >
                    <View style={styles.userInfo}>
                      {nearbyUser.selfie_url ? (
                        <TouchableOpacity onPress={() => setSelectedPhoto(nearbyUser.selfie_url)}>
                          <Image
                            source={{ uri: nearbyUser.selfie_url }}
                            style={[
                              styles.userPhoto,
                              theyFlickdMe && styles.userPhotoInterested,
                            ]}
                          />
                        </TouchableOpacity>
                      ) : (
                        <View
                          style={[
                            styles.userPhotoPlaceholder,
                            theyFlickdMe && styles.userPhotoInterestedPlaceholder,
                          ]}
                        >
                          <Text style={styles.userInitial}>?</Text>
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName}>
                            {nearbyUser.age} years old{nearbyUser.height ? ` • ${nearbyUser.height}cm` : ''}
                          </Text>
                        </View>
                        {theyFlickdMe ? (
                          <Text style={styles.interestedLabel}>
                            Wants to meet
                          </Text>
                        ) : (
                          <Text style={styles.userDistance}>
                            {formatDistance(nearbyUser.distance_meters)} away
                          </Text>
                        )}
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.flickButton,
                        theyFlickdMe && styles.flickButtonInterested,
                        iFlickdThem && styles.flickButtonDisabled,
                        !canInitiate && !iFlickdThem && styles.flickButtonDisabled,
                      ]}
                      onPress={() => handleFlick(nearbyUser)}
                      disabled={!canInitiate && !iFlickdThem && !theyFlickdMe}
                    >
                      <Text
                        style={[
                          styles.flickButtonText,
                          (iFlickdThem || (!canInitiate && !theyFlickdMe)) && styles.flickButtonTextDisabled,
                        ]}
                      >
                        {iFlickdThem
                          ? 'FLICKED ✓'
                          : theyFlickdMe
                          ? 'FLICK BACK'
                          : !canInitiate
                          ? 'WAIT'
                          : 'FLICK'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </Swipeable>
              );
            })
            )}
          </ScrollView>
        </>
      )}

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
    backgroundColor: COLORS.white,
    paddingTop: SPACING.xxl,
  },
  containerOff: {
    backgroundColor: COLORS.grayLight,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.green,
    marginBottom: SPACING.md,
  },
  name: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: SPACING.sm,
  },
  logoutButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
  },
  logoutText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  toggleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.black,
  },
  toggleLabelContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.md,
  },
  toggleLabel: {
    ...TYPOGRAPHY.subtitle,
  },
  toggleStatus: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.gray,
  },
  statusMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    gap: SPACING.sm,
  },
  pulseIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.green,
  },
  statusText: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
  },
  statusTextOff: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
  radarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
  },
  radarTitle: {
    ...TYPOGRAPHY.subtitle,
  },
  radarCount: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
  },
  radarFeed: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginBottom: SPACING.xs,
  },
  emptyStateSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  userCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayLight,
  },
  userCardInterested: {
    backgroundColor: COLORS.greenGlow,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.green,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
    marginRight: SPACING.md,
  },
  userPhoto: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  userPhotoInterested: {
    borderWidth: 3,
    borderColor: COLORS.green,
  },
  userPhotoPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPhotoInterestedPlaceholder: {
    borderWidth: 3,
    borderColor: COLORS.green,
  },
  userInitial: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.white,
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  userName: {
    ...TYPOGRAPHY.body,
    fontWeight: '600',
  },
  waveEmoji: {
    fontSize: 16,
  },
  interestedLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.green,
    fontWeight: 'bold',
  },
  userDistance: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
  },
  flickButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  flickButtonInterested: {
    backgroundColor: COLORS.green,
  },
  flickButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  flickButtonText: {
    fontFamily: 'Inter_900Black',
    fontSize: 14,
    letterSpacing: 1.5,
    color: '#0b0f0e',
  },
  flickButtonTextDisabled: {
    color: COLORS.white,
  },
  hideButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
    height: 70,
    marginVertical: SPACING.sm,
    borderRadius: 8,
  },
  hideButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
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
