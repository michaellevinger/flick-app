# Resume Prompt for Next Session

Copy and paste this prompt when you return:

---

## Prompt to Use:

```
I'm working on the HeyU app - a proximity-based social app (formerly called SPOT).

PROJECT LOCATION: /Users/michaellevinger/dev/spot-app/spot-app
GITHUB REPO: https://github.com/MikeyLevinger/heyu-app

CURRENT STATUS:
- ✅ All features are coded and complete (camera onboarding, proximity radar, visual nudges, mutual matching, number exchange with 15-min TTL)
- ✅ Supabase fully configured (database schema, storage bucket, PostGIS)
- ✅ Ready for end-to-end testing!

WHAT I NEED HELP WITH:
1. Read SESSION_NOTES.md to understand the full context
2. Help me test the app end-to-end
3. Fix any bugs we discover
4. Move to polish & optimization (Task #10)

KEY DOCUMENTATION:
- SESSION_NOTES.md - Complete context and testing checklist
- CLAUDE.md - Main project documentation

Please read SESSION_NOTES.md first, then help me test all features to make sure everything works together.
```

---

## Alternative Shorter Prompt:

If you want something more concise:

```
I'm working on HeyU app (proximity social app). Read SESSION_NOTES.md to see where we left off. Supabase is complete - ready for end-to-end testing! Project is at: /Users/michaellevinger/dev/spot-app/spot-app
```

---

## Tips for Next Session:

1. **Start with the prompt above** - It gives Claude all the context needed
2. **Claude will read SESSION_NOTES.md** - That file has everything documented
3. **Have 2 devices ready for testing** - Need to test proximity features
4. **Supabase dashboard open** - https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh (to verify data)

---

## Expected Flow:

1. You paste the prompt
2. Claude reads SESSION_NOTES.md and CLAUDE.md
3. You start the app with `npx expo start`
4. Claude helps you test all features end-to-end
5. We fix any bugs discovered
6. Move to Task #10 (Polish & Optimization)

---

**Bookmark this file!** It's your quick-start guide for the next session.
