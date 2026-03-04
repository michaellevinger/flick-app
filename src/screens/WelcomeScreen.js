import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../lib/userContext';
import { supabase } from '../lib/supabase';

export default function WelcomeScreen({ navigation }) {
  const { user } = useUser();

  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  const handleHostEvent = () => {
    // Check if user is authenticated
    if (!user) {
      Alert.alert(
        'Create Profile First',
        'You need to create a profile before hosting an event. Scan any event QR code to get started!',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Scan QR Code', onPress: () => navigation.navigate('QRScanner') },
        ]
      );
      return;
    }

    // User is authenticated, proceed directly to create event
    navigation.navigate('CreateEvent');
  };

  // DEBUG: Clear all cached data
  const handleClearCache = async () => {
    Alert.alert(
      'Clear All Data',
      'This will delete your profile and all data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              // Get user ID before clearing AsyncStorage
              const userData = await AsyncStorage.getItem('user');
              const storedUser = userData ? JSON.parse(userData) : null;

              // Clear AsyncStorage first (never fails)
              await AsyncStorage.removeItem('festivalId');
              await AsyncStorage.removeItem('user');

              // Then try to delete from database
              if (storedUser?.id) {
                const { error } = await supabase
                  .from('users')
                  .delete()
                  .eq('id', storedUser.id);

                if (error) throw error;
              }

              Alert.alert('Success', 'All data cleared!');
            } catch (error) {
              console.error('Clear cache error:', error);
              Alert.alert(
                'Partial Success',
                'Cache cleared. Database cleanup may have failed. You can still use the app.'
              );
            }
          },
        },
      ]
    );
  };

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
          {/* Logo */}
          <View style={styles.logoContainer}>
            <Text style={styles.heartIcon}>♥</Text>
            <Text style={styles.logoText}>flick</Text>
          </View>

          {/* Tagline */}
          <Text style={styles.tagline}>Join the event to see who's single.</Text>

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleScanQR}>
              <Text style={styles.primaryButtonIcon}>⊞</Text>
              <Text style={styles.primaryButtonText}>Scan Event QR</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.outlineButton} onPress={handleHostEvent}>
              <Text style={styles.outlineButtonIcon}>🏢</Text>
              <Text style={styles.outlineButtonText}>Host An Event</Text>
            </TouchableOpacity>
          </View>

          {/* Debug: Clear Cache Button */}
          <TouchableOpacity
            style={styles.debugButton}
            onPress={handleClearCache}
          >
            <Text style={styles.debugButtonText}>Clear Cache (Debug)</Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 120,
  },
  heartIcon: {
    fontSize: 100,
    color: '#FFFFFF',
    marginBottom: -10,
  },
  logoText: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 60,
    textAlign: 'center',
    opacity: 0.95,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 40,
    gap: 16,
  },
  primaryButton: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 12,
  },
  primaryButtonIcon: {
    fontSize: 20,
    color: '#333333',
  },
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  outlineButton: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 12,
  },
  outlineButtonIcon: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  outlineButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  debugButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  debugButtonText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
});
