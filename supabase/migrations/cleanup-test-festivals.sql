-- Cleanup old test festival data
-- This removes the hardcoded test festivals (coachella2024, tomorrowland2024, etc.)

-- Delete old test festivals
DELETE FROM festivals
WHERE id IN (
  'coachella2024',
  'tomorrowland2024',
  'lollapalooza2024',
  'test-wedding-1',
  'test-wedding-2'
);

-- Show remaining festivals
SELECT id, name, venue, created_at
FROM festivals
ORDER BY created_at DESC;
