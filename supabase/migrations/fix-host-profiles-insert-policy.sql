-- ============================================================================
-- Fix: Add INSERT policy for host_profiles
-- Issue: RLS blocking profile creation on signup
-- ============================================================================

-- Drop and recreate INSERT policy
DROP POLICY IF EXISTS "Users can create host profile" ON host_profiles;

-- Policy: Allow authenticated users to create their own host profile
CREATE POLICY "Users can create host profile"
  ON host_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE host_profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Done! Run this in Supabase SQL Editor
-- ============================================================================
