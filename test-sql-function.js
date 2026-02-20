#!/usr/bin/env node
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('\n🧪 Testing SQL Function Directly\n');

  // Test with explicit parameters
  console.log('Testing: male looking for female in coachella2024\n');

  const { data, error } = await supabase.rpc('find_users_in_festival', {
    user_festival_id: 'coachella2024',
    current_user_id: 'test_id_123',
    current_user_gender: 'male',
    current_user_looking_for: 'female'
  });

  if (error) {
    console.error('❌ Error:', error);
    return;
  }

  console.log(`✅ SQL function returned ${data.length} results:\n`);

  if (data.length > 0) {
    data.forEach(u => {
      console.log(`  ${u.name}, ${u.age} (${u.gender}) - Looking for: ${u.looking_for}`);
      console.log(`    Photos: ${u.photos ? 'YES ✅' : 'NO ❌'}`);
      console.log(`    Bio: ${u.bio || 'none'}`);
    });
    console.log('\n🎉 SUCCESS! The function is working!\n');
  } else {
    console.log('Still no results. Checking what profiles exist...\n');

    const { data: allInFestival } = await supabase
      .from('users')
      .select('name, gender, looking_for, status')
      .eq('festival_id', 'coachella2024')
      .eq('status', true);

    console.log(`Total active users in coachella2024: ${allInFestival.length}`);
    allInFestival.forEach(u => {
      console.log(`  ${u.name} (${u.gender}) looking for ${u.looking_for}`);
    });
  }
}

main().catch(console.error);
