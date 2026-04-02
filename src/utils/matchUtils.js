/**
 * Generate a consistent match ID for two users (alphabetically sorted).
 * This ensures the same pair always produces the same ID regardless of argument order.
 */
export function getMatchId(userId1, userId2) {
  return userId1 < userId2 ? `${userId1}|${userId2}` : `${userId2}|${userId1}`;
}

/**
 * Check if a straight match requires "ladies first" behavior.
 */
export function isLadiesFirstMatch(myGender, theirGender) {
  return (myGender === 'male' && theirGender === 'female') ||
    (myGender === 'female' && theirGender === 'male');
}

/**
 * Check if the user can request a number exchange.
 * In a straight match, a male cannot request until the female has
 * either messaged first or sent an exchange request herself.
 */
export function canRequestExchange({ myGender, theirGender, theirMessageCount, existingExchange }) {
  if (!isLadiesFirstMatch(myGender, theirGender)) return true;
  if (myGender !== 'male') return true;
  // She messaged first — he can request
  if (theirMessageCount > 0) return true;
  // She already requested his number — he can respond (handled elsewhere)
  if (existingExchange?.requested_by && existingExchange.requested_by !== null) return true;
  return false;
}

/**
 * Validate a phone number. Strips non-digit characters (except leading +),
 * then checks for 7-15 digits (E.164 range).
 * Returns { valid, cleaned, error }.
 */
export function validatePhoneNumber(raw) {
  if (!raw || !raw.trim()) {
    return { valid: false, cleaned: '', error: 'Please enter a phone number.' };
  }

  const hasPlus = raw.trim().startsWith('+');
  const digits = raw.replace(/\D/g, '');

  if (digits.length < 7) {
    return { valid: false, cleaned: '', error: 'Phone number is too short.' };
  }
  if (digits.length > 15) {
    return { valid: false, cleaned: '', error: 'Phone number is too long.' };
  }

  const cleaned = (hasPlus ? '+' : '') + digits;
  return { valid: true, cleaned, error: null };
}

/**
 * Normalize user data from Supabase to ensure correct JS types.
 * Supabase may return booleans as strings or numbers as strings.
 */
export function normalizeUserData(user) {
  if (!user) return null;
  return {
    ...user,
    status: user.status !== undefined ? Boolean(user.status) : undefined,
    age: user.age !== undefined ? Number(user.age) : undefined,
  };
}
