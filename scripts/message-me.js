#!/usr/bin/env node
/**
 * message-me.js — Simulate receiving a message from a match
 *
 * Usage:
 *   npm run message:me
 *
 * What it does:
 *   Finds an existing match between you and a seed user, inserts a text
 *   message from them to you, and updates the unread count on the match.
 *
 * In the app:
 *   The message arrives in real time via the chat subscription.
 *   The Matches tab badge updates with the unread count.
 *
 * Prerequisites:
 *   - Active dev session
 *   - At least one match with a seed user (either from seed-radar's MATCHED
 *     users, or by completing the Green Light flow via match:me)
 */

const { supabase } = require('./lib/supabase-client');
const { requireSession } = require('./lib/dev-session');
const log = require('./lib/logger');

function getMatchId(id1, id2) {
  return id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
}

const MESSAGES = [
  'Hey! Nice to match with you!',
  'This event is so much fun!',
  'Want to grab a drink?',
  'Hey there, how are you enjoying things?',
  'Small world that we matched here!',
  'So glad I came to this event 😊',
  'What did you think of the last set?',
];

async function main() {
  log.header('message:me');

  const sessionData = await requireSession(supabase);
  const { userId, name, gender, festivalId } = sessionData;

  log.session(userId, name, gender, festivalId);

  // Find all matches involving me
  log.step('Looking for existing matches...');

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id, unread_count_user1, unread_count_user2')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (matchError) {
    log.error(`Could not fetch matches: ${matchError.message}`);
    process.exit(1);
  }

  if (!matches || matches.length === 0) {
    log.error('No matches found.');
    log.step('Fix: complete a match first.');
    log.step('  Option A: The MATCHED users from `npm run seed` already have a chat ready — just open the app.');
    log.step('  Option B: Flick someone in the radar, then run `npm run match:me` and accept the Green Light.');
    log.footer();
    process.exit(1);
  }

  // Filter to matches with seed users only (not fixed test accounts)
  const seedMatches = matches.filter((m) => {
    const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
    return otherId.startsWith('seed_');
  });

  if (seedMatches.length === 0) {
    log.error('No matches with seed users found (all matches are with fixed test accounts or real users).');
    log.step('Fix: run `npm run seed` and complete a match with one of the new seed users.');
    log.footer();
    process.exit(1);
  }

  // Pick the most recent match
  const match = seedMatches[0];
  const senderId = match.user1_id === userId ? match.user2_id : match.user1_id;

  // Fetch the sender's name
  const { data: senderData } = await supabase
    .from('users')
    .select('name, age, gender')
    .eq('id', senderId)
    .single();

  const senderName = senderData?.name || senderId;

  log.step(`Sending message from: ${senderName} (${senderData?.gender || '?'})...`);

  const content = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  const { error: msgError } = await supabase
    .from('messages')
    .insert({
      match_id: match.id,
      sender_id: senderId,
      recipient_id: userId,
      message_type: 'text',
      content,
    });

  if (msgError) {
    log.error(`Failed to insert message: ${msgError.message}`);
    process.exit(1);
  }

  // Update match metadata: last_message_at + unread count for me
  const isUser1 = match.user1_id === userId;
  const unreadCol = isUser1 ? 'unread_count_user1' : 'unread_count_user2';
  const currentUnread = isUser1 ? match.unread_count_user1 : match.unread_count_user2;

  await supabase
    .from('matches')
    .update({
      last_message_at: new Date().toISOString(),
      [unreadCol]: (currentUnread || 0) + 1,
    })
    .eq('id', match.id);

  log.success(`${senderName} sent: "${content}"`);
  log.footer('Check the Matches tab — the message should appear with an unread badge.');
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
