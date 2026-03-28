# Backlog — Bugs and Missing Features

Tracked issues and planned work. Check items off as they're resolved.

Updated: 2026-03-28

---

## Bugs

- [x] **Notification icon shows as purple square** — Fixed: created monochrome `assets/notification-icon.png` and updated `app.json`. Needs a new EAS build to take effect.

## Missing Features (Push Notifications)

- [x] **Notification settings not wired to backend** — Fixed: `upsertUser` and `updateUser` now pass `notification_preferences` to DB. Toggles persist and Edge Function respects them.
- [ ] **iOS push notifications** — Requires Apple Developer account ($99/yr), APNs key upload to EAS, TestFlight setup. Android is working.

## Missing Features (General)

- [ ] **Preview build (shareable APK)** — Dev build requires laptop running. Need `eas build --profile preview --platform android` for testers.
- [ ] **App Store / Play Store submission** — Production builds, store listings, screenshots, review process.

## Cosmetic / Polish

- [x] **Notification grouping** — Fixed: Edge Function sets `threadId` per match so notifications from the same conversation group together. Flick notifications group separately.
- [ ] **Notification sound** — Uses system default. Could add a custom sound later.

## Cleanup

- [ ] **Dead files (~60MB)** — See `docs/CLEANUP-CANDIDATES.md` for the full list. Review with team before deleting.
