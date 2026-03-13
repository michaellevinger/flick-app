/**
 * Generate a consistent match ID for two users (alphabetically sorted).
 * This ensures the same pair always produces the same ID regardless of argument order.
 */
export function getMatchId(userId1, userId2) {
  return userId1 < userId2 ? `${userId1}|${userId2}` : `${userId2}|${userId1}`;
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
