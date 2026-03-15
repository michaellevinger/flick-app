#!/usr/bin/env node
/**
 * Test what users should match with yours
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('\n🔍 Testing User Matching\n');

  // Get the most recent user (probably yours)
  const { data: recentUsers } = await supabase
    .from('users')
    .select('*')
    .order('last_heartbeat', { ascending: false })
    .limit(5);

  console.log('Recent users (sorted by last heartbeat):');
  recentUsers.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.name} (${u.gender}) - Festival: ${u.festival_id || 'none'} - Looking for: ${u.looking_for}`);
  });

  const yourUser = recentUsers[0];
  console.log(`\n👤 Testing with: ${yourUser.name} (assuming this is you)\n`);
  console.log(`Your details:`);
  console.log(`  Gender: ${yourUser.gender}`);
  console.log(`  Looking for: ${yourUser.looking_for}`);
  console.log(`  Festival: ${yourUser.festival_id || 'none'}`);
  console.log(`  Status: ${yourUser.status ? 'ON' : 'OFF'}\n`);

  // Test the SQL function
  const { data: matches, error } = await supabase.rpc('find_users_in_festival', {
    user_festival_id: yourUser.festival_id,
    current_user_id: yourUser.id,
    current_user_gender: yourUser.gender,
    current_user_looking_for: yourUser.looking_for
  });

  if (error) {
    console.error('❌ Error calling function:', error);
    console.log('\n💡 The SQL function might not exist in your database!');
    console.log('   Run this file: supabase-gender-filter-migration.sql');
    return;
  }

  console.log(`✅ Function returned ${matches.length} matches:\n`);

  if (matches.length === 0) {
    console.log('No matches found. Checking why...\n');

    // Check users in same festival
    const { data: sameFestival } = await supabase
      .from('users')
      .select('id, name, gender, looking_for, status, festival_id')
      .eq('festival_id', yourUser.festival_id)
      .neq('id', yourUser.id);

    console.log(`Users in festival '${yourUser.festival_id}': ${sameFestival?.length || 0}`);

    if (sameFestival && sameFestival.length > 0) {
      sameFestival.forEach(u => {
        const myMatch = yourUser.looking_for === 'both' || yourUser.looking_for === u.gender;
        const theirMatch = u.looking_for === 'both' || u.looking_for === yourUser.gender;

        console.log(`\n  ${u.name} (${u.gender})`);
        console.log(`    Looking for: ${u.looking_for}`);
        console.log(`    Status: ${u.status ? 'ON' : 'OFF'}`);
        console.log(`    You match their preference: ${theirMatch ? '✅' : '❌'}`);
        console.log(`    They match your preference: ${myMatch ? '✅' : '❌'}`);
        console.log(`    COMPATIBLE: ${(myMatch && theirMatch && u.status) ? '✅ YES' : '❌ NO'}`);
      });
    }
  } else {
    matches.forEach(m => {
      console.log(`  ${m.name}, ${m.age} (${m.gender}) - Looking for: ${m.looking_for}`);
    });
  }

  console.log('\n');
}

main().catch(console.error);
