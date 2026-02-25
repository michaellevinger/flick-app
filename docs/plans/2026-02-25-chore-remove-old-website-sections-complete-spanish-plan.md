---
title: Remove old website sections and complete Spanish translations
type: chore
status: active
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

- [ ] Delete `/website/weddings/` directory entirely
- [ ] Delete `/website/bars/` directory entirely
- [ ] Delete `/website/colleges/` directory entirely
- [ ] Remove any routing rules for these sections in `vercel.json`
- [ ] Check for and remove any other references in config files

### 2. Complete Spanish Translations

**Verify every text element on `/website/index.html` has Spanish translation:**

- [ ] Navigation menu items
- [ ] Hero section (tag, title, subtitle, description)
- [ ] Phone mockup content (all UI text in screenshots)
- [ ] "How It Works" section (title, subtitle, all 3 steps)
- [ ] Step labels under phone mockups
- [ ] "Where guests become love stories" tagline
- [ ] "See flick in Action" section
- [ ] "Built For" section (titles and descriptions)
- [ ] CTA section ("Ready to Add Magic")
- [ ] Footer (Product, Contact, links, copyright)
- [ ] All button text
- [ ] Any tooltips or helper text

**Testing:**
- [ ] Click ESP toggle and verify entire page displays in Spanish
- [ ] Click ENG toggle and verify entire page displays in English
- [ ] Test on mobile and desktop
- [ ] Check for any English text remaining when Spanish is active

### 3. Update Documentation

**CLAUDE.md updates:**
- [ ] Remove references to "Festival Site"
- [ ] Update website section to reflect single wedding landing page
- [ ] Remove bars/colleges from feature list
- [ ] Update version notes to reflect current architecture

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
- [ ] Test waitlist page works (if keeping it)
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
