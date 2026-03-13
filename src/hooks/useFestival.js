import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { getCurrentFestival } from '../lib/database';

export function useFestival(userId, festivalId, navigation) {
  const [festival, setFestival] = useState(null);
  const [countdown, setCountdown] = useState('');

  // Load festival when user is available
  useEffect(() => {
    if (!userId) return;
    loadFestival();
  }, [userId]);

  // Countdown timer — updates every second while event is active
  useEffect(() => {
    if (!festival?.ends_at) {
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const end = new Date(festival.ends_at);
      const diff = end - now;

      if (diff <= 0) {
        setCountdown('Event ended');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(
        `${hours}h:${minutes.toString().padStart(2, '0')}m:${seconds.toString().padStart(2, '0')}s`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [festival?.ends_at]);

  // Validate festival — if user has a festivalId but it fails to load, redirect to QR scanner
  useEffect(() => {
    if (!festivalId || festival !== null) return;

    const timeoutId = setTimeout(async () => {
      try {
        const loaded = await getCurrentFestival(userId);
        if (!loaded) {
          Alert.alert(
            'Event Not Found',
            'This event is no longer available. Please scan a new QR code to join an event.',
            [{ text: 'Scan QR Code', onPress: () => navigation.replace('QRScanner') }],
            { cancelable: false }
          );
        }
      } catch (error) {
        console.error('Error validating festival:', error);
      }
    }, 2000); // Give 2 seconds for initial load before validating

    return () => clearTimeout(timeoutId);
  }, [festivalId, festival]);

  const loadFestival = async () => {
    try {
      const data = await getCurrentFestival(userId);
      setFestival(data);
    } catch (error) {
      console.error('Error loading current festival:', error);
    }
  };

  return { festival, countdown };
}
