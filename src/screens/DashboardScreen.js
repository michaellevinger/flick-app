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
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, SPACING, TYPOGRAPHY, PROXIMITY_RADIUS } from '../constants/theme';
import { useUser } from '../lib/userContext';
import { findNearbyUsers, subscribeToNearbyUsers } from '../lib/database';
import { requestLocationPermission, formatDistance } from '../lib/location';
import {
  sendNudge,
  checkMutualMatch,
  subscribeToNudges,
  getMatchedUserInfo,
  getNudgesSentByUser,
  getNudgesForUser,
} from '../lib/nudges';

export default function DashboardScreen({ navigation }) {
  const { user, toggleStatus, updateLocation, logout } = useUser();
  const [nearbyUsers, setNearbyUsers] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [nudgedUsers, setNudgedUsers] = useState(new Set());
  const [usersWhoNudgedMe, setUsersWhoNudgedMe] = useState(new Set());
  const [hiddenUsers, setHiddenUsers] = useState(new Set());
  const subscriptionRef = useRef(null);
  const nudgeSubscriptionRef = useRef(null);

  useEffect(() => {
    if (!user) {
      navigation.replace('Camera');
      return;
    }

    initializeLocation();
    setupRealtimeSubscription();
    setupNudgeSubscription();
    loadNudgesSent();
    loadNudgesReceived();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
      if (nudgeSubscriptionRef.current) {
        nudgeSubscriptionRef.current.unsubscribe();
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

  const setupNudgeSubscription = () => {
    if (!user) return;

    nudgeSubscriptionRef.current = subscribeToNudges(user.id, async (nudge) => {
      // Someone flicked us! Reload received flicks to update UI
      await loadNudgesReceived();

      // Check if it's a mutual match
      const isMutual = await checkMutualMatch(user.id, nudge.from_user_id);

      if (isMutual) {
        // It's a match! Navigate to Green Light screen
        const matchedUser = await getMatchedUserInfo(nudge.from_user_id);
        navigation.navigate('GreenLight', { matchedUser });
      }
    });
  };

  const loadNudgesSent = async () => {
    if (!user) return;

    try {
      const sentNudges = await getNudgesSentByUser(user.id);
      const nudgedUserIds = new Set(sentNudges.map((n) => n.to_user_id));
      setNudgedUsers(nudgedUserIds);
    } catch (error) {
      console.error('Error loading sent nudges:', error);
    }
  };

  const loadNudgesReceived = async () => {
    if (!user) return;

    try {
      const receivedNudges = await getNudgesForUser(user.id);
      const userIdsWhoNudgedMe = new Set(receivedNudges.map((n) => n.from_user_id));
      setUsersWhoNudgedMe(userIdsWhoNudgedMe);
    } catch (error) {
      console.error('Error loading received nudges:', error);
    }
  };

  const loadNearbyUsers = async () => {
    if (!user?.location) return;

    try {
      const users = await findNearbyUsers(
        user.id,
        user.location,
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
      await loadNudgesReceived();
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleNudge = async (targetUser) => {
    if (!user) return;

    const theyNudgedMe = usersWhoNudgedMe.has(targetUser.id);

    try {
      // Send the flick
      const result = await sendNudge(user.id, targetUser.id);

      if (result.alreadyNudged) {
        Alert.alert('Already Flicked', `You've already flicked them!`);
        return;
      }

      // Update local state
      setNudgedUsers((prev) => new Set([...prev, targetUser.id]));

      // If they already flicked us, this is an instant match!
      if (theyNudgedMe) {
        const matchedUser = await getMatchedUserInfo(targetUser.id);
        navigation.navigate('GreenLight', { matchedUser });
      } else {
        // Check if it's a mutual match (in case of race condition)
        const isMutual = await checkMutualMatch(user.id, targetUser.id);

        if (isMutual) {
          // It's a match! Navigate to Green Light screen
          const matchedUser = await getMatchedUserInfo(targetUser.id);
          navigation.navigate('GreenLight', { matchedUser });
        } else {
          // Just a one-way flick
          Alert.alert('Flick Sent', `They'll see you're interested!`);
        }
      }
    } catch (error) {
      console.error('Error sending flick:', error);
      Alert.alert('Error', 'Failed to send flick. Please try again.');
    }
  };

  const handleHideUser = (userId) => {
    setHiddenUsers((prev) => new Set([...prev, userId]));
  };

  const renderRightActions = (userId) => {
    return (
      <TouchableOpacity
        style={styles.hideButton}
        onPress={() => handleHideUser(userId)}
      >
        <Text style={styles.hideButtonText}>Hide</Text>
      </TouchableOpacity>
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
                  const theyNudgedMe = usersWhoNudgedMe.has(nearbyUser.id);
                  const iNudgedThem = nudgedUsers.has(nearbyUser.id);

                  return (
                    <Swipeable
                      key={nearbyUser.id}
                      renderRightActions={() => renderRightActions(nearbyUser.id)}
                      overshootRight={false}
                    >
                      <View
                        style={[
                          styles.userCard,
                          theyNudgedMe && styles.userCardInterested,
                        ]}
                      >
                    <View style={styles.userInfo}>
                      {nearbyUser.selfie_url ? (
                        <Image
                          source={{ uri: nearbyUser.selfie_url }}
                          style={[
                            styles.userPhoto,
                            theyNudgedMe && styles.userPhotoInterested,
                          ]}
                        />
                      ) : (
                        <View
                          style={[
                            styles.userPhotoPlaceholder,
                            theyNudgedMe && styles.userPhotoInterestedPlaceholder,
                          ]}
                        >
                          <Text style={styles.userInitial}>?</Text>
                        </View>
                      )}
                      <View style={styles.userDetails}>
                        <View style={styles.userNameRow}>
                          <Text style={styles.userName}>{nearbyUser.age} years old</Text>
                          {theyNudgedMe && (
                            <Text style={styles.waveEmoji}>👋</Text>
                          )}
                        </View>
                        {theyNudgedMe ? (
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
                        styles.nudgeButton,
                        theyNudgedMe && styles.nudgeButtonInterested,
                        iNudgedThem && styles.nudgeButtonDisabled,
                      ]}
                      onPress={() => handleNudge(nearbyUser)}
                      disabled={iNudgedThem}
                    >
                      <Text
                        style={[
                          styles.nudgeButtonText,
                          iNudgedThem && styles.nudgeButtonTextDisabled,
                        ]}
                      >
                        {iNudgedThem
                          ? 'FLICKED ✓'
                          : theyNudgedMe
                          ? 'FLICK BACK'
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
    alignItems: 'center',
    gap: SPACING.md,
  },
  toggleLabel: {
    ...TYPOGRAPHY.subtitle,
  },
  toggleStatus: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    fontWeight: 'bold',
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
  nudgeButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    minWidth: 90,
    alignItems: 'center',
  },
  nudgeButtonInterested: {
    backgroundColor: COLORS.green,
    borderWidth: 2,
    borderColor: COLORS.black,
  },
  nudgeButtonDisabled: {
    backgroundColor: COLORS.gray,
  },
  nudgeButtonText: {
    fontSize: 16,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1,
    color: '#0b0f0e',
  },
  nudgeButtonTextDisabled: {
    color: COLORS.white,
  },
  hideButton: {
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: SPACING.sm,
    borderRadius: 8,
  },
  hideButtonText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
