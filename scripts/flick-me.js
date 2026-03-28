#!/usr/bin/env node
/**
 * flick-me.js — Simulate someone flickng you (no prior relationship)
 *
 * Usage:
 *   npm run flick:me
 *
 * What it does:
 *   Finds a seed user who has NO flick relationship with you in either direction,
 *   and inserts a flick from them to you.
 *
 * In the app:
 *   Their card on the radar will show a green border and "Wants to meet" label
 *   in real time via the subscription.
 *
 * Prerequisites:
 *   - Active dev session (run `npm run dev:male` or `npm run dev:female` first)
 *   - Seed users exist (run `npm run seed` if the radar is empty)
 *   - The chosen user must NOT have flicked you yet (that's the whole point)
 */

const { supabase } = require('./lib/supabase-client');
const { requireSession } = require('./lib/dev-session');
const { FIXED_TEST_IDS } = require('./lib/test-accounts');
const log = require('./lib/logger');

async function main() {
  log.header('flick:me');

  const sessionData = await requireSession(supabase);
  const { userId, name, gender, festivalId } = sessionData;

  log.session(userId, name, gender, festivalId);

  // Get all seed users in festival
  log.step('Looking for seed users in your festival...');
  const { data: seedUsers, error: seedError } = await supabase
    .from('users')
    .select('id, name, age, gender')
    .eq('festival_id', festivalId)
    .like('id', 'seed_%');

  if (seedError) {
    log.error(`Could not fetch seed users: ${seedError.message}`);
    process.exit(1);
  }

  if (!seedUsers || seedUsers.length === 0) {
    log.error('No seed users found in your festival.');
    log.step('Fix: run `npm run seed` to create test users first.');
    log.footer();
    process.exit(1);
  }

  // Get all nudges involving me
  const { data: nudgesFromMe } = await supabase
    .from('nudges')
    .select('to_user_id')
    .eq('from_user_id', userId);

  const { data: nudgesToMe } = await supabase
    .from('nudges')
    .select('from_user_id')
    .eq('to_user_id', userId);

  const iFlicked = new Set((nudgesFromMe || []).map((n) => n.to_user_id));
  const theyFlicked = new Set((nudgesToMe || []).map((n) => n.from_user_id));

  // Find neutral users: no nudge in either direction
  const neutral = seedUsers.filter(
    (u) => !iFlicked.has(u.id) && !theyFlicked.has(u.id)
  );

  if (neutral.length === 0) {
    log.error('No neutral seed users found (all have an existing flick relationship with you).');
    log.step('Options:');
    log.step('  1. Run `npm run seed` to create fresh seed users.');
    log.step('  2. Or use `npm run match:me` if you want to trigger a Green Light instead.');
    log.footer();
    process.exit(1);
  }

  // Pick one at random
  const chosen = neutral[Math.floor(Math.random() * neutral.length)];

  log.step(`Found ${neutral.length} neutral user(s). Picking: ${chosen.name}, ${chosen.age} (${chosen.gender})`);
  log.step(`Inserting flick: ${chosen.name} → you...`);

  const { error: nudgeError } = await supabase
    .from('nudges')
    .insert({ from_user_id: chosen.id, to_user_id: userId });

  if (nudgeError) {
    log.error(`Failed to insert flick: ${nudgeError.message}`);
    process.exit(1);
  }

  // Send push notification via Edge Function
  log.step('Sending push notification...');
  const { error: pushError } = await supabase.functions.invoke('push-notification', {
    body: { toUserId: userId, type: 'flick', fromName: chosen.name },
  });

  if (pushError) {
    log.step(`Push notification failed (non-critical): ${pushError.message}`);
  } else {
    log.step('Push notification sent.');
  }

  log.success(`${chosen.name} just flicked you!`);
  log.footer(`Open the radar — ${chosen.name}'s card should now have a green border and "Wants to meet" label.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
