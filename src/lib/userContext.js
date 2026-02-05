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
import { deleteAllNudgesForUser } from './nudges';
import { cleanupDistantMatches } from './matchCleanup';

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

  const createUser = async ({ name, age, photoUri, phoneNumber, gender, lookingFor }) => {
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
        selfieUrl,
        status: true, // Default to ON
        location,
        phoneNumber,
        gender,
        lookingFor,
      });

      // Save to local storage
      const userToSave = {
        id: userId,
        name,
        age,
        selfieUrl,
        status: true,
        location,
        phoneNumber,
        gender,
        lookingFor,
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

      // Clean up matches with users who are now too far away
      if (newLocation) {
        await cleanupDistantMatches(user.id, newLocation);
      }
    } catch (error) {
      console.error('Error sending heartbeat:', error);
    }
  };

  const logout = async () => {
    try {
      if (user) {
        // Stop heartbeat
        stopHeartbeat();

        // Delete all nudges (sent and received)
        await deleteAllNudgesForUser(user.id);

        // Delete selfie from storage
        if (user.selfieUrl) {
          await deleteSelfie(user.selfieUrl);
        }

        // Delete user from database
        await deleteUser(user.id);

        // Clear local storage
        await AsyncStorage.removeItem('user');
        setUser(null);
      }
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        createUser,
        toggleStatus,
        updateLocation,
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
