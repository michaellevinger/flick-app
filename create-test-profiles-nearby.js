#!/usr/bin/env node

/**
 * Create Test Users for Festival/Event Testing
 *
 * Creates 10 fake profiles in your event:
 *   - 3 auto-matched with you (appear in Matches tab immediately)
 *   - 4 already flicked you (flick them back to get a Green Light)
 *   - 3 plain users (no flicks)
 *
 * Usage:
 *   node create-test-profiles-nearby.js [FESTIVAL_ID] [YOUR_USER_ID]
 *
 * Example:
 *   node create-test-profiles-nearby.js wedding-sarah-mike-2024 user_1234_abc
 *
 * To find your user ID, check the console logs in Expo when you open the app.
 *
 * The script first clears ALL existing test user data (nudges, matches,
 * messages, exchanges) before creating fresh ones.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY
);

const festivalId = process.argv[2];
// Support old format (festival count userId) and new format (festival userId)
const _arg3 = process.argv[3];
const _arg4 = process.argv[4];
const myUserId = _arg4 || (_arg3 && isNaN(_arg3) ? _arg3 : null);

if (!festivalId) {
  console.log('\nPlease provide a festival ID!\n');
  console.log('Usage: node create-test-profiles-nearby.js [FESTIVAL_ID] [YOUR_USER_ID]');
  console.log('\nExample:');
  console.log('  node create-test-profiles-nearby.js wedding-sarah-mike-2024 user_1234_abc\n');
  console.log('Check the Expo console logs to find your user ID and festival ID.\n');
  process.exit(1);
}

const names = [
  'Alex', 'Bailey', 'Casey', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper',
  'Indigo', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Navy', 'Oak', 'Parker',
  'Quinn', 'Riley', 'Sage', 'Taylor', 'Uma', 'Vesper', 'Winter', 'Xen'
];

const bios = [
  'Love live music',
  'Coffee enthusiast',
  'Adventure seeker',
  'Foodie',
  'Dog lover',
  'Beach person',
  'Night owl',
  'Bookworm',
  'Gym rat',
  'Artist',
  'Tech geek',
  'Nature lover'
];

function generatePhoto(name, gender) {
  const initial = name[0].toUpperCase();
  const colors = { male: '4A90E2', female: 'E24A90', other: '00FF00' };
  return `https://ui-avatars.com/api/?name=${initial}&size=400&background=${colors[gender]}&color=fff&bold=true&font-size=0.4`;
}

function generatePhone() {
  // +1-555-01xx is a fictional range safe for testing
  const suffix = String(Math.floor(Math.random() * 100)).padStart(2, '0');
  return `+155501${suffix}`;
}

// ---------------------------------------------------------------------------
// Resolve test user gender from real user's profile
// ---------------------------------------------------------------------------

async function resolveTestGenderPrefs(userId) {
  if (!userId) return { gender: 'female', lookingFor: 'male' };

  const { data, error } = await supabase
    .from('users')
    .select('gender, looking_for')
    .eq('id', userId)
    .single();

  if (error || !data) {
    console.log('  Could not fetch your profile, defaulting to female/male.');
    return { gender: 'female', lookingFor: 'male' };
  }

  // Test users should be what you're looking for, and look for what you are
  const testGender = data.looking_for === 'both' ? 'female' : data.looking_for;
  const testLookingFor = data.gender === 'other' ? 'both' : data.gender;

  console.log(`  Your profile  : gender=${data.gender}, looking_for=${data.looking_for}`);
  console.log(`  Test users    : gender=${testGender}, looking_for=${testLookingFor}`);

  return { gender: testGender, lookingFor: testLookingFor };
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

async function cleanupTestUsers() {
  console.log('\nCleaning up existing test users...');

  // Deleting test users cascades nudges, matches, messages, exchanges
  // that reference them. We also need to delete nudges FROM myUserId TO
  // test users (those reference myUserId as from_user_id, so won't cascade
  // when the test user is deleted — but they DO cascade on to_user_id delete).
  // Actually ON DELETE CASCADE on to_user_id covers that too. Safe to just delete users.

  const { data, error } = await supabase
    .from('users')
    .delete()
    .like('id', 'test_%')
    .select('id');

  if (error) {
    console.error('  Failed to delete test users:', error.message);
    return;
  }

  console.log(`  Deleted ${data.length} test user(s) and their related data.`);
}

// ---------------------------------------------------------------------------
// Create profile
// ---------------------------------------------------------------------------

let namePool = [...names];

function pickName() {
  if (namePool.length === 0) namePool = [...names];
  const idx = Math.floor(Math.random() * namePool.length);
  return namePool.splice(idx, 1)[0];
}

async function createProfile(testGender, testLookingFor) {
  const name = pickName();
  const age = 21 + Math.floor(Math.random() * 15);
  const height = 155 + Math.floor(Math.random() * 25);
  const bio = bios[Math.floor(Math.random() * bios.length)];
  const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const photoUrl = generatePhoto(name, testGender);

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
      gender: testGender,
      looking_for: testLookingFor,
      bio,
      festival_id: festivalId,
      phone_number: generatePhone(),
      last_heartbeat: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Flick helpers
// ---------------------------------------------------------------------------

async function insertNudge(fromId, toId) {
  const { error } = await supabase
    .from('nudges')
    .insert({ from_user_id: fromId, to_user_id: toId });
  if (error && error.code !== '23505') throw error;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\nTest User Setup');
  console.log('================');
  console.log(`Festival : ${festivalId}`);
  console.log(`My user  : ${myUserId || '(none — matches/flicks will be skipped)'}`);

  await cleanupTestUsers();

  console.log('\nResolving gender preferences...');
  const { gender: testGender, lookingFor: testLookingFor } = await resolveTestGenderPrefs(myUserId);

  // Shuffle type assignments so users appear in random order in the radar
  const types = ['matched', 'matched', 'matched', 'preFlicked', 'preFlicked', 'preFlicked', 'preFlicked', 'plain', 'plain', 'plain'];
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }

  console.log('\nCreating 10 test users...\n');

  const created = [];

  for (let i = 0; i < 10; i++) {
    try {
      const user = await createProfile(testGender, testLookingFor);
      created.push({ user, type: types[i] });
      await new Promise(r => setTimeout(r, 120));
    } catch (err) {
      console.error(`  Failed to create user: ${err.message}`);
    }
  }

  // Apply flick relationships
  for (const { user, type } of created) {
    try {
      if (type === 'matched' && myUserId) {
        await insertNudge(user.id, myUserId);
        await insertNudge(myUserId, user.id); // trigger creates match record
        console.log(`  [MATCHED]      ${user.name}, ${user.age}`);
      } else if (type === 'preFlicked' && myUserId) {
        await insertNudge(user.id, myUserId);
        console.log(`  [FLICKED YOU]  ${user.name}, ${user.age}`);
      } else {
        console.log(`  [PLAIN]        ${user.name}, ${user.age}`);
      }
    } catch (err) {
      console.error(`  Failed flick for ${user.name}: ${err.message}`);
    }
  }

  const matchedCount = created.filter(c => c.type === 'matched').length;
  const preFlickedCount = created.filter(c => c.type === 'preFlicked').length;
  const plainCount = created.filter(c => c.type === 'plain').length;

  console.log('\n--- Summary ---');
  console.log(`  ${matchedCount}  auto-matched  → check the Matches tab`);
  console.log(`  ${preFlickedCount}  pre-flicked   → flick them in the radar for a Green Light`);
  console.log(`  ${plainCount}  plain         → no flicks, just browsable`);
  console.log('\nPull to refresh in the app to see them!\n');
}

// ---------------------------------------------------------------------------
// Delete recent test users by name
// ---------------------------------------------------------------------------

async function deleteRecentUsers() {
  const readline = require('readline');

  console.log('\nSearching for users created in the last 5 days with test names...\n');

  const { data, error } = await supabase
    .from('users')
    .select('id, name, age, created_at')
    .in('name', names)
    .gte('created_at', new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch users:', error.message);
    return;
  }

  if (data.length === 0) {
    console.log('No matching users found. Nothing to delete.\n');
    return;
  }

  console.log(`Found ${data.length} user(s):\n`);
  data.forEach(u => {
    const created = new Date(u.created_at).toLocaleString();
    console.log(`  ${u.name.padEnd(10)} age ${u.age}  created ${created}  id: ${u.id}`);
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question(`\nDelete these ${data.length} user(s) and all their data? (y/N) `, async answer => {
    rl.close();
    if (answer.trim().toLowerCase() !== 'y') {
      console.log('Aborted. No users deleted.\n');
      return;
    }

    const ids = data.map(u => u.id);
    const { error: delError } = await supabase.from('users').delete().in('id', ids);

    if (delError) {
      console.error('Delete failed:', delError.message);
    } else {
      console.log(`\nDeleted ${data.length} user(s) and their related data.\n`);
    }
  });
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

if (process.argv[2] === '--delete-recent') {
  deleteRecentUsers().catch(console.error);
} else {
  main().catch(console.error);
}
