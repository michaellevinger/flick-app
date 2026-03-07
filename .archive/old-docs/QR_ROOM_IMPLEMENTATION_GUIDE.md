# QR Code Festival Rooms Implementation Guide

## 🎯 Overview

Transform flick from a proximity-based (500m radius) app to a QR code room-based system where users join specific festivals by scanning QR codes.

---

## 📊 Key Changes

### Before (Proximity-Based)
- Users see everyone within 500m
- Location tracking required
- Works anywhere
- No control over who's in the pool

### After (QR Room-Based)
- Users scan QR code to join festival "room"
- Only see users in same festival
- Location optional (can track for analytics)
- Full control over participants
- Multi-festival support

---

## 🗄️ Database Changes

### Step 1: Run SQL Script

Execute `supabase-festival-rooms.sql` in your Supabase SQL Editor:

```bash
# In Supabase Dashboard → SQL Editor → New Query
# Copy/paste the contents of supabase-festival-rooms.sql
# Click "Run"
```

This creates:
1. **`festivals` table** - Stores festival/event information
2. **`festival_id` column** in `users` table
3. **`find_users_in_festival()`** function - Replaces proximity query
4. **`get_festival_info()`** function - Validates QR codes
5. Sample festival data (Coachella, Tomorrowland, Lollapalooza)

---

## 📱 App Changes

### Step 2: Add QR Scanner Screen

File: `src/screens/QRScannerScreen.js` ✅ (Already created)

**Features:**
- Camera-based QR scanner
- Validates festival codes
- Joins user to festival
- Dev mode skip button for testing
- Beautiful scanning UI with corner guides

### Step 3: Update App.js Navigation

Add QRScanner to navigation stack:

```javascript
// App.js
import QRScannerScreen from './src/screens/QRScannerScreen';

<Stack.Screen name="QRScanner" component={QRScannerScreen} />
```

### Step 4: Update SetupScreen Flow

After user creates profile, navigate to QR scanner:

```javascript
// In SetupScreen.js after createUser()
navigation.navigate('QRScanner', { fromSetup: true });
```

### Step 5: Update DashboardScreen

**Add festival info display:**
```javascript
import { getCurrentFestival, findUsersInFestival } from '../lib/festivals';

// In DashboardScreen component
const [currentFestival, setCurrentFestival] = useState(null);

useEffect(() => {
  loadCurrentFestival();
}, [user]);

const loadCurrentFestival = async () => {
  const festival = await getCurrentFestival(user.id);
  setCurrentFestival(festival);
};

// Replace findNearbyUsers with findUsersInFestival
const fetchNearbyUsers = async () => {
  if (!user?.festival_id) {
    setNearbyUsers([]);
    return;
  }
  
  const users = await findUsersInFestival(user.festival_id, user.id);
  setNearbyUsers(users);
};
```

**Add "Change Festival" button:**
```javascript
<TouchableOpacity 
  style={styles.changeFestivalButton}
  onPress={() => navigation.navigate('QRScanner')}
>
  <Text style={styles.changeFestivalText}>Change Festival</Text>
</TouchableOpacity>
```

**Display current festival:**
```javascript
{currentFestival && (
  <View style={styles.festivalBanner}>
    <Text style={styles.festivalName}>{currentFestival.name}</Text>
    {currentFestival.sponsor_name && (
      <Text style={styles.sponsorName}>
        Sponsored by {currentFestival.sponsor_name}
      </Text>
    )}
  </View>
)}
```

### Step 6: Update database.js

Export festival functions:

```javascript
// src/lib/database.js
export { 
  validateAndJoinFestival,
  findUsersInFestival,
  getCurrentFestival,
  leaveFestival,
  getFestivalStats
} from './festivals';
```

---

## 🔧 Testing

### Test QR Codes

Create test QR codes for development:

**Festival Code Examples:**
- `coachella2024` - Coachella 2024 (Heineken sponsor)
- `tomorrowland2024` - Tomorrowland (Red Bull sponsor)
- `lollapalooza2024` - Lollapalooza (Spotify sponsor)

**Generate QR Codes:**
1. Go to https://www.qr-code-generator.com/
2. Enter festival code (e.g., `coachella2024`)
3. Download QR code
4. Print or display on screen for testing

**Dev Mode Skip:**
- In QRScannerScreen, tap "Skip (Dev Only)" button
- Automatically joins `coachella2024` for testing

### Testing Flow

1. **First User:**
   - Take selfie → Create profile
   - Scan QR code (or skip in dev mode)
   - See empty room

2. **Second User:**
   - Take selfie → Create profile
   - Scan SAME QR code
   - Both users now see each other!

3. **Different Festival:**
   - Create third user
   - Scan DIFFERENT QR code
   - Should NOT see first two users (different room)

---

## 🎨 UI/UX Improvements

### Dashboard Updates

