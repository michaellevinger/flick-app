import { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  requestNumberExchange,
  acceptExchangeRequest,
  declineExchangeRequest,
  getExchangeRequest,
  subscribeToExchanges,
  getUserPhoneNumber,
} from '../lib/vault';

/**
 * Manages the full number exchange flow for GreenLightScreen:
 * - Loads the user's saved phone number
 * - Checks for an existing exchange request on mount
 * - Subscribes to real-time exchange updates
 * - Handles request / accept / decline
 *
 * @param {object} user         Current user from UserContext
 * @param {object} matchedUser  The matched user shown on GreenLightScreen
 * @param {object} navigation   React Navigation object for Vault navigation
 */
export function useNumberExchange(user, matchedUser, navigation) {
  const [exchangeRequest, setExchangeRequest] = useState(null);
  const [showPhoneInput, setShowPhoneInput] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showIncomingRequest, setShowIncomingRequest] = useState(false);
  const [incomingRequest, setIncomingRequest] = useState(null);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    loadPhoneNumber();
    checkExistingExchange();
    setupSubscription();

    return () => subscriptionRef.current?.unsubscribe();
  }, []);

  const loadPhoneNumber = async () => {
    const saved = await getUserPhoneNumber(user.id);
    if (saved) setPhoneNumber(saved);
  };

  const checkExistingExchange = async () => {
    const existing = await getExchangeRequest(user.id, matchedUser.id);
    if (!existing) return;

    setExchangeRequest(existing);

    if (existing.requested_by === matchedUser.id && existing.status === 'pending') {
      setIncomingRequest(existing);
      setShowIncomingRequest(true);
    }

    if (existing.status === 'accepted') {
      Alert.alert('Match!', 'You both matched! Exchange your numbers now.', [
        {
          text: 'OK',
          onPress: () =>
            navigation.navigate('Vault', {
              exchangeId: existing.id,
              otherUserName: matchedUser.name,
            }),
        },
      ]);
    }
  };

  const setupSubscription = () => {
    subscriptionRef.current = subscribeToExchanges(user.id, (payload) => {
      const exchange = payload.new;

      if (exchange && exchange.requested_by === matchedUser.id && exchange.status === 'pending') {
        setIncomingRequest(exchange);
        setShowIncomingRequest(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }

      if (exchange && exchange.status === 'accepted') {
        setExchangeRequest(exchange);
        Alert.alert('Match!', 'You both matched! Exchange your numbers now.', [
          {
            text: 'OK',
            onPress: () =>
              navigation.navigate('Vault', {
                exchangeId: exchange.id,
                otherUserName: matchedUser.name,
              }),
          },
        ]);
      }
    });
  };

  const handleRequestNumber = () => setShowPhoneInput(true);

  const handleSubmitPhoneNumber = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      Alert.alert('Invalid Number', 'Please enter a valid phone number.');
      return;
    }

    try {
      const theirPhone = await getUserPhoneNumber(matchedUser.id);

      if (!theirPhone) {
        Alert.alert('Not Available', `${matchedUser.name} hasn't set their phone number yet.`);
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

  return {
    exchangeRequest,
    showPhoneInput,
    closePhoneInput: () => setShowPhoneInput(false),
    phoneNumber,
    setPhoneNumber,
    showIncomingRequest,
    incomingRequest,
    handleRequestNumber,
    handleSubmitPhoneNumber,
    handleAcceptRequest,
    handleDeclineRequest,
  };
}
