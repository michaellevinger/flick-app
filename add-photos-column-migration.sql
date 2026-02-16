-- Add photos array column to users table
-- This allows users to have 1-3 photos instead of just one selfie
-- The first photo in the array will also be stored in selfie_url for backward compatibility

-- Add the photos column (array of text URLs)
ALTER TABLE users
ADD COLUMN IF NOT EXISTS photos TEXT[] DEFAULT NULL;

-- Update existing users: populate photos array with their current selfie_url
UPDATE users
SET photos = ARRAY[selfie_url]
WHERE selfie_url IS NOT NULL AND photos IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.photos IS 'Array of photo URLs (1-3 photos). First photo is also stored in selfie_url as main profile picture.';
