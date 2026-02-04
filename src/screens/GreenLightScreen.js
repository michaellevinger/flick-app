import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';
import {
  requestNumberExchange,
  acceptExchangeRequest,
  declineExchangeRequest,
  getExchangeRequest,
  subscribeToExchanges,
  getUserPhoneNumber,
} from '../lib/vault';

const { width, height } = Dimensions.get('window');

export default function GreenLightScreen({ route, navigation }) {
  const { matchedUser } = route.params;
  const { user } = useUser();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [exchangeRequest, setExchangeRequest] = useState(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showIncomingRequest, setShowIncomingRequest] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const exchangeSubscription = useRef(null);

  useEffect(() => {
    // Trigger haptic feedback immediately
    triggerHapticPulse();

    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Continuous pulse animation
    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );

    pulseAnimation.start();

    // Load existing exchange request
    checkExistingExchange();

    // Subscribe to exchange updates
    setupExchangeSubscription();

    // Load user's saved phone number
    loadPhoneNumber();

    return () => {
      pulseAnimation.stop();
      if (exchangeSubscription.current) {
        exchangeSubscription.current.unsubscribe();
      }
    };
  }, []);

  const loadPhoneNumber = async () => {
    if (!user) return;
    const savedPhone = await getUserPhoneNumber(user.id);
    if (savedPhone) {
      setPhoneNumber(savedPhone);
    }
  };

  const checkExistingExchange = async () => {
    if (!user) return;
    const existing = await getExchangeRequest(user.id, matchedUser.id);
    if (existing) {
      setExchangeRequest(existing);
      // If there's a pending request TO me, show it
      if (existing.requested_by === matchedUser.id && existing.status === 'pending') {
        setIncomingRequest(existing);
        setShowIncomingRequest(true);
      }
      // If accepted, navigate to vault
      if (existing.status === 'accepted') {
        navigation.navigate('Vault', {
          exchangeId: existing.id,
          otherUserName: matchedUser.name,
        });
      }
    }
  };

  const setupExchangeSubscription = () => {
    if (!user) return;

    exchangeSubscription.current = subscribeToExchanges(user.id, (payload) => {
      const exchange = payload.new;

      // If it's a new request TO me
      if (
        exchange &&
        exchange.requested_by === matchedUser.id &&
        exchange.status === 'pending'
      ) {
        setIncomingRequest(exchange);
        setShowIncomingRequest(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      // If request was accepted
      if (exchange && exchange.status === 'accepted') {
        setExchangeRequest(exchange);
        navigation.navigate('Vault', {
          exchangeId: exchange.id,
          otherUserName: matchedUser.name,
        });
      }
    });
  };

  const triggerHapticPulse = async () => {
    // Heavy success notification
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Follow up with impact pulses
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 400);
  };

  const handleClose = () => {
    navigation.goBack();
  };

  const handleRequestNumber = () => {
    setShowPhoneInput(true);
  };

  const handleSubmitPhoneNumber = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    if (!user) return;

    try {
      // Get the matched user's phone number (they must have one set)
      const theirPhone = await getUserPhoneNumber(matchedUser.id);

      if (!theirPhone) {
        Alert.alert(
          'Not Available',
          `${matchedUser.name} hasn't set their phone number yet.`
        );
        return;
      }

      const result = await requestNumberExchange(
        user.id,
        matchedUser.id,
        phoneNumber,
        theirPhone
      );

      setShowPhoneInput(false);

      if (result.alreadyExists) {
        Alert.alert('Request Pending', 'You already sent a request to this person.');
      } else {
        Alert.alert(
          'Request Sent',
          `${matchedUser.name} will be asked to accept the exchange.`
        );
        setExchangeRequest(result.exchange);
      }
    } catch (error) {
      console.error('Error requesting exchange:', error);
      Alert.alert('Error', 'Failed to send request. Please try again.');
    }
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;

    try {
      await acceptExchangeRequest(incomingRequest.id);
      setShowIncomingRequest(false);

      // Navigate to vault
      navigation.navigate('Vault', {
        exchangeId: incomingRequest.id,
        otherUserName: matchedUser.name,
      });
    } catch (error) {
      console.error('Error accepting request:', error);
      Alert.alert('Error', 'Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = async () => {
    if (!incomingRequest) return;

    try {
      await declineExchangeRequest(incomingRequest.id);
      setShowIncomingRequest(false);
      setIncomingRequest(null);
    } catch (error) {
      console.error('Error declining request:', error);
    }
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Full-screen green background with pulse */}
      <Animated.View
        style={[
          styles.greenBackground,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>GREEN LIGHT</Text>

        {/* Matched User Info */}
        <View style={styles.userContainer}>
          {matchedUser.selfie_url ? (
            <Animated.Image
              source={{ uri: matchedUser.selfie_url }}
              style={[
                styles.userPhoto,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
          ) : (
            <View style={styles.userPhotoPlaceholder}>
              <Text style={styles.userInitial}>{matchedUser.name[0]}</Text>
            </View>
          )}

          <Text style={styles.matchText}>You matched with</Text>
          <Text style={styles.userName}>{matchedUser.name}</Text>
        </View>

        {/* Number Exchange */}
        <View style={styles.actionContainer}>
          {exchangeRequest && exchangeRequest.status === 'pending' ? (
            <Text style={styles.hint}>Waiting for response...</Text>
          ) : (
            <>
              <TouchableOpacity
                style={styles.requestNumberButton}
                onPress={handleRequestNumber}
              >
                <Text style={styles.requestNumberText}>📞 Request Number</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>
                They're nearby. Go say hi!
              </Text>
            </>
          )}
        </View>

        {/* Close Button */}
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Text style={styles.closeButtonText}>Back to Radar</Text>
        </TouchableOpacity>
      </View>

      {/* Phone Number Input Modal */}
      <Modal
        visible={showPhoneInput}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhoneInput(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter Your Phone Number</Text>
            <Text style={styles.modalSubtitle}>
              This will be shared with {matchedUser.name} if they accept
            </Text>

            <TextInput
              style={styles.phoneInput}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              placeholder="(555) 123-4567"
              keyboardType="phone-pad"
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setShowPhoneInput(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleSubmitPhoneNumber}
              >
                <Text style={styles.modalButtonText}>Send Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Incoming Request Modal */}
      <Modal
        visible={showIncomingRequest}
        transparent
        animationType="fade"
        onRequestClose={() => setShowIncomingRequest(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Number Exchange Request</Text>
            <Text style={styles.modalSubtitle}>
              {matchedUser.name} wants to exchange numbers. Accept?
            </Text>

            <View style={styles.warningBox}>
              <Text style={styles.warningBoxText}>
                ⚠️ Both numbers will be visible for 15 minutes, then permanently deleted.
              </Text>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={handleDeclineRequest}
              >
                <Text style={styles.modalButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonConfirm}
                onPress={handleAcceptRequest}
              >
                <Text style={styles.modalButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.green,
  },
  greenBackground: {
    position: 'absolute',
    top: -height * 0.5,
    left: -width * 0.5,
    width: width * 2,
    height: height * 2,
    backgroundColor: COLORS.green,
    borderRadius: width,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    zIndex: 1,
  },
  title: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.xxl,
    letterSpacing: 2,
  },
  userContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  userPhoto: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    borderColor: COLORS.black,
    marginBottom: SPACING.lg,
  },
  userPhotoPlaceholder: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 5,
    borderColor: COLORS.white,
    marginBottom: SPACING.lg,
  },
  userInitial: {
    fontSize: 64,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  matchText: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    marginBottom: SPACING.xs,
  },
  userName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  actionContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxl,
  },
  requestNumberButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
  },
  requestNumberText: {
    ...TYPOGRAPHY.body,
    color: COLORS.green,
    fontWeight: 'bold',
  },
  hint: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  modalSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.gray,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  phoneInput: {
    ...TYPOGRAPHY.subtitle,
    borderWidth: 2,
    borderColor: COLORS.black,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  warningBox: {
    backgroundColor: COLORS.greenGlow,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.green,
  },
  warningBoxText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.black,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: COLORS.gray,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonConfirm: {
    flex: 1,
    backgroundColor: COLORS.green,
    padding: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    ...TYPOGRAPHY.body,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
  },
  closeButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  closeButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.green,
    fontWeight: 'bold',
  },
});
