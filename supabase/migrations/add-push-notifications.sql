-- Migration: Add push notification support
-- Date: 2026-03-26
-- Purpose: Store Expo push tokens and per-user notification preferences.
--
-- Future upgrade path:
--   - expo_push_token: replace with a push_tokens(user_id, token, platform, updated_at)
--     table to support multiple devices per user. The Edge Function would then fan out
--     to all tokens for a given user_id.
--   - notification_preferences: already JSONB so new preference keys can be added
--     without schema changes.

ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;

ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB
  DEFAULT '{"matches": true, "messages": true, "flicks": true, "exchanges": true}';
