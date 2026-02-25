---
title: Build Customizable Client Onboarding Experience
type: feat
status: mvp-complete
date: 2026-02-24
completed_phases: 1-3 (Database, Components, CustomizeEventScreen)
---

# Build Customizable Client Onboarding Experience

Create a self-serve onboarding platform for couples/wedding planners where they can personalize their wedding interaction experience inside Flick.

## Overview

Enable couples hosting weddings to customize their event's appearance and interaction prompts through an intuitive interface. This includes theme colors, custom event titles, personalized questions, AI-generated icebreakers, and a preview mode before publishing.

## Problem Statement / Motivation

**Current State:**
- Event hosts can create events via `CreateEventScreen` with basic details (name, venue, dates, sponsor)
- All events use the same hardcoded purple/pink gradient theme (`#C44CE0`, `#FF6B9D`)
- No customization options for branding or interaction prompts
- No way to preview the guest experience before going live

**Why This Matters:**
- Couples want their wedding app experience to match their wedding theme/colors
- Different weddings need different interaction styles (formal vs. casual, dance-focused vs. networking)
- AI-generated couple-specific trivia creates more engaging icebreakers
- Preview mode builds confidence before publishing to guests

**Impact:**
- Differentiates Flick from generic event apps
- Increases perceived value ("This is OUR wedding app, not just an app")
- Reduces support requests from hosts wanting to change things after launch
- Enables premium upsell tier (basic vs. custom branding)

## Proposed Solution

Add a multi-step customization flow after basic event creation:

```
CreateEventScreen (existing)
  ↓
CustomizeEventScreen (NEW) - Colors, title, questions, AI prompts
  ↓
PreviewEventScreen (NEW) - Mock guest view with custom theme
  ↓
PublishConfirmationScreen (NEW) - Final review & publish
  ↓
EventSuccessScreen (existing, with "Edit" button added)
```

## Technical Approach

### Database Schema Changes

**Add to `festivals` table:**
```sql
-- Color customization
ALTER TABLE festivals
ADD COLUMN primary_color TEXT DEFAULT '#C44CE0',
ADD COLUMN secondary_color TEXT DEFAULT '#FF6B9D';

-- Event branding
ALTER TABLE festivals
ADD COLUMN custom_title TEXT, -- e.g., "Daniel & Maya's Wedding"
ADD COLUMN subtitle TEXT; -- e.g., "June 15, 2026 • Napa Valley"

-- Custom questions/prompts
ALTER TABLE festivals
ADD COLUMN custom_questions JSONB DEFAULT '[]';
-- Example format: [{"id": "q1", "text": "Meet me at the bar", "type": "prompt"}, ...]

-- AI-generated content
ALTER TABLE festivals
ADD COLUMN ai_icebreakers JSONB DEFAULT '[]';
-- Example: [{"question": "How did Daniel and Maya meet?", "answer": "At a coffee shop"}]

-- Publishing state
ADD COLUMN is_published BOOLEAN DEFAULT false,
ADD COLUMN customization_completed BOOLEAN DEFAULT false;
```

### Implementation Architecture

**1. New Screens:**

#### `CustomizeEventScreen.js`
Multi-section form with tabs/accordion:

**Section 1: Theme Colors**
- Color picker for primary color (default: `#C44CE0`)
- Color picker for secondary color (default: `#FF6B9D`)
- Live preview swatch showing gradient

**Section 2: Event Title**
- Text input for custom display title (max 50 chars)
- Optional subtitle (e.g., date & location)
- Character counter
- Example: "Daniel & Maya's Wedding"

**Section 3: Custom Questions**
- Dynamic list of custom prompts
- Add/Edit/Delete functionality
- Pre-filled examples:
  - "Meet me at the bar"
  - "Want to dance to the next song?"
  - "Let's grab a drink during cocktail hour"
- Maximum 10 custom questions
- Each question: plain text input, 100 char max

**Section 4: AI Icebreakers**
- Button: "Generate AI Questions About Us"
- Modal/Form: Couple info inputs
  - "How did you meet?" (text area)
  - "Favorite memory together?" (text area)
  - "Fun fact about the couple?" (text area)
- Calls AI API to generate trivia questions
- Shows generated questions in editable list
- Maximum 5 AI questions

**Section 5: Navigation**
- "Save Draft" button (bottom left)
- "Preview" button (bottom right, primary)

