#!/usr/bin/env node
/**
 * Refresh heartbeats for test profiles
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('\n🔄 Refreshing heartbeats for all active users...\n');

  const { data, error } = await supabase
    .from('users')
    .update({ last_heartbeat: new Date().toISOString() })
    .eq('status', true)
    .select('name');

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`✅ Updated ${data.length} users:\n`);
  data.forEach(u => console.log(`  ${u.name}`));

  console.log('\n📱 Now pull to refresh in your app!\n');
}

main().catch(console.error);
