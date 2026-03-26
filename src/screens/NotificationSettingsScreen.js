import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';
import { useUser } from '../lib/userContext';

export default function NotificationSettingsScreen({ navigation }) {
  const { user, updateUser } = useUser();

  const prefs = user?.notificationPreferences || {
    matches: true,
    messages: true,
    flicks: true,
    exchanges: true,
  };

  const [matchNotifications, setMatchNotifications] = useState(prefs.matches !== false);
  const [messageNotifications, setMessageNotifications] = useState(prefs.messages !== false);
  const [flickNotifications, setFlickNotifications] = useState(prefs.flicks !== false);
  const [exchangeNotifications, setExchangeNotifications] = useState(prefs.exchanges !== false);

  const handleToggle = async (key, setter, currentValue) => {
    const newValue = !currentValue;
    setter(newValue);
    try {
      await updateUser({
        notificationPreferences: {
          ...prefs,
          [key]: newValue,
        },
      });
    } catch (error) {
      console.error('Failed to save notification preference:', error);
      setter(currentValue); // rollback on failure
    }
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
              onValueChange={() => handleToggle('matches', setMatchNotifications, matchNotifications)}
              trackColor={{ false: COLORS.grayDisabled, true: COLORS.purple }}
              thumbColor={matchNotifications ? COLORS.white : COLORS.grayLight}
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
              onValueChange={() => handleToggle('messages', setMessageNotifications, messageNotifications)}
              trackColor={{ false: COLORS.grayDisabled, true: COLORS.purple }}
              thumbColor={messageNotifications ? COLORS.white : COLORS.grayLight}
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
              onValueChange={() => handleToggle('flicks', setFlickNotifications, flickNotifications)}
              trackColor={{ false: COLORS.grayDisabled, true: COLORS.purple }}
              thumbColor={flickNotifications ? COLORS.white : COLORS.grayLight}
            />
          </View>
        </View>

        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Number Exchange</Text>
              <Text style={styles.settingDescription}>
                Get notified for number exchange requests and acceptances
              </Text>
            </View>
            <Switch
              value={exchangeNotifications}
              onValueChange={() => handleToggle('exchanges', setExchangeNotifications, exchangeNotifications)}
              trackColor={{ false: COLORS.grayDisabled, true: COLORS.purple }}
              thumbColor={exchangeNotifications ? COLORS.white : COLORS.grayLight}
            />
          </View>
        </View>

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
    backgroundColor: COLORS.grayLight,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: COLORS.black,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  settingCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
  },
  settingInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.grayDark,
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: COLORS.grayMedium,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(196, 76, 224, 0.1)',
    borderRadius: 12,
    padding: SPACING.md,
    marginTop: SPACING.md,
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
    color: COLORS.grayMedium,
    lineHeight: 20,
  },
});
