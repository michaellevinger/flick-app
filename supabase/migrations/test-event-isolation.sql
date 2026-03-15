-- Test Event Isolation
-- Run this AFTER running migrations/add-event-isolation.sql

-- Step 1: Create test festivals
INSERT INTO festivals (id, name, venue, start_date, end_date, host_user_id, is_active)
VALUES
  ('test-wedding-1', 'Test Wedding 1', 'Test Venue 1', NOW(), NOW() + INTERVAL '1 day', 'test_host_1', true),
  ('test-wedding-2', 'Test Wedding 2', 'Test Venue 2', NOW(), NOW() + INTERVAL '1 day', 'test_host_2', true)
ON CONFLICT (id) DO UPDATE SET is_active = true;

-- Step 2: Create test users in different festivals
INSERT INTO users (id, name, age, festival_id, gender, looking_for, status, last_heartbeat)
VALUES
  -- Wedding 1 users
  ('user_alice', 'Alice', 25, 'test-wedding-1', 'female', 'male', true, NOW()),
  ('user_bob', 'Bob', 28, 'test-wedding-1', 'male', 'female', true, NOW()),
  ('user_carol', 'Carol', 26, 'test-wedding-1', 'female', 'male', true, NOW()),

  -- Wedding 2 users (different event)
  ('user_dave', 'Dave', 30, 'test-wedding-2', 'male', 'female', true, NOW()),
  ('user_eve', 'Eve', 27, 'test-wedding-2', 'female', 'male', true, NOW())
ON CONFLICT (id) DO UPDATE SET
  festival_id = EXCLUDED.festival_id,
  status = EXCLUDED.status,
  last_heartbeat = EXCLUDED.last_heartbeat;

-- Step 3: Test the function
-- Test 1: Alice (Wedding 1, Female looking for Male) should see Bob only
SELECT '=== Test 1: Alice from Wedding 1 ===' as test;
SELECT id, name, gender, festival_id
FROM find_users_in_festival(
  'test-wedding-1',  -- Alice's festival
  'user_alice',      -- Alice's user ID
  'female',          -- Alice's gender
  'male'             -- Alice looking for male
);
-- Expected: Bob (male from Wedding 1)
-- Should NOT see: Carol (female), Dave (different wedding), Eve (different wedding)

-- Test 2: Bob (Wedding 1, Male looking for Female) should see Alice and Carol
SELECT '=== Test 2: Bob from Wedding 1 ===' as test;
SELECT id, name, gender, festival_id
FROM find_users_in_festival(
  'test-wedding-1',  -- Bob's festival
  'user_bob',        -- Bob's user ID
  'male',            -- Bob's gender
  'female'           -- Bob looking for female
);
-- Expected: Alice, Carol (both female from Wedding 1)
-- Should NOT see: Dave (different wedding), Eve (different wedding)

-- Test 3: Dave (Wedding 2, Male looking for Female) should see Eve only
SELECT '=== Test 3: Dave from Wedding 2 ===' as test;
SELECT id, name, gender, festival_id
FROM find_users_in_festival(
  'test-wedding-2',  -- Dave's festival
  'user_dave',       -- Dave's user ID
  'male',            -- Dave's gender
  'female'           -- Dave looking for female
);
-- Expected: Eve (female from Wedding 2)
-- Should NOT see: Alice (different wedding), Bob (different wedding), Carol (different wedding)

-- Test 4: Check if users are properly assigned to festivals
SELECT '=== Test 4: All users with festival assignments ===' as test;
SELECT id, name, festival_id
FROM users
WHERE id IN ('user_alice', 'user_bob', 'user_carol', 'user_dave', 'user_eve')
ORDER BY festival_id, name;

-- Cleanup (optional - uncomment to remove test data)
-- DELETE FROM users WHERE id IN ('user_alice', 'user_bob', 'user_carol', 'user_dave', 'user_eve');
-- DELETE FROM festivals WHERE id IN ('test-wedding-1', 'test-wedding-2');
