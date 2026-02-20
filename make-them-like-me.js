#!/usr/bin/env node
/**
 * Make specific users flick you
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  // Get your user ID (most recent user)
  const { data: recentUsers } = await supabase
    .from('users')
    .select('id, name')
    .order('last_heartbeat', { ascending: false })
    .limit(1);

  const yourUser = recentUsers[0];
  console.log(`\n👤 Your user: ${yourUser.name} (${yourUser.id.substring(0, 20)}...)\n`);

  // Find Kate and Wendy
  const { data: users } = await supabase
    .from('users')
    .select('id, name')
    .in('name', ['Kate', 'Wendy']);

  console.log(`Found ${users.length} users to flick you:\n`);

  for (const user of users) {
    console.log(`  ${user.name} → flicking you...`);

    // Insert nudge (or update if already exists)
    const { error } = await supabase
      .from('nudges')
      .upsert({
        from_user_id: user.id,
        to_user_id: yourUser.id,
        created_at: new Date().toISOString()
      }, {
        onConflict: 'from_user_id,to_user_id'
      });

    if (error) {
      console.log(`    ❌ Error: ${error.message}`);
    } else {
      console.log(`    ✅ Done!`);
    }
  }

  console.log('\n📱 Pull to refresh in the app - you should see green borders!\n');
}

main().catch(console.error);
