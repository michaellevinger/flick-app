# Nudge - Production Deployment Guide

**Created:** 2026-02-03
**Status:** Pre-Production (MVP Working)

---

## 🎯 Current Status: MVP Complete & Tested

✅ All core features working
✅ Profile creation functional
✅ Proximity detection verified (1m!)
✅ Ready for production deployment

---

## 1. 📱 Installing App on Your Phone (Without App Store)

### Option A: Build Development APK (Android)
**Duration:** 10-15 minutes

```bash
# Build APK
npx eas build --platform android --profile preview

# Or local build
npx expo run:android --variant release
```

**Result:** Get an `.apk` file you can install directly on Android

### Option B: Build iOS App (Requires Apple Developer Account)
**Duration:** 15-20 minutes

```bash
npx eas build --platform ios --profile preview
```

**Result:** Get an `.ipa` file for TestFlight or direct install

### Option C: Expo Go (Development Only)
**Current Method:** Using Expo Go
- ❌ Not permanent
- ❌ Requires Metro bundler running
- ❌ Shows Expo branding
- ✅ Good for testing only

---

## 2. 🏪 Publishing to App Stores

### Prerequisites

#### A. Apple App Store (iOS)
**Cost:** $99/year
**Timeline:** 2-4 weeks for first approval

**Requirements:**
1. **Apple Developer Account** ($99/year)
   - Sign up: https://developer.apple.com

2. **App Store Connect Setup**
   - Create app listing
   - Add screenshots (6.5" and 5.5" iPhone)
   - Write app description
   - Set pricing (Free/Paid)

