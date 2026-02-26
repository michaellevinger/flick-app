import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import ViewShot from 'react-native-view-shot';

export default function EventSuccessScreen({ route, navigation }) {
  const { event } = route.params;
  const qrRef = useRef();

  const handleDone = () => {
    // Navigate back to Welcome screen
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  const handleShare = async () => {
    try {
      // Capture the QR code as an image
      const uri = await qrRef.current.capture();

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (!isAvailable) {
        Alert.alert('Sharing not available', 'Unable to share on this device.');
        return;
      }

      // Share the QR code image
      await Sharing.shareAsync(uri, {
        mimeType: 'image/png',
        dialogTitle: `${event.name} - Event QR Code`,
        UTI: 'public.png',
      });

      console.log('QR code shared successfully');
    } catch (error) {
      console.error('Failed to share QR code:', error);
      Alert.alert('Share Failed', 'Unable to share QR code. Please try again.');
    }
  };

  const formatDateRange = () => {
    const start = event.startDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    const end = event.endDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    return `${start} - ${end}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#FF6B9D', '#C44CE0', '#7B5EE3']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Success Icon */}
          <View style={styles.successIconContainer}>
            <Text style={styles.successIcon}>✓</Text>
          </View>

          <Text style={styles.title}>Event Created!</Text>
          <Text style={styles.subtitle}>{event.name}</Text>
          <Text style={styles.dateRange}>{formatDateRange()}</Text>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <ViewShot ref={qrRef} options={{ format: 'png', quality: 1.0 }}>
              <View style={styles.qrBackground}>
                <QRCode
                  value={event.id}
                  size={220}
                  backgroundColor="white"
                  color="black"
                />
                <Text style={styles.qrEventName}>{event.name}</Text>
              </View>
            </ViewShot>
          </View>

          <Text style={styles.instructions}>
            Scan this QR code to join the event
          </Text>

          <View style={styles.spacer} />

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.outlineButton} onPress={handleShare}>
              <Text style={styles.outlineButtonIcon}>📤</Text>
              <Text style={styles.outlineButtonText}>Share QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={handleDone}>
              <Text style={styles.buttonText}>Done</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 60,
    alignItems: 'center',
  },
  successIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successIcon: {
    fontSize: 50,
    color: '#00D084',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    fontWeight: '600',
  },
  dateRange: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 32,
  },
  qrContainer: {
    marginBottom: 24,
  },
  qrBackground: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  qrEventName: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  spacer: {
    flex: 1,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    color: '#C44CE0',
    fontWeight: 'bold',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  outlineButtonIcon: {
    fontSize: 16,
    color: '#FFFFFF',
  },
  outlineButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});
