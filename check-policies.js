// Check what storage policies exist
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

// We need to query the policies through the database
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkPolicies() {
  console.log('🔍 Checking storage policies...\n');

  // Try a simple upload with more details
  const { data, error } = await supabase.storage
    .from('selfies')
    .upload('test.txt', 'test content', {
      contentType: 'text/plain'
    });

  if (error) {
    console.log('❌ Error details:', error);
    console.log('\n💡 The policy needs to check bucket_id = \'selfies\'');
    console.log('\nTry updating the policy WITH CHECK to:');
    console.log('   bucket_id = \'selfies\'');
  } else {
    console.log('✅ Upload works!', data);
  }
}

checkPolicies();
