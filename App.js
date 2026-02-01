import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';

import CameraScreen from './src/screens/CameraScreen';
import SetupScreen from './src/screens/SetupScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import GreenLightScreen from './src/screens/GreenLightScreen';
import VaultScreen from './src/screens/VaultScreen';
import { COLORS } from './src/constants/theme';
import { UserProvider } from './src/lib/userContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <UserProvider>
      <StatusBar style="dark" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Camera"
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: COLORS.white },
          }}
        >
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="Setup" component={SetupScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen
            name="GreenLight"
            component={GreenLightScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="Vault"
            component={VaultScreen}
            options={{ presentation: 'modal' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
}
