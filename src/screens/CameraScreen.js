import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';
import { useUser } from '../lib/userContext';

export default function CameraScreen({ navigation, route }) {
  const { user, isLoading } = useUser();
  const forceReset = route?.params?.forceReset;

  // Initialize photo state - if forceReset is present, start with null
  const [photo, setPhoto] = useState(forceReset ? null : null);
  const [key, setKey] = useState(Date.now()); // Unique key for camera remount
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const hasResetRef = useRef(false);

  // Immediate synchronous reset on forceReset - runs before any render
  if (forceReset && !hasResetRef.current) {
    hasResetRef.current = true;
    console.log('Force reset detected - preventing photo display');
  }

  // Clear forceReset param immediately
  useEffect(() => {
    if (forceReset && navigation.setParams) {
      navigation.setParams({ forceReset: undefined });
    }
  }, [forceReset, navigation]);

  // Check if user exists and navigate to Dashboard
  useEffect(() => {
    if (!isLoading && user) {
      // Clear photo before navigating to Dashboard
      setPhoto(null);
      navigation.replace('Dashboard');
    }
  }, [user, isLoading, navigation]);

  // Reset on screen focus
  useFocusEffect(
    React.useCallback(() => {
      // Reset ref when screen comes into focus
      hasResetRef.current = false;

      // If we just came from logout, ensure photo is cleared
      if (route?.params?.forceReset) {
        console.log('Focus effect - force clearing photo');
        setPhoto(null);
        setKey(Date.now());
      }
    }, [route?.params?.forceReset])
  );

  // Show loading while checking user or permissions
  if (isLoading || !permission) {
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
          Flick needs camera access to take your selfie
        </Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Access</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={pickFromGallery}>
          <Text style={styles.skipButtonText}>Choose from Gallery Instead</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });
      hasResetRef.current = false; // Clear reset flag when taking new photo
      setPhoto(photo);
    }
  };

  const retakePicture = () => {
    hasResetRef.current = false; // Clear reset flag when retaking
    setPhoto(null);
  };

  const confirmPicture = () => {
    navigation.navigate('Setup', { photoUri: photo.uri });
  };

  const pickFromGallery = async () => {
    // Request media library permissions first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need camera roll permissions to select photos!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false, // Skip crop screen for simpler UX
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPhoto({ uri: result.assets[0].uri });
    }
  };

  // Don't show photo preview if we're in force reset mode or if reset has been triggered
  // Only show preview if we have a photo AND we're not resetting AND user doesn't exist (new profile flow)
  const shouldShowPreview = photo && !forceReset && !hasResetRef.current && !user;

  if (shouldShowPreview) {
    return (
      <View style={styles.container}>
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <View style={styles.previewActions}>
          <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
            <Text style={styles.buttonText}>Retake</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.confirmButton} onPress={confirmPicture}>
            <Text style={styles.buttonText}>Looks Good</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        key={key}
        style={styles.camera}
        facing="front"
        ref={cameraRef}
      />
      <View style={styles.cameraOverlay}>
        <View style={styles.header}>
          <Text style={styles.title}>You are beautiful!</Text>
          <Text style={styles.subtitle}>Take a fresh selfie</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  buttonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.black,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  skipButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.gray,
    textDecorationLine: 'underline',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  cameraOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xxl,
  },
  header: {
    alignItems: 'center',
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
  actions: {
    alignItems: 'center',
    gap: SPACING.lg,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: COLORS.green,
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.green,
  },
  galleryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  galleryButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.white,
    fontWeight: '500',
  },
  preview: {
    width: '100%',
    height: '80%',
    resizeMode: 'cover',
  },
  previewActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingVertical: SPACING.lg,
  },
  retakeButton: {
    backgroundColor: COLORS.gray,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
  confirmButton: {
    backgroundColor: COLORS.green,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: 8,
  },
});
