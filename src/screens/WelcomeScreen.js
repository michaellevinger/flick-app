import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useUser } from '../lib/userContext';

export default function WelcomeScreen({ navigation }) {
  const { user } = useUser();

  const handleScanQR = () => {
    navigation.navigate('QRScanner');
  };

  const handleHostEvent = () => {
    // Future feature
    alert('Coming soon!');
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
          {/* Profile Avatar (if logged in before) */}
          {user?.selfieUrl && (
            <TouchableOpacity style={styles.avatarContainer}>
              <Image source={{ uri: user.selfieUrl }} style={styles.avatar} />
            </TouchableOpacity>
          )}

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
  avatarContainer: {
    position: 'absolute',
    top: 60,
    right: 24,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
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
});
