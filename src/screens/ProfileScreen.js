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
  Platform,
  StatusBar,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../lib/userContext';
import { updateUserBio, updateUserPhoneNumber } from '../lib/database';
import { COLORS, SPACING } from '../constants/theme';

export default function ProfileScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { user, updateSelfie, leaveEvent, logout, refreshUser } = useUser();
  const [bio, setBio] = useState(user?.bio || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleBioChange = (text) => {
    setBio(text);
    setHasChanges(text !== (user?.bio || '') || phoneNumber !== (user?.phoneNumber || ''));
  };

  const handlePhoneNumberChange = (text) => {
    setPhoneNumber(text);
    setHasChanges(bio !== (user?.bio || '') || text !== (user?.phoneNumber || ''));
  };

  const handleSaveChanges = async () => {
    if (!user || !hasChanges) return;

    setIsSaving(true);
    try {
      await updateUserBio(user.id, bio);
      await updateUserPhoneNumber(user.id, phoneNumber);
      await refreshUser();
      setHasChanges(false);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePhoto = () => {
    navigation.navigate('ManagePhotos');
  };

  const handleLogout = () => {
    Alert.alert(
      'Leave Event',
      'Leave this event? Your profile will be saved and you can join another event anytime.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave Event',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveEvent();
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            } catch (error) {
              console.error('Error leaving event:', error);
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              console.error('Error deleting account:', error);
            } finally {
              // Always navigate to Welcome, even if logout fails
              navigation.reset({
                index: 0,
                routes: [{ name: 'Welcome' }],
              });
            }
          },
        },
      ]
    );
  };

  const handleHelpSupport = () => {
    navigation.navigate('HelpSupport');
  };

  const handleNotificationSettings = () => {
    navigation.navigate('NotificationSettings');
  };

  const handleAgeFilter = () => {
    navigation.navigate('AgeRangeScreen', {
      editMode: true,
      ageRangeMin: user.ageRangeMin ?? 20,
      ageRangeMax: user.ageRangeMax ?? 35,
    });
  };

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <TouchableOpacity style={styles.photoSection} onPress={handleChangePhoto}>
            <Image source={{ uri: user.selfieUrl }} style={styles.profilePhoto} />
            <View style={styles.editPhotoButton}>
              <Text style={styles.editPhotoIcon}>✎</Text>
            </View>
          </TouchableOpacity>

          {/* Name Display */}
          <Text style={styles.userName}>{user.name}, {user.age}</Text>

          {/* Profile Card */}
          <View style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bio</Text>
              <TextInput
                style={styles.input}
                value={bio}
                onChangeText={handleBioChange}
                placeholder="Tell others about yourself..."
                placeholderTextColor="#999"
                multiline
                maxLength={150}
              />
              <Text style={styles.charCount}>{bio.length}/150</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number</Text>
              <TextInput
                style={[styles.input, styles.phoneInput]}
                value={phoneNumber}
                onChangeText={handlePhoneNumberChange}
                placeholder="+1 (555) 123-4567"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                maxLength={20}
              />
              <Text style={styles.helperText}>Used only for number exchange after matching</Text>
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[styles.saveButton, (!hasChanges || isSaving) && styles.saveButtonDisabled]}
              onPress={handleSaveChanges}
              disabled={!hasChanges || isSaving}
            >
              <LinearGradient
                colors={hasChanges ? [COLORS.pink, COLORS.purple] : [COLORS.grayDisabled, '#AAAAAA']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Account Section */}
          <Text style={styles.sectionTitle}>Account</Text>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport}>
              <Text style={styles.menuIcon}>💬</Text>
              <Text style={styles.menuText}>Help & Support</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleAgeFilter}>
              <Text style={styles.menuIcon}>🎂</Text>
              <Text style={styles.menuText}>Age Filter</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleNotificationSettings}>
              <Text style={styles.menuIcon}>🔔</Text>
              <Text style={styles.menuText}>Notification Settings</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.menuCard}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
              <Text style={styles.menuIcon}>↪</Text>
              <Text style={styles.menuText}>Leave Event</Text>
              <Text style={styles.menuChevron}>›</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.menuCard, styles.menuCardDanger]}>
            <TouchableOpacity style={styles.menuItem} onPress={handleDeleteAccount}>
              <Text style={[styles.menuIcon, styles.menuIconDanger]}>🗑</Text>
              <Text style={[styles.menuText, styles.menuTextDanger]}>Delete Account</Text>
              <Text style={[styles.menuChevron, styles.menuChevronDanger]}>›</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardView: {
    flex: 1,
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
  },
  backButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 28,
    color: COLORS.black,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  photoSection: {
    alignSelf: 'center',
    marginBottom: SPACING.md,
    position: 'relative',
  },
  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: COLORS.purple,
  },
  editPhotoButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.purple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  editPhotoIcon: {
    fontSize: 14,
    color: COLORS.white,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.black,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.grayMedium,
    marginBottom: SPACING.sm,
  },
  input: {
    fontSize: 16,
    color: COLORS.grayDark,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 12,
    padding: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: COLORS.graySubtle,
    textAlign: 'right',
    marginTop: 4,
  },
  phoneInput: {
    minHeight: 50,
  },
  helperText: {
    fontSize: 12,
    color: COLORS.graySubtle,
    marginTop: 4,
    fontStyle: 'italic',
  },
  saveButton: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.black,
    marginBottom: SPACING.md,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  menuCardDanger: {
    borderColor: COLORS.danger,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  menuIcon: {
    fontSize: 18,
    width: 30,
    textAlign: 'center',
    color: COLORS.grayMedium,
  },
  menuIconDanger: {
    color: COLORS.danger,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: COLORS.grayDark,
    marginLeft: SPACING.sm,
  },
  menuTextDanger: {
    color: COLORS.danger,
  },
  menuChevron: {
    fontSize: 20,
    color: COLORS.grayDisabled,
  },
  menuChevronDanger: {
    color: COLORS.danger,
  },
});