#### `PreviewEventScreen.js`
Mock guest view showing:
- Custom theme colors applied to gradients
- Custom event title in header
- Sample profile cards with custom colors
- Custom questions displayed as prompt buttons
- AI icebreaker questions in modal overlay
- "Back to Edit" and "Publish Event" buttons

#### `PublishConfirmationScreen.js`
Final checklist before going live:
- ✓ Theme colors set
- ✓ Event title configured
- ✓ X custom questions added
- ✓ X AI icebreakers generated
- Warning: "Once published, guests can start scanning the QR code"
- "Publish Now" button
- Sets `is_published = true` in database

**2. New Components:**

#### `ColorPicker.js`
```javascript
<ColorPicker
  selectedColor={primaryColor}
  onColorChange={(color) => setPrimaryColor(color)}
  label="Primary Color"
  presetColors={['#C44CE0', '#FF6B9D', '#00FF00', '#4A90E2', '#E94B3C']}
/>
```
- Simple hex input field
- Row of preset color swatches
- Live preview circle

#### `CustomQuestionsEditor.js`
```javascript
<CustomQuestionsEditor
  questions={customQuestions}
  onQuestionsChange={(questions) => setCustomQuestions(questions)}
  maxQuestions={10}
/>
```
- List of editable question cards
- Add/Remove buttons
- Drag to reorder (nice-to-have)
- Character counter per question

#### `AIQuestionGenerator.js`
```javascript
<AIQuestionGenerator
  coupleInfo={{ howWeMet, favoriteMemory, funFact }}
  onQuestionsGenerated={(questions) => setAiQuestions(questions)}
  isLoading={generatingAI}
/>
```
- Form for couple info
- "Generate Questions" button
- Loading state with spinner
- Display generated questions

**3. New Library Files:**

#### `src/lib/customization.js`
```javascript
// Save customization draft (AsyncStorage + Supabase)
export async function saveCustomizationDraft(festivalId, customization) {
  const { primary_color, secondary_color, custom_title, custom_questions, ai_icebreakers } = customization;

  const { error } = await supabase
    .from('festivals')
    .update({
      primary_color,
      secondary_color,
      custom_title,
      custom_questions,
      ai_icebreakers,
      customization_completed: true
    })
    .eq('id', festivalId);

  if (error) throw error;
}

// Get customization for event
export async function getCustomization(festivalId) {
  const { data, error } = await supabase
    .from('festivals')
    .select('primary_color, secondary_color, custom_title, custom_questions, ai_icebreakers')
    .eq('id', festivalId)
    .single();

  if (error) throw error;
  return data;
}

// Publish event (make live)
export async function publishEvent(festivalId) {
  const { error } = await supabase
    .from('festivals')
    .update({ is_published: true })
    .eq('id', festivalId);

  if (error) throw error;
}
```

#### `src/lib/aiQuestions.js`
```javascript
// Generate AI icebreaker questions
export async function generateIcebreakers(coupleInfo) {
  // Call OpenAI/Claude API
  const prompt = `Generate 5 fun trivia questions about a couple based on:
  - How they met: ${coupleInfo.howWeMet}
  - Favorite memory: ${coupleInfo.favoriteMemory}
  - Fun fact: ${coupleInfo.funFact}

  Format as JSON array of objects with "question" and "answer" keys.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}
```

**4. Dynamic Theme System:**

Update `src/constants/theme.js` to support dynamic colors:

```javascript
// Before: Hardcoded colors
export const COLORS = {
  primary: '#C44CE0',
  secondary: '#FF6B9D',
  // ...
};

// After: Dynamic colors from context
import { useEvent } from '../lib/eventContext';

export function useTheme() {
  const { currentEvent } = useEvent();

  return {
    primary: currentEvent?.primary_color || '#C44CE0',
    secondary: currentEvent?.secondary_color || '#FF6B9D',
    gradient: [currentEvent?.primary_color || '#C44CE0', currentEvent?.secondary_color || '#FF6B9D'],
    // ... rest of theme
  };
}
```

Replace all `LinearGradient` hardcoded colors with dynamic theme:
```javascript
// Before
<LinearGradient colors={['#FF6B9D', '#C44CE0', '#7B5EE3']} />

// After
const theme = useTheme();
<LinearGradient colors={theme.gradient} />
```

**5. Navigation Updates:**

Update `App.js` to add new screens:
```javascript
<Stack.Screen name="CreateEvent" component={CreateEventScreen} />
<Stack.Screen name="CustomizeEvent" component={CustomizeEventScreen} /> {/* NEW */}
<Stack.Screen name="PreviewEvent" component={PreviewEventScreen} /> {/* NEW */}
<Stack.Screen name="PublishConfirmation" component={PublishConfirmationScreen} /> {/* NEW */}
<Stack.Screen name="EventSuccess" component={EventSuccessScreen} />
```

**6. Edit Flow:**

Add "Edit Event" button to `EventSuccessScreen`:
```javascript
<TouchableOpacity
  onPress={() => navigation.navigate('CustomizeEvent', { eventId: event.id })}
