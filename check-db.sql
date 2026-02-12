-- Check if festivals table exists and has data
SELECT 'festivals table' as check, COUNT(*) as count FROM festivals;

-- Check if users table has festival_id column
SELECT 'users with festival_id' as check, COUNT(*) as count 
FROM users WHERE festival_id IS NOT NULL;
