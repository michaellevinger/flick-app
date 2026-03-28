#!/usr/bin/env node
/**
 * match-me.js — Simulate a mutual match (Green Light trigger)
 *
 * Usage:
 *   npm run match:me
 *
 * What it does:
 *   Finds a seed user that YOU have already flicked (nudge from you → them),
 *   and who has NOT flicked you back yet. Then:
 *     1. Inserts a return flick from them → you (creating a mutual match)
 *     2. Creates the match record in the DB
 *
 *   The app's real-time subscription detects the mutual match and navigates
 *   to the Green Light screen automatically.
 *
 * In the app:
 *   You should see the Green Light screen appear immediately.
 *
 * Prerequisites:
 *   - Active dev session (run `npm run dev:male` or `npm run dev:female` first)
 *   - You must have flicked at least one seed user in the app already
 *     (open the radar, flick someone, THEN run this script)
 */

const { supabase } = require('./lib/supabase-client');
const { requireSession } = require('./lib/dev-session');
const log = require('./lib/logger');

function getMatchId(id1, id2) {
  return id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
}

async function main() {
  log.header('match:me');

  const sessionData = await requireSession(supabase);
  const { userId, name, gender, festivalId } = sessionData;

  log.session(userId, name, gender, festivalId);

  // Find seed users that I have flicked
  log.step('Looking for seed users you have already flicked...');

  const { data: myFlicks, error: flickError } = await supabase
    .from('nudges')
    .select('to_user_id')
    .eq('from_user_id', userId);

  if (flickError) {
    log.error(`Could not fetch your flicks: ${flickError.message}`);
    process.exit(1);
  }

  const iFlickedIds = (myFlicks || [])
    .map((n) => n.to_user_id)
    .filter((id) => id.startsWith('seed_'));

  // Show what seed users exist in the festival
  const { data: seedUsers } = await supabase
    .from('users')
    .select('id, name, age, gender')
    .eq('festival_id', festivalId)
    .like('id', 'seed_%');

  log.step(`Seed users in festival: ${seedUsers?.length || 0}`);
  if (seedUsers?.length) {
    seedUsers.forEach((u) => log.step(`  - ${u.name}, ${u.age} (${u.gender}) — ${u.id}`));
  }
  console.log('');

  // Get ALL return nudges to me from seed users (regardless of whether I flicked them)
  const { data: allReturnFlicks } = await supabase
    .from('nudges')
    .select('from_user_id')
    .eq('to_user_id', userId)
    .like('from_user_id', 'seed_%');

  const allReturnedIds = new Set((allReturnFlicks || []).map((n) => n.from_user_id));

  // Log current state clearly
  log.step(`State: you have flicked ${iFlickedIds.length} seed user(s).`);
  if (iFlickedIds.length > 0) {
    const mutualIds = iFlickedIds.filter((id) => allReturnedIds.has(id));
    const pendingIds = iFlickedIds.filter((id) => !allReturnedIds.has(id));
    log.step(`  - ${pendingIds.length} waiting for return flick (usable)`);
    log.step(`  - ${mutualIds.length} already have return flick (mutual)`);
  }
  console.log('');

  if (iFlickedIds.length === 0) {
    log.error('You have not flicked anyone yet.');
    log.step('Fix: open the app, go to the radar, flick one of the seed users, then run this script.');
    log.footer();
    process.exit(1);
  }

  const pendingIds = iFlickedIds.filter((id) => !allReturnedIds.has(id));

  if (pendingIds.length === 0) {
    // All flicked users already have return flicks — check if match records are missing
    log.step('All flicked users already have return flicks. Checking for missing match records...');

    const mutualIds = iFlickedIds.filter((id) => allReturnedIds.has(id));
    let fixed = 0;

    for (const seedId of mutualIds) {
      const matchId = getMatchId(userId, seedId);
      const { data: existing } = await supabase.from('matches').select('id').eq('id', matchId).single();

      if (!existing) {
        const user1Id = userId < seedId ? userId : seedId;
        const user2Id = userId < seedId ? seedId : userId;
        const { error: matchError } = await supabase.from('matches').upsert(
          { id: matchId, user1_id: user1Id, user2_id: user2Id, unread_count_user1: 0, unread_count_user2: 0 },
          { onConflict: 'id' }
        );
        if (!matchError) {
          log.success(`Created missing match record for ${matchId}.`);
          fixed++;
        }
      }
    }

    if (fixed > 0) {
      log.footer('Missing match records created. Check the Matches tab in the app.');
    } else {
      log.step('All match records already exist. Check the Matches tab in the app.');
      log.step('To trigger a fresh Green Light: run `npm run seed` and flick a new user.');
      log.footer();
    }
    process.exit(0);
  }

  // Fetch profile info for pending candidates
  const { data: candidates } = await supabase
    .from('users')
    .select('id, name, age, gender')
    .in('id', pendingIds);

  if (!candidates || candidates.length === 0) {
    log.error('Could not fetch candidate profiles — seed users may have been deleted.');
    log.step('Fix: run `npm run seed` to recreate them.');
    log.footer();
    process.exit(1);
  }

  // Pick one at random
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];

  log.step(`Picking: ${chosen.name}, ${chosen.age} (${chosen.gender})`);
  log.step(`Inserting return flick: ${chosen.name} → you...`);

  const { error: nudgeError } = await supabase
    .from('nudges')
    .insert({ from_user_id: chosen.id, to_user_id: userId });

  if (nudgeError && nudgeError.code !== '23505') {
    log.error(`Failed to insert return flick: ${nudgeError.message}`);
    process.exit(1);
  }

  // Create match record so chat is accessible even if the app subscription misses it
  log.step('Creating match record...');
  const matchId = getMatchId(userId, chosen.id);
  const user1Id = userId < chosen.id ? userId : chosen.id;
  const user2Id = userId < chosen.id ? chosen.id : userId;

  const { error: matchError } = await supabase
    .from('matches')
    .upsert(
      { id: matchId, user1_id: user1Id, user2_id: user2Id, unread_count_user1: 0, unread_count_user2: 0 },
      { onConflict: 'id' }
    );

  if (matchError) {
    log.step(`Match record warning: ${matchError.message}`);
  } else {
    log.success('Match record created.');
  }

  // Send push notification via Edge Function
  log.step('Sending push notification...');
  const { error: pushError } = await supabase.functions.invoke('push-notification', {
    body: { toUserId: userId, type: 'match', fromName: chosen.name, data: {
      matchId,
      otherUser: { id: chosen.id },
    }},
  });

  if (pushError) {
    log.step(`Push notification failed (non-critical): ${pushError.message}`);
  } else {
    log.step('Push notification sent.');
  }

  log.success(`${chosen.name} flicked you back — it's a mutual match!`);
  log.footer('The Green Light screen should appear in the app right now.');
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
