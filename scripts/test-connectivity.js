/**
 * Simple connectivity test for Supabase
 * Run this to verify phone can reach Supabase
 */

import { supabase } from './src/lib/supabase.js';

async function testConnectivity() {
  console.log('Testing Supabase connectivity...\n');

  // Test 1: Basic connection
  console.log('Test 1: Can we reach Supabase?');
  try {
    const { data, error } = await supabase.from('users').select('count').limit(1);
    if (error) {
      console.log('❌ Database query failed:', error.message);
    } else {
      console.log('✅ Database connection works!');
    }
  } catch (err) {
    console.log('❌ Network error:', err.message);
  }

  // Test 2: Storage bucket access
  console.log('\nTest 2: Can we access storage bucket?');
  try {
    const { data, error } = await supabase.storage.from('selfies').list('', { limit: 1 });
    if (error) {
      console.log('❌ Storage access failed:', error.message);
    } else {
      console.log('✅ Storage bucket accessible!');
    }
  } catch (err) {
    console.log('❌ Network error:', err.message);
  }

  // Test 3: Upload small test file
  console.log('\nTest 3: Can we upload to storage?');
  try {
    const testData = 'test';
    const testBlob = new Blob([testData], { type: 'text/plain' });
    const { data, error } = await supabase.storage
      .from('selfies')
      .upload(`test-${Date.now()}.txt`, testBlob);

    if (error) {
      console.log('❌ Upload failed:', error.message);
    } else {
      console.log('✅ Upload works!');
      // Clean up test file
      await supabase.storage.from('selfies').remove([data.path]);
    }
  } catch (err) {
    console.log('❌ Network error:', err.message);
  }

  console.log('\n--- Test Complete ---');
}

testConnectivity();
