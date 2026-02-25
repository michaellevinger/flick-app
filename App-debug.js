import React from 'react';
import { View, Text } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Debug Test - App Loads!</Text>
      <Text style={{ fontSize: 16, marginTop: 20 }}>If you see this, the basic app works</Text>
    </View>
  );
}
