-- Migration: Add support for system messages in chat
-- Date: 2026-02-20
-- Purpose: Enable number exchange request messages and other system notifications

-- Step 1: Drop existing constraint
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_message_type_check;

-- Step 2: Add new constraint with 'system' type
ALTER TABLE messages
ADD CONSTRAINT messages_message_type_check
CHECK (message_type IN ('text', 'image', 'location', 'emoji_reaction', 'system'));

-- Step 3: Add metadata column for system message data
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- Step 4: Create index on metadata for faster queries
CREATE INDEX IF NOT EXISTS messages_metadata_idx ON messages USING GIN (metadata);

-- Verification query (run after migration)
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'messages' AND column_name IN ('message_type', 'metadata');
