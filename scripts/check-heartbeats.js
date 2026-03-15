const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

async function main() {
  const { data } = await supabase
    .from('users')
    .select('name, last_heartbeat')
    .eq('festival_id', 'coachella2024')
    .eq('status', true)
    .in('gender', ['Female'])
    .in('looking_for', ['Male', 'Both']);

  console.log('\nFemale users compatible with male:');
  const now = new Date();
  data.forEach(u => {
    const hb = new Date(u.last_heartbeat);
    const ageMinutes = (now - hb) / 1000 / 60;
    console.log(`${u.name}: ${ageMinutes.toFixed(1)} minutes ago ${ageMinutes > 20 ? '❌ TOO OLD' : '✅ OK'}`);
  });
}

main();
