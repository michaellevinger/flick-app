import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../lib/userContext';
import { uploadPhotos, deleteSelfie } from '../lib/database';

export default function CameraScreen({ navigation, route }) {
  const { user, isLoading, updateSelfie } = useUser();
  const forceReset = route?.params?.forceReset;
  const updatePhoto = route?.params?.updatePhoto;

  // Initialize photo state
  const [photo, setPhoto] = useState(null);
  const [key, setKey] = useState(Date.now()); // Unique key for camera remount
  const [isUpdating, setIsUpdating] = useState(false);
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

  // Check if user exists and navigate to Dashboard (unless we're updating photo)
  useEffect(() => {
    if (!isLoading && user && !updatePhoto) {
      // Clear photo before navigating to Dashboard
      setPhoto(null);
      navigation.replace('Dashboard');
    }
  }, [user, isLoading, navigation, updatePhoto]);

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
        <LinearGradient
          colors={['#FF6B9D', '#C44CE0', '#7B5EE3']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
        </LinearGradient>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={['#FF6B9D', '#C44CE0', '#7B5EE3']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <SafeAreaView style={styles.permissionContent}>
            <Text style={styles.permissionTitle}>Camera Access</Text>
            <Text style={styles.permissionText}>
              flick needs camera access to take your selfie
            </Text>
            <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
              <Text style={styles.grantButtonText}>Grant Camera Access</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipLink} onPress={pickFromGallery}>
              <Text style={styles.skipLinkText}>Choose from Gallery Instead</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  const takePicture = async () => {
    if (!cameraRef.current) {
      Alert.alert('Error', 'Camera not ready. Please try again.');
      return;
    }

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        exif: true,
      });

      // Fix orientation for front-facing camera
      // Front camera often needs horizontal flip
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      hasResetRef.current = false; // Clear reset flag when taking new photo
      setPhoto(manipulatedImage);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert(
        'Camera Not Available',
        'Camera capture is not working on this device. Please use "Choose from Gallery" instead.',
        [{ text: 'OK' }]
      );
    }
  };

  const retakePicture = () => {
    hasResetRef.current = false; // Clear reset flag when retaking
    setPhoto(null);
  };

  const confirmPicture = async () => {
    // If updating existing photo, upload and update immediately
    if (updatePhoto && user) {
      setIsUpdating(true);
      try {
        // Delete old selfie
        if (user.selfieUrl) {
          await deleteSelfie(user.selfieUrl);
        }

        // Upload new selfie
        const [newSelfieUrl] = await uploadPhotos(user.id, [photo.uri]);

        // Update user using context
        await updateSelfie(newSelfieUrl);

        // Navigate back to Dashboard
        navigation.navigate('Dashboard');
      } catch (error) {
        console.error('Error updating photo:', error);
        Alert.alert('Error', 'Failed to update photo. Please try again.');
        setIsUpdating(false);
      }
    } else {
      // New profile creation flow
      navigation.navigate('Setup', { photoUri: photo.uri });
    }
  };

  const pickFromGallery = async () => {
    try {
      // Request media library permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need photo library access to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square crop - most flexible and clear
        quality: 0.8,
        presentationStyle: 'fullScreen',
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhoto({ uri: result.assets[0].uri });
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  // Don't show photo preview if we're in force reset mode or if reset has been triggered
  // Show preview if: we have a photo AND not resetting AND (no user OR updating existing photo)
  const shouldShowPreview = photo && !forceReset && !hasResetRef.current && (!user || updatePhoto);

  if (shouldShowPreview) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <Image source={{ uri: photo.uri }} style={styles.preview} />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.previewOverlay}
        >
          <View style={styles.previewActions}>
            <TouchableOpacity
              style={styles.retakeButton}
              onPress={retakePicture}
              disabled={isUpdating}
            >
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmButton, isUpdating && { opacity: 0.6 }]}
              onPress={confirmPicture}
              disabled={isUpdating}
            >
              {isUpdating ? (
                <ActivityIndicator color="#C44CE0" />
              ) : (
                <Text style={styles.confirmButtonText}>Looks Good</Text>
              )}
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <CameraView
        key={key}
        style={styles.camera}
        facing="front"
        ref={cameraRef}
      />

      {/* Top Gradient */}
      <LinearGradient
        colors={['#FF6B9D', '#C44CE0', 'transparent']}
        style={styles.topGradient}
      />

      {/* Bottom Gradient */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.8)']}
        style={styles.bottomGradient}
      >
        <View style={styles.actions}>
          <Text style={styles.title}>Show Your Real Self</Text>
          <Text style={styles.subtitle}>Take a fresh selfie</Text>

          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.galleryButton} onPress={pickFromGallery}>
            <Text style={styles.galleryButtonText}>Choose from Gallery</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
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
  permissionContent: {
    flex: 1,
    justifyContent: 'center',
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
  topGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'ios' ? 120 : 80,
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: 60,
  },
  actions: {
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 16,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
  },
  captureButtonInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },
  galleryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  galleryButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  preview: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: 40,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  retakeButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  retakeButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 30,
  },
  confirmButtonText: {
    fontSize: 16,
    color: '#C44CE0',
    fontWeight: '600',
  },
});
