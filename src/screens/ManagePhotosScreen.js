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
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
// TEMPORARY: DraggableFlatList removed to fix Worklets version mismatch
// import DraggableFlatList from 'react-native-draggable-flatlist';
import { useUser } from '../lib/userContext';
import { uploadPhotos, updateUserPhotos } from '../lib/database';

export default function ManagePhotosScreen({ navigation }) {
  const { user, refreshUser } = useUser();
  const [photos, setPhotos] = useState(user?.photos || [user?.selfieUrl].filter(Boolean) || []);
  const [isSaving, setIsSaving] = useState(false);

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
        aspect: [4, 5],
        quality: 0.7,
        cameraType: ImagePicker.CameraType.front,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotos([...photos, result.assets[0].uri]);
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
        aspect: [4, 5],
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

  // TEMPORARY: Drag-to-reorder disabled
  // const handleReorder = ({ data }) => {
  //   setPhotos(data);
  // };

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

      <View style={styles.content}>
        <Text style={styles.subtitle}>
          Add up to 3 photos
        </Text>

        {/* Photo List (drag-to-reorder temporarily disabled) */}
        <FlatList
          data={photos}
          keyExtractor={(item, index) => `photo-${index}`}
          renderItem={({ item, index }) => {
            return (
              <View style={styles.photoTile}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.photoTouchable}
                >
                  <Image source={{ uri: item }} style={styles.photo} />
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
            );
          }}
          ListFooterComponent={
            canAddMore ? (
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
                <Text style={styles.plusIcon}>+</Text>
                <Text style={styles.addPhotoText}>Add Photo</Text>
              </TouchableOpacity>
            ) : null
          }
          contentContainerStyle={styles.photoList}
        />

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoText}>
            Drag to reorder photos. When adding photos, you can crop them before adding. Your first photo is your main profile photo.
          </Text>
        </View>
      </View>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  photoList: {
    paddingBottom: 24,
  },
  photoTile: {
    height: 120,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEEEEE',
    flexDirection: 'row',
  },
  photoTileActive: {
    opacity: 0.8,
    borderColor: '#C44CE0',
    borderWidth: 2,
  },
  photoTouchable: {
    flex: 1,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
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
    color: '#FFFFFF',
    fontWeight: 'bold',
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
    height: 120,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    borderStyle: 'dashed',
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  plusIcon: {
    fontSize: 36,
    color: '#CCCCCC',
    fontWeight: '300',
    lineHeight: 36,
    marginBottom: 4,
  },
  addPhotoText: {
    fontSize: 14,
    color: '#999999',
    fontWeight: '500',
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
});
