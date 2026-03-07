# Flick B2B Model - Festival QR Rooms

## Overview

Flick uses QR codes to create isolated "rooms" for each festival or event. This B2B model allows sponsors to directly track and measure the social connections created at their events.

## User Flow

### 1. Download & Open App
- First screen: **QR Scanner**
- Camera view with green corner guides
- "Scan Festival QR Code" header

### 2. Scan Festival QR Code
- User points camera at festival's unique QR code
- System validates festival is active
- Stores festival ID in app
- Shows welcome message: "Welcome to [Festival Name] sponsored by [Sponsor]"

**Example Festivals:**
- `coachella2024` → Coachella 2024 (Sponsored by Heineken)
- `tomorrowland2024` → Tomorrowland 2024 (Sponsored by Red Bull)
- `lollapalooza2024` → Lollapalooza 2024 (Sponsored by Spotify)

### 3. Create Profile
**Camera Screen:**
- Take selfie (front-facing camera primary)
- Gallery fallback available
- Retake option

**Setup Screen:**
- First name
- Age (18+ validation)
- Gender (Male/Female/Other)
- Looking for (Male/Female/Both)
- Height (optional)

### 4. Enter Festival Room
**Dashboard:**
- Festival banner shows: "[Festival Name] - Sponsored by [Sponsor]"
- List of users who scanned SAME QR code
- Pull to refresh
- Flick to match
- **No festival switching** - locked into scanned festival

## B2B Value Proposition

### For Festival Sponsors

**Direct Attribution:**
- Exact count of matches created at YOUR festival
- Real-time dashboard of active users
- Metrics: Total scans, active users, matches made, booth visits

**Brand Association:**
- "Sponsored by Heineken" on every match screen
- Green Light animation with sponsor colors (customizable)
- Branded QR codes on festival materials

**Booth Traffic Driver:**
- "Exchange numbers" feature requires visiting sponsor booth
- Sponsor staff verify couple before number exchange
- Creates foot traffic and face-to-face brand interaction

**Isolated Measurement:**
- Users only see attendees of YOUR festival
- No cross-contamination with other events
- Clean ROI calculation

### For Festival Organizers

**Unique QR per Event:**
- Different code for each festival
- Different code per weekend/day if needed
- Different code per stage/area for granular tracking

**Sponsor Upsell:**
- Tier 1: Basic QR room
- Tier 2: Branded interface
- Tier 3: Custom match animations + booth integration

**Attendee Engagement:**
- Digital icebreaker increases festival satisfaction
- Social element enhances festival experience
- Drives repeat attendance

**Data Insights:**
- See which stages/areas have most activity
- Peak matching times
- Demographics of most active users

## Distribution Strategy

### 1. Physical Materials
- **Posters:** Large QR codes at entrance, main stage, food courts
- **Wristbands:** QR code printed on festival wristbands
- **Tent Cards:** At bars, seating areas, bathrooms
- **Maps:** Festival map includes QR code
- **Staff Shirts:** QR code on back of staff/volunteer shirts

### 2. Digital Distribution
- **Festival App:** QR scanner in official festival app
- **Push Notifications:** "Scan to meet people around you"
- **Social Media:** Instagram stories with QR code
- **Email:** Pre-festival email with QR code

### 3. Sponsor Activation
- **Sponsor Booth:** Large QR code display
- **Product Packaging:** QR code on beer cups, water bottles
- **Photo Ops:** "Scan here to meet your festival crew"
- **Giveaways:** Free item for scanning QR code

## Technical Implementation

### Database Schema

**festivals table:**
```sql
CREATE TABLE festivals (
  id TEXT PRIMARY KEY,              -- 'coachella2024'
  name TEXT NOT NULL,               -- 'Coachella 2024'
  description TEXT,
  sponsor_name TEXT,                -- 'Heineken'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  expires_at TIMESTAMP,
  max_participants INTEGER
);
```

**users table:**
```sql
ALTER TABLE users ADD COLUMN festival_id TEXT REFERENCES festivals(id);
CREATE INDEX users_festival_idx ON users(festival_id);
```

### SQL Functions

**Find Users in Festival:**
```sql
CREATE FUNCTION find_users_in_festival(
  user_festival_id TEXT,
  current_user_id TEXT
)
RETURNS TABLE (id, name, age, selfie_url, gender, looking_for)
```

**Validate Festival:**
```sql
CREATE FUNCTION get_festival_info(festival_code TEXT)
RETURNS TABLE (id, name, description, sponsor_name, is_active)
```

### QR Code Generation

**Format:** Plain text festival code
- `coachella2024`
- `tomorrowland2024`
- `lollapalooza2024`

**Tools:**
- Online: qr-code-generator.com
- CLI: `qrencode -o coachella2024.png "coachella2024"`
- Bulk: Generate with sponsor branding

## Analytics Dashboard (Future)

### Sponsor Dashboard Metrics:
- **Active Users:** Currently online at festival
- **Total Scans:** Lifetime QR scans
- **Matches Made:** Total flick matches
- **Booth Visits:** Number of couples who exchanged numbers
- **Peak Activity:** Busiest times/areas
- **Demographics:** Age, gender breakdown
- **Retention:** Users who stayed active >1 hour

### Real-time Display:
- Live counter at sponsor booth
- "X matches made at this festival"
- Gamification: "Be match #1000 and win [prize]"

## Security & Privacy

**User Privacy:**
- No last names required
- No exact GPS coordinates shown to users
- Location data only used for backend verification
- Auto-wipe after 20 minutes of inactivity

**Festival Security:**
- Festival codes are public (on posters)
- But codes expire after festival ends
- Cannot join expired festival
- Max participants cap prevents abuse

**Data Retention:**
- User data auto-deleted after festival
- Aggregate metrics retained for sponsor reporting
- No PII shared with sponsors

## Pricing Model (Example)

**Per Festival:**
- Basic: $500 (up to 1,000 users)
- Standard: $2,000 (up to 5,000 users, branded interface)
- Premium: $5,000 (unlimited users, custom branding, dedicated support)

**Annual License:**
- $50,000/year for unlimited festivals
- White-label option available
- Custom feature development

## Success Metrics

**For Flick:**
- Number of festivals signed up
- Total QR scans across all festivals
- Average matches per festival
- Sponsor renewal rate

**For Sponsors:**
- ROI: Cost per match created
- Brand impressions (match screens shown)
- Booth traffic increase
- Social media mentions

## Getting Started

### For Sponsors:
1. Contact Flick team
2. Choose festival(s) and dates
3. Receive unique QR code(s)
4. Distribute QR codes at festival
5. View real-time analytics dashboard
6. Receive post-festival report

### For Users:
1. Download Flick app
2. Scan festival QR code
3. Create profile
4. Start flicking!

---

**Contact:** hello@flickapp.com
**Demo:** https://demo.flickapp.com
**Pricing:** https://flickapp.com/pricing
