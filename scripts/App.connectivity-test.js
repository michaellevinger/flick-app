/**
 * Connectivity Test App
 * Temporarily replace App.js with this to test Supabase connectivity from phone
 */

import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Button, StyleSheet } from 'react-native';
import { supabase } from './src/lib/supabase';

export default function App() {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);

  const addResult = (test, success, message) => {
    setResults(prev => [...prev, { test, success, message }]);
  };

  const runTests = async () => {
    setResults([]);
    setTesting(true);
    addResult('Starting', true, 'Running connectivity tests...');

    // Test 1: Basic fetch to Supabase
    try {
      addResult('Test 1', null, 'Testing basic network fetch...');
      const response = await fetch('https://oithyuuztrmohcbfglrh.supabase.co/rest/v1/', {
        headers: {
          'apikey': supabase.supabaseKey,
        },
      });
      addResult('Test 1', true, `HTTP ${response.status} - Basic connection works`);
    } catch (err) {
      addResult('Test 1', false, `Network error: ${err.message}`);
    }

    // Test 2: Database query
    try {
      addResult('Test 2', null, 'Testing database query...');
      const { data, error } = await supabase.from('users').select('count').limit(1);
      if (error) {
        addResult('Test 2', false, `DB Error: ${error.message}`);
      } else {
        addResult('Test 2', true, 'Database query successful');
      }
    } catch (err) {
      addResult('Test 2', false, `Network error: ${err.message}`);
    }

    // Test 3: Storage endpoint
    try {
      addResult('Test 3', null, 'Testing storage endpoint...');
      const response = await fetch('https://oithyuuztrmohcbfglrh.supabase.co/storage/v1/bucket', {
        headers: {
          'apikey': supabase.supabaseKey,
          'Authorization': `Bearer ${supabase.supabaseKey}`,
        },
      });
      addResult('Test 3', true, `Storage endpoint: HTTP ${response.status}`);
    } catch (err) {
      addResult('Test 3', false, `Storage network error: ${err.message}`);
    }

    // Test 4: Upload attempt
    try {
      addResult('Test 4', null, 'Testing storage upload...');
      const testData = 'test';
      const blob = new Blob([testData], { type: 'text/plain' });
      const { data, error } = await supabase.storage
        .from('selfies')
        .upload(`connectivity-test-${Date.now()}.txt`, blob);

      if (error) {
        addResult('Test 4', false, `Upload error: ${error.message}`);
      } else {
        addResult('Test 4', true, 'Upload successful!');
        // Clean up
        await supabase.storage.from('selfies').remove([data.path]);
      }
    } catch (err) {
      addResult('Test 4', false, `Upload network error: ${err.message}`);
    }

    setTesting(false);
    addResult('Complete', true, '--- Tests Complete ---');
  };

  useEffect(() => {
    runTests();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Supabase Connectivity Test</Text>
      <Button title="Run Tests Again" onPress={runTests} disabled={testing} />

      <ScrollView style={styles.results}>
        {results.map((result, index) => (
          <View key={index} style={styles.resultItem}>
            <Text style={styles.testName}>{result.test}</Text>
            <Text style={[
              styles.message,
              result.success === true && styles.success,
              result.success === false && styles.error,
            ]}>
              {result.success === true && '✅ '}
              {result.success === false && '❌ '}
              {result.message}
            </Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.footer}>
        Check the results above to diagnose connectivity issues
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  results: {
    flex: 1,
    marginTop: 20,
  },
  resultItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 5,
  },
  testName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  message: {
    fontSize: 14,
    color: '#666',
  },
  success: {
    color: '#00aa00',
  },
  error: {
    color: '#ff0000',
  },
  footer: {
    marginTop: 20,
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