3. **Privacy Policy** (REQUIRED)
   - Create privacy policy webpage
   - Add URL to App Store Connect
   - See: [PRIVACY_POLICY_TEMPLATE.md](#privacy-policy)

4. **Build & Submit**
```bash
# Configure EAS
npm install -g eas-cli
eas login
eas build:configure

# Build production iOS
eas build --platform ios --auto-submit

# Or manual TestFlight first
eas build --platform ios
eas submit --platform ios
```

#### B. Google Play Store (Android)
**Cost:** $25 one-time
**Timeline:** 1-3 days for first approval

**Requirements:**
1. **Google Play Console Account** ($25 one-time)
   - Sign up: https://play.google.com/console

2. **App Listing**
   - Screenshots (phone, 7" & 10" tablet)
   - Feature graphic (1024x500)
   - App description (short & full)
   - Content rating questionnaire

3. **Privacy Policy** (REQUIRED)
   - Same as iOS

4. **Build & Submit**
```bash
# Build production Android
eas build --platform android --auto-submit

# Or manual upload
eas build --platform android
# Upload .aab file to Play Console
```

---

## 3. 💳 Stripe Integration (For Monetization)

### When to Add Stripe?
- ❓ **Do you want to charge users?**
- ❓ **Subscription model or one-time payment?**
- ❓ **Premium features?**

### Option A: Subscription Model
**Example:** $4.99/month for unlimited nudges

```bash
# Install Stripe SDK
npm install @stripe/stripe-react-native

# Backend setup (Supabase Edge Functions)
# Create subscription management functions
```

**Implementation Steps:**
1. Create Stripe account: https://stripe.com
2. Add `stripe_customer_id` to users table
3. Create paywall screen (after X nudges?)
4. Implement subscription flow
5. Add payment method screen
6. Set up webhooks for subscription events

### Option B: Free App (Recommended for MVP)
**Monetization alternatives:**
- Start free to build user base
- Add ads later (Google AdMob)
- Premium features after traction
- In-app purchases for boosts

**Recommendation:** Launch free first, add monetization after 1000+ users

---

## 4. ✅ Production Readiness Checklist

### A. Security & Privacy 🔒

#### Required Legal Documents
- [ ] **Privacy Policy** (REQUIRED for app stores)
  - What data you collect
  - How you use it
  - How long you store it
  - User rights (deletion, access)

- [ ] **Terms of Service** (REQUIRED)
  - User responsibilities
  - Age restrictions (18+)
  - Account termination policy
  - Liability disclaimers

- [ ] **Community Guidelines**
  - Acceptable behavior
  - Reporting system
  - Moderation policy

#### Security Improvements
- [ ] **Rate Limiting** (prevent spam)
  - Limit nudges per hour (e.g., 10/hour)
  - Limit profile updates
  - Limit location updates

- [ ] **Content Moderation**
  - Photo review system (manual or AI)
  - Report user feature
  - Block user feature

- [ ] **Secrets Management**
  - Move API keys to environment variables
  - Use Expo Secrets for production builds

```bash
# Set production secrets
eas secret:create --name SUPABASE_URL --value "..."
eas secret:create --name SUPABASE_ANON_KEY --value "..."
```

### B. Performance Optimization ⚡

- [ ] **Image Optimization**
  - Compress uploads (already at 0.7 quality)
  - Add image CDN (Supabase Storage already serves this)
  - Lazy load images

- [ ] **Caching**
  - Cache nearby users (already doing this)
  - Cache user profile locally
  - Reduce API calls

- [ ] **Battery Optimization**
  - Review heartbeat interval (currently 60s - good!)
  - Reduce location accuracy when not critical
  - Pause updates when app backgrounded

### C. Analytics & Monitoring 📊

- [ ] **Analytics** (Choose one)
  - **Mixpanel** (best for mobile)
  - **Amplitude** (user behavior)
  - **Google Analytics** (free)

```bash
npm install @amplitude/analytics-react-native
```

**Key Metrics to Track:**
- Daily Active Users (DAU)
- Profiles created
- Nudges sent
- Mutual matches
- Session duration
- Retention (Day 1, 7, 30)

- [ ] **Error Tracking**
  - **Sentry** (recommended)
  - Captures crashes automatically
  - Stack traces with source maps

```bash
npm install @sentry/react-native
npx sentry-wizard -i reactNative -p ios android
```

- [ ] **Performance Monitoring**
  - App load time
  - API response times
  - Crash-free rate

### D. Testing & QA 🧪

- [ ] **Beta Testing** (Before public launch)
  - TestFlight (iOS): 10,000 testers max
  - Google Play Internal Testing: Unlimited
  - Test with 20-50 real users first

- [ ] **Device Testing**
  - [ ] iOS 15+ (iPhone 12, 13, 14, 15)
  - [ ] Android 11+ (Samsung, Google Pixel, OnePlus)
  - [ ] Different screen sizes
  - [ ] Dark mode support

- [ ] **Network Testing**
  - [ ] Slow 3G connection
  - [ ] Airplane mode → back online
  - [ ] WiFi to cellular handoff

- [ ] **Edge Cases**
  - [ ] 100+ nearby users
  - [ ] Multiple mutual matches
  - [ ] GPS disabled
  - [ ] Storage full
  - [ ] Low battery mode

### E. Backend Production Setup 🗄️

- [ ] **Supabase Production**
  - [ ] Enable Point-in-Time Recovery (backups)
  - [ ] Set up monitoring alerts
  - [ ] Review RLS policies
  - [ ] Add database indexes (already have location index!)

- [ ] **Auto-Wipe Edge Function**
  - [ ] Deploy to production
  - [ ] Set up cron job (every 5 minutes)
  - [ ] Monitor execution logs

```bash
cd supabase/functions
supabase functions deploy auto-cleanup
```

- [ ] **Database Backups**
  - Enable automated daily backups
  - Test restore procedure

- [ ] **Monitoring**
  - Set up Supabase alerts
  - Monitor database size
  - Track API usage

### F. App Store Optimization (ASO) 📈

- [ ] **App Store Listing**
  - [ ] Compelling icon (80x80, 1024x1024)
  - [ ] Eye-catching screenshots (show value quickly)
  - [ ] Short description (170 chars max)
  - [ ] Keywords (iOS): proximity, social, meet, nearby, dating
  - [ ] Category: Social Networking or Lifestyle

- [ ] **Marketing Assets**
  - [ ] Website/Landing page
  - [ ] Demo video (15-30 seconds)
  - [ ] Social media accounts
  - [ ] Press kit

---

## 5. 🚀 Launch Checklist

### Pre-Launch (1-2 Weeks Before)
- [ ] All features tested end-to-end
- [ ] Privacy policy live
- [ ] Terms of service live
- [ ] Analytics installed
- [ ] Error tracking set up
- [ ] Beta testers recruited (20-50 people)
- [ ] App store screenshots ready
- [ ] Marketing materials ready

### Launch Day
- [ ] Submit to app stores
- [ ] Monitor for crashes (Sentry dashboard)
- [ ] Watch analytics (first users!)
- [ ] Respond to support requests quickly
- [ ] Post on social media
- [ ] Share with friends/family

### Post-Launch (First Week)
- [ ] Daily monitoring of analytics
- [ ] Fix critical bugs immediately
- [ ] Respond to app store reviews
- [ ] Collect user feedback
- [ ] Plan next features based on usage

---

## 6. 💰 Cost Breakdown

### One-Time Costs
| Item | Cost | Required? |
|------|------|-----------|
| Apple Developer | $99/year | Required for iOS |
| Google Play | $25 once | Required for Android |
| **Total** | **$124** | **Both platforms** |

### Monthly Costs (Starting)
| Service | Free Tier | Paid Plan |
|---------|-----------|-----------|
| Supabase | 500MB DB, 1GB storage | $25/month (Pro) |
| Sentry | 5K errors/month | $26/month (Team) |
| Analytics | Usually free | $0-50/month |
| **Estimate** | **$0/month** | **$50-100/month** |

### When You Need to Upgrade
- Supabase: 500+ active users (~10K API calls/day)
- Sentry: 5K+ errors/month (something's wrong!)
- Analytics: Usually generous free tiers

---

## 7. 📋 Recommended Launch Timeline

### Week 1-2: Polish & Testing
- [ ] Fix any remaining bugs
- [ ] Add error tracking (Sentry)
- [ ] Add basic analytics
- [ ] Beta test with 20 people
- [ ] Create privacy policy
- [ ] Create terms of service

### Week 3: App Store Prep
- [ ] Create app store accounts
- [ ] Design app icon
- [ ] Take screenshots
- [ ] Write descriptions
- [ ] Build production apps
- [ ] Submit for review

### Week 4: Launch
- [ ] Apps approved (hopefully!)
- [ ] Soft launch to friends
- [ ] Monitor closely
- [ ] Fix critical issues
- [ ] Gather feedback

### Month 2+: Growth
- [ ] Iterate based on feedback
- [ ] Add requested features
- [ ] Expand to more cities
- [ ] Marketing campaigns
- [ ] Consider monetization

---

## 8. 🎯 Priority Order (What to Do First)

### Immediate (This Week)
1. ✅ Test all features thoroughly
2. ✅ Fix critical bugs
3. 📝 Write Privacy Policy (use template below)
4. 📝 Write Terms of Service
5. 🎨 Design app icon

### Short-term (Next 2 Weeks)
1. 📊 Add Sentry error tracking
2. 📊 Add basic analytics (Amplitude/Mixpanel)
3. 🧪 Beta test with 20-50 people
4. 📸 Create app store screenshots
5. 🏗️ Build production apps

### Medium-term (Next Month)
1. 🏪 Submit to app stores
2. 🚀 Launch!
3. 📈 Monitor analytics
4. 🐛 Fix bugs based on user feedback
5. 🎉 Celebrate!

---

## 9. 📄 Privacy Policy Template

```markdown
# Privacy Policy for Nudge

**Last Updated:** [DATE]

## What We Collect
- Name and age (you provide)
- Profile photo (you upload)
- Location (approximate, while app is active)
- Device information (for app functionality)

## How We Use It
- Show you to nearby users
- Enable proximity-based matching
- Improve app performance

## How Long We Keep It
- **20 minutes after inactivity** - all data auto-deleted
- No permanent storage
- No chat history

## Your Rights
- Delete account anytime (Sign Out button)
- Data deleted immediately
- No backups or archives

## Security
- Encrypted connections (HTTPS)
- Secure database (Supabase)
- No third-party data sharing

## Contact
- Email: [YOUR EMAIL]
- Privacy questions: [YOUR EMAIL]
```

---

## 10. 🎓 Learning Resources

### App Store Submission
- [Apple App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Google Play Store Policies](https://play.google.com/about/developer-content-policy/)

### Expo EAS Build
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Submit to App Stores](https://docs.expo.dev/submit/introduction/)

### React Native Production
- [Going to Production](https://reactnative.dev/docs/running-on-device)
- [Expo Production Checklist](https://docs.expo.dev/distribution/app-stores/)

---

## ❓ FAQ

**Q: Can I launch with just iOS or Android first?**
A: Yes! Many apps launch iOS-only first. Easier to manage one platform.

**Q: Do I need a company/LLC?**
A: No, you can publish as an individual. LLC recommended if you get traction.

**Q: How long does app store approval take?**
A: iOS: 1-3 days average. Android: Few hours to 1 day.

**Q: Can I update the app after launch?**
A: Yes! You can push updates anytime. They go through review again.

**Q: What if my app gets rejected?**
A: Common on first try. They'll tell you why. Fix it and resubmit.

---

## 🎊 You're Almost There!

The app is **feature-complete** and **working**!

**Minimum to launch:** Privacy policy + App store accounts + Production builds

**Recommended timeline:** 2-3 weeks to production launch

**Next action:** Choose your launch timeline and start with privacy policy!

---

**Questions?** Just ask - I can help with any of these steps!
