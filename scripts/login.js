#!/usr/bin/env node
/**
 * login.js — Set the active dev test account
 *
 * Usage:
 *   node scripts/login.js male
 *   node scripts/login.js female
 *
 * What it does:
 *   1. Upserts the active test account into the DB
 *   2. Sets the OTHER test account to status=false (invisible on radar)
 *   3. Wipes ALL other users from test-festival (Bob, leftover real users, old seed users)
 *   4. Wipes ALL nudges and matches involving the active test account (clean flick state)
 *   5. Writes .dev-session.json so all other scripts know who you are
 *
 * Called automatically by `npm run dev:male` and `npm run dev:female`.
 * After running, tap "Login as Male" or "Login as Female" in the app.
 */

const { supabase } = require('./lib/supabase-client');
const { TEST_ACCOUNTS } = require('./lib/test-accounts');
const { writeSession } = require('./lib/dev-session');
const log = require('./lib/logger');

const gender = process.argv[2];

if (!gender || !['male', 'female'].includes(gender)) {
  console.log('');
  console.log('  Usage: node scripts/login.js [male|female]');
  console.log('');
  process.exit(1);
}

async function main() {
  log.header(`login — ${gender}`);

  const account = TEST_ACCOUNTS[gender];

  log.step(`Upserting test account: ${account.name} (${account.id})...`);

  const { error } = await supabase
    .from('users')
    .upsert(account, { onConflict: 'id' });

  if (error) {
    log.error(`Failed to upsert test account: ${error.message}`);
    log.step('Is the Supabase project active? Check https://supabase.com/dashboard');
    log.footer();
    process.exit(1);
  }

  log.success('Test account ready in DB.');

  const otherGender = gender === 'male' ? 'female' : 'male';
  const otherAccount = TEST_ACCOUNTS[otherGender];

  // 1. Set the other test account to invisible so it doesn't appear on the radar
  log.step(`Setting ${otherAccount.name} to inactive (invisible on radar)...`);
  await supabase
    .from('users')
    .update({ status: false })
    .eq('id', otherAccount.id);

  // 2. Wipe ALL other users from test-festival (leftover real users, old seeds, Bob, etc.)
  //    Safe because test-festival is exclusively for dev testing.
  log.step('Wiping all other users from test-festival...');
  const { data: deletedUsers, error: usersError } = await supabase
    .from('users')
    .delete()
    .eq('festival_id', account.festival_id)
    .not('id', 'in', `("${account.id}","${otherAccount.id}")`)
    .select('id');

  if (usersError) {
    log.step(`Festival cleanup warning: ${usersError.message} (continuing anyway)`);
  } else {
    log.success(`Removed ${deletedUsers?.length || 0} leftover user(s) from festival.`);
  }

  // 3. Wipe ALL nudges FROM this test account (clear flick state completely)
  await supabase.from('nudges').delete().eq('from_user_id', account.id);

  // 4. Wipe ALL nudges TO this test account
  await supabase.from('nudges').delete().eq('to_user_id', account.id);

  // 5. Wipe ALL matches involving this test account
  await supabase
    .from('matches')
    .delete()
    .or(`user1_id.eq.${account.id},user2_id.eq.${account.id}`);

  log.success('All nudges and matches cleared — clean flick state.');

  writeSession({
    userId: account.id,
    gender,
    name: account.name,
    festivalId: account.festival_id,
  });

  log.success(`.dev-session.json written.`);
  log.footer(`Now tap "Login as ${gender === 'male' ? 'Male' : 'Female'}" in the app.`);
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
