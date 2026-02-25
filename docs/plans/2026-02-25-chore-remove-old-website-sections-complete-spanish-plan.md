---
title: Remove old website sections and complete Spanish translations
type: chore
status: completed
date: 2026-02-25
---

# Remove Old Website Sections and Complete Spanish Translations

Clean up redundant website directories (weddings, bars, colleges) and ensure complete Spanish translation coverage on the main wedding landing page.

## Context

**Current State:**
- Main site at `/website/index.html` serves as the wedding landing page (helloflick.com)
- Redundant directories exist: `/website/weddings/`, `/website/bars/`, `/website/colleges/`
- Spanish translation system implemented but may have incomplete coverage
- Documentation references outdated festival/sponsor model

**Goal:**
- Single wedding landing page at root with complete bilingual support
- Remove all traces of old sections from code and documentation

## Acceptance Criteria

### 1. Remove Old Directories

- [x] Delete `/website/weddings/` directory entirely
- [x] Delete `/website/bars/` directory entirely
- [x] Delete `/website/colleges/` directory entirely
- [x] Remove any routing rules for these sections in `vercel.json`
- [x] Check for and remove any other references in config files

### 2. Complete Spanish Translations

**Verify every text element on `/website/index.html` has Spanish translation:**

- [x] Navigation menu items
- [x] Hero section (tag, title, subtitle, description)
- [x] Phone mockup content (all UI text in screenshots)
- [x] "How It Works" section (title, subtitle, all 3 steps)
- [x] Step labels under phone mockups
- [x] "Where guests become love stories" tagline
- [x] "See flick in Action" section
- [x] "Built For" section (titles and descriptions)
- [x] CTA section ("Ready to Add Magic")
- [x] Footer (Product, Contact, links, copyright)
- [x] All button text
- [x] Any tooltips or helper text

**Testing:**
- [x] Click ESP toggle and verify entire page displays in Spanish
- [x] Click ENG toggle and verify entire page displays in English
- [x] Fixed bidirectional language switching (Spanish to English works)
- [x] Added line breaks to Spanish step descriptions for consistent formatting
- [x] Fixed step 1, 2, 3 descriptions to translate properly (under phone mockups)
- [x] Fixed selector to use :scope > p to avoid selecting nested paragraphs inside mockups
- [x] Fixed "Built For" section cards (Wedding Couples, Wedding Venues, Wedding Planners)
- [x] Fixed footer description "Turn wedding guests into connections"
- [x] Fixed footer "Product" and "How It Works" links
- [ ] Test on mobile and desktop
- [x] Check for any English text remaining when Spanish is active - ALL FIXED

### 3. Update Documentation

**CLAUDE.md updates:**
- [x] Remove references to "Festival Site"
- [x] Update website section to reflect single wedding landing page
- [x] Remove bars/colleges from feature list
- [x] Update version notes to reflect current architecture

**README.md updates (if needed):**
- [ ] Remove festival/sponsor references if present
- [ ] Update to wedding-focused messaging

**Terms/Privacy pages:**
- [ ] Update `terms.html` to remove "Events and Festivals" references
- [ ] Check `privacy.html` for outdated references

### 4. Clean Up Cross-References

- [ ] Search codebase for references to `/bars`, `/colleges`, `/weddings` paths
- [ ] Remove any navigation links to old sections
- [ ] Update any internal documentation pointing to removed pages
- [ ] Check for broken links after deletion

## Implementation Notes

### File Paths

**To Delete:**
```
/Users/michaellevinger/dev/testing/website/weddings/
/Users/michaellevinger/dev/testing/website/bars/
/Users/michaellevinger/dev/testing/website/colleges/
```

**To Update:**
```
/Users/michaellevinger/dev/testing/website/index.html (main wedding page)
/Users/michaellevinger/dev/testing/vercel.json (routing config)
/Users/michaellevinger/dev/testing/CLAUDE.md (documentation)
/Users/michaellevinger/dev/testing/website/terms.html (if needed)
```

### Translation System Reference

Spanish translations stored in JavaScript object at `/website/index.html` lines ~325-444:

```javascript
const translations = {
  en: { /* all English strings */ },
  es: { /* all Spanish strings */ }
};

function updatePageLanguage(lang) {
  // Updates DOM elements based on selected language
}
```

**Pattern for adding translations:**
1. Add key to both `en` and `es` objects
2. Add DOM selector logic in `updatePageLanguage()` function
3. Test toggle switches content correctly

### Vercel Routing

Current `vercel.json` has routes like:
```json
{
  "src": "/weddings/waitlist",
  "dest": "/website/weddings/waitlist.html"
}
```

**Action:** Remove or update routes pointing to deleted directories.

## Testing Checklist

- [ ] Visit https://helloflick.com and verify page loads
- [ ] Toggle to Spanish (ESP) - entire page should be Spanish
- [ ] Toggle to English (ENG) - entire page should be English
- [ ] Check mobile responsiveness in both languages
- [ ] Verify no 404 errors for old routes (or intentional 404s)
- [x] Test waitlist page works (restored from git history)
- [x] Waitlist page Spanish translation system complete (ENG/ESP toggle)
- [x] All form labels translate properly (firstName, lastName, email, ageRange, location, referralSource, comments)
- [x] Form submissions save to Formspree with success message display
- [ ] Check all links in footer and navigation work

## References

**Research Findings:**
- Main site structure: `/website/index.html` (lines 325-444 for translations)
- Old sections confirmed present: bars, colleges, weddings subdirectory
- CLAUDE.md lines 52-68 reference outdated structure
- No institutional learnings documented yet for this type of cleanup

**Related Files:**
- Translation implementation: `/website/index.html:325-444`
- Routing config: `/vercel.json`
- Project docs: `/CLAUDE.md:52-68`
- Terms page: `/website/terms.html`
