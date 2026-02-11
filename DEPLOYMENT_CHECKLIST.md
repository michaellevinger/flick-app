# flick Deployment Checklist

Use this checklist to ensure everything is set up correctly before going live.

## 🌐 Website (B2B Sponsor Landing Page)

### Website Deployment
- [ ] Website files ready in `/website/` folder
- [ ] All images optimized and loading correctly
- [ ] Video playback tested (Heineken Green Light demo)
- [ ] Ghost emoji logos displaying correctly
- [ ] Responsive design tested on mobile and desktop
- [ ] Contact email (sponsors@getflick.com) configured
- [ ] Domain name registered (getflick.com or similar)
- [ ] Vercel/Netlify account set up
- [ ] Website deployed to production
- [ ] SSL certificate active (HTTPS)
- [ ] Analytics configured (optional)

### Website Content
- [ ] Hero section messaging finalized
- [ ] Festival audience imagery approved
- [ ] Activation examples reviewed (Heineken, Red Bull, Spotify)
- [ ] Post-Event Analytics metrics verified
- [ ] CTA button links to correct email
- [ ] All text proofread for typos
- [ ] Brand colors consistent (black, white, flick green #00FF00)

---

## 🗄 Backend (Supabase)

### Database Setup
- [ ] Supabase project created
- [ ] PostgreSQL database initialized
- [ ] PostGIS extension enabled
- [ ] Complete `supabase-setup.sql` executed
- [ ] `users` table created with correct schema
- [ ] `nudges` table created with UNIQUE constraint
- [ ] All indexes created (location, status, heartbeat)
- [ ] All SQL functions created:
  - [ ] `find_nearby_users()`
  - [ ] `check_mutual_nudge()`
  - [ ] `auto_wipe_inactive_users()`

### Storage Setup
- [ ] `selfies` storage bucket created
- [ ] Bucket set to **public**
- [ ] INSERT policy: "Allow public uploads"
- [ ] SELECT policy: "Allow public reads"
- [ ] DELETE policy: "Allow public deletes"

### Edge Functions
- [ ] Supabase CLI installed
- [ ] Project linked via CLI
- [ ] `auto-cleanup` Edge Function deployed
- [ ] pg_cron extension enabled
- [ ] Cron job scheduled (every 5 minutes)
- [ ] Cron job verified as active
- [ ] Edge Function tested manually
- [ ] Edge Function logs reviewed (no errors)

### Real-time
- [ ] Real-time enabled for `users` table
- [ ] Real-time enabled for `nudges` table
- [ ] Replication configured correctly

### Security
- [ ] Row Level Security (RLS) enabled on all tables
- [ ] Policies created for `users` table
- [ ] Policies created for `nudges` table
- [ ] Service role key kept secure (not in git)
- [ ] Anon key used in app (not service role)

---

## 📱 App Configuration

### Environment Setup
- [ ] `src/lib/supabase.js` updated with correct URL
- [ ] `src/lib/supabase.js` updated with anon key
- [ ] `.env` file NOT committed to git
- [ ] `.gitignore` includes `.env`

### Permissions
- [ ] Camera permission messages set in `app.json` (iOS)
- [ ] Location permission messages set in `app.json` (iOS)
- [ ] Android permissions declared in `app.json`
- [ ] Permissions tested on both iOS and Android

### Constants
- [ ] `PROXIMITY_RADIUS` set correctly (500m default, configurable)
- [ ] `HEARTBEAT_INTERVAL` set correctly (60s default)
- [ ] `AUTO_WIPE_TIMEOUT` documented (20min)
- [x] Color scheme finalized: Black (#000000), White (#FFFFFF), flick Green (#00FF00)

---

## 🧪 Testing

### Basic Flow
- [ ] Can take selfie
- [ ] Can enter name and age
- [ ] Profile created in Supabase
- [ ] Selfie uploaded to storage
- [ ] Dashboard loads correctly
- [ ] Status toggle works (ON/OFF)
- [ ] Location permission requested
- [ ] Heartbeat starts when ON

### Proximity & Radar
- [ ] Can see nearby users (within 500m)
- [ ] Distance calculated correctly
- [ ] Pull-to-refresh updates list
- [ ] Real-time updates work
- [ ] Users disappear when they sign out
- [ ] Empty state shows when no one nearby

### Nudge System
- [ ] Can send nudge
- [ ] Button shows "Nudged ✓" after sending
- [ ] Can't nudge same user twice
- [ ] Received nudges tracked in real-time
- [ ] Mutual match detected correctly
- [ ] Green Light screen appears
- [ ] Haptic feedback works (on physical device)
- [ ] Both users see match simultaneously

### Auto-Wipe
- [ ] Edge Function runs every 5 minutes
- [ ] Users deleted after 20+ minutes inactive
- [ ] Selfies deleted when user deleted
- [ ] Nudges deleted when user deleted
- [ ] Distance dissolution works (>500m)
- [ ] Matches disappear when users move apart

### Edge Cases
- [ ] App works offline (shows appropriate errors)
- [ ] App handles poor connection gracefully
- [ ] Location services disabled → shows message
- [ ] Camera permission denied → shows message
- [ ] Supabase errors handled gracefully
- [ ] App doesn't crash on unexpected data

---

## 🚀 Production Readiness

### Performance
- [ ] App loads in <3 seconds
- [ ] Images load quickly (optimized)
- [ ] No memory leaks
- [ ] Battery usage is reasonable
- [ ] Network requests are minimal
- [ ] Real-time subscriptions don't cause lag

### User Experience
- [ ] All screens have proper loading states
- [ ] Error messages are clear and helpful
- [ ] Navigation is smooth and intuitive
- [ ] Animations are smooth (60fps)
- [ ] Haptic feedback is appropriate
- [ ] Text is readable on all screen sizes

### Code Quality
- [ ] No console errors or warnings
- [ ] No unused imports
- [ ] Code follows consistent style
- [ ] All TODOs resolved or documented
- [ ] Comments explain complex logic
- [ ] Files are organized logically

### Documentation
- [ ] README.md is up to date
- [ ] QUICKSTART.md tested by fresh user
- [ ] SUPABASE_SETUP.md tested by fresh user
- [ ] AUTO_WIPE_SETUP.md tested
- [ ] TESTING_NUDGE_SYSTEM.md verified
- [ ] CLAUDE.md reflects current state

---

## 📊 Monitoring Setup

### Supabase Dashboard
- [ ] Database usage monitored
- [ ] Storage usage monitored
- [ ] Edge Function invocations tracked
- [ ] Real-time connections monitored
- [ ] Error logs reviewed regularly

### App Analytics (Optional)
- [ ] Analytics service chosen (privacy-friendly)
- [ ] Key events tracked:
  - [ ] User signups
  - [ ] Nudges sent
  - [ ] Mutual matches
  - [ ] Sign outs
- [ ] No PII (personally identifiable info) collected
- [ ] Privacy policy updated if needed

---

## 🎨 Branding & Assets

### App Identity
- [x] App name finalized: **flick**
- [x] Tagline: "Turn a Look into Hello"
- [x] Logo: Ghost emoji with green hearts
- [x] Color scheme: Black, White, flick Green (#00FF00)
- [ ] App icon designed (1024x1024)
- [ ] App icon added to project
- [ ] Splash screen designed
- [ ] Splash screen added to project

### App Store Preparation (if publishing)
- [ ] App Store screenshots (iOS)
- [ ] Play Store screenshots (Android)
- [ ] App description written
- [ ] Keywords chosen
- [ ] Privacy policy written
- [ ] Terms of service written

---

## 🔒 Security Audit

### Data Privacy
- [ ] No unnecessary data collected
- [ ] Location data not stored long-term
- [ ] Selfies auto-deleted after session
- [ ] No chat logs or message history
- [ ] User IDs are anonymous
- [ ] No email/phone required

### API Security
- [ ] Service role key never exposed in app
- [ ] Anon key used for client requests
- [ ] RLS policies prevent unauthorized access
- [ ] Storage policies restrict access appropriately
- [ ] Edge Functions require authentication

### Code Security
- [ ] No API keys in git history
- [ ] `.env` properly gitignored
- [ ] Dependencies reviewed for vulnerabilities
- [ ] No eval() or unsafe code patterns
- [ ] User input sanitized where needed

---

## 🚦 Go/No-Go Decision

### Required (Must be ✅ to launch)
- [ ] App works end-to-end
- [ ] Database is set up correctly
- [ ] Auto-wipe is automated
- [ ] No critical bugs
- [ ] Privacy/security requirements met

### Recommended (Should be ✅)
- [ ] Tested with 5+ real users
- [ ] Performance is acceptable
- [ ] Documentation is complete
- [ ] Monitoring is in place

### Nice to Have
- [ ] App Store assets ready
- [ ] Analytics configured
- [ ] Onboarding tutorial
- [ ] Sound effects

---

## 📝 Post-Launch

### Week 1
- [ ] Monitor Edge Function logs daily
- [ ] Check for error spikes
- [ ] Review user feedback
- [ ] Fix critical bugs immediately

### Week 2-4
- [ ] Analyze usage patterns
- [ ] Optimize based on real data
- [ ] Plan feature updates
- [ ] Address user requests

---

## ✅ Final Sign-Off

- [ ] Backend fully operational
- [ ] App tested thoroughly
- [ ] Documentation complete
- [ ] Team trained/informed
- [ ] Launch plan in place

**Ready to launch flick!** 🚀
