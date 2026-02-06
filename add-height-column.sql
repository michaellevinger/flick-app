-- Add height column to users table
-- Run this in your Supabase SQL Editor

ALTER TABLE users ADD COLUMN IF NOT EXISTS height INTEGER;
