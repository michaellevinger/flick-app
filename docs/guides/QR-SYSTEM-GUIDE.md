# Flick QR System - Complete Guide

## Overview

The QR system allows festivals/events to have isolated user pools. Each festival gets a unique QR code that users scan to join that specific room.

## How It Works

```
Festival Organizer → Creates Festival → Generates QR Code
         ↓
QR Code Printed/Displayed at Event
         ↓
User Opens App → Scans QR → Joins Festival Room
         ↓
User Only Sees Other Users in Same Festival
```

## Setup Instructions

### 1. Create Festivals Table in Supabase

1. Open Supabase SQL Editor: https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh/sql/new
2. Copy contents of `festivals-schema.sql`
3. Paste and click "Run"

This creates:
- ✅ `festivals` table with sample data
- ✅ Adds `festival_id` column to `users` table
- ✅ Adds gender, height, phone fields (for profile)

### 2. Generate QR Codes

**Option A: Use Built-in Generator (Recommended)**

1. Open `generate-qr.html` in your browser:
   ```bash
   open generate-qr.html
   ```

2. Fill in festival details:
   - Festival ID: `coachella2024` (must match database)
   - Festival Name: `Coachella 2024`
   - Sponsor: `Heineken` (optional)
   - Size: Choose based on use case

3. Click "Generate QR Code"

4. Download the QR code PNG

**Option B: Use Online QR Generator**

1. Go to: https://www.qr-code-generator.com/
2. Type: `coachella2024` (just the festival ID)
3. Download as PNG/SVG
4. Add branding in design software

### 3. Print & Display QR Codes

**Physical Materials:**
- Posters at entrance/exits
- Wristbands (small QR)
- Tent cards at bars/stages
- Sponsor booth signage

**Digital Distribution:**
- Festival app push notification
- Email before event
- Social media posts
- Event website

**Pro Tip:** Add text below QR:
```
"Scan to meet people at Coachella 2024"
"Powered by flick"
```

### 4. Test the Flow

1. Start the app: `npm start`
2. Open on device
3. Point camera at generated QR code
4. Should see: "Welcome! You're now in Coachella 2024 sponsored by Heineken"
5. Create profile
6. Dashboard shows only users in that festival

### 5. Create New Festival (For Each Event)

Run in Supabase SQL Editor:

```sql
INSERT INTO festivals (id, name, sponsor_name, is_active)
VALUES ('your-festival-id', 'Your Festival Name', 'Sponsor Name', true);
```

Example:
```sql
INSERT INTO festivals (id, name, sponsor_name, is_active)
VALUES ('burningman2024', 'Burning Man 2024', 'Red Bull', true);
```

Then generate QR code for `burningman2024`

## B2B Sales Pitch

When pitching to festivals:

**1. Isolated Rooms:**
"Your attendees only see each other, not users from other events"

**2. Direct Attribution:**
"Every match is tracked to YOUR festival with YOUR sponsor branding"

**3. Booth Traffic:**
"Drive foot traffic: 'Visit Heineken booth to exchange numbers'"

**4. Real-time Dashboard:**
"See live metrics: active users, matches made, engagement rates"

**5. Easy Setup:**
"Just print QR codes and display them - we handle everything else"

## Pricing Model Ideas

- **Per Event:** $2,000 flat fee per festival/weekend
- **Per User:** $1 per user who scans QR
- **Sponsor Tier:** $5,000 includes sponsor branding throughout app
- **Analytics Tier:** $3,000 includes post-event analytics dashboard

## QR Code Best Practices

**Size:**
- Posters: 1024x1024px minimum
- Banners: 2048x2048px
- Wristbands: 512x512px (test readability!)

**Placement:**
- High traffic areas (entrance, main stage, food courts)
- Multiple locations (not just one spot)
- Eye level for easy scanning

**Branding:**
- Add festival logo above QR
- Add sponsor logo below
- Use festival colors for border

**Testing:**
- Print test QR and scan from 3 feet away
- Test in different lighting conditions
- Have backup QR codes if one gets damaged

## Advanced: Multiple Stages/Areas

For large festivals with multiple stages, create sub-rooms:

```sql
INSERT INTO festivals (id, name, sponsor_name) VALUES
  ('coachella2024-mainstage', 'Coachella - Main Stage', 'Heineken'),
  ('coachella2024-sahara', 'Coachella - Sahara Tent', 'Red Bull');
```

Users at each stage only see people at that stage!

## Troubleshooting

**QR Not Scanning:**
- Check festival ID exists in database
- Try different QR generator (some have better error correction)
- Increase QR size/resolution

**No Users Showing:**
- Verify users scanned same festival QR
- Check `festival_id` in users table matches

**Want to Reset:**
```sql
-- Delete all users from a festival
DELETE FROM users WHERE festival_id = 'coachella2024';

-- Disable a festival
UPDATE festivals SET is_active = false WHERE id = 'coachella2024';
```

## Next Steps

1. ✅ Run `festivals-schema.sql` in Supabase
2. ✅ Generate QR codes for your test events
3. ✅ Test the full user flow
4. ✅ Design poster templates with QR codes
5. ✅ Create B2B pitch deck with screenshots
6. ✅ Reach out to festival organizers

## Questions?

The QR system is the core of the B2B model - each festival gets their own isolated room with their sponsor's branding. This is what makes it valuable to festival organizers!
