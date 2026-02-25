-- Gender Filtering Test Suite
-- Run this in Supabase SQL Editor to test the filtering logic

-- 1. Check all users in test festival
SELECT
  '=== ALL USERS IN TEST FESTIVAL ===' as test_section;

SELECT
  id,
  name,
  gender,
  looking_for,
  festival_id,
  status,
  last_heartbeat
FROM users
WHERE festival_id = 'test-festival'
ORDER BY created_at DESC;

-- 2. Test: Man looking for women
-- Should only see: women looking for (men OR both)
SELECT
  '=== TEST: Man looking for women ===' as test_section;

SELECT * FROM find_users_in_festival(
  'test-festival',           -- festival_id
  'test-user-male-1',        -- current_user_id (exclude this user)
  'male',                    -- current_user_gender
  'female'                   -- current_user_looking_for
);

-- 3. Test: Woman looking for men
-- Should only see: men looking for (women OR both)
SELECT
  '=== TEST: Woman looking for men ===' as test_section;

SELECT * FROM find_users_in_festival(
  'test-festival',
  'test-user-female-1',
  'female',
  'male'
);

-- 4. Test: Man looking for both
-- Should see: women looking for (men OR both) + men looking for (men OR both)
SELECT
  '=== TEST: Man looking for everyone ===' as test_section;

SELECT * FROM find_users_in_festival(
  'test-festival',
  'test-user-male-2',
  'male',
  'both'
);

-- 5. Test: Woman looking for both
-- Should see: everyone who wants (women OR both)
SELECT
  '=== TEST: Woman looking for everyone ===' as test_section;

SELECT * FROM find_users_in_festival(
  'test-festival',
  'test-user-female-2',
  'female',
  'both'
);

-- 6. Edge case: User with NULL preferences (should see no one)
SELECT
  '=== TEST: Edge case - NULL preferences ===' as test_section;

SELECT * FROM find_users_in_festival(
  'test-festival',
  'test-user-edge',
  NULL,
  NULL
);

-- EXPECTED RESULTS:
-- Man (looking for women) → Should ONLY see women who want (men OR both)
-- Woman (looking for men) → Should ONLY see men who want (women OR both)
-- Anyone (looking for both) → Should see everyone compatible with their gender
