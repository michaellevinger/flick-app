# Manual Testing Guide

This guide explains how to test the full flick app flow end-to-end, from both a male and female perspective, using the dev scripts and test accounts built into the project.

---

## How It Works

There are two persistent test accounts:

| Account | ID | Gender | Looking for |
|---|---|---|---|
| Dor (M) | `test_dor_male` | male | female |
| Dor (F) | `test_dor_female` | female | male |

These accounts never get deleted. You switch between them using buttons in the app.

A local file called `.dev-session.json` (gitignored) tracks which account is currently active so the scripts know who to act on.

---

## First-Time Setup

No extra setup required. The test accounts are created automatically when you first run `npm run dev:male` or `npm run dev:female`.

---

## Starting a Test Session

### As the male perspective

```bash
npm run dev:male
```

This will:
1. Upsert `test_dor_male` into the database
2. Write `.dev-session.json` with the male account
3. Start Expo on LAN

Then run `npm run seed` to populate the radar with fake users.

Then in the app, tap **Login as Male** (orange button at the bottom of the Welcome screen).

### As the female perspective

```bash
npm run dev:female
```

Same flow, but with `test_dor_female`. Then run `npm run seed` to populate with male seed users.

Then in the app, tap **Login as Female**.

---

## The Flow Scripts

Run these from a **separate terminal** while the app is open. Each script reads `.dev-session.json` to know who you currently are.

---

### `npm run seed`

