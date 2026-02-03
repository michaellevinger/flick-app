import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';

// WORKAROUND: Disable native screens for Expo SDK 54 compatibility
enableScreens(false);

import CameraScreen from './src/screens/CameraScreen';
import SetupScreen from './src/screens/SetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GreenLightScreen from './src/screens/GreenLightScreen';
import VaultScreen from './src/screens/VaultScreen';
import { COLORS } from './src/constants/theme';
import { UserProvider } from './src/lib/userContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Camera"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="GreenLight" component={GreenLightScreen} />
          <Stack.Screen name="Vault" component={VaultScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
