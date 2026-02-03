// Storage bucket management script
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function checkBuckets() {
  console.log('🔍 Checking storage buckets...\n');

  const { data: buckets, error } = await supabase.storage.listBuckets();

  if (error) {
    console.error('❌ Error fetching buckets:', error);
    return null;
  }

  console.log(`Found ${buckets?.length || 0} bucket(s):\n`);

  if (buckets && buckets.length > 0) {
    buckets.forEach(bucket => {
      console.log(`📦 ${bucket.name}`);
      console.log(`   Public: ${bucket.public ? '✅ Yes' : '❌ No'}`);
      console.log(`   ID: ${bucket.id}`);
      console.log('');
    });

    const selfiesBucket = buckets.find(b => b.name === 'selfies');
    return selfiesBucket;
  }

  return null;
}

async function createBucket() {
  console.log('📦 Creating "selfies" bucket...\n');

  const { data, error } = await supabase.storage.createBucket('selfies', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg']
  });

  if (error) {
    console.error('❌ Cannot create bucket with anon key');
    console.log('\n💡 Create manually via Supabase Dashboard:');
    console.log('   1. Go to: https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh/storage/buckets');
    console.log('   2. Click "New Bucket"');
    console.log('   3. Name: selfies');
    console.log('   4. Public: ✅ ON');
    console.log('   5. File size: 5MB\n');
    return false;
  }

  console.log('✅ Bucket created!\n');
  return true;
}

async function main() {
  console.log('🗄️  Nudge Storage Management\n');
  console.log('=====================================\n');

  // Check existing buckets
  const selfiesBucket = await checkBuckets();

  if (selfiesBucket) {
    console.log('✅ "selfies" bucket exists and is configured correctly!\n');
    console.log('You\'re ready to test the app: npx expo start\n');
  } else {
    console.log('⚠️  "selfies" bucket not found\n');
    await createBucket();
  }
}

main();