**When to run:** Any time you want a fresh set of fake users on the radar (radar is empty, or you've already flicked everyone).

**What it does:**
- Deletes all previously seeded users (`seed_` prefix)
- Creates 10 plain users of the opposite gender — no flick relationships
- Does NOT affect your fixed test account or the other fixed test account

**In the app:** Pull to refresh on the radar to see the new users.

**Errors:**

| Error | Cause | Fix |
|---|---|---|
| `No active dev session found` | `.dev-session.json` is missing | Run `npm run dev:male` or `npm run dev:female` first |
| `Dev session is stale` | User not found in DB (Supabase may have been paused) | Run `npm run dev:male` or `npm run dev:female` to re-create the account |
| `Supabase credentials not found` | `.env` file missing or incorrect | Check that `.env` has `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` |

---

### `npm run flick:me`

**When to run:** When you want to test receiving a flick from someone (no prior relationship).

**What it does:**
- Finds a seed user who has no flick relationship with you in either direction
- Inserts a flick from them → you

**In the app:** Their card on the radar shows a green border and "Wants to meet" label in real time.

**Errors:**

| Error | Cause | Fix |
|---|---|---|
| `No active dev session found` | `.dev-session.json` is missing | Run `npm run dev:male` or `npm run dev:female` first |
| `No seed users found in your festival` | Radar is empty | Run `npm run seed` first |
| `No neutral seed users found` | All seed users already have a flick relationship with you | Run `npm run seed` to reset — or use `npm run match:me` to trigger a Green Light instead |

---

### `npm run match:me`

**When to run:** After you've flicked someone in the radar and want to trigger the Green Light (mutual match).

**What it does:**
- Finds a seed user that **you have already flicked** in the app
- Checks they haven't flicked you back yet
- Inserts a return flick from them → you
- Creates the match record in the database

**In the app:** The Green Light screen should appear immediately via the real-time subscription.

**Important:** You must flick someone in the app first — this script enforces the real flow.

**Errors:**

| Error | Cause | Fix |
|---|---|---|
| `No active dev session found` | `.dev-session.json` is missing | Run `npm run dev:male` or `npm run dev:female` first |
| `You have not flicked anyone yet` | No outgoing flicks found | Open the radar in the app, flick one of the seed users, then run this script |
| `All users you flicked have already flicked you back` | You are already matched with everyone you flicked | Run `npm run seed` to get fresh users |
| `Could not fetch candidate user data` | Seed users were deleted | Run `npm run seed` to recreate them |

---

### `npm run message:me`

**When to run:** When you want to test receiving a message while you are already in a match.

**What it does:**
- Finds your most recent match with a seed user
- Inserts a text message from them → you
- Updates the unread count on the match

**In the app:** The message appears in the chat in real time. The Matches tab badge updates.

**Errors:**

| Error | Cause | Fix |
|---|---|---|
| `No active dev session found` | `.dev-session.json` is missing | Run `npm run dev:male` or `npm run dev:female` first |
| `No matches found` | You have no matches yet | Either open the Matches tab (the MATCHED seed users are ready) or run `npm run match:me` and complete the Green Light |
| `No matches with seed users found` | All matches are with fixed test accounts or real users | Run `npm run seed` and complete a match with one of the new seed users |

---

## Full Testing Scenarios

### Scenario A — Test the radar and flick flow

1. `npm run dev:male` → tap **Login as Male** in app
2. Pull to refresh on the radar — see 10 female users
3. Notice 4 of them already have green borders ("Wants to meet")
4. Flick one of the plain users → card gets a "Nudged" state
5. `npm run match:me` → Green Light appears in app
6. Tap "Start Chat" in the Green Light screen

### Scenario B — Test receiving a flick in real time

1. `npm run dev:male` → tap **Login as Male** in app
2. Stay on the radar
3. In a second terminal: `npm run flick:me`
4. Watch a card update with green border in real time

### Scenario C — Test the chat from both sides

1. `npm run dev:male` → tap **Login as Male** → open Matches → open a MATCHED chat
2. In a second terminal: `npm run message:me`
3. Watch the message arrive in real time
4. Send a reply
5. Switch perspective: go back to Welcome screen → tap **Login as Female**
6. Open Matches → see your reply from the male side

### Scenario D — Test the ladies-first rule

1. `npm run dev:male` → tap **Login as Male**
2. In the radar, find a female user and try to flick her (you haven't been flicked first)
3. You should see the "Ladies First" alert — the male cannot initiate
4. `npm run flick:me` → she flicks you
5. Now you (male) can flick her back → Green Light

### Scenario E — Full female perspective

1. `npm run dev:female` → tap **Login as Female**
2. Pull to refresh → see male seed users on radar
3. You (female) can flick any male user freely (ladies first rule allows it)
4. `npm run match:me` → the male flicks back → Green Light
5. You initiate the chat (females send first)
6. `npm run message:me` → a different match sends you a message

---

## Switching Between Accounts

Switching requires two steps — one for the scripts (Mac), one for the app (phone):

**In terminal** (updates `.dev-session.json` so scripts target the right account):
```bash
npm run switch:male
# or
npm run switch:female
```

**In app** (updates AsyncStorage on the phone):
Go to the Welcome screen → tap **Login as Male** or **Login as Female**.

Both steps are needed. If you only tap the button in the app without running the switch script, `npm run seed`, `flick:me`, `match:me`, and `message:me` will still target the old account.

---

## Quick Reference

```bash
# Start testing sessions
npm run dev:male       # set up as male + start expo
npm run dev:female     # set up as female + start expo

# Switch accounts mid-session (expo already running)
npm run switch:male    # update session file → then tap "Login as Male" in app
npm run switch:female  # update session file → then tap "Login as Female" in app

# While the app is running (separate terminal)
npm run seed           # reset and re-seed the radar with 10 fresh users
npm run flick:me       # someone new flicks you (green border on their card)
npm run match:me       # someone you already flicked flicks back (Green Light)
npm run message:me     # a matched user sends you a message
```

---

## File Reference

| File | Purpose |
|---|---|
| `scripts/login.js` | Upserts test account to DB, writes `.dev-session.json` |
| `scripts/seed-radar.js` | Creates/resets 10 fake seed users in your festival |
| `scripts/flick-me.js` | Inserts a flick from a neutral seed user to you |
| `scripts/match-me.js` | Inserts a return flick from a user you already flicked |
| `scripts/message-me.js` | Inserts a message from a matched seed user to you |
| `scripts/lib/test-accounts.js` | Fixed test account definitions (shared by all scripts) |
| `scripts/lib/dev-session.js` | Read/write/validate `.dev-session.json` |
| `scripts/lib/logger.js` | Consistent logging format across all scripts |
| `.dev-session.json` | Local file tracking the active test account (gitignored) |
