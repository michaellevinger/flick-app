#!/usr/bin/env node

/**
 * Create Test Users for Festival/Event Testing
 *
 * Creates fake profiles in your event and optionally auto-matches them with you.
 *
 * Usage:
 *   node create-test-profiles-nearby.js [FESTIVAL_ID] [COUNT] [YOUR_USER_ID]
 *
 * Examples:
 *   # Create 5 test users in your event (no auto-match)
 *   node create-test-profiles-nearby.js wedding-sarah-mike-2024 5
 *
 *   # Create 5 test users AND auto-match them with you
 *   node create-test-profiles-nearby.js wedding-sarah-mike-2024 5 user_1234_abc
 *
 * To find your user ID, check the console logs in Expo when you open the app.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const festivalId = process.argv[2];
const count = parseInt(process.argv[3]) || 5;
const myUserId = process.argv[4] || null;

if (!festivalId) {
  console.log('\n❌ Please provide a festival ID!\n');
  console.log('Usage: node create-test-profiles-nearby.js [FESTIVAL_ID] [COUNT] [YOUR_USER_ID]');
  console.log('\nExamples:');
  console.log('  node create-test-profiles-nearby.js wedding-sarah-mike-2024 5');
  console.log('  node create-test-profiles-nearby.js wedding-sarah-mike-2024 5 user_1234_abc\n');
  console.log('Pass YOUR_USER_ID as the 3rd arg to auto-match all test users with you.');
  console.log('Check the Expo console logs to find your user ID and festival ID.\n');
  process.exit(1);
}

const names = [
  'Alex', 'Bailey', 'Casey', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper',
  'Indigo', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Navy', 'Oak', 'Parker',
  'Quinn', 'Riley', 'Sage', 'Taylor', 'Uma', 'Vesper', 'Winter', 'Xen'
];

const bios = [
  'Love live music 🎵',
  'Coffee enthusiast ☕',
  'Adventure seeker 🏔️',
  'Foodie 🍕',
  'Dog lover 🐕',
  'Beach person 🌊',
  'Night owl 🦉',
  'Bookworm 📚',
  'Gym rat 💪',
  'Artist 🎨',
  'Tech geek 💻',
  'Nature lover 🌲'
];

function generatePhoto(name, gender) {
  const initial = name[0].toUpperCase();
  const colors = { male: '4A90E2', female: 'E24A90', other: '00FF00' };
  return `https://ui-avatars.com/api/?name=${initial}&size=400&background=${colors[gender]}&color=fff&bold=true&font-size=0.4`;
}

// Valid values — must match src/constants/theme.js GENDER/LOOKING_FOR
const TEST_GENDER = 'female';
const TEST_LOOKING_FOR = 'male';

async function createProfile(festivalId) {
  const gender = TEST_GENDER;
  const name = names[Math.floor(Math.random() * names.length)];
  const age = 21 + Math.floor(Math.random() * 15);
  const height = 155 + Math.floor(Math.random() * 25);
  const lookingFor = TEST_LOOKING_FOR;
  const bio = bios[Math.floor(Math.random() * bios.length)];
  const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const photoUrl = generatePhoto(name, gender);

  const { data, error } = await supabase
    .from('users')
    .insert({
      id,
      name,
      age,
      height,
      selfie_url: photoUrl,
      photos: [photoUrl],
      status: true,
      gender,
      looking_for: lookingFor,
      bio,
      festival_id: festivalId,
      last_heartbeat: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  console.log(`  ✅ ${name}, ${age} (${gender}, looking for ${lookingFor})`);
  return data;
}

async function sendFlickToUser(fromTestUserId, toMyUserId) {
  // One-way flick: test user flicks you first (ladies first rule)
  const { error } = await supabase
    .from('nudges')
    .insert({ from_user_id: fromTestUserId, to_user_id: toMyUserId });

  if (error && error.code !== '23505') throw error;
}

async function main() {
  console.log('\n🎭 Creating Test Users\n');
  console.log(`🎪 Festival: ${festivalId}`);
  console.log(`👥 Count: ${count}`);
  console.log(`🤝 Auto-match: ${myUserId ? 'YES (with ' + myUserId + ')' : 'NO (pass your user ID as 3rd arg)'}\n`);

  const createdUsers = [];

  for (let i = 0; i < count; i++) {
    try {
      const user = await createProfile(festivalId);
      createdUsers.push(user);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Failed: ${error.message}`);
    }
  }

  if (myUserId && createdUsers.length > 0) {
    console.log('\n💃 Sending flicks to you (ladies first)...\n');
    for (const user of createdUsers) {
      try {
        await sendFlickToUser(user.id, myUserId);
        console.log(`  💚 ${user.name} flicked you`);
      } catch (error) {
        console.error(`  ❌ Flick failed for ${user.name}: ${error.message}`);
      }
    }
  }

  console.log(`\n✨ Done! ${createdUsers.length} test users created.`);
  if (myUserId) {
    console.log(`💃 They all flicked you first — now flick them back for a match!`);
  }
  console.log(`\n📱 Pull to refresh in the app to see them!\n`);
}

main().catch(console.error);
