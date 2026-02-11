import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';
import { validateAndJoinFestival } from '../lib/database';

export default function QRScannerScreen({ navigation, route }) {
  const { user, updateUser } = useUser();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const fromSetup = route?.params?.fromSetup;

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          flick needs camera access to scan festival QR codes
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Camera Access</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarCodeScanned = async ({ type, data }) => {
    if (scanned || isJoining) return;
    
    setScanned(true);
    setIsJoining(true);

    try {
      // Validate festival code and join
      const festival = await validateAndJoinFestival(user.id, data);
      
      if (festival) {
        // Update user context with festival info
        await updateUser({ festival_id: data });
        
        Alert.alert(
          'Welcome!',
          `You're now in ${festival.name}${festival.sponsor_name ? ` sponsored by ${festival.sponsor_name}` : ''}`,
          [
            {
              text: 'Start Flicking',
              onPress: () => {
                if (fromSetup) {
                  navigation.replace('Dashboard');
                } else {
                  navigation.goBack();
                }
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Invalid QR Code',
          'This festival code is not valid or has expired.',
          [
            {
              text: 'Try Again',
              onPress: () => {
                setScanned(false);
                setIsJoining(false);
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error joining festival:', error);
      Alert.alert(
        'Error',
        'Failed to join festival. Please try again.',
        [
          {
            text: 'Try Again',
            onPress: () => {
              setScanned(false);
              setIsJoining(false);
            }
          }
        ]
      );
    }
  };

  const handleSkip = () => {
    // For testing: allow skip and join default festival
    if (__DEV__) {
      Alert.alert(
        'Skip QR Scan',
        'Join test festival for development?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setScanned(false)
          },
          {
            text: 'Join Test Festival',
            onPress: async () => {
              await handleBarCodeScanned({ data: 'coachella2024' });
            }
          }
        ]
      );
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      />
      <View style={styles.overlay}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan Festival QR Code</Text>
          <Text style={styles.subtitle}>Point your camera at the festival QR code</Text>
        </View>

        <View style={styles.scanArea}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {__DEV__ && (
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip (Dev Only)</Text>
          </TouchableOpacity>
        )}

        {isJoining && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.green} />
            <Text style={styles.loadingText}>Joining festival...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  permissionText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.green,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    marginHorizontal: SPACING.xl,
  },
  buttonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.black,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: SPACING.lg,
    borderRadius: 12,
  },
  title: {
    ...TYPOGRAPHY.title,
    color: COLORS.white,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    marginTop: SPACING.sm,
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.green,
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.white,
  },
  skipText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.white,
    marginTop: SPACING.md,
  },
});
