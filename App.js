import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { enableScreens } from 'react-native-screens';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Inter_900Black } from '@expo-google-fonts/inter';
import { View, ActivityIndicator, Text, Platform, Alert } from 'react-native';
import * as Linking from 'expo-linking';

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
import AgeRangeScreen from './src/screens/AgeRangeScreen';
import HostAuthScreen from './src/screens/HostAuthScreen';
import { COLORS } from './src/constants/theme';
import { AuthProvider } from './src/lib/authContext';
import { UserProvider, useUser } from './src/lib/userContext';
import { MatchesProvider, useMatches } from './src/lib/matchesContext';
import { useNotifications } from './src/hooks/useNotifications';
import { navigationRef } from './src/lib/navigationRef';
import { handleNotificationTap } from './src/lib/notifications';
import { parseDeepLink, parseEventIdFromUrl, storePendingFestivalId } from './src/lib/deepLinking';
import { validateAndJoinFestival } from './src/lib/festivals';
import InAppNotification from './src/components/InAppNotification';

// Mounted inside UserProvider — registers push token, handles taps + foreground banner
function NotificationManager() {
  const { user } = useUser();
  const [bannerNotification, setBannerNotification] = useState(null);

  const handleForegroundNotification = useCallback((notification) => {
    const title = notification.request.content.title;
    const body = notification.request.content.body;
    const data = notification.request.content.data;

    // Suppress if user is already on the relevant screen
    if (navigationRef.isReady()) {
      const currentRoute = navigationRef.getCurrentRoute();
      const routeName = currentRoute?.name;
      const routeParams = currentRoute?.params;

      // In a chat with this match → suppress message/exchange notifications
      if (routeName === 'Chat' && routeParams?.matchId === data?.matchId) {
        return;
      }
      // On the matches tab → suppress message notifications
      if (routeName === 'MatchesTab' && data?.type === 'message') {
        return;
      }
      // On the radar tab → suppress flick/match notifications
      if (routeName === 'DashboardTab' && (data?.type === 'flick' || data?.type === 'match')) {
        return;
      }
    }

    setBannerNotification({ title, body, data });
  }, []);

  useNotifications(user, navigationRef, handleForegroundNotification);

  return (
    <InAppNotification
      notification={bannerNotification}
      onPress={(data) => {
        setBannerNotification(null);
        if (data) handleNotificationTap({ notification: { request: { content: { data } } } }, navigationRef);
      }}
      onDismiss={() => setBannerNotification(null)}
    />
  );
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

// Determines the initial route based on user state + deep link
function AppNavigator() {
  const { user, isLoading, updateUser } = useUser();
  const [initialUrl, setInitialUrl] = useState(undefined); // undefined = not checked yet
  const coldLinkProcessed = useRef(false);

  // Check for cold-start deep link URL
  useEffect(() => {
    Linking.getInitialURL().then((url) => setInitialUrl(url || null));
  }, []);

  // Handle warm-start deep links (app already open, user taps a link)
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });
    return () => sub.remove();
  }, [user]);

  // Process cold-start deep link once user + URL are both ready
  useEffect(() => {
    if (isLoading || initialUrl === undefined || coldLinkProcessed.current) return;
    if (!initialUrl) return;
    coldLinkProcessed.current = true;

    const link = parseDeepLink(initialUrl);
    if (!link) return;
    // Host links: always handle. Join links for existing users: handle here (new users get festivalId via initialParams)
    if (link.type === 'host' || (link.type === 'join' && user)) {
      handleDeepLink(initialUrl);
    }
  }, [isLoading, initialUrl, user]);

  const handleDeepLink = async (url) => {
    const link = parseDeepLink(url);
    if (!link) return;

    if (link.type === 'host') {
      navigationRef.reset({ index: 0, routes: [{ name: 'HostAuth' }] });
      return;
    }

    // type === 'join'
    const festival = await validateAndJoinFestival(null, link.eventId);
    if (!festival) {
      Alert.alert('Invalid Link', 'This event link is not valid or has expired.');
      return;
    }

    if (user) {
      await updateUser({ festival_id: link.eventId });
      navigationRef.reset({ index: 0, routes: [{ name: 'Dashboard' }] });
    } else {
      await storePendingFestivalId(link.eventId);
      navigationRef.reset({
        index: 0,
        routes: [{ name: 'NameScreen', params: { festivalId: link.eventId } }],
      });
    }
  };

  if (isLoading || initialUrl === undefined) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.black }}>
        <ActivityIndicator size="large" color={COLORS.pink} />
      </View>
    );
  }

  // Determine initial route, incorporating cold-start deep link for new users
  const deepLinkEventId = initialUrl ? parseEventIdFromUrl(initialUrl) : null;

  let initialRoute = 'NameScreen';
  let nameScreenInitialParams = {};

  if (user && user.festival_id) {
    initialRoute = 'Dashboard';
  } else if (user) {
    initialRoute = 'QRScanner';
  } else if (deepLinkEventId) {
    // New user from deep link — seed festivalId into onboarding
    nameScreenInitialParams = { festivalId: deepLinkEventId };
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
        }}
      >
              {/* Onboarding Flow */}
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="QRScanner" component={QRScannerScreen} />

              {/* New Onboarding */}
              <Stack.Screen name="NameScreen" component={NameScreen} options={{ headerShown: false }} initialParams={nameScreenInitialParams} />
              <Stack.Screen name="BirthdayScreen" component={BirthdayScreen} options={{ headerShown: false }} />
              <Stack.Screen name="GenderScreen" component={GenderScreen} options={{ headerShown: false }} />
              <Stack.Screen name="LookingForScreen" component={LookingForScreen} options={{ headerShown: false }} />
              <Stack.Screen name="AgeRangeScreen" component={AgeRangeScreen} options={{ headerShown: false }} />
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
              <AppNavigator />
            </MatchesProvider>
          </UserProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
