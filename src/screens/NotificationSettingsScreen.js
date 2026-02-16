import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
} from 'react-native';

export default function NotificationSettingsScreen({ navigation }) {
  // Notification preferences
  const [matchNotifications, setMatchNotifications] = useState(true);
  const [messageNotifications, setMessageNotifications] = useState(true);
  const [flickNotifications, setFlickNotifications] = useState(true);
  const [nearbyNotifications, setNearbyNotifications] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const handleToggle = (setter, value, title) => {
    setter(!value);
    // In a real app, you'd save this to backend or AsyncStorage
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Push Notifications Section */}
        <Text style={styles.sectionTitle}>Push Notifications</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Match Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone flicks you back
              </Text>
            </View>
            <Switch
              value={matchNotifications}
              onValueChange={() => handleToggle(setMatchNotifications, matchNotifications, 'Match')}
              trackColor={{ false: '#CCCCCC', true: '#C44CE0' }}
              thumbColor={matchNotifications ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Message Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified when you receive a message
              </Text>
            </View>
            <Switch
              value={messageNotifications}
              onValueChange={() => handleToggle(setMessageNotifications, messageNotifications, 'Message')}
              trackColor={{ false: '#CCCCCC', true: '#C44CE0' }}
              thumbColor={messageNotifications ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Flick Notifications</Text>
              <Text style={styles.settingDescription}>
                Get notified when someone flicks you
              </Text>
            </View>
            <Switch
              value={flickNotifications}
              onValueChange={() => handleToggle(setFlickNotifications, flickNotifications, 'Flick')}
              trackColor={{ false: '#CCCCCC', true: '#C44CE0' }}
              thumbColor={flickNotifications ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Nearby Users</Text>
              <Text style={styles.settingDescription}>
                Get notified when new users join nearby
              </Text>
            </View>
            <Switch
              value={nearbyNotifications}
              onValueChange={() => handleToggle(setNearbyNotifications, nearbyNotifications, 'Nearby')}
              trackColor={{ false: '#CCCCCC', true: '#C44CE0' }}
              thumbColor={nearbyNotifications ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>
        </View>

        {/* Sound & Vibration Section */}
        <Text style={styles.sectionTitle}>Sound & Vibration</Text>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Sound</Text>
              <Text style={styles.settingDescription}>
                Play sound for notifications
              </Text>
            </View>
            <Switch
              value={soundEnabled}
              onValueChange={() => handleToggle(setSoundEnabled, soundEnabled, 'Sound')}
              trackColor={{ false: '#CCCCCC', true: '#C44CE0' }}
              thumbColor={soundEnabled ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Vibration</Text>
              <Text style={styles.settingDescription}>
                Vibrate for notifications and matches
              </Text>
            </View>
            <Switch
              value={vibrationEnabled}
              onValueChange={() => handleToggle(setVibrationEnabled, vibrationEnabled, 'Vibration')}
              trackColor={{ false: '#CCCCCC', true: '#C44CE0' }}
              thumbColor={vibrationEnabled ? '#FFFFFF' : '#F4F4F4'}
            />
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Notifications help you stay connected. You can always adjust these settings later.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    marginTop: 8,
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#666666',
    lineHeight: 18,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuIcon: {
    fontSize: 18,
    width: 30,
    textAlign: 'center',
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    marginLeft: 8,
  },
  menuChevron: {
    fontSize: 20,
    color: '#CCCCCC',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(196, 76, 224, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(196, 76, 224, 0.2)',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
});
