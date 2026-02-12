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
import SetupScreen from './src/screens/SetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import MatchesScreen from './src/screens/MatchesScreen';
import ChatScreen from './src/screens/ChatScreen';
import GreenLightScreen from './src/screens/GreenLightScreen';
import VaultScreen from './src/screens/VaultScreen';
import QRScannerScreen from './src/screens/QRScannerScreen';
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
        tabBarActiveTintColor: COLORS.green,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopWidth: 1,
          borderTopColor: COLORS.grayLight,
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
        <ActivityIndicator size="large" color="#2EFF4D" />
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
              initialRouteName="QRScanner"
              screenOptions={{
                headerShown: false,
              }}
            >
              {/* Onboarding Flow */}
              <Stack.Screen name="QRScanner" component={QRScannerScreen} />
              <Stack.Screen name="Camera" component={CameraScreen} />
              <Stack.Screen name="Setup" component={SetupScreen} />

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
