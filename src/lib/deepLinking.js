import AsyncStorage from '@react-native-async-storage/async-storage';

const PENDING_FESTIVAL_KEY = 'pendingDeepLinkFestivalId';
const DEEP_LINK_DOMAIN = 'helloflick.com';

/**
 * Parse a deep link URL and return its type and payload.
 * Supports:
 *   flick://join/EVENT_ID, https://helloflick.com/join/EVENT_ID  → { type: 'join', eventId }
 *   flick://host,          https://helloflick.com/host            → { type: 'host' }
 * Returns null for unrecognised URLs.
 */
export function parseDeepLink(url) {
  if (!url) return null;

  try {
    // Host deep link
    if (url === 'flick://host' || url.includes(`${DEEP_LINK_DOMAIN}/host`)) {
      return { type: 'host' };
    }

    // Join event deep link
    if (url.startsWith('flick://join/')) {
      const match = url.match(/^flick:\/\/join\/(.+)/);
      return match?.[1] ? { type: 'join', eventId: match[1] } : null;
    }
    if (url.includes(`${DEEP_LINK_DOMAIN}/join/`)) {
      const match = url.match(/\/join\/([^/?#]+)/);
      return match?.[1] ? { type: 'join', eventId: match[1] } : null;
    }
  } catch {
    // malformed URL
  }

  return null;
}

/**
 * Extract event ID from a deep link URL (convenience wrapper).
 */
export function parseEventIdFromUrl(url) {
  const result = parseDeepLink(url);
  return result?.type === 'join' ? result.eventId : null;
}

/**
 * Extract event ID from a QR code value.
 * Handles both full URLs and raw festival IDs.
 */
export function parseEventIdFromQR(data) {
  if (!data) return null;
  // Try URL parsing first
  const fromUrl = parseEventIdFromUrl(data);
  if (fromUrl) return fromUrl;
  // Raw festival ID (no slashes, no protocol)
  return data;
}

/**
 * Build the shareable join link for an event.
 */
export function getJoinLink(eventId) {
  return `https://${DEEP_LINK_DOMAIN}/join/${eventId}`;
}

/** Store a pending festival ID for after onboarding completes. */
export async function storePendingFestivalId(eventId) {
  await AsyncStorage.setItem(PENDING_FESTIVAL_KEY, eventId);
}

/** Read the pending festival ID (returns null if none). */
export async function getPendingFestivalId() {
  return AsyncStorage.getItem(PENDING_FESTIVAL_KEY);
}

/** Clear the pending festival ID. */
export async function clearPendingFestivalId() {
  await AsyncStorage.removeItem(PENDING_FESTIVAL_KEY);
}
