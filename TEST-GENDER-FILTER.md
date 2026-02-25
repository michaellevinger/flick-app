# Gender Filter Testing Guide

## Quick Test (Using SQL)

1. Open Supabase SQL Editor
2. Run the queries in `test-gender-filtering.sql`
3. Check that the results match expected behavior

## App Testing (Using 2 Devices/Emulators)

### Setup Test Users

**Device 1: Man looking for women**
1. Open app → Scan QR (use test-festival)
2. Setup profile:
   - Name: "TestMan"
   - Gender: Man
   - Looking for: Women
3. Go to radar

**Device 2: Woman looking for men**
1. Open app → Scan QR (use test-festival)
2. Setup profile:
   - Name: "TestWoman"
   - Gender: Woman
   - Looking for: Men
3. Go to radar

### Expected Results

✅ **Device 1 (Man)** should see:
- TestWoman (because she's a woman looking for men)
- No other men

✅ **Device 2 (Woman)** should see:
- TestMan (because he's a man looking for women)
- No other women

### Test Cases

#### Test 1: Basic Filtering
- Man looking for women → Only sees compatible women
- Woman looking for men → Only sees compatible men
- ✅ PASS if they see each other
- ✅ PASS if they don't see same-gender users

#### Test 2: "Looking for Both"
**Device 3: Person looking for everyone**
- Gender: Man
- Looking for: Both
- Should see: Women who want men/both + Men who want men/both

#### Test 3: Incompatible Users
**Device 4: Man looking for men**
- Gender: Man
- Looking for: Men
- Should NOT see: Men looking for women only
- Should see: Men looking for men/both

## Quick Verification

Run this in Supabase to see all users:

```sql
SELECT name, gender, looking_for, festival_id
FROM users
WHERE festival_id = 'test-festival'
AND status = true;
```

Then for each user, imagine what they should see based on:
1. Their `looking_for` preference
2. Other users' `gender` matching their preference
3. Other users' `looking_for` including their `gender`
