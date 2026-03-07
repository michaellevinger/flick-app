-- ============================================================================
-- Host Authentication & Authorization Migration (Idempotent)
-- Created: 2026-03-08
-- Purpose: Add host profiles, enable RLS for security (safe to re-run)
-- ============================================================================

-- ============================================================================
-- 1. Create host_profiles Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS host_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone_number TEXT,
  events_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS host_profiles_email_idx ON host_profiles(email);

-- ============================================================================
-- 2. Enable Row Level Security on host_profiles
-- ============================================================================

ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 3. RLS Policies for host_profiles (Drop existing first)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Hosts can read own profile" ON host_profiles;
DROP POLICY IF EXISTS "Hosts can update own profile" ON host_profiles;
DROP POLICY IF EXISTS "Users can create host profile" ON host_profiles;

-- Policy: Hosts can read their own profile
CREATE POLICY "Hosts can read own profile"
  ON host_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Hosts can update their own profile
CREATE POLICY "Hosts can update own profile"
  ON host_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can create their host profile (on first sign-in)
CREATE POLICY "Users can create host profile"
  ON host_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ============================================================================
-- 4. Add auth_host_id to festivals table
-- ============================================================================

-- Add column to link festivals to authenticated hosts
ALTER TABLE festivals ADD COLUMN IF NOT EXISTS auth_host_id UUID REFERENCES auth.users(id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS festivals_auth_host_id_idx ON festivals(auth_host_id);

-- ============================================================================
-- 5. Enable Row Level Security on festivals
-- ============================================================================

ALTER TABLE festivals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 6. RLS Policies for festivals (Drop existing first)
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can create events" ON festivals;
DROP POLICY IF EXISTS "Hosts can update own events" ON festivals;
DROP POLICY IF EXISTS "Hosts can read own events" ON festivals;
DROP POLICY IF EXISTS "Public can read active events" ON festivals;
DROP POLICY IF EXISTS "Authenticated users can read active events" ON festivals;

-- Policy: Authenticated users can create events
CREATE POLICY "Authenticated users can create events"
  ON festivals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_host_id);

-- Policy: Hosts can update their own events
CREATE POLICY "Hosts can update own events"
  ON festivals
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_host_id);

-- Policy: Hosts can read their own events
CREATE POLICY "Hosts can read own events"
  ON festivals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_host_id);

-- Policy: Public (anonymous users) can read active events (for QR scanning)
CREATE POLICY "Public can read active events"
  ON festivals
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Policy: Authenticated guests can read active events (for QR scanning)
CREATE POLICY "Authenticated users can read active events"
  ON festivals
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- ============================================================================
-- 7. Update Function: Auto-update updated_at timestamp
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for host_profiles
DROP TRIGGER IF EXISTS update_host_profiles_updated_at ON host_profiles;
CREATE TRIGGER update_host_profiles_updated_at
  BEFORE UPDATE ON host_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Helper Function: Increment Events Created Counter
-- ============================================================================

CREATE OR REPLACE FUNCTION increment_events_created(host_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE host_profiles
  SET events_created = events_created + 1
  WHERE id = host_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Migration Complete - Safe to re-run!
-- ============================================================================