**1. Festival Header:**
```javascript
<View style={styles.festivalHeader}>
  <View style={styles.festivalInfo}>
    <Text style={styles.festivalName}>
      {currentFestival?.name || 'No Festival'}
    </Text>
    {currentFestival?.sponsor_name && (
      <Text style={styles.sponsorBadge}>
        {currentFestival.sponsor_name}
      </Text>
    )}
  </View>
  <TouchableOpacity 
    style={styles.changeFestivalButton}
    onPress={() => navigation.navigate('QRScanner')}
  >
    <Text style={styles.changeFestivalText}>
      {currentFestival ? 'Switch' : 'Join Festival'}
    </Text>
  </TouchableOpacity>
</View>
```

**2. Empty State:**
```javascript
{nearbyUsers.length === 0 && currentFestival && (
  <View style={styles.emptyState}>
    <Text style={styles.emptyTitle}>
      You're the first one here!
    </Text>
    <Text style={styles.emptySubtitle}>
      As more people join {currentFestival.name}, they'll appear here
    </Text>
  </View>
)}
```

**3. User Count:**
```javascript
<Text style={styles.userCount}>
  {nearbyUsers.length} {nearbyUsers.length === 1 ? 'person' : 'people'} at {currentFestival?.name}
</Text>
```

---

## 📊 Sponsor Features

### Festival Analytics Dashboard

Create admin panel to track metrics per festival:

```javascript
// Example usage in admin dashboard
const stats = await getFestivalStats('coachella2024');

console.log({
  festival: 'Coachella 2024',
  activeUsers: stats.activeUsers,        // e.g., 847
  totalMatches: stats.totalMatches,      // e.g., 312
  impressions: stats.totalMatches * 2     // e.g., 624
});
```

### QR Code Generation for Sponsors

**Create festival-specific QR codes:**

1. **Unique ID Format:**
   - `{sponsor}_{event}_{year}` (e.g., `heineken_coachella_2024`)
   - Or use UUID for security

2. **Add to Supabase:**
```sql
INSERT INTO festivals (id, name, sponsor_name, expires_at) VALUES
  ('heineken_coachella_2024', 'Coachella 2024 - Heineken Lounge', 'Heineken', '2024-04-15 23:59:59'),
  ('redbull_edclv_2024', 'EDC Las Vegas - Red Bull Stage', 'Red Bull', '2024-05-20 23:59:59');
```

3. **Generate QR code with that ID**
4. **Print/display at booth**

---

## 🚀 Deployment Checklist

- [ ] Run `supabase-festival-rooms.sql` in Supabase
- [ ] Add QRScannerScreen to navigation
- [ ] Update SetupScreen to navigate to QR scanner
- [ ] Update DashboardScreen to use festival queries
- [ ] Create test QR codes
- [ ] Test with multiple users in same festival
- [ ] Test with users in different festivals
- [ ] Add "Change Festival" button
- [ ] Update location description (optional now)
- [ ] Create sponsor admin panel (optional)

---

## 💡 Benefits of QR Room System

### For Users:
✅ **Better Privacy** - Only see people at your event
✅ **More Relevant** - Everyone is actually there
✅ **Works Indoors** - No GPS required
✅ **Multi-Event** - Can attend multiple festivals

### For Sponsors:
✅ **Controlled Pool** - Know exact participant count
✅ **Direct Attribution** - Track who scanned your QR
✅ **Exclusive Access** - Create VIP rooms
✅ **Real-time Analytics** - See active users per event
✅ **Scalable** - Easy to add new events

### Technical:
✅ **No Location Tracking** - Battery-friendly
✅ **Faster Queries** - Festival filter vs geo queries
✅ **Better Control** - Can disable/expire festivals
✅ **Multi-tenancy** - Multiple events simultaneously

---

## 🔄 Migration Strategy

If you want to support BOTH proximity and QR:

1. Keep `location` column in `users` table
2. Add `room_type` column: `'proximity' | 'festival'`
3. Query based on `room_type`:
   - `proximity` → use `find_nearby_users()`
   - `festival` → use `find_users_in_festival()`

This allows hybrid mode where some users use proximity, others use QR rooms.

---

## 📝 Next Steps

1. **Run the SQL migration** (5 min)
2. **Add QR Scanner to app** (already created!)
3. **Update navigation flow** (10 min)
4. **Update Dashboard UI** (20 min)
5. **Test with QR codes** (10 min)
6. **Deploy and test** (5 min)

**Total Time: ~1 hour** ⚡

---

## 🆘 Troubleshooting

**Q: QR scanner not working?**
- Check camera permissions in app.json
- Make sure `expo-camera` is installed
- Test with real device (camera doesn't work in simulator)

**Q: Festival not found?**
- Verify festival exists in `festivals` table
- Check `is_active = true`
- Ensure QR code matches `festivals.id` exactly

**Q: Not seeing other users?**
- Confirm both users scanned same QR code
- Check `users.festival_id` in database
- Verify users have `status = true`

**Q: Want to create custom festivals?**
```sql
INSERT INTO festivals (id, name, description, sponsor_name) VALUES
  ('your-festival-id', 'Your Festival Name', 'Description', 'Sponsor');
```

---

**Ready to implement?** Let me know if you want me to help with any specific step!
