const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.log('');
  console.log('  ERROR: Supabase credentials not found.');
  console.log('  Make sure .env exists in the project root with:');
  console.log('    EXPO_PUBLIC_SUPABASE_URL=...');
  console.log('    EXPO_PUBLIC_SUPABASE_ANON_KEY=...');
  console.log('');
  process.exit(1);
}

const supabase = createClient(url, key);

module.exports = { supabase };
