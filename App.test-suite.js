import React, { useState } from 'react';
import { View, Text, Button, ScrollView, StyleSheet, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { enableScreens } from 'react-native-screens';

// Disable native screens
enableScreens(false);

const Stack = createStackNavigator();

// ============================================
// TEST 1: Basic React Native Components
// ============================================
function Test1Screen({ navigation }) {
  const [count, setCount] = useState(0);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✅ Test 1: Basic Components</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Counter Test:</Text>
        <Text style={styles.result}>Count: {count}</Text>
        <Button title="Increment" onPress={() => setCount(count + 1)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Button Test:</Text>
        <Button
          title="Show Alert"
          onPress={() => Alert.alert('Success', 'Button works!')}
        />
      </View>

      <View style={styles.section}>
        <Button
          title="✅ PASS - Go to Test 2"
          onPress={() => navigation.navigate('Test2')}
          color="green"
        />
      </View>
    </ScrollView>
  );
}

// ============================================
// TEST 2: Theme & Constants
// ============================================
function Test2Screen({ navigation }) {
  const [themeLoaded, setThemeLoaded] = useState(false);
  const [error, setError] = useState(null);

  const testTheme = async () => {
    try {
      const theme = require('./src/constants/theme');
      const hasColors = theme.COLORS && theme.COLORS.green === '#00FF00';
      const hasSpacing = theme.SPACING && theme.SPACING.md === 16;

      if (hasColors && hasSpacing) {
        setThemeLoaded(true);
        Alert.alert('Success', 'Theme loaded correctly!');
      } else {
        throw new Error('Theme structure invalid');
      }
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✅ Test 2: Theme & Constants</Text>

      <View style={styles.section}>
        <Button title="Test Theme Import" onPress={testTheme} />
        {themeLoaded && <Text style={styles.success}>✅ Theme loaded</Text>}
        {error && <Text style={styles.error}>❌ {error}</Text>}
      </View>

      <View style={styles.section}>
        <Button
          title="← Back"
          onPress={() => navigation.goBack()}
        />
        {themeLoaded && (
          <Button
            title="✅ PASS - Go to Test 3"
            onPress={() => navigation.navigate('Test3')}
            color="green"
          />
        )}
      </View>
    </ScrollView>
  );
}

// ============================================
// TEST 3: Supabase Connection
// ============================================
function Test3Screen({ navigation }) {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);

  const testSupabase = async () => {
    try {
      const { supabase } = require('./src/lib/supabase');

      // Test simple query
      const { data, error } = await supabase
        .from('users')
        .select('count')
        .limit(0);

      if (error) throw error;

      setConnected(true);
      Alert.alert('Success', 'Supabase connected!');
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✅ Test 3: Supabase Connection</Text>

      <View style={styles.section}>
        <Text style={styles.info}>
          This tests if Supabase client can connect to your backend.
        </Text>
        <Button title="Test Connection" onPress={testSupabase} />
        {connected && <Text style={styles.success}>✅ Supabase connected</Text>}
        {error && <Text style={styles.error}>❌ {error}</Text>}
      </View>

      <View style={styles.section}>
        <Button
          title="← Back"
          onPress={() => navigation.goBack()}
        />
        {connected && (
          <Button
            title="✅ PASS - Go to Test 4"
            onPress={() => navigation.navigate('Test4')}
            color="green"
          />
        )}
      </View>
    </ScrollView>
  );
}

// ============================================
// TEST 4: Camera Permissions
// ============================================
function Test4Screen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [error, setError] = useState(null);

  const testCamera = async () => {
    try {
      const { Camera } = require('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();

      if (status === 'granted') {
        setHasPermission(true);
        Alert.alert('Success', 'Camera permission granted!');
      } else {
        setHasPermission(false);
        Alert.alert('Denied', 'Camera permission denied');
      }
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✅ Test 4: Camera Permissions</Text>

      <View style={styles.section}>
        <Text style={styles.info}>
          This tests if camera permissions can be requested.
        </Text>
        <Button title="Request Camera Permission" onPress={testCamera} />
        {hasPermission === true && <Text style={styles.success}>✅ Permission granted</Text>}
        {hasPermission === false && <Text style={styles.warning}>⚠️ Permission denied</Text>}
        {error && <Text style={styles.error}>❌ {error}</Text>}
      </View>

      <View style={styles.section}>
        <Button
          title="← Back"
          onPress={() => navigation.goBack()}
        />
        {hasPermission && (
          <Button
            title="✅ PASS - Go to Test 5"
            onPress={() => navigation.navigate('Test5')}
            color="green"
          />
        )}
      </View>
    </ScrollView>
  );
}

// ============================================
// TEST 5: Location Permissions
// ============================================
function Test5Screen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);

  const testLocation = async () => {
    try {
      const Location = require('expo-location');
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        setHasPermission(false);
        Alert.alert('Denied', 'Location permission denied');
        return;
      }

      setHasPermission(true);
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
      Alert.alert('Success', `Location: ${loc.coords.latitude}, ${loc.coords.longitude}`);
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✅ Test 5: Location</Text>

      <View style={styles.section}>
        <Text style={styles.info}>
          This tests if location can be accessed.
        </Text>
        <Button title="Request Location" onPress={testLocation} />
        {hasPermission === true && <Text style={styles.success}>✅ Permission granted</Text>}
        {location && (
          <Text style={styles.result}>
            Lat: {location.latitude.toFixed(6)}{'\n'}
            Lng: {location.longitude.toFixed(6)}
          </Text>
        )}
        {hasPermission === false && <Text style={styles.warning}>⚠️ Permission denied</Text>}
        {error && <Text style={styles.error}>❌ {error}</Text>}
      </View>

      <View style={styles.section}>
        <Button
          title="← Back"
          onPress={() => navigation.goBack()}
        />
        {hasPermission && (
          <Button
            title="✅ PASS - Go to Test 6"
            onPress={() => navigation.navigate('Test6')}
            color="green"
          />
        )}
      </View>
    </ScrollView>
  );
}

// ============================================
// TEST 6: User Context
// ============================================
function Test6Screen({ navigation }) {
  const [contextLoaded, setContextLoaded] = useState(false);
  const [error, setError] = useState(null);

  const testUserContext = async () => {
    try {
      const { UserProvider, useUser } = require('./src/lib/userContext');

      if (UserProvider && useUser) {
        setContextLoaded(true);
        Alert.alert('Success', 'UserContext loaded!');
      } else {
        throw new Error('UserContext exports invalid');
      }
    } catch (err) {
      setError(err.message);
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>✅ Test 6: User Context</Text>

      <View style={styles.section}>
        <Button title="Test UserContext" onPress={testUserContext} />
        {contextLoaded && <Text style={styles.success}>✅ Context loaded</Text>}
        {error && <Text style={styles.error}>❌ {error}</Text>}
      </View>

      <View style={styles.section}>
        <Button
          title="← Back"
          onPress={() => navigation.goBack()}
        />
        {contextLoaded && (
          <Button
            title="✅ PASS - Go to Summary"
            onPress={() => navigation.navigate('Summary')}
            color="green"
          />
        )}
      </View>
    </ScrollView>
  );
}

// ============================================
// SUMMARY: Test Results
// ============================================
function SummaryScreen({ navigation }) {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>📊 Test Summary</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Tests Passed! 🎉</Text>
        <Text style={styles.info}>
          Your environment is ready. Now you can try loading the full app.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>What We Tested:</Text>
        <Text style={styles.result}>
          ✅ React Native components{'\n'}
          ✅ Theme & constants{'\n'}
          ✅ Supabase connection{'\n'}
          ✅ Camera permissions{'\n'}
          ✅ Location services{'\n'}
          ✅ User context{'\n'}
        </Text>
      </View>

      <View style={styles.section}>
        <Button
          title="🔄 Run Tests Again"
          onPress={() => navigation.navigate('Test1')}
        />
      </View>
    </ScrollView>
  );
}

// ============================================
// MAIN APP
// ============================================
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Test1"
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#000' },
          headerTintColor: '#fff',
        }}
      >
        <Stack.Screen
          name="Test1"
          component={Test1Screen}
          options={{ title: 'Test 1: Components' }}
        />
        <Stack.Screen
          name="Test2"
          component={Test2Screen}
          options={{ title: 'Test 2: Theme' }}
        />
        <Stack.Screen
          name="Test3"
          component={Test3Screen}
          options={{ title: 'Test 3: Supabase' }}
        />
        <Stack.Screen
          name="Test4"
          component={Test4Screen}
          options={{ title: 'Test 4: Camera' }}
        />
        <Stack.Screen
          name="Test5"
          component={Test5Screen}
          options={{ title: 'Test 5: Location' }}
        />
        <Stack.Screen
          name="Test6"
          component={Test6Screen}
          options={{ title: 'Test 6: Context' }}
        />
        <Stack.Screen
          name="Summary"
          component={SummaryScreen}
          options={{ title: 'Summary' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  section: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  info: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  result: {
    fontSize: 16,
    marginVertical: 10,
    color: '#333',
  },
  success: {
    fontSize: 16,
    color: '#00AA00',
    marginTop: 10,
    fontWeight: 'bold',
  },
  error: {
    fontSize: 16,
    color: '#FF0000',
    marginTop: 10,
    fontWeight: 'bold',
  },
  warning: {
    fontSize: 16,
    color: '#FF8800',
    marginTop: 10,
    fontWeight: 'bold',
  },
});
