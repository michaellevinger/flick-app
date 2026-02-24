-- Migration: Add event customization columns
-- Date: 2026-02-24
-- Purpose: Enable couples to customize event colors, title, and questions

-- Add color customization columns
ALTER TABLE festivals
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#C44CE0',
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#FF6B9D';

-- Add event branding columns
ALTER TABLE festivals
ADD COLUMN IF NOT EXISTS custom_title TEXT,
ADD COLUMN IF NOT EXISTS subtitle TEXT;

-- Add custom questions column (JSONB array)
ALTER TABLE festivals
ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '[]'::jsonb;

-- Add publishing state columns
ALTER TABLE festivals
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS customization_completed BOOLEAN DEFAULT false;

-- Create index on custom_questions for faster queries
CREATE INDEX IF NOT EXISTS festivals_custom_questions_idx ON festivals USING GIN (custom_questions);

-- Verification query (run after migration)
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'festivals'
--   AND column_name IN ('primary_color', 'secondary_color', 'custom_title', 'subtitle', 'custom_questions', 'is_published', 'customization_completed');
