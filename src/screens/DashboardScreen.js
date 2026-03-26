import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../lib/userContext';
import { useFestival } from '../hooks/useFestival';
import { useFestivalUsers } from '../hooks/useFestivalUsers';
import { useFlicks } from '../hooks/useFlicks';
import UserCard from '../components/UserCard';
import { COLORS, SPACING } from '../constants/theme';

export default function DashboardScreen({ navigation, route }) {
  const { user } = useUser();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  useFestival(user?.id, user?.festival_id, navigation);
  const { users, refresh, reload } = useFestivalUsers(user);

  // Advance to the next card; going past the end shows the empty state
  const handleAdvance = useCallback(() => {
    setCurrentUserIndex((prev) => prev + 1);
  }, []);

  const { flickedUsers, usersWhoFlickedMe, passedUsers, handleFlick, handlePass, loadFlicksReceived, loadFlicksSent } = useFlicks(
    user,
    navigation
  );

  // Hide users already flicked or passed
  const visibleUsers = useMemo(
    () => users.filter((u) => !flickedUsers.has(u.id) && !passedUsers.has(u.id)),
    [users, flickedUsers, passedUsers]
  );

  // When the visible list shrinks, clamp the index to the last valid card
  useEffect(() => {
    if (visibleUsers.length > 0 && currentUserIndex >= visibleUsers.length) {
      setCurrentUserIndex(visibleUsers.length - 1);
    }
  }, [visibleUsers.length]);

  // Handle flick/pass actions returned from UserProfileScreen
  useEffect(() => {
    if (route.params?.pendingFlick) {
      handleFlick(route.params.pendingFlick);
      navigation.setParams({ pendingFlick: undefined });
    }
    if (route.params?.pendingPass) {
      handleAdvance();
      navigation.setParams({ pendingPass: undefined });
    }
  }, [route.params?.pendingFlick, route.params?.pendingPass]);

  // Reload silently every time the Radar tab comes into focus
  useFocusEffect(
    useCallback(() => {
      reload();
      loadFlicksReceived();
      loadFlicksSent();
    }, [])
  );

  const handleRefresh = async () => {
    await refresh();
    await loadFlicksReceived();
  };

  if (!user) {
    navigation.replace('Welcome');
    return null;
  }

  const currentUser = visibleUsers[currentUserIndex];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => navigation.replace('Welcome') },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[COLORS.purple, COLORS.pink]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.logo}>flick</Text>
            <TouchableOpacity onPress={handleSignOut}>
              <Text style={styles.signOutButton}>Sign Out</Text>
            </TouchableOpacity>
          </View>

          {currentUser ? (
            <UserCard
              user={currentUser}
              isFlicked={flickedUsers.has(currentUser.id)}
              hasFlickedMe={usersWhoFlickedMe.has(currentUser.id)}
              onFlick={handleFlick}
              onViewProfile={() =>
                navigation.navigate('UserProfile', {
                  user: currentUser,
                  fromRadar: true,
                })
              }
              onPrev={() => setCurrentUserIndex((prev) => prev - 1)}
              onPass={handlePass}
              onNext={() => setCurrentUserIndex((prev) => prev + 1)}
              currentIndex={currentUserIndex}
              totalCount={visibleUsers.length}
            />
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
    paddingVertical: SPACING.md,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  signOutButton: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyStateText: {
    fontSize: 22,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: SPACING.sm,
  },
  refreshButton: {
    marginTop: SPACING.md,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: SPACING.xl,
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
    color: COLORS.purple,
  },
});
