import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { HEARTBEAT_INTERVAL } from '../constants/theme';
import {
  upsertUser,
  updateHeartbeat,
  updateUserStatus,
  updateUserLocation,
  uploadSelfie,
  deleteSelfie,
  deleteUser,
} from './database';
import { getCurrentLocation } from './location';
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

  const createUser = async ({ name, age, height, photoUri, phoneNumber, gender, lookingFor, festivalId }) => {
    try {
      // Generate a unique user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Try to get current location (optional - will be set later if permissions not granted)
      let location = null;
      try {
        location = await getCurrentLocation();
        console.log('Location obtained during profile creation:', location);
      } catch (locationError) {
        console.log('Location not available during profile creation (will request later):', locationError.message);
        // Continue without location - it will be set on first heartbeat
      }

      // Upload selfie
      const selfieUrl = await uploadSelfie(userId, photoUri);

      // Create user in database
      const userData = await upsertUser({
        id: userId,
        name,
        age,
        height,
        selfieUrl,
        status: true, // Default to ON
        location,
        phoneNumber,
        gender,
        lookingFor,
        festivalId,
      });

      // Save to local storage
      const userToSave = {
        id: userId,
        name,
        age,
        height,
        selfieUrl,
        status: true,
        location,
        phoneNumber,
        gender,
        lookingFor,
        festival_id: festivalId,
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

  const updateLocation = async () => {
    if (!user) return null;

    try {
      const location = await getCurrentLocation();
      await updateUserLocation(user.id, location);
      await saveUser({ ...user, location });
      console.log('Location updated successfully');
      return location;
    } catch (error) {
      console.log('Could not update location:', error.message);
      // Don't throw - allow heartbeat to continue without location update
      return null;
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
      // Update location and heartbeat
      const newLocation = await updateLocation();
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
        location: updatedUser.location,
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

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        createUser,
        updateUser,
        toggleStatus,
        updateLocation,
        updateSelfie,
        logout,
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
