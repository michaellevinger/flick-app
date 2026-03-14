import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  Linking,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';
import {
  getActiveExchange,
  deleteExchange,
} from '../lib/vault';

export default function VaultScreen({ route, navigation }) {
  const { exchangeId, otherUserName } = route.params;
  const { user } = useUser();
  const [timeRemaining, setTimeRemaining] = useState(900); // 15 minutes in seconds
  const [exchange, setExchange] = useState(null);
  const [isWiping, setIsWiping] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadExchange();
    startCountdown();

    // Pulse animation for urgency
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    return () => {
      pulseAnimation.stop();
    };
  }, []);

  const loadExchange = async () => {
    if (!user) return;

    try {
      const activeExchange = await getActiveExchange(user.id);

      if (!activeExchange) {
        Alert.alert('Expired', 'This number exchange has expired.');
        navigation.goBack();
        return;
      }

      setExchange(activeExchange);
      setTimeRemaining(activeExchange.time_remaining_seconds);
    } catch (error) {
      console.error('Error loading exchange:', error);
      Alert.alert('Error', 'Failed to load number exchange.');
      navigation.goBack();
    }
  };

  const startCountdown = () => {
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSelfDestruct('Time expired');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  };

  const handleSelfDestruct = async (reason) => {
    if (isWiping) return;
    setIsWiping(true);

    try {
      await deleteExchange(exchangeId);

      Alert.alert(
        'Self-Destruct',
        `Numbers deleted. Reason: ${reason}`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Dashboard'),
          },
        ],
        { cancelable: false }
      );
    } catch (error) {
      console.error('Error during self-destruct:', error);
      navigation.navigate('Dashboard');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCallNumber = (phoneNumber) => {
    Linking.openURL(`tel:${phoneNumber}`);
  };

  const handleTextNumber = (phoneNumber) => {
    Linking.openURL(`sms:${phoneNumber}`);
  };

  const handleSaveToContacts = () => {
    Alert.alert(
      'Save to Contacts',
      `Copy the number and save it manually:\n\n${exchange?.other_phone}`,
      [
        { text: 'Copy', onPress: () => {/* TODO: Implement clipboard copy */} },
        { text: 'OK' },
      ]
    );
  };

  if (!exchange) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  const isUrgent = timeRemaining < 300; // Last 5 minutes

  return (
    <View style={styles.container}>
      {/* Warning Banner */}
      <Animated.View
        style={[
          styles.warningBanner,
          isUrgent && styles.warningBannerUrgent,
          { transform: [{ scale: isUrgent ? pulseAnim : 1 }] },
        ]}
      >
        <Text style={styles.warningIcon}>⚠️</Text>
        <View style={styles.warningTextContainer}>
          <Text style={styles.warningTitle}>Self-Destruct Timer</Text>
          <Text style={styles.warningText}>
            For your privacy, this data self-destructs in{' '}
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          </Text>
          <Text style={styles.warningSubtext}>
            Save it to your contacts now.
          </Text>
        </View>
      </Animated.View>

      {/* Vault Content */}
      <View style={styles.vaultContent}>
        <Text style={styles.vaultTitle}>Number Exchange</Text>
        <Text style={styles.vaultSubtitle}>with {otherUserName}</Text>

        {/* Your Number */}
        <View style={styles.numberSection}>
          <Text style={styles.numberLabel}>Your Number</Text>
          <View style={styles.numberBox}>
            <Text style={styles.numberText}>{exchange.my_phone}</Text>
          </View>
        </View>

        {/* Their Number */}
        <View style={styles.numberSection}>
          <Text style={styles.numberLabel}>{otherUserName}'s Number</Text>
          <View style={[styles.numberBox, styles.numberBoxHighlight]}>
            <Text style={styles.numberText}>{exchange.other_phone}</Text>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleCallNumber(exchange.other_phone)}
            >
              <Text style={styles.actionButtonText}>📞 Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleTextNumber(exchange.other_phone)}
            >
              <Text style={styles.actionButtonText}>💬 Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSaveToContacts}
            >
              <Text style={styles.actionButtonText}>💾 Save</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyNotice}>
          <Text style={styles.privacyText}>
            🔒 This exchange will self-destruct when:
          </Text>
          <Text style={styles.privacyBullet}>• Timer reaches 00:00 (15 minutes)</Text>
          <Text style={styles.privacySubtext}>
            Save the number to your contacts before time runs out!
          </Text>
        </View>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={styles.closeButton}
        onPress={() => {
          Alert.alert(
            'Leave Vault?',
            'The exchange will remain active for the remaining time, but you can only return through a new match.',
            [
              { text: 'Stay', style: 'cancel' },
              { text: 'Leave', onPress: () => navigation.navigate('Dashboard') },
            ]
          );
        }}
      >
        <Text style={styles.closeButtonText}>Back to Radar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    textAlign: 'center',
    marginTop: SPACING.xxl,
  },
  warningBanner: {
    backgroundColor: COLORS.green,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: COLORS.black,
  },
  warningBannerUrgent: {
    backgroundColor: COLORS.danger,
  },
  warningIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  warningText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  timerText: {
    fontWeight: 'bold',
    fontSize: 18,
  },
  warningSubtext: {
    ...TYPOGRAPHY.caption,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  vaultContent: {
    flex: 1,
    padding: SPACING.xl,
  },
  vaultTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: SPACING.sm,
  },
  vaultSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },
  numberSection: {
    marginBottom: SPACING.xl,
  },
  numberLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    marginBottom: SPACING.sm,
    fontWeight: '600',
  },
  numberBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.lg,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.gray,
  },
  numberBoxHighlight: {
    borderColor: COLORS.green,
    borderWidth: 3,
  },
  numberText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    letterSpacing: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.green,
    padding: SPACING.sm,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  privacyNotice: {
    backgroundColor: COLORS.white,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.lg,
  },
  privacyText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  privacyBullet: {
    ...TYPOGRAPHY.caption,
    marginLeft: SPACING.md,
    marginTop: SPACING.xs,
  },
  privacySubtext: {
    ...TYPOGRAPHY.caption,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: COLORS.white,
    margin: SPACING.xl,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.black,
  },
});
