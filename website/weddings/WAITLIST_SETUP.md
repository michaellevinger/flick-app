# Wedding Waitlist Setup Guide

## Overview
The waitlist page collects leads for the wedding platform at `/weddings/waitlist.html`

## Form Backend Options

### Option 1: Formspree (Recommended - Free)

**Setup Steps:**
1. Go to [formspree.io](https://formspree.io)
2. Sign up for free account
3. Create a new form
4. Copy your form endpoint URL (looks like: `https://formspree.io/f/xyzabc123`)
5. Replace `YOUR_FORM_ID` in `waitlist.html` line 169:
   ```html
   <form id="waitlistForm" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```

**Features:**
- ✅ Free for up to 50 submissions/month
- ✅ Email notifications
- ✅ Spam filtering
- ✅ Export to CSV
- ✅ No coding required

### Option 2: Google Sheets via Google Forms

**Setup Steps:**
1. Create a Google Form with matching fields
2. Link it to a Google Sheet
3. Use Apps Script to handle submissions
4. Replace form action URL

### Option 3: Airtable

**Setup Steps:**
1. Create an Airtable base
2. Set up a form view
3. Use Airtable's form endpoint
4. Great for CRM-style management

### Option 4: Custom Backend

If you want to build your own:
- Set up a simple Express/Node.js server
- Store submissions in PostgreSQL/MongoDB
- Deploy on Vercel/Railway/Render

## Form Fields Collected

The waitlist form collects:
- **First Name** (required)
- **Last Name** (required)
- **Email** (required)
- **Phone Number** (optional)
- **Wedding Date** (optional)
- **Expected Guest Count** (dropdown)
- **Referral Source** (dropdown)
- **Additional Comments** (optional)

## Email Notifications

With Formspree, you'll receive email notifications at your account email containing:
- All form field data
- Timestamp
- Browser/device info

## Data Export

**Formspree:**
- Dashboard → Forms → Your Form → Submissions → Export CSV

**Google Sheets:**
- Already in spreadsheet format
- Can set up automatic emails with Apps Script

## Next Steps After Launch

1. Add email automation (welcome email, follow-ups)
2. Set up CRM integration (HubSpot, Mailchimp)
3. Create email nurture sequence
4. Track conversion analytics
5. A/B test different messaging

## Analytics Tracking

Add Google Analytics or Plausible to track:
- Page views on waitlist page
- Form completion rate
- Traffic sources
- Time on page

## Spam Prevention

Formspree includes:
- reCAPTCHA option
- Honeypot fields
- Email verification

For custom solutions, consider:
- Google reCAPTCHA v3
- Turnstile (Cloudflare)
- Rate limiting

## Current URL

Once deployed:
- Waitlist page: `https://helloflick.com/weddings/waitlist`
- Main wedding page: `https://helloflick.com/weddings`

## Promotion Strategy

Share this URL:
1. Instagram/TikTok bio link
2. Wedding planner networks
3. Facebook wedding groups
4. Wedding venue partnerships
5. Influencer collaborations
6. Paid ads (Google, Meta)
