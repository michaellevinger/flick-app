import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
  StatusBar,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../lib/userContext';
import { clearPendingFestivalId } from '../lib/deepLinking';

export default function PhotosScreen({ route, navigation }) {
  const { createUser } = useUser();
  const { name, gender, age, height, lookingFor, phoneNumber, bio, festivalId, ageRangeMin, ageRangeMax } = route.params;

  const [photos, setPhotos] = useState([]);
  const [showCamera, setShowCamera] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const canAddMore = photos.length < 3;
  const hasMinimum = photos.length >= 1;

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
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleFinish = async () => {
    if (!hasMinimum) {
      Alert.alert('Add at least 1 photo', 'Please add at least one photo to continue.');
      return;
    }

    if (isCreating) return;

    setIsCreating(true);
    try {
      await createUser({
        name,
        gender,
        age,
        height,
        lookingFor,
        phoneNumber: phoneNumber?.trim() || null,
        bio: bio?.trim() || null,
        festivalId,
        photoUris: photos, // Array of photo URIs
        ageRangeMin: ageRangeMin ?? 20,
        ageRangeMax: ageRangeMax ?? 35,
      });
      await clearPendingFestivalId();
      if (festivalId) {
        navigation.replace('Dashboard');
      } else {
        // Profile created — now scan QR to join an event
        navigation.replace('QRScanner');
      }
    } catch (error) {
      console.error('Error creating user:', error);
      Alert.alert('Error', 'Failed to create profile. Please try again.');
      setIsCreating(false);
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
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cameraBottomGradient}
        >
          <View style={styles.cameraActions}>
            <Text style={styles.cameraTitle}>Take a Photo</Text>
            <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </View>
    );
  }

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
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '85%' }]} />
            </View>

            <Text style={styles.title}>Add your best{'\n'}photos</Text>
            <Text style={styles.subtitle}>
              Add 1-3 photos • First will be your main
            </Text>

            {/* Photo Grid - 3 columns */}
            <View style={styles.photoGrid}>
              {photos.map((uri, index) => (
                <View key={index} style={styles.photoTile}>
                  <Image source={{ uri }} style={styles.photo} />
                  {index === 0 && (
                    <View style={styles.mainBadge}>
                      <Text style={styles.mainBadgeText}>Main</Text>
                    </View>
                  )}
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
                  <View style={styles.plusButton}>
                    <Text style={styles.plusIcon}>+</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* Info Box */}
            <View style={styles.infoBox}>
              <Text style={styles.infoIcon}>💡</Text>
              <Text style={styles.infoText}>
                Profiles with 3 photos get 5x more matches!
              </Text>
            </View>

            <View style={styles.spacer} />

            {/* Finish Button */}
            <TouchableOpacity
              style={[styles.nextButton, (!hasMinimum || isCreating) && styles.nextButtonDisabled]}
              onPress={handleFinish}
              disabled={!hasMinimum || isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.arrowContainer}>
                  <View style={styles.arrowLine} />
                  <View style={styles.arrowHead} />
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 20 : 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    marginBottom: 40,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginBottom: 32,
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
    backgroundColor: 'rgba(255,255,255,0.9)',
    marginHorizontal: 6,
    marginBottom: 12,
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#C44CE0',
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
    borderColor: 'rgba(255,255,255,0.5)',
    borderStyle: 'dashed',
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plusIcon: {
    fontSize: 36,
    color: '#C44CE0',
    fontWeight: '300',
    lineHeight: 36,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  spacer: {
    height: 40,
  },
  nextButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  nextButtonDisabled: {
    opacity: 0.3,
  },
  arrowContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  arrowLine: {
    width: 20,
    height: 2.5,
    backgroundColor: '#C44CE0',
    borderRadius: 2,
  },
  arrowHead: {
    position: 'absolute',
    right: 0,
    width: 8,
    height: 8,
    borderTopWidth: 2.5,
    borderRightWidth: 2.5,
    borderColor: '#C44CE0',
    transform: [{ rotate: '45deg' }],
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
  cameraBottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
    paddingTop: 60,
  },
  cameraActions: {
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
