import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useMatches } from '../lib/matchesContext';
import MatchCard from '../components/MatchCard';

export default function MatchesScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { matches, loading, loadMatches } = useMatches();

  const handleMatchPress = (match) => {
    navigation.navigate('Chat', {
      matchId: match.matchId,
      otherUser: match.otherUser,
    });
  };

  const renderMatch = ({ item }) => (
    <MatchCard match={item} onPress={() => handleMatchPress(item)} />
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#C44CE0" />
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>💬</Text>
        <Text style={styles.emptyTitle}>No matches yet</Text>
        <Text style={styles.emptySubtitle}>Keep flicking!</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>♥ flick</Text>
        <Text style={styles.headerTitle}>Matches</Text>
      </View>

      {/* Matches List */}
      <FlatList
        data={matches}
        renderItem={renderMatch}
        keyExtractor={(item) => item.matchId}
        contentContainerStyle={[
          styles.listContent,
          matches.length === 0 && styles.emptyList,
        ]}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={loadMatches}
            tintColor="#C44CE0"
          />
        }
      />

      {/* Bottom Tab Bar */}
      <View style={[styles.tabBar, { paddingBottom: insets.bottom + 10 }]}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('DashboardTab')}>
          <Text style={styles.tabIcon}>📡</Text>
          <Text style={styles.tabLabel}>Radar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIconActive}>💬</Text>
          <Text style={styles.tabLabelActive}>Matches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('ProfileTab')}>
          <Text style={styles.tabIcon}>👤</Text>
          <Text style={styles.tabLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#C44CE0',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyList: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: SPACING.lg,
  },
  emptyTitle: {
    ...TYPOGRAPHY.subtitle,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  tabIconActive: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#888888',
  },
  tabLabelActive: {
    fontSize: 12,
    color: '#C44CE0',
    fontWeight: '600',
  },
});
