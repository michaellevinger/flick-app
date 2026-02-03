// Quick Supabase verification script
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables from .env
config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying Supabase setup...\n');

  // Check 1: Test connection
  console.log('1️⃣ Testing connection...');
  const { data, error } = await supabase.from('users').select('count');
  if (error && error.code !== 'PGRST116') {
    console.error('❌ Connection failed:', error.message);
    return;
  }
  console.log('✅ Connection successful!\n');

  // Check 2: Verify tables exist
  console.log('2️⃣ Checking tables...');
  const tables = ['users', 'nudges', 'exchanges'];

  for (const table of tables) {
    const { error } = await supabase.from(table).select('count');
    if (error && error.code !== 'PGRST116') {
      console.log(`❌ Table '${table}' not found or has issues`);
    } else {
      console.log(`✅ Table '${table}' exists`);
    }
  }
  console.log();

  // Check 3: Verify storage bucket
  console.log('3️⃣ Checking storage bucket...');
  const { data: buckets } = await supabase.storage.listBuckets();
  const selfiesBucket = buckets?.find(b => b.name === 'selfies');

  if (selfiesBucket) {
    console.log('✅ Storage bucket "selfies" exists');
    console.log(`   Public: ${selfiesBucket.public ? 'Yes ✅' : 'No ❌ (needs to be public!)'}`);
  } else {
    console.log('❌ Storage bucket "selfies" not found');
  }
  console.log();

  // Check 4: Test SQL function
  console.log('4️⃣ Testing SQL functions...');
  const { data: nearbyTest, error: nearbyError } = await supabase.rpc('find_nearby_users', {
    user_lat: 0,
    user_lng: 0,
    radius_meters: 100,
    current_user_id: 'test'
  });

  if (nearbyError) {
    console.log('❌ Function find_nearby_users failed:', nearbyError.message);
  } else {
    console.log('✅ Function find_nearby_users works');
  }

  console.log('\n🎉 Supabase setup verification complete!');
}

verifySetup();
