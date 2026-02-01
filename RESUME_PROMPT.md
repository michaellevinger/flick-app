# Resume Prompt for Next Session

Copy and paste this prompt when you return:

---

## Prompt to Use:

```
I'm working on the HeyU app - a proximity-based social app (formerly called SPOT).

PROJECT LOCATION: /Users/michaellevinger/dev/spot-app/spot-app
GITHUB REPO: https://github.com/MikeyLevinger/heyu-app

CURRENT STATUS:
- All features are coded and complete (camera onboarding, proximity radar, visual nudges, mutual matching, number exchange with 15-min TTL)
- Supabase project is created (oithyuuztrmohcbfglrh.supabase.co)
- .env file is configured with credentials
- PostGIS extension is enabled

CURRENT BLOCKER:
I'm in the middle of setting up the Supabase database schema. Task #12 is "in_progress".

WHAT I NEED HELP WITH:
1. Read SESSION_NOTES.md to understand exactly where we left off
2. Help me complete the 3 remaining Supabase setup steps:
   - Run base schema SQL (supabase-setup.sql)
   - Run exchange schema SQL (supabase-exchanges-schema.sql)
   - Create selfies storage bucket (make it PUBLIC)
3. Test the app end-to-end

KEY DOCUMENTATION:
- SESSION_NOTES.md - Complete context from last session
- CLAUDE.md - Main project documentation
- Task #12 - Supabase setup checklist

Please read SESSION_NOTES.md first, then guide me through completing the Supabase database setup so we can test the app.
```

---

## Alternative Shorter Prompt:

If you want something more concise:

```
I'm working on HeyU app (proximity social app). Read SESSION_NOTES.md to see where we left off. I need help completing Supabase database setup (Task #12 in progress). Project is at: /Users/michaellevinger/dev/spot-app/spot-app
```

---

## Tips for Next Session:

1. **Start with the prompt above** - It gives Claude all the context needed
2. **Claude will read SESSION_NOTES.md** - That file has everything documented
3. **Have Supabase dashboard open** - https://supabase.com/dashboard/project/oithyuuztrmohcbfglrh
4. **Be ready to copy-paste SQL** - Claude will guide you through it step by step

---

## Expected Flow:

1. You paste the prompt
2. Claude reads SESSION_NOTES.md and CLAUDE.md
3. Claude walks you through the 3 SQL/setup steps
4. You test the app with `npx expo start`
5. We move to Task #10 (Polish & Testing)

---

**Bookmark this file!** It's your quick-start guide for the next session.
