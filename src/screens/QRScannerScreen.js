import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { validateAndJoinFestival } from '../lib/database';

export default function QRScannerScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const handleClose = () => {
    navigation.goBack();
  };

  const handleSkip = () => {
    handleBarCodeScanned({ data: 'coachella2024' });
  };

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || isJoining) return;

    setScanned(true);
    setIsJoining(true);

    try {
      const festival = await validateAndJoinFestival(null, data);

      if (festival) {
        await AsyncStorage.setItem('festivalId', data);

        Alert.alert(
          'Welcome!',
          `You're now in ${festival.name}${festival.sponsor_name ? ` sponsored by ${festival.sponsor_name}` : ''}`,
          [
            {
              text: 'Create Profile',
              onPress: () => {
                navigation.replace('Camera', { festivalId: data });
              },
            },
          ]
        );
      } else {
        Alert.alert('Invalid QR Code', 'This event code is not valid or has expired.', [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setIsJoining(false);
            },
          },
        ]);
      }
    } catch (error) {
      console.error('Error joining festival:', error);
      Alert.alert('Error', 'Failed to join event. Please try again.', [
        {
          text: 'Try Again',
          onPress: () => {
            setScanned(false);
            setIsJoining(false);
          },
        },
      ]);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FF6B9D', '#C44CE0']} style={styles.gradient}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </LinearGradient>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#FF6B9D', '#C44CE0']} style={styles.gradient}>
          <View style={styles.permissionContainer}>
            <Text style={styles.permissionTitle}>Camera Access</Text>
            <Text style={styles.permissionText}>
              flick needs camera access to scan event QR codes
            </Text>
            <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
              <Text style={styles.grantButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipLink} onPress={handleSkip}>
              <Text style={styles.skipLinkText}>Skip - Join Test Event</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#FF6B9D', '#C44CE0']} style={styles.headerGradient} />

      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
        <Text style={styles.closeButtonText}>✕</Text>
      </TouchableOpacity>

      {/* Scan Frame Overlay */}
      <View style={styles.overlay}>
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        <Text style={styles.instructionText}>Position QR code within the frame</Text>
        <Text style={styles.hintText}>Pinch to zoom in or out</Text>

        {/* Skip button for testing */}
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip - Join Test Event</Text>
        </TouchableOpacity>
      </View>

      {isJoining && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Joining event...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 100 : 60,
    zIndex: 10,
  },
  permissionContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  permissionText: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
    marginBottom: 32,
    lineHeight: 24,
  },
  grantButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  grantButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C44CE0',
  },
  skipLink: {
    marginTop: 24,
    paddingVertical: 12,
  },
  skipLinkText: {
    fontSize: 16,
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  camera: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    right: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
  },
  closeButtonText: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 280,
    height: 280,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.8)',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
  },
  topLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFFFFF',
    borderTopLeftRadius: 24,
  },
  topRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFFFFF',
    borderTopRightRadius: 24,
  },
  bottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
  },
  bottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderColor: '#FFFFFF',
    borderBottomRightRadius: 24,
  },
  instructionText: {
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 32,
    fontWeight: '500',
  },
  hintText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
  },
  skipButton: {
    marginTop: 40,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  skipButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 16,
  },
});
