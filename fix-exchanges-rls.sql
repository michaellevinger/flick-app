-- Fix RLS policies for exchanges table
-- Run this in your Supabase SQL Editor

-- Drop the old restrictive policies
DROP POLICY IF EXISTS "Users can view their own exchanges" ON exchanges;
DROP POLICY IF EXISTS "Users can create exchanges" ON exchanges;
DROP POLICY IF EXISTS "Users can update their own exchanges" ON exchanges;
DROP POLICY IF EXISTS "Users can delete their own exchanges" ON exchanges;

-- Create new permissive policy (matching users/nudges tables)
CREATE POLICY "Enable all operations for exchanges" ON exchanges
  FOR ALL USING (true) WITH CHECK (true);
