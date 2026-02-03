// Test if we can actually upload to the selfies bucket
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpload() {
  console.log('🧪 Testing file upload to selfies bucket...\n');

  // Create a small test file (1x1 pixel PNG in base64)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const testImageBuffer = Buffer.from(testImageBase64, 'base64');

  const fileName = `test_${Date.now()}.png`;

  console.log(`Uploading test file: ${fileName}`);

  // Try to upload
  const { data, error } = await supabase.storage
    .from('selfies')
    .upload(fileName, testImageBuffer, {
      contentType: 'image/png',
      upsert: false
    });

  if (error) {
    console.error('❌ Upload failed:', error.message);
    console.log('\n💡 This might mean:');
    console.log('   1. Bucket policies need to be configured');
    console.log('   2. Bucket might not be truly public');
    console.log('   3. RLS policies blocking anonymous uploads\n');

    console.log('🔧 Fix: Go to Storage → selfies → Policies');
    console.log('   Add policy: "Allow anonymous uploads"');
    console.log('   Target roles: anon');
    console.log('   Allowed operations: INSERT\n');
    return false;
  }

  console.log('✅ Upload successful!');
  console.log(`   Path: ${data.path}`);

  // Try to get public URL
  const { data: urlData } = supabase.storage
    .from('selfies')
    .getPublicUrl(fileName);

  console.log(`   Public URL: ${urlData.publicUrl}\n`);

  // Clean up - try to delete the test file
  const { error: deleteError } = await supabase.storage
    .from('selfies')
    .remove([fileName]);

  if (deleteError) {
    console.log('⚠️  Could not delete test file (manual cleanup needed)');
  } else {
    console.log('🗑️  Test file cleaned up\n');
  }

  console.log('🎉 Storage bucket is working correctly!\n');
  return true;
}

testUpload();
