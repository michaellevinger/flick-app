import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Inter_900Black } from '@expo-google-fonts/inter';
import { View, ActivityIndicator, Text } from 'react-native';

// WORKAROUND: Disable native screens for Expo SDK 54 compatibility
enableScreens(false);

import CameraScreen from './src/screens/CameraScreen';
import Setup1Screen from './src/screens/Setup1Screen';
import Setup2Screen from './src/screens/Setup2Screen';
import Setup3Screen from './src/screens/Setup3Screen';
import DashboardScreen from './src/screens/DashboardScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ProfileScreen from './src/screens/ProfileScreen';
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
import { COLORS } from './src/constants/theme';
import { UserProvider } from './src/lib/userContext';
import { MatchesProvider, useMatches } from './src/lib/matchesContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main tabs (Dashboard + Matches)
function MainTabs() {
  const { totalUnread } = useMatches();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
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
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: size, color }}>👤</Text>
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0B0F0E' }}>
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <UserProvider>
        <MatchesProvider>
          <StatusBar style="dark" />
          <NavigationContainer>
            <Stack.Navigator
              initialRouteName="Welcome"
              screenOptions={{
                headerShown: false,
              }}
            >
              {/* Onboarding Flow */}
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="QRScanner" component={QRScannerScreen} />
              <Stack.Screen name="Camera" component={CameraScreen} />
              <Stack.Screen name="Setup" component={Setup1Screen} />
              <Stack.Screen name="Setup2" component={Setup2Screen} />
              <Stack.Screen name="Setup3" component={Setup3Screen} />

              {/* Host Event Flow */}
              <Stack.Screen name="HostOnboarding1" component={HostOnboarding1Screen} />
              <Stack.Screen name="HostOnboarding2" component={HostOnboarding2Screen} />
              <Stack.Screen name="HostOnboarding3" component={HostOnboarding3Screen} />
              <Stack.Screen name="CreateEvent" component={CreateEventScreen} />
              <Stack.Screen name="EventSuccess" component={EventSuccessScreen} />

              {/* Main App (Tabs) */}
              <Stack.Screen name="Dashboard" component={MainTabs} />

              {/* Modals */}
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
            </Stack.Navigator>
          </NavigationContainer>
        </MatchesProvider>
      </UserProvider>
    </GestureHandlerRootView>
  );
}
