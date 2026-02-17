import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  Platform,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useUser } from '../lib/userContext';
import { uploadPhotos, updateUserPhotos } from '../lib/database';

export default function ManagePhotosScreen({ navigation }) {
  const { user, refreshUser } = useUser();
  const [photos, setPhotos] = useState(user?.photos || [user?.selfieUrl].filter(Boolean) || []);
  const [isSaving, setIsSaving] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = React.useRef(null);

  const canAddMore = photos.length < 3;

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
      const manipulatedImage = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ flip: ImageManipulator.FlipType.Horizontal }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      setPhotos([...photos, manipulatedImage.uri]);
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const pickFromGallery = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need photo library access to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.7,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos([...photos, result.assets[0].uri]);
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const removePhoto = (index) => {
    Alert.alert(
      'Remove Photo',
      index === 0 ? 'Remove your main photo?' : 'Remove this photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setPhotos(photos.filter((_, i) => i !== index));
          },
        },
      ]
    );
  };

  const setAsMain = (index) => {
    if (index === 0) return; // Already main

    const newPhotos = [...photos];
    const [selectedPhoto] = newPhotos.splice(index, 1);
    newPhotos.unshift(selectedPhoto);
    setPhotos(newPhotos);
  };

  const handleSave = async () => {
    if (photos.length === 0) {
      Alert.alert('Add at least 1 photo', 'You need at least one photo for your profile.');
      return;
    }

    setIsSaving(true);
    try {
      // Upload new photos if they're local URIs (not already uploaded)
      const uploadedPhotos = [];
      for (const photoUri of photos) {
        if (photoUri.startsWith('http')) {
          // Already uploaded, keep the URL
          uploadedPhotos.push(photoUri);
        } else {
          // Local URI, needs to be uploaded
          const uploaded = await uploadPhotos(user.id, [photoUri]);
          uploadedPhotos.push(...uploaded);
        }
      }

      // Update user's photos in database
      await updateUserPhotos(user.id, uploadedPhotos);

      // Refresh user data
      await refreshUser();

      Alert.alert('Success', 'Photos updated!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving photos:', error);
      Alert.alert('Error', 'Failed to save photos. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenCamera = async () => {
    if (!permission) {
      await requestPermission();
      return;
    }
    if (!permission.granted) {
      await requestPermission();
      return;
    }
    setShowCamera(true);
  };

  if (showCamera) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <CameraView
          style={styles.camera}
          facing="front"
          ref={cameraRef}
        />

        {/* Top Bar */}
        <View style={styles.cameraTopBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => setShowCamera(false)}>
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Actions */}
        <View style={styles.cameraBottomBar}>
          <Text style={styles.cameraTitle}>Take a Photo</Text>
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Photos</Text>
        <TouchableOpacity
          onPress={handleSave}
          disabled={isSaving}
          style={styles.saveButton}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#C44CE0" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Add up to 3 photos • Tap to set as main
        </Text>

        {/* Photo Grid */}
        <View style={styles.photoGrid}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.photoTile}>
              <TouchableOpacity
                onPress={() => setAsMain(index)}
                activeOpacity={0.8}
              >
                <Image source={{ uri }} style={styles.photo} />
                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Main</Text>
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removePhoto(index)}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Photo Tile */}
          {canAddMore && (
            <TouchableOpacity
              style={styles.addPhotoTile}
              onPress={() => {
                Alert.alert(
                  'Add Photo',
                  'Choose how to add a photo',
                  [
                    { text: 'Take Photo', onPress: handleOpenCamera },
                    { text: 'Choose from Gallery', onPress: pickFromGallery },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.plusIcon}>+</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Tap any photo to set it as your main photo. Your main photo is shown first on your profile.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12,
  },
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 32,
    color: '#000000',
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#C44CE0',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    marginHorizontal: -6,
  },
  photoTile: {
    width: '31.33%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  mainBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: '#C44CE0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    lineHeight: 14,
  },
  addPhotoTile: {
    width: '31.33%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  plusIcon: {
    fontSize: 48,
    color: '#CCCCCC',
    fontWeight: '300',
    lineHeight: 48,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  // Camera styles
  camera: {
    flex: 1,
  },
  cameraTopBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 40,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  cameraBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: 30,
    alignItems: 'center',
    gap: 16,
  },
  cameraTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
});
