import React, { useState, useEffect } from 'react';
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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
// TEMPORARY: DraggableFlatList removed to fix Worklets version mismatch
// import DraggableFlatList from 'react-native-draggable-flatlist';
import { useUser } from '../lib/userContext';
import { COLORS, SPACING } from '../constants/theme';
import { uploadPhotos, updateUserPhotos } from '../lib/database';

export default function ManagePhotosScreen({ navigation }) {
  const { user, refreshUser } = useUser();
  const [photos, setPhotos] = useState(user?.photos || [user?.selfieUrl].filter(Boolean) || []);
  const [isSaving, setIsSaving] = useState(false);
  const [brokenImages, setBrokenImages] = useState(new Set());

  // Refresh photos from user context when screen gains focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('ManagePhotosScreen focused, user.photos:', user?.photos);
      if (user?.photos && user.photos.length > 0) {
        setPhotos(user.photos);
        setBrokenImages(new Set()); // Reset broken images tracker
      } else if (user?.selfieUrl) {
        // Fallback to selfie URL if no photos array
        setPhotos([user.selfieUrl]);
        setBrokenImages(new Set());
      }
    }, [user?.photos, user?.selfieUrl])
  );

  const canAddMore = photos.length < 3;


  const takePhotoWithCrop = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'We need camera access to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1], // Square crop - most flexible and clear
        quality: 0.8,
        cameraType: 'front',
        presentationStyle: 'fullScreen',
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        // Prevent duplicate photos
        if (!photos.includes(newUri)) {
          setPhotos([...photos, newUri]);
        }
      }
    } catch (error) {
      console.error('Error taking photo:', error);
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
        allowsEditing: true,
        allowsMultipleSelection: false,
        aspect: [1, 1], // Square crop - most flexible and clear
        quality: 0.8,
        presentationStyle: 'fullScreen',
        selectionLimit: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newUri = result.assets[0].uri;
        // Prevent duplicate photos
        if (!photos.includes(newUri)) {
          setPhotos([...photos, newUri]);
        }
      }
    } catch (error) {
      console.error('Error picking from gallery:', error);
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    }
  };

  const removePhoto = (index) => {
    Alert.alert(
      'Remove Photo',
      index === 0
        ? 'Remove your main photo? The next photo will become your main photo.'
        : 'Remove this photo?',
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

  const movePhotoUp = (index) => {
    if (index === 0) return; // Can't move first item up
    const newPhotos = [...photos];
    [newPhotos[index - 1], newPhotos[index]] = [newPhotos[index], newPhotos[index - 1]];
    setPhotos(newPhotos);
  };

  const movePhotoDown = (index) => {
    if (index === photos.length - 1) return; // Can't move last item down
    const newPhotos = [...photos];
    [newPhotos[index], newPhotos[index + 1]] = [newPhotos[index + 1], newPhotos[index]];
    setPhotos(newPhotos);
  };

  const handleSave = async () => {
    if (photos.length === 0) {
      Alert.alert('Add at least 1 photo', 'You need at least one photo for your profile.');
      return;
    }

    console.log('Starting photo save...', { photoCount: photos.length, userId: user?.id });
    setIsSaving(true);
    try {
      // Remove duplicates from photos array
      const uniquePhotos = [...new Set(photos)];
      console.log('Unique photos count:', uniquePhotos.length);

      // Upload new photos if they're local URIs (not already uploaded)
      const uploadedPhotos = [];
      for (const photoUri of uniquePhotos) {
        console.log('Processing photo:', photoUri.substring(0, 50) + '...');
        if (photoUri.startsWith('http')) {
          // Already uploaded, keep the URL
          console.log('Photo already uploaded, keeping URL');
          uploadedPhotos.push(photoUri);
        } else {
          // Local URI, needs to be uploaded
          console.log('Uploading new photo...');
          const uploaded = await uploadPhotos(user.id, [photoUri]);
          console.log('Photo uploaded successfully:', uploaded);
          uploadedPhotos.push(...uploaded);
        }
      }

      console.log('All photos processed, updating database...', uploadedPhotos);
      // Update user's photos in database
      await updateUserPhotos(user.id, uploadedPhotos);
      console.log('Database updated successfully');

      // Refresh user data
      console.log('Refreshing user data...');
      await refreshUser();
      console.log('User data refreshed');

      Alert.alert('Success', 'Photos updated!', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error('Error saving photos:', error);
      Alert.alert('Error', `Failed to save photos: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };


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
            <ActivityIndicator size="small" color={COLORS.purple} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <Text style={styles.subtitle}>
          Add up to 3 photos • Use ↑↓ to reorder
        </Text>

        {/* Empty State */}
        {photos.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📷</Text>
            <Text style={styles.emptyStateTitle}>No photos yet</Text>
            <Text style={styles.emptyStateText}>
              Add up to 3 photos to your profile
            </Text>
            <TouchableOpacity
              style={styles.addPhotoButton}
              onPress={() => {
                Alert.alert(
                  'Add Photo',
                  'Choose how to add a photo',
                  [
                    { text: 'Take Photo', onPress: takePhotoWithCrop },
                    { text: 'Choose from Gallery', onPress: pickFromGallery },
                    { text: 'Cancel', style: 'cancel' }
                  ]
                );
              }}
            >
              <Text style={styles.addPhotoButtonText}>Add Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoGrid}>
          {photos.map((item, index) => (
            <View key={index} style={styles.photoTile}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.photoTouchable}
                onPress={() => {
                  navigation.navigate('PhotoView', {
                    photos: photos,
                    initialIndex: index,
                  });
                }}
              >
                {brokenImages.has(item) ? (
                  <View style={styles.brokenImageContainer}>
                    <Text style={styles.brokenImageIcon}>⚠️</Text>
                    <Text style={styles.brokenImageText}>Failed to load</Text>
                    <TouchableOpacity
                      style={styles.replaceButton}
                      onPress={() => {
                        Alert.alert(
                          'Replace Photo',
                          'Choose a new photo',
                          [
                            {
                              text: 'Take Photo',
                              onPress: async () => {
                                const oldPhotos = [...photos];
                                oldPhotos.splice(index, 1);
                                setPhotos(oldPhotos);
                                await takePhotoWithCrop();
                                setBrokenImages(prev => {
                                  const next = new Set(prev);
                                  next.delete(item);
                                  return next;
                                });
                              }
                            },
                            {
                              text: 'Choose from Gallery',
                              onPress: async () => {
                                const oldPhotos = [...photos];
                                oldPhotos.splice(index, 1);
                                setPhotos(oldPhotos);
                                await pickFromGallery();
                                setBrokenImages(prev => {
                                  const next = new Set(prev);
                                  next.delete(item);
                                  return next;
                                });
                              }
                            },
                            { text: 'Cancel', style: 'cancel' }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.replaceButtonText}>Replace</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Image
                    source={{ uri: item }}
                    style={styles.photo}
                    onError={(error) => {
                      console.error('Image load error:', error.nativeEvent.error, 'URI:', item);
                      setBrokenImages(prev => new Set(prev).add(item));
                    }}
                    onLoad={() => {
                      console.log('Image loaded successfully:', item?.substring(0, 50));
                      setBrokenImages(prev => {
                        const next = new Set(prev);
                        next.delete(item);
                        return next;
                      });
                    }}
                  />
                )}
                {index === 0 && (
                  <View style={styles.mainBadge}>
                    <Text style={styles.mainBadgeText}>Main</Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Reorder buttons - overlay at bottom */}
              {photos.length > 1 && (
                <View style={styles.reorderButtons}>
                  <TouchableOpacity
                    style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
                    onPress={() => movePhotoUp(index)}
                    disabled={index === 0}
                  >
                    <Text style={[styles.reorderButtonText, index === 0 && styles.reorderButtonTextDisabled]}>↑</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.reorderButton, index === photos.length - 1 && styles.reorderButtonDisabled]}
                    onPress={() => movePhotoDown(index)}
                    disabled={index === photos.length - 1}
                  >
                    <Text style={[styles.reorderButtonText, index === photos.length - 1 && styles.reorderButtonTextDisabled]}>↓</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Remove button */}
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
                    { text: 'Take Photo', onPress: takePhotoWithCrop },
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
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Drag to reorder photos. When adding photos, you can crop them before adding. Your first photo is your main profile photo.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.grayLight,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.grayBorder,
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
    color: COLORS.black,
    fontWeight: '300',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
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
    color: COLORS.purple,
  },
  content: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: 100,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.grayMedium,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.lg,
    marginHorizontal: -6,
  },
  photoTile: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: COLORS.white,
    marginHorizontal: 6,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  photoTileActive: {
    opacity: 0.8,
    borderColor: COLORS.purple,
    borderWidth: 2,
  },
  photoTouchable: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  reorderButtons: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    right: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  reorderButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.purple,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reorderButtonDisabled: {
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderColor: COLORS.grayDisabled,
  },
  reorderButtonText: {
    fontSize: 18,
    color: COLORS.purple,
    fontWeight: 'bold',
  },
  reorderButtonTextDisabled: {
    color: COLORS.grayDisabled,
  },
  dragHandle: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  dragHandleText: {
    fontSize: 24,
    color: COLORS.white,
    fontWeight: 'bold',
  },
  mainBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  mainBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.purple,
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
    color: COLORS.white,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  addPhotoTile: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.grayDisabled,
    borderStyle: 'dashed',
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
    marginBottom: 12,
  },
  plusButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.white,
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
    color: COLORS.purple,
    fontWeight: '300',
    lineHeight: 36,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: SPACING.md,
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    marginTop: SPACING.lg,
    marginBottom: 40,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.grayMedium,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: SPACING.md,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.sm,
  },
  emptyStateText: {
    fontSize: 16,
    color: COLORS.grayMedium,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: 40,
  },
  addPhotoButton: {
    backgroundColor: COLORS.purple,
    paddingVertical: 14,
    paddingHorizontal: SPACING.xl,
    borderRadius: 24,
  },
  addPhotoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  brokenImageContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.sm,
  },
  brokenImageIcon: {
    fontSize: 32,
    marginBottom: 4,
  },
  brokenImageText: {
    fontSize: 12,
    color: COLORS.grayMedium,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  replaceButton: {
    backgroundColor: COLORS.purple,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  replaceButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
  },
});
