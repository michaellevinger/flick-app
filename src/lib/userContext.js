import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HEARTBEAT_INTERVAL } from '../constants/theme';
import { supabase } from './supabase';
import {
  upsertUser,
  updateHeartbeat,
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
  const heartbeatInterval = useRef(null);

  // Load user from AsyncStorage on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Start heartbeat when user is active
  useEffect(() => {
    if (user?.status) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }

    return () => stopHeartbeat();
  }, [user?.status]);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user');
      if (userData) {
        const parsedUser = JSON.parse(userData);

        // Clean up invalid festival_ids from old test data
        const INVALID_FESTIVALS = ['coachella2024', 'tomorrowland2024', 'lollapalooza2024', 'test-wedding-1', 'test-wedding-2'];
        if (INVALID_FESTIVALS.includes(parsedUser.festival_id)) {
          parsedUser.festival_id = null;
          await AsyncStorage.setItem('user', JSON.stringify(parsedUser));

          // Also update in database
          try {
            await supabase
              .from('users')
              .update({ festival_id: null })
              .eq('id', parsedUser.id);
          } catch (dbError) {
            console.error('Error clearing festival_id in database:', dbError);
          }
        }

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

  const startHeartbeat = () => {
    if (heartbeatInterval.current) return;

    // Send heartbeat immediately
    sendHeartbeat();

    // Then send every HEARTBEAT_INTERVAL
    heartbeatInterval.current = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);
  };

  const stopHeartbeat = () => {
    if (heartbeatInterval.current) {
      clearInterval(heartbeatInterval.current);
      heartbeatInterval.current = null;
    }
  };

  const sendHeartbeat = async () => {
    if (!user) return;

    try {
      // Update heartbeat (no location tracking in event-based model)
      await updateHeartbeat(user.id);

      // Note: In event-based model, matches persist regardless of distance
      // Users are locked to their festival/event, no proximity-based cleanup
    } catch (error) {
      console.error('Error sending heartbeat:', error);
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
        location: user.location,
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

    // Stop heartbeat
    stopHeartbeat();

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

    // Stop heartbeat first
    stopHeartbeat();

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
          location: data.location,
          phoneNumber: data.phone_number,
          gender: data.gender,
          lookingFor: data.looking_for,
          festival_id: data.festival_id,
          bio: data.bio,
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
