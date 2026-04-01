# Backlog — Bugs and Missing Features

Tracked issues and planned work.

Updated: 2026-04-01

---

## Bugs

- [ ] **Phone number exchange doesn't require recipient to have a phone number** — Requesting a number should succeed even if the other user hasn't added theirs yet. When the recipient sees the request, they should be navigated to their profile to add their phone number before they can accept.
- [x] **App restart loses event session** — Fixed: festival_id key mismatch in updateUser, now persists correctly and AppNavigator routes to Dashboard on relaunch.


## Missing Features (Push Notifications)

- [ ] **iOS push notifications** — Requires Apple Developer account ($99/yr), APNs key upload to EAS, TestFlight setup. Android is working.
- [ ] **Notification sound** — Uses system default. Could add a custom sound later.

## Missing Features (General)

- [ ] **Join event via deep link (no QR scan)** — Share an event link via WhatsApp/SMS/etc. that opens the app and joins the event directly, instead of requiring a QR code scan every time.
- [ ] **Google Sign-In for hosts** — Web + Android OAuth clients created, Supabase configured. Needs testing in preview build.
- [ ] **App Store / Play Store submission** — Production builds, store listings, screenshots, review process.

## Cleanup

- [ ] **Dead files (~60MB)** — See `docs/CLEANUP-CANDIDATES.md` for the full list. Review with team before deleting.

---

## Done

### Bugs (Resolved)
- [x] **Notification icon shows as purple square** — Fixed: created monochrome `assets/notification-icon.png` and updated `app.json`.
- [x] **Real-time messages not appearing in chat** — Fixed: added `messages` table to Supabase Realtime publication + 3s polling fallback.
- [x] **"Already Flicked" error on fast double-tap** — Fixed: silently ignore duplicate flick during card transition.
- [x] **Phone icon always shows "Request" modal** — Fixed: checks exchange state first (accepted → Vault, pending from them → accept/decline, pending from me → waiting).
- [x] **System message buttons not working** — Fixed: check `metadata.type === 'exchange_request'` instead of `metadata.buttons`.
- [x] **VaultScreen crash on missing route params** — Fixed: route params now optional with DB fallback for other user's name.
- [x] **Unmatch doesn't clear data history** — Already handled: `unmatchUser()` deletes messages, exchanges, flicks, and match record.

### Features (Shipped)
- [x] **Notification settings not wired to backend** — Fixed.
- [x] **Notification grouping** — Fixed: Edge Function sets `threadId` per match.
- [x] **In-app notification suppression** — Fixed: suppress banner when user is already on the relevant screen.
- [x] **Preview build (shareable APK)** — Done: `eas build --profile preview --platform android`.
- [x] **Age range filter on radar** — Added: onboarding step after "Looking For", editable from Profile, client-side filtering in radar.
- [x] **Reorder onboarding: profile before QR scan** — Done: new users create profile first, then scan QR. Returning users go straight to QR scanner.