>
  <Text>Edit Customization</Text>
</TouchableOpacity>
```

## Acceptance Criteria

### Functional Requirements

- [ ] User can select primary and secondary theme colors
- [ ] User can add custom event title (max 50 chars) and subtitle
- [ ] User can add up to 10 custom questions/prompts (max 100 chars each)
- [ ] User can input couple info and generate 5 AI icebreaker questions
- [ ] Generated AI questions are editable
- [ ] "Save Draft" persists customization to Supabase
- [ ] "Preview" shows accurate guest-view mockup with custom theme
- [ ] "Publish" makes event live and QR code active
- [ ] Published events can be edited (changes update existing event)
- [ ] Custom colors apply to all guest-facing screens (Dashboard, Profile, Chat)

### Non-Functional Requirements

- [ ] Form validation: Title 3-50 chars, Questions 1-100 chars
- [ ] AI generation completes in <5 seconds or shows loading state
- [ ] Color picker works on iOS and Android
- [ ] Preview mode accurately reflects final guest experience
- [ ] Mobile-friendly layout (single column, scrollable)
- [ ] Works offline (saves draft locally, syncs when online)

### Quality Gates

- [ ] All new screens follow existing `LinearGradient` UI pattern
- [ ] Form validation matches `validateEventData()` pattern in `events.js`
- [ ] Database migrations tested on local Supabase instance
- [ ] Navigation flow tested end-to-end (create → customize → preview → publish → edit)
- [ ] AI API errors handled gracefully (timeout, rate limit, invalid response)
- [ ] AsyncStorage fallback if Supabase offline

## Implementation Phases

### Phase 1: Database & Data Layer (2-3 days)
**Tasks:**
- [ ] Write migration: `add-festival-customization-columns.sql`
- [ ] Run migration on local Supabase
- [ ] Create `src/lib/customization.js` with CRUD functions
- [ ] Create `src/lib/aiQuestions.js` with API integration
- [ ] Test data flow: save draft → retrieve → update

**Success Criteria:**
- Can save/load customization data from Supabase
- AI API returns valid JSON array of questions
- Database constraints working (color format, max lengths)

### Phase 2: UI Components (3-4 days)
**Tasks:**
- [ ] Build `ColorPicker.js` component
- [ ] Build `CustomQuestionsEditor.js` component
- [ ] Build `AIQuestionGenerator.js` component
- [ ] Add to Storybook or test in isolation
- [ ] Test on iOS and Android

**Success Criteria:**
- Color picker updates state correctly
- Questions editor handles add/edit/delete
- AI generator shows loading state and handles errors

### Phase 3: Customization Screen (2-3 days)
**Tasks:**
- [ ] Create `CustomizeEventScreen.js` with 5 sections
- [ ] Integrate `ColorPicker`, `CustomQuestionsEditor`, `AIQuestionGenerator`
- [ ] Add form validation
- [ ] Implement "Save Draft" button
- [ ] Implement "Preview" navigation
- [ ] Add to navigation stack in `App.js`

**Success Criteria:**
- Screen layout matches design (scrollable, sectioned)
- Save draft persists to Supabase
- Preview button navigates with customization data
- Form validation shows inline errors

### Phase 4: Preview & Publish (2-3 days)
**Tasks:**
- [ ] Create `PreviewEventScreen.js` with mock guest UI
- [ ] Apply dynamic theme colors to preview
- [ ] Create `PublishConfirmationScreen.js` with checklist
- [ ] Implement "Publish Now" button (sets `is_published = true`)
- [ ] Add "Back to Edit" navigation
- [ ] Update `EventSuccessScreen` with "Edit Event" button

**Success Criteria:**
- Preview accurately shows custom theme
- Publish confirmation shows completed checklist
- Publish button makes event live
- Edit button navigates back to customization

### Phase 5: Dynamic Theme System (3-4 days)
**Tasks:**
- [ ] Create `EventContext` to store current event data
- [ ] Update `theme.js` to use dynamic colors
- [ ] Replace hardcoded `LinearGradient` colors across all screens:
  - `DashboardScreen.js`
  - `ProfileScreen.js`
  - `ChatScreen.js`
  - All onboarding screens
- [ ] Test theme switching with different color combos
- [ ] Handle null/undefined colors gracefully (fallback to defaults)

**Success Criteria:**
- All screens use `useTheme()` hook instead of hardcoded colors
- Switching events updates theme in real-time
- Default colors used if event has no customization
- No color flickering during navigation

### Phase 6: Polish & Testing (2 days)
**Tasks:**
- [ ] Add loading states for AI generation
- [ ] Add error handling for API failures
- [ ] Test offline mode (AsyncStorage fallback)
- [ ] Test edit flow (publish → edit → update → preview)
- [ ] Test with real couple data and long text inputs
- [ ] Accessibility: VoiceOver/TalkBack labels
- [ ] Add analytics events (customize_started, published, etc.)

**Success Criteria:**
- No crashes or unhandled errors
- AI failures show user-friendly error message
- Offline mode works (saves locally, syncs later)
- Edit flow doesn't break published event
- All interactive elements have ARIA labels

## Success Metrics

**Adoption Metrics:**
- % of events that complete customization
- Average time spent on customization screen
- % of events that publish vs. save draft only

**Engagement Metrics:**
- Average number of custom questions added per event
- % of events using AI icebreaker generator
- % of events using custom colors (vs. defaults)

**Quality Metrics:**
- Customization completion rate (start → publish)
- Edit rate after publishing
- Support tickets related to customization

**Target Goals:**
- 70%+ of events complete customization
- 50%+ use AI icebreaker generator
- <5% abandon customization flow
- <3 min average time to customize

## Dependencies & Risks

**Dependencies:**
- OpenAI or Claude API key for AI generation
- Supabase migration successfully applied
- React Navigation updated to support new screens

**Risks:**

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| AI API rate limits hit during events | Medium | High | Cache generated questions, implement retry with backoff, offer manual question entry as fallback |
| Custom colors break accessibility (contrast) | High | Medium | Validate color contrast against WCAG AA, warn user if combo fails, auto-adjust text color |
| Theme switching causes performance issues | Low | Medium | Memoize theme object, use React Context efficiently, test on older devices |
| Users publish without customizing | Medium | Low | Add nudge/tooltip on first publish: "Want to customize your event first?" |
| Complex color picker confuses users | Medium | Low | Start with simple preset swatches, hide advanced hex input |

## Future Considerations

**Phase 2 Enhancements (Post-MVP):**
- Upload couple photo for branding
- Font selection (not just colors)
- Custom app icon (shown on guest home screen)
- More AI-generated content (playlist suggestions, schedule ideas)
- Template library (pre-made themes: "Boho Beach", "Classic Elegance")
- Multi-language support for questions/prompts

**Extensibility:**
- Export customization as JSON (couples can reuse for multiple events)
- White-label API for event planners to bulk-customize
- A/B testing different question sets
- Analytics on which questions drive most engagement

## References & Research

### Internal References

**Existing Patterns:**
- Event creation: `src/screens/CreateEventScreen.js:1`
- Form validation: `src/lib/events.js:19` (`validateEventData()`)
- Multi-step onboarding: `src/screens/HostOnboarding1Screen.js:1`
- Theme system: `src/constants/theme.js:1`

**Database Schema:**
- Festivals table: `supabase/festivals-schema.sql:1`
- Database functions: `supabase-setup.sql:1`

**State Management:**
- UserContext: `src/lib/userContext.js:1`
- AsyncStorage usage: `src/lib/userContext.js:45`

### External References

**AI Integration:**
- OpenAI Chat Completions API: https://platform.openai.com/docs/api-reference/chat
- Claude API (alternative): https://docs.anthropic.com/claude/reference/messages

**React Native Components:**
- Color Picker: `react-native-color-picker` (simple option)
- Or build custom with `TouchableOpacity` and hex input

**Design Inspiration:**
- Canva customization flow
- Squarespace website builder
- Notion color palette picker

### Related Work

**Similar Features in Codebase:**
- Host onboarding carousel: `docs/plans/2026-02-16-feat-host-event-onboarding-carousel-plan.md`
- QR system: `QR-SYSTEM-GUIDE.md`

---

**Estimated Total Effort:** 14-19 days (2-3 weeks)

**Priority:** High (core differentiator for wedding market)

**Next Steps:**
1. Review plan with team/stakeholders
2. Get OpenAI/Claude API key
3. Run database migration on dev environment
4. Start with Phase 1 (data layer)
