# Cleanup Candidates

Files and folders that appear unused or redundant. Review with the team before deleting.

Audited: 2026-03-28

---

## Folders (~60MB total)

| Path | Size | Reason |
|---|---|---|
| `.archive/old-docs/` (33 files) | ~200KB | Old docs already archived from previous dev sessions |
| `docs/archive/` (5 files) | ~30KB | Session notes, Notion export, TODO from previous dev (GOOGLE-SIGNIN-FIX.md, NOTION-SIMPLE.txt, SESSION-RESUME-2026-02-24.md, SESSION-STATUS-2026-03-07.md, TODO-FOR-DOR.md) |
| `docs/plans/` (13 files) | ~250KB | Completed/abandoned feature plans from Feb-Mar 2026 |
| `notion-sections/` (1 file) | ~1KB | Single Notion fragment (01-overview.md), not referenced anywhere |
| `design-reference/` (~10 files) | ~30MB | Gemini-generated images and WhatsApp screenshots, not used in the app |
| `original-images/` (~15 files) | ~30MB | More Gemini-generated images and screenshots, not used in the app |
| `qr-codes/` (4 PNGs) | ~27KB | Pre-generated QR codes for old festivals, can regenerate with `node scripts/generate-qr.js` |

## Scripts (old developer one-time utilities)

| File | Reason |
|---|---|
| `scripts/App-debug.js` | Barebones debug App.js replacement, not referenced |
| `scripts/App.connectivity-test.js` | Old connectivity test App replacement, not referenced |
| `scripts/App.test-suite.js` | Old test suite App replacement, not referenced |
| `scripts/start-expo.sh` | Hardcoded to `/Users/michaellevinger/dev/testing` |
| `scripts/test-android.sh` | Local Android build script, superseded by EAS builds |
| `scripts/test-setup.sh` | Calls old verify/manage scripts below |
| `scripts/check-policies.js` | One-time Supabase RLS policy check |
| `scripts/get-my-location.js` | GPS location script, app is event-based now (no GPS) |
| `scripts/make-them-like-me.js` | Old nudge insertion script, superseded by `flick-me.js` |
| `scripts/manage-storage.js` | One-time Supabase storage bucket setup |
| `scripts/test-connectivity.js` | One-time Supabase connectivity test |
| `scripts/test-matching.js` | Old matching test, superseded by `match-me.js` |
| `scripts/test-sql-function.js` | One-time SQL function test |
| `scripts/test-upload.js` | One-time upload test |
| `scripts/verify-supabase.js` | One-time Supabase setup verification |

## Keep (confirmed active)

| File/Folder | Why |
|---|---|
| `scripts/login.js`, `seed-radar.js`, `flick-me.js`, `match-me.js`, `message-me.js` | Active dev testing workflow |
| `scripts/lib/` | Shared utilities for dev scripts |
| `scripts/generate-qr.js`, `generate-qr.html` | QR code generation for events |
| `scripts/debug-radar.js` | Useful for debugging radar issues |
| `website/`, `vercel.json` | Live website at helloflick.com |
| `docs/guides/` | Active documentation |
| `supabase/` | Migrations and Edge Functions |
| `assets/` | App icons and splash screen |

---

To delete everything listed above, run:

```bash
# Folders
rm -rf .archive/old-docs docs/archive docs/plans notion-sections design-reference original-images qr-codes

# Old scripts
rm scripts/App-debug.js scripts/App.connectivity-test.js scripts/App.test-suite.js
rm scripts/start-expo.sh scripts/test-android.sh scripts/test-setup.sh
rm scripts/check-policies.js scripts/get-my-location.js scripts/make-them-like-me.js
rm scripts/manage-storage.js scripts/test-connectivity.js scripts/test-matching.js
rm scripts/test-sql-function.js scripts/test-upload.js scripts/verify-supabase.js
```
