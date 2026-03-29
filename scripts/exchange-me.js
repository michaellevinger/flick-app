#!/usr/bin/env node
/**
 * exchange-me.js — Simulate receiving a phone number exchange request
 *
 * Usage:
 *   npm run exchange:me
 *
 * What it does:
 *   Finds an existing match between you and a seed user, then inserts
 *   an exchange request from them to you (as if they tapped "Request Number"
 *   in the chat). Also inserts a system message in the chat.
 *
 * In the app:
 *   An Alert pops up asking you to accept or decline the exchange.
 *   The chat shows a system message about the request.
 *
 * Prerequisites:
 *   - Active dev session
 *   - At least one match with a seed user
 *   - Both users must have phone numbers set
 */

const { supabase } = require('./lib/supabase-client');
const { requireSession } = require('./lib/dev-session');
const log = require('./lib/logger');

function getMatchId(id1, id2) {
  return id1 < id2 ? `${id1}|${id2}` : `${id2}|${id1}`;
}

async function main() {
  log.header('exchange:me');

  const sessionData = await requireSession(supabase);
  const { userId, name, gender, festivalId } = sessionData;

  log.session(userId, name, gender, festivalId);

  // Find matches with seed users
  log.step('Looking for existing matches...');

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('id, user1_id, user2_id')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('last_message_at', { ascending: false, nullsFirst: false });

  if (matchError) {
    log.error(`Could not fetch matches: ${matchError.message}`);
    process.exit(1);
  }

  const seedMatches = (matches || []).filter((m) => {
    const otherId = m.user1_id === userId ? m.user2_id : m.user1_id;
    return otherId.startsWith('seed_');
  });

  if (seedMatches.length === 0) {
    log.error('No matches with seed users found.');
    log.step('Fix: complete a match first with `npm run match:me`.');
    log.footer();
    process.exit(1);
  }

  // Check for existing pending exchanges and skip those matches
  const match = seedMatches[0];
  const senderId = match.user1_id === userId ? match.user2_id : match.user1_id;
  const matchId = match.id;

  const { data: existingExchange } = await supabase
    .from('exchanges')
    .select('id, status')
    .or(`and(user_a_id.eq.${senderId},user_b_id.eq.${userId}),and(user_a_id.eq.${userId},user_b_id.eq.${senderId})`)
    .single();

  if (existingExchange) {
    log.error(`Exchange already exists (status: ${existingExchange.status}).`);
    log.step('Fix: delete it first or use a different match.');
    log.footer();
    process.exit(1);
  }

  // Fetch sender info
  const { data: senderData } = await supabase
    .from('users')
    .select('name, phone_number')
    .eq('id', senderId)
    .single();

  const senderName = senderData?.name || senderId;
  const senderPhone = senderData?.phone_number;

  // Fetch my phone number
  const { data: myData } = await supabase
    .from('users')
    .select('phone_number')
    .eq('id', userId)
    .single();

  const myPhone = myData?.phone_number;

  if (!senderPhone) {
    log.step(`${senderName} has no phone number. Setting a test number...`);
    await supabase.from('users').update({ phone_number: '+15559990001' }).eq('id', senderId);
  }

  if (!myPhone) {
    log.step('You have no phone number set. Setting a test number...');
    await supabase.from('users').update({ phone_number: '+15559990002' }).eq('id', userId);
  }

  const finalSenderPhone = senderPhone || '+15559990001';
  const finalMyPhone = myPhone || '+15559990002';

  log.step(`${senderName} is requesting to exchange numbers with you...`);

  // Insert the exchange request
  const { data: exchange, error: exchangeError } = await supabase
    .from('exchanges')
    .insert({
      user_a_id: senderId,
      user_b_id: userId,
      user_a_phone: finalSenderPhone,
      user_b_phone: finalMyPhone,
      requested_by: senderId,
      status: 'pending',
    })
    .select()
    .single();

  if (exchangeError) {
    log.error(`Failed to create exchange request: ${exchangeError.message}`);
    process.exit(1);
  }

  // Insert system message in chat (sender_id/recipient_id are null for system messages)
  const { error: msgError } = await supabase
    .from('messages')
    .insert({
      match_id: matchId,
      sender_id: null,
      recipient_id: null,
      message_type: 'system',
      content: `${senderName} requested to exchange phone numbers`,
      metadata: { type: 'exchange_request', exchange_id: exchange.id },
    });

  if (msgError) {
    log.step(`System message failed (non-critical): ${msgError.message}`);
  }

  // Send push notification
  log.step('Sending push notification...');
  const { error: pushError } = await supabase.functions.invoke('push-notification', {
    body: {
      toUserId: userId,
      type: 'exchange_request',
      fromName: senderName,
      data: {
        matchId,
        otherUser: { id: senderId },
      },
    },
  });

  if (pushError) {
    log.step(`Push notification failed (non-critical): ${pushError.message}`);
  } else {
    log.step('Push notification sent.');
  }

  log.success(`${senderName} wants to exchange numbers!`);
  log.footer('Check the chat — you should see the exchange request alert.');
}

main().catch((err) => {
  console.error('Unexpected error:', err.message);
  process.exit(1);
});
