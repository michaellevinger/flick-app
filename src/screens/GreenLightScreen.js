import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
} from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';
import { usePulseAnimation } from '../hooks/usePulseAnimation';
import { useHaptics } from '../hooks/useHaptics';
import { useNumberExchange } from '../hooks/useNumberExchange';
import NumberExchangeModal from '../components/NumberExchangeModal';
import { getMatchId } from '../utils/matchUtils';

const { width, height } = Dimensions.get('window');

export default function GreenLightScreen({ route, navigation }) {
  const { matchedUser } = route.params;
  const { user } = useUser();

  const { pulseAnim, fadeAnim } = usePulseAnimation();
  const { triggerHapticPulse } = useHaptics();
  const {
    exchangeRequest,
    showPhoneInput,
    closePhoneInput,
    phoneNumber,
    setPhoneNumber,
    showIncomingRequest,
    incomingRequest,
    handleRequestNumber,
    handleSubmitPhoneNumber,
    handleAcceptRequest,
    handleDeclineRequest,
  } = useNumberExchange(user, matchedUser, navigation);

  useEffect(() => {
    triggerHapticPulse();
  }, []);

  const handleStartChat = () => {
    const matchId = getMatchId(user.id, matchedUser.id);
    navigation.replace('Chat', { matchId, otherUser: matchedUser });
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Pulsing full-screen green background */}
      <Animated.View
        style={[styles.greenBackground, { transform: [{ scale: pulseAnim }] }]}
      />

      <View style={styles.content}>
        <Text style={styles.title}>GREEN LIGHT</Text>

        <View style={styles.userContainer}>
          {matchedUser.selfie_url ? (
            <Animated.Image
              source={{ uri: matchedUser.selfie_url }}
              style={[styles.userPhoto, { transform: [{ scale: pulseAnim }] }]}
            />
          ) : (
            <View style={styles.userPhotoPlaceholder}>
              <Text style={styles.userInitial}>{matchedUser.name[0]}</Text>
            </View>
          )}
          <Text style={styles.matchText}>You matched with</Text>
          <Text style={styles.userName}>{matchedUser.name}</Text>
        </View>

        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.chatButton} onPress={handleStartChat}>
            <Text style={styles.chatButtonText}>💬 Start Chat</Text>
          </TouchableOpacity>

          {exchangeRequest?.status === 'pending' ? (
            <Text style={styles.hint}>Number request pending...</Text>
          ) : (
            <>
              <TouchableOpacity
                style={styles.requestNumberButton}
                onPress={handleRequestNumber}
              >
                <Text style={styles.requestNumberText}>📞 Request Number</Text>
              </TouchableOpacity>
              <Text style={styles.hint}>They're nearby. Go say hi!</Text>
            </>
          )}
        </View>

        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Text style={styles.closeButtonText}>Back to Radar</Text>
        </TouchableOpacity>
      </View>

      {/* Phone number input modal */}
      <NumberExchangeModal
        visible={showPhoneInput}
        phoneNumber={phoneNumber}
        onChangePhone={setPhoneNumber}
        otherUserName={matchedUser.name}
        onSubmit={handleSubmitPhoneNumber}
        onCancel={closePhoneInput}
      />

      {/* Incoming request modal */}
      <Modal
        visible={showIncomingRequest}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
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
              <TouchableOpacity style={styles.modalButtonCancel} onPress={handleDeclineRequest}>
                <Text style={styles.modalButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonConfirm} onPress={handleAcceptRequest}>
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
    width: '100%',
  },
  chatButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    width: '80%',
  },
  chatButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  requestNumberButton: {
    backgroundColor: COLORS.black,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.md,
    width: '80%',
  },
  requestNumberText: {
    ...TYPOGRAPHY.body,
    color: COLORS.green,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  hint: {
    ...TYPOGRAPHY.body,
    color: COLORS.black,
    textAlign: 'center',
    fontStyle: 'italic',
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
});
