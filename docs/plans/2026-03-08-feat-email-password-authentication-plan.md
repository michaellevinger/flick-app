---
title: Add Email/Password Authentication to HostAuthScreen
type: feat
status: active
date: 2026-03-08
---

# Add Email/Password Authentication to HostAuthScreen

## Overview

Add email/password authentication as a regular sign-up option alongside existing Google and Apple Sign-In buttons. This follows modern app best practices (Instagram, Airbnb, etc.) with a single-screen toggle between sign-up and sign-in modes.

## Problem Statement / Motivation

Currently, HostAuthScreen only supports social authentication (Google/Apple). Users without these accounts or those who prefer email/password cannot authenticate. This limits accessibility and user choice.

**User Request:** "make sure to sign up regulary is also an option (not only via google) - IMPORTANT - please make sure this flow is like other apps best practices"

## Proposed Solution

Add email/password authentication to HostAuthScreen with:
- Email input field with validation
- Password input with show/hide toggle (eye icon)
- "Sign Up" / "Sign In" mode toggle (tabs or buttons)
- Forgot password flow (email reset link)
- Email verification requirement
- Proper error messages (inline + toast)
- Loading states during async operations

**Layout:**
```
┌─────────────────────────────┐
│   Host Authentication       │
├─────────────────────────────┤
│  [Sign Up] | [Sign In]      │  ← Toggle tabs
│                             │
│  Email                      │
│  [___________________]      │
│                             │
│  Password                   │
│  [___________________] 👁   │  ← Show/hide toggle
│                             │
│  [Forgot Password?]         │  ← Only in Sign In mode
│                             │
│  [Continue]                 │  ← Primary CTA
│                             │
│  ────── OR ──────           │
│                             │
│  [Continue with Google]     │
│  [Continue with Apple] (iOS)│
└─────────────────────────────┘
```

## Technical Approach

### Architecture

**Single Screen, Two Modes:**
- Use React state to toggle between "signup" and "signin" modes
- Conditionally render "Forgot Password?" link in sign-in mode
- Share email/password inputs between both modes

**Integration Points:**
- Existing `AuthContext` (src/lib/authContext.js) - Add email auth methods
- Existing `HostAuthScreen` (src/screens/HostAuthScreen.js) - Add email/password UI
- Supabase Auth API - Use signUp, signInWithPassword, resetPasswordForEmail

### Implementation Phases

#### Phase 1: Core Email/Password UI
- [x] Read existing patterns (HostAuthScreen.js, AuthContext.js)
- [x] Add mode toggle state (signup/signin)
- [x] Add email input field with validation
- [x] Add password input field with show/hide toggle
- [x] Add "Continue" button with loading state
- [x] Add OR divider and reposition social auth buttons
- [x] Style with existing theme (brutalist/minimalist)

#### Phase 2: Authentication Logic
- [x] Extend AuthContext with email auth methods:
  - `signUpWithEmail(email, password)`
  - `signInWithEmail(email, password)`
- [x] Wire up "Continue" button to appropriate method
- [x] Handle loading states (disable inputs during async)
- [x] Create host profile after successful auth

#### Phase 3: Error Handling & Validation
- [x] Email validation (format, required)
- [x] Password validation (min 8 chars, required)
- [x] Inline error messages below inputs
- [x] Alert notifications for auth errors
- [x] Handle Supabase error codes:
  - `invalid_credentials` - Wrong email/password
  - `email_exists` - Account already exists
  - `weak_password` - Password too weak
  - `invalid_email` - Email format invalid

#### Phase 4: Email Verification Flow
- [ ] Enable email verification in Supabase dashboard
- [ ] Add confirmation message after signup: "Check your email to verify your account"
- [ ] Handle unverified email state on sign-in
- [ ] Add "Resend verification email" option

#### Phase 5: Password Reset Flow
- [ ] Implement forgot password modal/screen
- [ ] Send reset email via Supabase
- [ ] Configure deep linking for reset token
- [ ] Create password reset screen
- [ ] Handle expired/invalid reset tokens

## Acceptance Criteria

### Functional Requirements

**Sign Up Mode:**
- [ ] User can enter email and password
- [ ] Password field has show/hide toggle (eye icon)
- [ ] Email validation shows errors immediately
- [ ] Password must be at least 8 characters
- [ ] Clicking "Continue" creates account and sends verification email
- [ ] Success message: "Check your email to verify your account"
- [ ] After verification, user can sign in

**Sign In Mode:**
- [ ] User can enter email and password
- [ ] "Forgot Password?" link is visible
- [ ] Clicking "Continue" authenticates user
- [ ] On success, creates host profile and navigates to returnTo screen
- [ ] On failure, shows clear error message

**Forgot Password:**
- [ ] Clicking link shows forgot password modal
- [ ] User enters email
- [ ] System sends reset email
- [ ] Email contains deep link to app
- [ ] Deep link opens password reset screen
- [ ] User enters new password
- [ ] Password is updated successfully

