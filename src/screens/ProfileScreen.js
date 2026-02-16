import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  SafeAreaView,
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { useUser } from '../lib/userContext';
import { updateUserBio } from '../lib/database';

export default function ProfileScreen({ navigation }) {
  const { user, updateSelfie, logout, refreshUser } = useUser();
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveBio = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      await updateUserBio(user.id, bio);
      await refreshUser();
      setIsEditingBio(false);
      Alert.alert('Success', 'Bio updated!');
    } catch (error) {
      console.error('Error saving bio:', error);
      Alert.alert('Error', 'Failed to save bio. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    navigation.navigate('Camera', {
      updatePhoto: true,
      forceReset: Date.now()
    });
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
            navigation.reset({
              index: 0,
              routes: [{ name: 'QRScanner' }],
            });
          } catch (error) {
            console.error('Error during logout:', error);
            navigation.reset({
              index: 0,
              routes: [{ name: 'QRScanner' }],
            });
          }
        },
      },
    ]);
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>♥ flick</Text>
            <Text style={styles.headerTitle}>Profile</Text>
          </View>

          {/* Profile Photo */}
          <TouchableOpacity style={styles.photoContainer} onPress={handleChangePhoto}>
            <Image source={{ uri: user.selfieUrl }} style={styles.profilePhoto} />
            <View style={styles.editPhotoOverlay}>
              <Text style={styles.editPhotoText}>Change Photo</Text>
            </View>
          </TouchableOpacity>

          {/* Name & Age */}
          <View style={styles.nameSection}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userAge}>{user.age} years old</Text>
            {user.height && (
              <Text style={styles.userHeight}>{user.height} cm</Text>
            )}
          </View>

          {/* Bio Section */}
          <View style={styles.bioSection}>
            <View style={styles.bioHeader}>
              <Text style={styles.bioLabel}>About me</Text>
              {!isEditingBio && (
                <TouchableOpacity onPress={() => setIsEditingBio(true)}>
                  <Text style={styles.editButton}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            {isEditingBio ? (
              <View style={styles.bioEditContainer}>
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell others about yourself..."
                  placeholderTextColor="#999"
                  multiline
                  maxLength={150}
                  autoFocus
                />
                <Text style={styles.charCount}>{bio.length}/150</Text>
                <View style={styles.bioActions}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => {
                      setBio(user?.bio || '');
                      setIsEditingBio(false);
                    }}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                    onPress={handleSaveBio}
                    disabled={isSaving}
                  >
                    <Text style={styles.saveButtonText}>
                      {isSaving ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity onPress={() => setIsEditingBio(true)}>
                <Text style={styles.bioText}>
                  {user.bio || 'Tap to add a bio...'}
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.gender || '—'}</Text>
              <Text style={styles.statLabel}>Gender</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{user.lookingFor || '—'}</Text>
              <Text style={styles.statLabel}>Looking for</Text>
            </View>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('DashboardTab')}>
          <Text style={styles.tabIcon}>👥</Text>
          <Text style={styles.tabLabel}>Discover</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem} onPress={() => navigation.navigate('MatchesTab')}>
          <Text style={styles.tabIcon}>💬</Text>
          <Text style={styles.tabLabel}>Matches</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Text style={styles.tabIconActive}>👤</Text>
          <Text style={styles.tabLabelActive}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Platform.OS === 'android' ? 160 : 120,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.green,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000000',
  },
  photoContainer: {
    alignSelf: 'center',
    marginTop: 20,
    position: 'relative',
  },
  profilePhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: COLORS.green,
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingVertical: 8,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
  },
  editPhotoText: {
    color: '#FFFFFF',
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  nameSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
  },
  userAge: {
    fontSize: 18,
    color: '#666666',
    marginTop: 4,
  },
  userHeight: {
    fontSize: 16,
    color: '#888888',
    marginTop: 2,
  },
  bioSection: {
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  bioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    textTransform: 'uppercase',
  },
  editButton: {
    fontSize: 14,
    color: COLORS.green,
    fontWeight: '600',
  },
  bioText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
  },
  bioEditContainer: {
    marginTop: 4,
  },
  bioInput: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'right',
    marginTop: 4,
  },
  bioActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#EEEEEE',
  },
  cancelButtonText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.green,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    textTransform: 'capitalize',
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#DDDDDD',
  },
  logoutButton: {
    marginTop: 32,
    marginHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFF0F0',
    borderWidth: 1,
    borderColor: '#FFCCCC',
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#FF4444',
    fontWeight: '600',
    textAlign: 'center',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    fontSize: 24,
    marginBottom: 4,
    opacity: 0.5,
  },
  tabIconActive: {
    fontSize: 24,
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: 12,
    color: '#888888',
  },
  tabLabelActive: {
    fontSize: 12,
    color: COLORS.green,
    fontWeight: '600',
  },
});
