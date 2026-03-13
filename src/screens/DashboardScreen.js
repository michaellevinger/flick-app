import React, { useState, useEffect, useCallback } from 'react';
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
import EventBanner from '../components/EventBanner';
import UserCard from '../components/UserCard';

export default function DashboardScreen({ navigation }) {
  const { user } = useUser();
  const [currentUserIndex, setCurrentUserIndex] = useState(0);

  const { festival } = useFestival(user?.id, user?.festival_id, navigation);
  const { users, refresh } = useFestivalUsers(user);

  // Reset carousel index when user list shrinks
  useEffect(() => {
    if (currentUserIndex >= users.length) {
      setCurrentUserIndex(Math.max(0, users.length - 1));
    }
  }, [users.length]);

  const handleAdvance = useCallback(() => {
    setCurrentUserIndex((prev) => Math.min(prev + 1, users.length - 1));
  }, [users.length]);

  const { flickedUsers, usersWhoFlickedMe, handleFlick, loadFlicksReceived } = useFlicks(
    user,
    navigation,
    handleAdvance
  );

  const handleRefresh = async () => {
    await refresh();
    await loadFlicksReceived();
  };

  if (!user) {
    navigation.replace('Welcome');
    return null;
  }

  const currentUser = users[currentUserIndex];

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => navigation.replace('Welcome') },
    ]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#C44CE0', '#FF6B9D']}
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

          <EventBanner festival={festival} />

          {currentUser ? (
            <UserCard
              user={currentUser}
              isFlicked={flickedUsers.has(currentUser.id)}
              hasFlickedMe={usersWhoFlickedMe.has(currentUser.id)}
              onFlick={handleFlick}
              onViewProfile={() =>
                navigation.navigate('UserProfile', {
                  user: currentUser,
                  onFlick: handleFlick,
                  onPass: handleAdvance,
                })
              }
              onPrev={() => setCurrentUserIndex((prev) => prev - 1)}
              onNext={() => setCurrentUserIndex((prev) => prev + 1)}
              currentIndex={currentUserIndex}
              totalCount={users.length}
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
    paddingVertical: 16,
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
});
