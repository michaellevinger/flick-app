#!/usr/bin/env node
/**
 * seed-radar.js — Populate the radar with 10 plain fake users
 *
 * Usage:
 *   node scripts/seed-radar.js
 *
 * What it does:
 *   1. Reads the active dev session to know who you are
 *   2. Deletes all previously seeded users (id starts with 'seed_')
 *   3. Creates 10 new plain users with the opposite gender (so they appear on your radar)
 *      No flick relationships — use the other scripts to simulate those in real time.
 *
 * Run with `npm run seed` to populate or reset the radar.
 */

const { supabase } = require('./lib/supabase-client');
const { requireSession } = require('./lib/dev-session');
const { FIXED_TEST_IDS } = require('./lib/test-accounts');
const log = require('./lib/logger');

const NAMES = [
  'Alex', 'Bailey', 'Casey', 'Drew', 'Ellis', 'Finley', 'Gray', 'Harper',
  'Indigo', 'Jordan', 'Kai', 'Logan', 'Morgan', 'Navy', 'Oak', 'Parker',
  'Quinn', 'Riley', 'Sage', 'Taylor',
];

const BIOS = [
  'Love live music', 'Coffee enthusiast', 'Adventure seeker', 'Foodie',
  'Dog lover', 'Beach person', 'Night owl', 'Bookworm', 'Gym rat', 'Artist',
];


function pickName(used) {
  const available = NAMES.filter((n) => !used.has(n));
  if (available.length === 0) return `User${Math.floor(Math.random() * 1000)}`;
  return available[Math.floor(Math.random() * available.length)];
}

function generatePhoto(gender) {
  const colors = { male: '4A90E2', female: 'E24A90', other: '00FF00' };
  const initials = gender === 'male' ? 'M' : 'F';
  return `https://ui-avatars.com/api/?name=${initials}&size=400&background=${colors[gender]}&color=fff&bold=true&font-size=0.5`;
}

async function cleanup(festivalId) {
  log.step('Cleaning up previous seed users...');

  // Delete by prefix — never touches fixed test accounts
  const { data, error } = await supabase
    .from('users')
    .delete()
    .like('id', 'seed_%')
    .select('id');

  if (error) {
    log.error(`Cleanup failed: ${error.message}`);
    process.exit(1);
  }

  // Also clean up any old-style test_ prefixed seed users (not fixed accounts)
  const { data: oldData, error: oldError } = await supabase
    .from('users')
    .delete()
    .like('id', 'test_%')
    .not('id', 'in', `(${FIXED_TEST_IDS.map((id) => `"${id}"`).join(',')})`)
    .select('id');

  const total = (data?.length || 0) + (oldData?.length || 0);
  log.success(`Deleted ${total} old seed user(s) and their related data.`);
}

async function createSeedUser(myUserId, festivalId, seedGender, seedLookingFor, name) {
  const id = `seed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const age = 21 + Math.floor(Math.random() * 12);
  const height = seedGender === 'male'
    ? 170 + Math.floor(Math.random() * 20)
    : 158 + Math.floor(Math.random() * 15);
  const bio = BIOS[Math.floor(Math.random() * BIOS.length)];
  const photoUrl = generatePhoto(seedGender);

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
      gender: seedGender,
      looking_for: seedLookingFor,
      bio,
      festival_id: festivalId,
      phone_number: `+1555${String(Math.floor(Math.random() * 9000) + 1000)}`,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create seed user ${name}: ${error.message}`);
  return data;
}


async function main() {
  log.header('seed-radar');

  const sessionData = await requireSession(supabase);
  const { userId, name, gender, festivalId } = sessionData;

  log.session(userId, name, gender, festivalId);

  // Opposite gender + looking_for for seed users (they should appear on your radar)
  const seedGender = gender === 'male' ? 'female' : 'male';
  const seedLookingFor = gender; // they're looking for what you are

  await cleanup(festivalId);

  log.step('Creating 10 seed users...');
  console.log('');

  const usedNames = new Set();
  let created = 0;

  for (let i = 0; i < 10; i++) {
    const name = pickName(usedNames);
    usedNames.add(name);

    try {
      await new Promise((r) => setTimeout(r, 50)); // avoid timestamp ID collisions
      const seedUser = await createSeedUser(userId, festivalId, seedGender, seedLookingFor, name);
      console.log(`  ${name}, ${seedUser.age} (${seedGender})`);
      created++;
    } catch (err) {
      console.log(`  [ERROR] ${name} — ${err.message}`);
    }
  }

  console.log('');
  log.success(`${created} users created.`);
  log.footer('Pull to refresh in the app to see them on the radar.');
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
