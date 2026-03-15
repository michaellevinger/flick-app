-- Add gender and preference fields to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS looking_for TEXT;

-- Create indexes for faster preference matching
CREATE INDEX IF NOT EXISTS users_gender_idx ON users(gender);
CREATE INDEX IF NOT EXISTS users_looking_for_idx ON users(looking_for);
