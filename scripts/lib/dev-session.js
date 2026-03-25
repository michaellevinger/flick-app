const fs = require('fs');
const path = require('path');

const SESSION_FILE = path.join(__dirname, '../../.dev-session.json');

function readSession() {
  if (!fs.existsSync(SESSION_FILE)) return null;
  try {
    return JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeSession(data) {
  fs.writeFileSync(SESSION_FILE, JSON.stringify(data, null, 2));
}

function deleteSession() {
  if (fs.existsSync(SESSION_FILE)) fs.unlinkSync(SESSION_FILE);
}

/**
 * Reads the session file and validates the user exists in the DB.
 * Exits with a clear error message if the session is missing or stale.
 * Returns the session data + the DB user row on success.
 */
async function requireSession(supabase) {
  const session = readSession();

  if (!session) {
    console.log('');
    console.log('  ERROR: No active dev session found.');
    console.log('  Run one of these first:');
    console.log('    npm run dev:male    — set up as male and start expo');
    console.log('    npm run dev:female  — set up as female and start expo');
    console.log('');
    process.exit(1);
  }

  const { data, error } = await supabase
    .from('users')
    .select('id, name, gender, looking_for, festival_id')
    .eq('id', session.userId)
    .single();

  if (error || !data) {
    console.log('');
    console.log('  ERROR: Dev session is stale — user not found in the database.');
    console.log(`  Session pointed to: ${session.userId}`);
    console.log('  The Supabase project may have been paused, or the user was deleted.');
    console.log('  Fix: run `npm run dev:male` or `npm run dev:female` to re-create it.');
    console.log('');
    process.exit(1);
  }

  return { ...session, dbUser: data };
}

module.exports = { readSession, writeSession, deleteSession, requireSession };
