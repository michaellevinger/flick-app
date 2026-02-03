import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, SPACING, TYPOGRAPHY } from '../constants/theme';

export default function CameraScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [photo, setPhoto] = useState(null);
  const cameraRef = useRef(null);

  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>
          HeyU needs camera access to take your selfie
        </Text>
        <TouchableOpacity style={styles.button} onPress={async () => {
          const { status } = await Camera.requestCameraPermissionsAsync();
          setHasPermission(status === 'granted');
        }}>
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
      setPhoto(photo);
    }
  };

  const retakePicture = () => {
    setPhoto(null);
  };

  const confirmPicture = () => {
    navigation.navigate('Setup', { photoUri: photo.uri });
  };

  const pickFromGallery = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.7,
    });

    if (!result.canceled) {
      setPhoto({ uri: result.assets[0].uri });
    }
  };

  if (photo) {
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
      <Camera
        style={styles.camera}
        type="front"
        ref={cameraRef}
      >
        <View style={styles.cameraOverlay}>
          <View style={styles.header}>
            <Text style={styles.title}>Show Your Real Self</Text>
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
      </Camera>
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
    flex: 1,
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