**Error Handling:**
- [ ] Invalid email format: "Please enter a valid email address"
- [ ] Password too short: "Password must be at least 8 characters"
- [ ] Wrong credentials: "Invalid email or password"
- [ ] Email already exists: "Account already exists. Try signing in."
- [ ] Weak password: "Password is too weak. Use a mix of letters and numbers."

### Non-Functional Requirements

**UX:**
- [ ] Input fields follow existing app style (black border, white background)
- [ ] Loading states show ActivityIndicator (green tint)
- [ ] Keyboard dismisses when tapping outside
- [ ] Tab key navigates between email → password → continue
- [ ] Form state persists when switching between signup/signin modes

**Performance:**
- [ ] Auth operations complete within 3 seconds (network dependent)
- [ ] No UI jank during loading states
- [ ] Input validation is instantaneous (< 100ms)

**Security:**
- [ ] Passwords never logged or stored in plain text
- [ ] Email verification required before first sign-in
- [ ] Password reset tokens expire after 24 hours
- [ ] Rate limiting on authentication attempts (Supabase default)

### Quality Gates

- [ ] All inputs have proper keyboard types (email, secure-text)
- [ ] All error states have been manually tested
- [ ] Email verification flow tested end-to-end
- [ ] Password reset flow tested end-to-end
- [ ] Loading states prevent double-submission
- [ ] Code follows existing patterns in HostAuthScreen.js

## Technical Considerations

### Email Validation
```javascript
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
```

### Password Visibility Toggle
```javascript
const [isPasswordVisible, setIsPasswordVisible] = useState(false);

<TextInput
  secureTextEntry={!isPasswordVisible}
  // ...
/>
<TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
  <Text>{isPasswordVisible ? '🙈' : '👁'}</Text>
</TouchableOpacity>
```

### Supabase Auth Methods
```javascript
// Sign Up
const { data, error } = await supabase.auth.signUp({
  email: email.trim().toLowerCase(),
  password: password,
  options: {
    emailRedirectTo: 'yourapp://reset-password', // Deep link
  },
});

// Sign In
const { data, error } = await supabase.auth.signInWithPassword({
  email: email.trim().toLowerCase(),
  password: password,
});

// Reset Password
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: 'yourapp://reset-password',
});
```

### Deep Linking Configuration
Add to `app.json`:
```json
{
  "expo": {
    "scheme": "yourapp",
    "ios": {
      "associatedDomains": ["applinks:yourapp.com"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": [{ "scheme": "yourapp" }],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    }
  }
}
```

## Dependencies & Prerequisites

- [x] Supabase project configured
- [x] AuthContext implemented (src/lib/authContext.js)
- [x] HostAuthScreen exists (src/screens/HostAuthScreen.js)
- [ ] Email verification enabled in Supabase dashboard
- [ ] Deep linking configured for password reset
- [ ] Password reset screen created

## Risk Analysis & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Email verification emails go to spam | High | Add SPF/DKIM records, use custom SMTP |
| Users forget passwords frequently | Medium | Prominent "Forgot Password?" link |
| Deep linking fails on some devices | Medium | Fallback to web-based reset flow |
| Password reset tokens expire too quickly | Low | Use 24-hour expiry (Supabase default) |
| Weak passwords compromise accounts | High | Enforce 8+ chars, consider strength meter |

## Success Metrics

- [ ] Email/password authentication works end-to-end
- [ ] Error messages are clear and actionable
- [ ] Email verification flow completes successfully
- [ ] Password reset flow completes successfully
- [ ] No console errors or warnings
- [ ] Matches UX of reference apps (Instagram, Airbnb)

## Future Considerations

**Not in this phase:**
- Password strength meter (visual indicator)
- "Remember me" toggle
- Biometric authentication (Face ID, Touch ID)
- Two-factor authentication (2FA)
- Social account linking (connect Google to email account)

## References & Research

### Internal References
- Authentication context: src/lib/authContext.js:1-100
- Existing auth UI: src/screens/HostAuthScreen.js:1-200
- Form validation patterns: src/screens/NameScreen.js:1-150
- Form state management: src/screens/CreateEventScreen.js:1-300

### External References
- Supabase Auth Docs: https://supabase.com/docs/guides/auth/auth-email
- Supabase Password Reset: https://supabase.com/docs/guides/auth/auth-password-reset
- Expo Deep Linking: https://docs.expo.dev/guides/linking/
- React Native TextInput: https://reactnative.dev/docs/textinput

### Design Inspiration
- Instagram authentication flow (single screen toggle)
- Airbnb sign-up/sign-in (email-first approach)
- Modern apps: Bumble, Hinge (password visibility toggle)

---

**Plan Created:** 2026-03-08
**Ready for Implementation:** Pending user approval
