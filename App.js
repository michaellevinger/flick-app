import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useFonts, Oswald_400Regular, Oswald_400Regular_Italic } from '@expo-google-fonts/oswald';
import { View, ActivityIndicator } from 'react-native';

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
  const [fontsLoaded, fontError] = useFonts({
    Oswald_400Regular,
    Oswald_400Regular_Italic,
  });

  // Don't block the app if fonts fail to load - just use system font as fallback
  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.black }}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
    </GestureHandlerRootView>
  );
}
