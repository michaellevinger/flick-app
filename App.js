import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_900Black } from '@expo-google-fonts/inter';
import { View, ActivityIndicator, Text, Platform } from 'react-native';

// WORKAROUND: Disable native screens for Expo SDK 54 compatibility
enableScreens(false);

import NameScreen from './src/screens/NameScreen';
import BirthdayScreen from './src/screens/BirthdayScreen';
import GenderScreen from './src/screens/GenderScreen';
import LookingForScreen from './src/screens/LookingForScreen';
import BioScreen from './src/screens/BioScreen';
import PhotosScreen from './src/screens/PhotosScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import UserProfileScreen from './src/screens/UserProfileScreen';
import ManagePhotosScreen from './src/screens/ManagePhotosScreen';
import PhotoViewScreen from './src/screens/PhotoViewScreen';
import ChatScreen from './src/screens/ChatScreen';
import GreenLightScreen from './src/screens/GreenLightScreen';
import VaultScreen from './src/screens/VaultScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import HostOnboarding1Screen from './src/screens/HostOnboarding1Screen';
import HostOnboarding2Screen from './src/screens/HostOnboarding2Screen';
import HostOnboarding3Screen from './src/screens/HostOnboarding3Screen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import EventSuccessScreen from './src/screens/EventSuccessScreen';
import HelpSupportScreen from './src/screens/HelpSupportScreen';
import NotificationSettingsScreen from './src/screens/NotificationSettingsScreen';
import HostAuthScreen from './src/screens/HostAuthScreen';
import { COLORS } from './src/constants/theme';
import { AuthProvider } from './src/lib/authContext';
import { UserProvider, useUser } from './src/lib/userContext';
import { MatchesProvider, useMatches } from './src/lib/matchesContext';
import { useNotifications } from './src/hooks/useNotifications';
import { navigationRef } from './src/lib/navigationRef';

// Mounted inside UserProvider — registers push token and handles notification taps
function NotificationManager() {
  const { user } = useUser();
  useNotifications(user, navigationRef);
  return null;
}

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tabs (Dashboard + Matches)
function MainTabs() {
  const { totalUnread } = useMatches();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.purple,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.grayBorder,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Radar',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>📡</Text>
          ),
        }}
      />
      <Tab.Screen
        name="MatchesTab"
        component={MatchesScreen}
        options={{
          tabBarLabel: 'Matches',
          tabBarBadge: totalUnread > 0 ? totalUnread : null,
          tabBarBadgeStyle: {
            backgroundColor: COLORS.green,
          },
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>💬</Text>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, size }) => (
            <Text style={{ fontSize: size, opacity: focused ? 1 : 0.5 }}>👤</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_900Black,
  });

  // Continue with system font if Inter fails to load
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.black }}>
        <ActivityIndicator size="large" color={COLORS.pink} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <UserProvider>
            <MatchesProvider>
              <NotificationManager />
              <StatusBar style="dark" />
              <NavigationContainer ref={navigationRef}>
            <Stack.Navigator
              initialRouteName="Welcome"
              screenOptions={{
                headerShown: false,
              }}
            >
              {/* Onboarding Flow */}
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="QRScanner" component={QRScannerScreen} />

              {/* New Onboarding */}
              <Stack.Screen name="NameScreen" component={NameScreen} options={{ headerShown: false }} />
              <Stack.Screen name="BirthdayScreen" component={BirthdayScreen} options={{ headerShown: false }} />
              <Stack.Screen name="GenderScreen" component={GenderScreen} options={{ headerShown: false }} />
              <Stack.Screen name="LookingForScreen" component={LookingForScreen} options={{ headerShown: false }} />
              <Stack.Screen name="BioScreen" component={BioScreen} options={{ headerShown: false }} />
              <Stack.Screen name="Photos" component={PhotosScreen} options={{ headerShown: false }} />

                      {/* Host Event Flow */}
              <Stack.Screen name="HostAuth" component={HostAuthScreen} options={{ title: 'Sign In' }} />
              <Stack.Screen name="HostOnboarding1" component={HostOnboarding1Screen} />
              <Stack.Screen name="HostOnboarding2" component={HostOnboarding2Screen} />
              <Stack.Screen name="HostOnboarding3" component={HostOnboarding3Screen} />
              <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
              <Stack.Screen name="EventSuccess" component={EventSuccessScreen} />

              {/* Main App (Tabs) */}
              <Stack.Screen name="Dashboard" component={MainTabs} />

              {/* Modals */}
              <Stack.Screen
                name="UserProfile"
                component={UserProfileScreen}
                options={{
                  presentation: 'card',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="Chat"
                component={ChatScreen}
                options={{
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="GreenLight"
                component={GreenLightScreen}
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="Vault"
                component={VaultScreen}
                options={{
                  presentation: 'modal',
                }}
              />
              <Stack.Screen
                name="ManagePhotos"
                component={ManagePhotosScreen}
                options={{
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="PhotoView"
                component={PhotoViewScreen}
                options={{
                  presentation: 'modal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="HelpSupport"
                component={HelpSupportScreen}
                options={{
                  presentation: 'card',
                }}
              />
              <Stack.Screen
                name="NotificationSettings"
                component={NotificationSettingsScreen}
                options={{
                  presentation: 'card',
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
            </MatchesProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
