-- Migration: Add passes table
-- Date: 2026-03-26
-- Purpose: Track users that have been passed (X button). Stored with created_at
--          so that in future a time-based window can be applied to re-show them
--          (e.g. after 1 hour). Re-passing an already-passed user resets created_at.

CREATE TABLE IF NOT EXISTS passes (
  from_user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id   TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (from_user_id, to_user_id)
);

-- Index for fast lookup of "who has this user passed?"
CREATE INDEX IF NOT EXISTS passes_from_user_idx ON passes(from_user_id);

-- RLS
ALTER TABLE passes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable all operations for passes" ON passes
  FOR ALL USING (true) WITH CHECK (true);
