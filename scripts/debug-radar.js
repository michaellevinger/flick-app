#!/usr/bin/env node
/**
 * Debug Radar - Find out why profiles aren't showing
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('\n🔍 Debugging Radar\n');

  // 1. Count all users in database
  const { count: totalCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  console.log(`📊 Total users in database: ${totalCount}\n`);

  // 2. Get all active users
  const { data: allUsers, error } = await supabase
    .from('users')
    .select('id, name, age, gender, looking_for, festival_id, status')
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error fetching users:', error);
    return;
  }

  console.log(`👥 Active users (status=true):\n`);

  allUsers.forEach(user => {
    console.log(`  ${user.name}, ${user.age} (${user.gender})`);
    console.log(`    Looking for: ${user.looking_for}`);
    console.log(`    Festival: ${user.festival_id || 'none'}`);
    console.log(`    Status: ${user.status ? 'ON' : 'OFF'}`);

    // Debug location - show raw value
    console.log(`    Location RAW:`, JSON.stringify(user.location));

    // Parse location
    if (user.location) {
      let lat, lng;
      if (typeof user.location === 'string') {
        const match = user.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (match) {
          lng = parseFloat(match[1]);
          lat = parseFloat(match[2]);
          console.log(`    Location PARSED: ${lat}, ${lng}`);
        } else {
          console.log(`    Location: String but doesn't match POINT format`);
        }
      } else if (user.location && user.location.latitude) {
        console.log(`    Location PARSED: ${user.location.latitude}, ${user.location.longitude}`);
      } else if (typeof user.location === 'object') {
        console.log(`    Location: Object but no latitude property`);
      }
    } else {
      console.log(`    Location: NOT SET ❌`);
    }

    console.log(`    ID: ${user.id.substring(0, 30)}...`);
    console.log('');
  });

  console.log('\n💡 Troubleshooting:\n');
  console.log('  1. Make sure YOU have a location set (check app console)');
  console.log('  2. Make sure test profiles have the SAME festival_id as you');
  console.log('  3. Check gender filtering (Male looking for Female, etc.)');
  console.log('  4. Make sure you and test profiles are within 500m\n');
}

main().catch(console.error);
