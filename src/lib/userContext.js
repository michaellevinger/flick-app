import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import {
  upsertUser,
  updateUserStatus,
  uploadPhotos,
  deleteSelfie,
  deleteUser,
} from './database';
import { deleteAllFlicksForUser } from './flicks';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);

        // Ensure status is always a boolean
        parsedUser.status = Boolean(parsedUser.status);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = async (userData) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  const createUser = async ({ name, age, height, photoUri, photoUris, phoneNumber, gender, lookingFor, festivalId, bio }) => {
    try {
      // Generate a unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Upload photos (support both single photoUri and multiple photoUris)
      let photoUrls = [];
      if (photoUris && photoUris.length > 0) {
        // New flow: multiple photos
        photoUrls = await uploadPhotos(userId, photoUris);
      } else if (photoUri) {
        // Old flow: single photo (backward compatibility)
        photoUrls = await uploadPhotos(userId, [photoUri]);
      }

      // First photo is the main selfie
      const selfieUrl = photoUrls[0];

      // Create user in database
      const userData = await upsertUser({
        id: userId,
        name,
        age,
        height,
        selfieUrl,
        photos: photoUrls, // Store all photo URLs
        status: true, // Default to ON
        phoneNumber,
        gender,
        lookingFor,
        festivalId,
        bio,
      });

      // Save to local storage
      const userToSave = {
        id: userId,
        name,
        age,
        height,
        selfieUrl,
        photos: photoUrls,
        status: true,
        phoneNumber,
        gender,
        lookingFor,
        festival_id: festivalId,
        bio,
        notificationPreferences: { matches: true, messages: true, flicks: true, exchanges: true },
      };

      await saveUser(userToSave);

      return userToSave;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const toggleStatus = async (newStatus) => {
    if (!user) return;

    try {
      await updateUserStatus(user.id, newStatus);
      await saveUser({ ...user, status: newStatus });
    } catch (error) {
      console.error('Error toggling status:', error);
      throw error;
    }
  };

  const updateUser = async (updates) => {
    if (!user) return;

    try {
      // Merge updates with current user data
      const updatedUser = { ...user, ...updates };

      // Update user in database
      await upsertUser({
        id: user.id,
        name: updatedUser.name,
        age: updatedUser.age,
        height: updatedUser.height,
        selfieUrl: updatedUser.selfieUrl,
        status: updatedUser.status,
        phoneNumber: updatedUser.phoneNumber,
        gender: updatedUser.gender,
        lookingFor: updatedUser.lookingFor,
        festivalId: updatedUser.festival_id,
        bio: updatedUser.bio,
      });

      // Update local state and storage
      await saveUser(updatedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const updateSelfie = async (newSelfieUrl) => {
    if (!user) return;

    try {
      // Update user in database
      await upsertUser({
        id: user.id,
        name: user.name,
        age: user.age,
        height: user.height,
        selfieUrl: newSelfieUrl,
        status: user.status,
        phoneNumber: user.phoneNumber,
        gender: user.gender,
        lookingFor: user.lookingFor,
      });

      // Update local state and storage
      const updatedUser = { ...user, selfieUrl: newSelfieUrl };
      await saveUser(updatedUser);
    } catch (error) {
      console.error('Error updating selfie:', error);
      throw error;
    }
  };

  const leaveEvent = async () => {
    if (!user) return;

    try {
      // Clear festival association but keep profile
      await AsyncStorage.removeItem('festivalId');

      // Update user status to inactive
      const updatedUser = { ...user, status: false, festivalId: null };
      await saveUser(updatedUser);

      // Delete all flicks for this user (since they're leaving the event)
      try {
        await deleteAllFlicksForUser(user.id);
      } catch (error) {
        console.warn('Failed to delete flicks:', error.message);
      }

      // Update user status in database
      try {
        await updateUserStatus(user.id, false);
      } catch (error) {
        console.warn('Failed to update status in database:', error.message);
      }
    } catch (error) {
      console.error('Error leaving event:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (!user) return;

    // Store user data for cleanup
    const userId = user.id;
    const selfieUrl = user.selfieUrl;

    try {
      // Clear local state IMMEDIATELY (never fails)
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('festivalId');
      setUser(null);

      // Then try backend cleanup (don't block logout if this fails)
      try {
        // Delete all flicks (sent and received)
        await deleteAllFlicksForUser(userId);
      } catch (error) {
        console.warn('Failed to delete flicks (non-critical):', error.message);
      }

      try {
        // Delete selfie from storage
        if (selfieUrl) {
          await deleteSelfie(selfieUrl);
        }
      } catch (error) {
        console.warn('Failed to delete selfie (non-critical):', error.message);
      }

      try {
        // Delete user from database (CASCADE deletes matches, messages, etc.)
        await deleteUser(userId);
      } catch (error) {
        console.warn('Failed to delete user from database (non-critical):', error.message);
      }

      console.log('Logout completed successfully');
    } catch (error) {
      console.error('Error during logout:', error);
      // Don't throw - logout should always succeed
    }
  };

  // DEV ONLY: fixed test account definitions (mirrors scripts/lib/test-accounts.js)
  const DEV_TEST_ACCOUNTS = __DEV__
    ? {
        male: {
          id: 'test_dor_male',
          name: 'Dor (M)',
          age: 28,
          gender: 'male',
          lookingFor: 'female',
          selfieUrl:
            'https://ui-avatars.com/api/?name=M&size=400&background=4A90E2&color=fff&bold=true&font-size=0.5',
          photos: [
            'https://ui-avatars.com/api/?name=M&size=400&background=4A90E2&color=fff&bold=true&font-size=0.5',
          ],
          status: true,
          phoneNumber: '+15550100',
          height: 180,
          bio: '[DEV] Male test account',
          festival_id: 'test-festival',
        },
        female: {
          id: 'test_dor_female',
          name: 'Dor (F)',
          age: 26,
          gender: 'female',
          lookingFor: 'male',
          selfieUrl:
            'https://ui-avatars.com/api/?name=F&size=400&background=E24A90&color=fff&bold=true&font-size=0.5',
          photos: [
            'https://ui-avatars.com/api/?name=F&size=400&background=E24A90&color=fff&bold=true&font-size=0.5',
          ],
          status: true,
          phoneNumber: '+15550101',
          height: 165,
          bio: '[DEV] Female test account',
          festival_id: 'test-festival',
        },
      }
    : null;

  /**
   * DEV ONLY: Switch to a fixed test account.
   * Upserts the account to DB, wipes AsyncStorage, saves the new user,
   * and updates React state. Navigation reset is handled by the caller.
   */
  const loginAsTestUser = async (gender) => {
    if (!__DEV__) return;

    const account = DEV_TEST_ACCOUNTS[gender];
    if (!account) throw new Error(`Unknown gender: ${gender}`);

    console.log(`[DEV] Logging in as test ${gender} account (${account.id})`);

    // 1. Upsert to DB so the account exists
    await upsertUser({
      id: account.id,
      name: account.name,
      age: account.age,
      height: account.height,
      selfieUrl: account.selfieUrl,
      photos: account.photos,
      status: true,
      phoneNumber: account.phoneNumber,
      gender: account.gender,
      lookingFor: account.lookingFor,
      festivalId: account.festival_id,
      bio: account.bio,
    });

    // 2. Wipe all existing session data from AsyncStorage
    await AsyncStorage.multiRemove(['user', 'festivalId', '@dev_real_user_backup']);

    // 3. Build and save the new user (saveUser also calls setUser)
    const userToSave = {
      id: account.id,
      name: account.name,
      age: account.age,
      height: account.height,
      selfieUrl: account.selfieUrl,
      photos: account.photos,
      status: true,
      phoneNumber: account.phoneNumber,
      gender: account.gender,
      lookingFor: account.lookingFor,
      festival_id: account.festival_id,
      bio: account.bio,
    };

    await saveUser(userToSave);
    await AsyncStorage.setItem('festivalId', account.festival_id);

    console.log(`[DEV] Logged in as ${account.name}. Navigation reset should follow.`);
    return userToSave;
  };

  const refreshUser = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        const updatedUser = {
          id: data.id,
          name: data.name,
          age: data.age,
          height: data.height,
          selfieUrl: data.selfie_url,
          photos: data.photos || [],
          status: Boolean(data.status),
          phoneNumber: data.phone_number,
          gender: data.gender,
          lookingFor: data.looking_for,
          festival_id: data.festival_id,
          bio: data.bio,
          notificationPreferences: data.notification_preferences || { matches: true, messages: true, flicks: true, exchanges: true },
        };
        await saveUser(updatedUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        createUser,
        updateUser,
        toggleStatus,
        updateSelfie,
        leaveEvent,
        logout,
        refreshUser,
        loginAsTestUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
