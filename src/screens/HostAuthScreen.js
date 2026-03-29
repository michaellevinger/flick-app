import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
// Google Sign-in - Optional (not available in Expo Go)
let GoogleSignin, GoogleSigninButton, statusCodes;
try {
  const GoogleSigninModule = require('@react-native-google-signin/google-signin');
  GoogleSignin = GoogleSigninModule.GoogleSignin;
  GoogleSigninButton = GoogleSigninModule.GoogleSigninButton;
  statusCodes = GoogleSigninModule.statusCodes;
} catch (e) {
  console.log('Google Sign-in not available (Expo Go)');
}
import Constants from 'expo-constants';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

const GOOGLE_WEB_CLIENT_ID = Constants.expoConfig?.extra?.googleWebClientId || process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export default function HostAuthScreen({ navigation, route }) {
  const { session, signUpWithEmail, signInWithEmail } = useAuth();
  const [mode, setMode] = React.useState('signin'); // 'signin' or 'signup'
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isPasswordVisible, setIsPasswordVisible] = React.useState(false);
  const [emailError, setEmailError] = React.useState('');
  const [passwordError, setPasswordError] = React.useState('');
  const [isSigningIn, setIsSigningIn] = React.useState(false);
  const returnTo = route.params?.returnTo || 'CreateEvent';

  // Redirect if already authenticated
  React.useEffect(() => {
    if (session) {
      navigation.replace(returnTo);
    }
  }, [session]);

  // Configure Google Sign-In (only if available)
  React.useEffect(() => {
    if (GoogleSignin?.configure) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
      });
    }
  }, []);

  // Map Supabase error codes to user-friendly messages
  const getAuthErrorMessage = (error) => {
    if (!error) return 'An unexpected error occurred';

    const errorCode = error.code || error.message;

    // Map common error codes
    if (errorCode.includes('invalid_credentials') || errorCode.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    }
    if (errorCode.includes('email_exists') || errorCode.includes('already registered')) {
      return 'Account already exists. Try signing in.';
    }
    if (errorCode.includes('weak_password') || errorCode.includes('Password should be')) {
      return 'Password is too weak. Use a mix of letters and numbers.';
    }
    if (errorCode.includes('invalid_email') || errorCode.includes('Unable to validate email')) {
      return 'Please enter a valid email address';
    }
    if (errorCode.includes('Email not confirmed')) {
      return 'Please verify your email address before signing in';
    }

    // Default to the original error message
    return error.message || 'An unexpected error occurred';
  };

  // Email validation
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate email field
  const validateEmail = () => {
    if (!email.trim()) {
      setEmailError('Email is required');
      return false;
    }
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Validate password field
  const validatePassword = () => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle email/password authentication
  const handleEmailAuth = async () => {
    // Clear previous errors
    setEmailError('');
    setPasswordError('');

    // Validate inputs
    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    setIsSigningIn(true);

    try {
      let result;

      if (mode === 'signup') {
        // Sign up
        result = await signUpWithEmail(email, password);

        if (result.error) {
          // Show user-friendly error message
          Alert.alert('Sign Up Error', getAuthErrorMessage(result.error));
        } else {
          // Success - create host profile
          await createHostProfile(result.data.user);
          Alert.alert(
            'Account Created',
            'Your account has been created successfully!',
            [{ text: 'OK', onPress: () => navigation.replace(returnTo) }]
          );
        }
      } else {
        // Sign in
        result = await signInWithEmail(email, password);

        if (result.error) {
          // Show user-friendly error message
          Alert.alert('Sign In Error', getAuthErrorMessage(result.error));
        } else {
          // Success - create host profile if needed
          await createHostProfile(result.data.user);
          navigation.replace(returnTo);
        }
      }
    } catch (error) {
      Alert.alert('Error', getAuthErrorMessage(error));
    } finally {
      setIsSigningIn(false);
    }
  };

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
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.content}>
          <Text style={styles.title}>Host an Event</Text>
          <Text style={styles.subtitle}>
            Create your host account to generate event QR codes
          </Text>

          {/* Mode Toggle Tabs */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'signin' && styles.modeTabActive,
              ]}
              onPress={() => setMode('signin')}
              disabled={isSigningIn}
            >
              <Text
                style={[
                  styles.modeTabText,
                  mode === 'signin' && styles.modeTabTextActive,
                ]}
              >
                Sign In
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeTab,
                mode === 'signup' && styles.modeTabActive,
              ]}
              onPress={() => setMode('signup')}
              disabled={isSigningIn}
            >
              <Text
                style={[
                  styles.modeTabText,
                  mode === 'signup' && styles.modeTabTextActive,
                ]}
              >
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[styles.input, emailError && styles.inputError]}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
              }}
              onBlur={validateEmail}
              placeholder="your@email.com"
              placeholderTextColor="#808080"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isSigningIn}
            />
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.input,
                  styles.passwordInput,
                  passwordError && styles.inputError,
                ]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError('');
                }}
                onBlur={validatePassword}
                placeholder="Enter password"
                placeholderTextColor="#808080"
                secureTextEntry={!isPasswordVisible}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isSigningIn}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setIsPasswordVisible(!isPasswordVisible)}
                disabled={isSigningIn}
              >
                <Text style={styles.eyeIcon}>
                  {isPasswordVisible ? '🙈' : '👁'}
                </Text>
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          {/* Continue Button */}
          <TouchableOpacity
            style={[styles.continueButton, isSigningIn && styles.continueButtonDisabled]}
            onPress={handleEmailAuth}
            disabled={isSigningIn}
          >
            {isSigningIn ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.continueButtonText}>Continue</Text>
            )}
          </TouchableOpacity>

          {/* OR Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Social Sign-In Buttons */}
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

            {/* Google Sign-In (only in standalone builds) */}
            {GoogleSigninButton ? (
              <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={GoogleSigninButton.Color.Dark}
                onPress={signInWithGoogle}
                disabled={isSigningIn}
                style={styles.googleButton}
              />
            ) : (
              <View style={styles.expoGoNotice}>
                <Text style={styles.expoGoText}>
                  📱 Google Sign-in requires a standalone build
                </Text>
                <Text style={styles.expoGoSubtext}>
                  Use email/password or build the app with EAS
                </Text>
              </View>
            )}
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
      </TouchableWithoutFeedback>
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
    marginBottom: 32,
    textAlign: 'center',
  },
  // Mode Toggle
  modeToggle: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 300,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeTab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  modeTabActive: {
    backgroundColor: '#000000',
  },
  modeTabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  // Input Fields
  inputGroup: {
    width: '100%',
    maxWidth: 300,
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    fontSize: 12,
    color: '#FF0000',
    marginTop: 4,
  },
  // Password Field
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
  },
  eyeButton: {
    position: 'absolute',
    right: 12,
    top: 12,
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
  },
  // Continue Button
  continueButton: {
    width: '100%',
    maxWidth: 300,
    height: 50,
    backgroundColor: '#00FF00',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#808080',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  // Divider
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 300,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D3D3D3',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#808080',
    fontWeight: '600',
  },
  // Social Buttons
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
  expoGoNotice: {
    width: '100%',
    padding: 16,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    alignItems: 'center',
  },
  expoGoText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 4,
  },
  expoGoSubtext: {
    fontSize: 12,
    color: '#808080',
  },
  backButton: {
    marginTop: 32,
  },
  backButtonText: {
    fontSize: 16,
    color: '#808080',
  },
});
