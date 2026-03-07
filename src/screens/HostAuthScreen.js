import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export default function HostAuthScreen({ navigation, route }) {
  const { session } = useAuth();
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const returnTo = route.params?.returnTo || 'CreateEvent';

  // Redirect if already authenticated
  React.useEffect(() => {
    if (session) {
      navigation.replace(returnTo);
    }
  }, [session]);

  // Configure Google Sign-In
  React.useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    });
  }, []);

  const createHostProfile = async (user, additionalData = {}) => {
    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('host_profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!existingProfile) {
        const { error } = await supabase.from('host_profiles').insert({
          id: user.id,
          display_name:
            additionalData.fullName?.givenName ||
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            'Host',
          email: user.email,
        });

        if (error) {
          console.error('Error creating host profile:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in createHostProfile:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      if (response.data?.idToken) {
        const { data, error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.data.idToken,
        });

        if (error) {
          Alert.alert('Authentication Error', error.message);
        } else if (data?.user) {
          // Create host profile
          await createHostProfile(data.user);
          navigation.replace(returnTo);
        }
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // User cancelled
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // Sign-in already in progress
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Error', 'Google Play Services not available');
      } else {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const signInWithApple = async () => {
    if (isSigningIn) return;

    setIsSigningIn(true);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      const { data, error } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: credential.identityToken,
        nonce: credential.nonce,
      });

      if (error) {
        Alert.alert('Authentication Error', error.message);
      } else if (data?.user) {
        // Create host profile
        await createHostProfile(data.user, {
          fullName: credential.fullName,
        });
        navigation.replace(returnTo);
      }
    } catch (error) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User canceled
      } else {
        Alert.alert('Sign In Error', error.message || 'Failed to sign in with Apple');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sign in to host events</Text>
        <Text style={styles.subtitle}>
          Create your host account to generate event QR codes
        </Text>

        {isSigningIn && (
          <ActivityIndicator
            size="large"
            color="#00FF00"
            style={styles.loader}
          />
        )}

        <View style={styles.buttonContainer}>
          {/* Apple Sign-In (iOS only) */}
          {Platform.OS === 'ios' && (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={8}
              style={styles.appleButton}
              onPress={signInWithApple}
              disabled={isSigningIn}
            />
          )}

          {/* Google Sign-In */}
          <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={signInWithGoogle}
            disabled={isSigningIn}
            style={styles.googleButton}
          />
        </View>

        {/* Back to Welcome */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          disabled={isSigningIn}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#808080',
    marginBottom: 48,
    textAlign: 'center',
  },
  loader: {
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
  },
  appleButton: {
    width: '100%',
    height: 50,
    marginBottom: 16,
  },
  googleButton: {
    width: '100%',
    height: 50,
  },
  backButton: {
    marginTop: 32,
  },
  backButtonText: {
    fontSize: 16,
    color: '#808080',
  },
});
