#!/usr/bin/env node
/**
 * Get current user's location from database
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  console.log('\n📍 Fetching all active users...\n');

  const { data, error } = await supabase
    .from('users')
    .select('id, name, location')
    .eq('status', true)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) {
    console.error('Error:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('No active users found.');
    return;
  }

  data.forEach(user => {
    if (user.location) {
      // Parse PostGIS POINT format
      const match = user.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
      if (match) {
        const lng = parseFloat(match[1]);
        const lat = parseFloat(match[2]);
        console.log(`${user.name} (${user.id.substring(0, 20)}...)`);
        console.log(`  Location: ${lat}, ${lng}\n`);
      }
    } else {
      console.log(`${user.name} - No location set\n`);
    }
  });
}

main().catch(console.error);
