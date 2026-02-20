---
title: Add Number Exchange Request Button to Chat
type: feat
status: active
date: 2026-02-20
---

# Add Number Exchange Request Button to Chat

## Overview

Integrate the existing vault/number exchange system into the chat interface. Add a "Request Number" button in the message input area that becomes available after users exchange messages, and show a modal prompt when the 10-message limit is reached. Numbers are only revealed after mutual consent (both users request).

## Problem Statement / Motivation

**Current State:**
- Vault system fully implemented (`vault.js`, `VaultScreen.js`, exchanges table)
- No way for users to initiate number exchange from chat
- 10-message limit encourages meetup but doesn't provide a clear next step

**Why This Matters:**
- After 10 messages, users are blocked but have no clear path to exchange contact info
- Existing vault infrastructure is unused because there's no trigger point
- Users want to move off-app but need a privacy-preserving way to exchange numbers

**User Flow Gap:**
1. ✅ Match happens (flick/green light works)
2. ✅ Chat for 10 messages (limit enforced)
3. ❌ **MISSING:** No way to request number exchange
4. ✅ Vault screen works (if they could get there)

## Proposed Solution

### High-Level Approach

**Add 3 touchpoints for number exchange:**

1. **"Request Number" Button** in message input area (next to camera icon)
   - Visible when user has sent 5+ messages (50% of limit)
   - Styled as phone icon button: 📞
   - Opens confirmation dialog

2. **Modal Prompt** after 10 messages reached
   - Shows automatically when either user hits limit
   - "You've reached the message limit. Request [Name]'s number to continue?"
   - Buttons: "Not Now" / "Request Number"

3. **System Messages** in chat feed
   - "You requested [Name]'s number"
   - "[Name] wants to exchange numbers" (with Accept/Decline buttons)
   - "Number exchange accepted! Check your vault"
   - Styled as centered, gray text

### User Flow

```
User A sends 10th message
  ↓
Modal appears: "Request [User B]'s number?"
  ↓
User A taps "Request Number"
  ↓
System message appears in both chats: "[User A] requested your number"
  ↓
User B sees alert: "Accept exchange?" [Decline] [Accept]
  ↓
[If Accept] Both navigate to VaultScreen
  ↓
15-minute countdown starts, numbers visible
  ↓
After expiration or >100m distance → numbers deleted
```

## Technical Approach

### Architecture

**Components Modified:**
1. `ChatScreen.js` - Add subscription, request logic, modal
2. `MessageInput.js` - Add phone button
3. `MessageBubble.js` - Render system messages
4. `messages.js` - Add `sendSystemMessage()` function
5. `supabase-setup.sql` - Add 'system' to message_type enum

**Components Reused (No Changes):**
6. `vault.js` - Complete business logic ✅
7. `VaultScreen.js` - Display screen ✅
8. Exchanges database schema ✅

### Implementation Phases

#### Phase 1: Database Schema Update ✅

**File:** `supabase-setup.sql`

Add 'system' message type to enum constraint:

```sql
-- Line 147 (current):
message_type TEXT CHECK (message_type IN ('text', 'image', 'location', 'emoji_reaction')),

-- Update to:
message_type TEXT CHECK (message_type IN ('text', 'image', 'location', 'emoji_reaction', 'system')),
```

Run migration in Supabase SQL Editor.

#### Phase 2: System Message Rendering ✅

**File:** `src/components/MessageBubble.js`

Add new message type handler (lines 30-70):

```javascript
const renderContent = () => {
  switch (message.message_type) {
    // ... existing cases ...

    case 'system':
      return (
        <View style={styles.systemMessageContainer}>
          <Text style={styles.systemMessageText}>{message.content}</Text>
          {message.metadata?.buttons && (
            <View style={styles.systemButtonsContainer}>
              <TouchableOpacity
                style={styles.declineButton}
                onPress={() => onSystemAction?.('decline', message)}
              >
                <Text style={styles.declineButtonText}>Decline</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.acceptButton}
                onPress={() => onSystemAction?.('accept', message)}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      );
  }
};
```

**Styles to add:**

```javascript
systemMessageContainer: {
  alignSelf: 'center',
  paddingVertical: SPACING.sm,
},
systemMessageText: {
  ...TYPOGRAPHY.caption,
  color: COLORS.gray,
  textAlign: 'center',
  fontStyle: 'italic',
},
systemButtonsContainer: {
  flexDirection: 'row',
  marginTop: SPACING.sm,
  gap: SPACING.sm,
},
acceptButton: {
  backgroundColor: COLORS.purple,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.sm,
  borderRadius: 16,
},
declineButton: {
  backgroundColor: COLORS.gray,
  paddingHorizontal: SPACING.md,
  paddingVertical: SPACING.sm,
  borderRadius: 16,
},
acceptButtonText: {
  color: COLORS.white,
  fontWeight: '600',
},
declineButtonText: {
  color: COLORS.white,
  fontWeight: '600',
},
```

#### Phase 3: Add System Message Function ✅

**File:** `src/lib/messages.js`

Add new function after `sendImageMessage()`:

```javascript
/**
 * Send a system message (for number exchange, etc.)
 */
export async function sendSystemMessage(matchId, content, metadata = null) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: null, // System messages have no sender
        recipient_id: null,
        message_type: 'system',
        content: content.trim(),
        metadata: metadata, // Store buttons, exchange_id, etc.
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending system message:', error);
    throw error;
  }
}
```

Export in module.exports.

#### Phase 4: Add Phone Button to Message Input ✅

**File:** `src/components/MessageInput.js`

Add phone button next to camera button (line 100):

```javascript
export default function MessageInput({
  onSendText,
  onSendImage,
  onRequestNumber, // NEW PROP
  disabled = false,
  messageCount = 0, // NEW PROP - to show/hide button
}) {
  // ... existing code ...

  const showPhoneButton = messageCount >= 5; // Show after 5 messages

  return (
    <View style={[styles.container, ...]}>
      {/* Camera Button */}
      <TouchableOpacity ... />

      {/* Phone Button - NEW */}
      {showPhoneButton && (
        <TouchableOpacity
          style={styles.iconButton}
          onPress={onRequestNumber}
          disabled={sending || disabled}
        >
          <Text style={styles.iconText}>📞</Text>
        </TouchableOpacity>
      )}

      {/* Text Input */}
      <TextInput ... />

      {/* Send Button */}
      <TouchableOpacity ... />
    </View>
  );
}
```

No style changes needed - reuse `iconButton` style.

#### Phase 5: Chat Integration - Request Logic ✅

**File:** `src/screens/ChatScreen.js`

Add imports (line 15):

```javascript
import {
  requestNumberExchange,
  subscribeToExchanges,
  acceptExchangeRequest,
  declineExchangeRequest,
  getUserPhoneNumber,
} from '../lib/vault';
import { sendSystemMessage } from '../lib/messages';
```

Add state (line 32):

```javascript
const [exchangeRequest, setExchangeRequest] = useState(null);
```

Add subscription (after line 58):

```javascript
// Subscribe to exchange requests
useEffect(() => {
  if (!user) return;

  const exchangeSub = subscribeToExchanges(user.id, async (exchangeUpdate) => {
    if (exchangeUpdate.status === 'pending') {
      // Someone requested your number
      setExchangeRequest(exchangeUpdate);

      // Show alert
      Alert.alert(
        'Number Exchange Request',
        `${otherUser.name} wants to exchange phone numbers. Accept?`,
        [
          {
            text: 'Decline',
            style: 'cancel',
            onPress: () => handleDeclineExchange(exchangeUpdate.id),
          },
          {
            text: 'Accept',
            onPress: () => handleAcceptExchange(exchangeUpdate.id),
          },
        ]
      );
    }

    if (exchangeUpdate.status === 'accepted') {
      // Exchange accepted - navigate to vault
      Alert.alert(
        'Exchange Accepted!',
        'Check your vault to see phone numbers.',
        [
          {
            text: 'View Vault',
            onPress: () => navigation.navigate('Vault'),
          },
        ]
      );
    }
  });

  return () => {
    exchangeSub?.unsubscribe();
  };
}, [user]);
```

Add request handler (after `handleSendImage`):

```javascript
const handleRequestNumber = async () => {
  if (!user) return;

  // Check if user has phone number set
  const myPhone = await getUserPhoneNumber(user.id);

  if (!myPhone) {
    Alert.alert(
      'Phone Number Required',
      'Please add your phone number in profile settings first.',
      [{ text: 'OK' }]
    );
    return;
  }

  // Confirm request
  Alert.alert(
    'Request Phone Number?',
    `Ask ${otherUser.name} to exchange phone numbers?`,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Request',
        onPress: async () => {
          try {
            // Get their phone number (if they have one)
            const theirPhone = await getUserPhoneNumber(otherUser.id);

            if (!theirPhone) {
              Alert.alert(
                'Cannot Request',
                `${otherUser.name} hasn't set a phone number yet.`,
                [{ text: 'OK' }]
              );
              return;
            }

            // Create exchange request
            const result = await requestNumberExchange(
              user.id,
              otherUser.id,
              myPhone,
              theirPhone
            );

            if (result.alreadyExists) {
              Alert.alert(
                'Request Pending',
                'You already have a pending exchange request.',
                [{ text: 'OK' }]
              );
              return;
            }

            // Send system message to both chats
            await sendSystemMessage(
              matchId,
              `${user.name} requested to exchange phone numbers`,
              { type: 'exchange_request', exchange_id: result.exchange.id }
            );

            Alert.alert(
              'Request Sent',
              `Waiting for ${otherUser.name} to accept.`,
              [{ text: 'OK' }]
            );
          } catch (error) {
            console.error('Error requesting number exchange:', error);
            Alert.alert('Error', 'Failed to send request. Please try again.');
          }
        },
      },
    ]
  );
};

const handleAcceptExchange = async (exchangeId) => {
  try {
    await acceptExchangeRequest(exchangeId);

    // Send system message
    await sendSystemMessage(
      matchId,
      'Number exchange accepted! Check your vault.',
      { type: 'exchange_accepted' }
    );

    // Navigate to vault
    navigation.navigate('Vault');
  } catch (error) {
    console.error('Error accepting exchange:', error);
    Alert.alert('Error', 'Failed to accept. Please try again.');
  }
};

const handleDeclineExchange = async (exchangeId) => {
  try {
    await declineExchangeRequest(exchangeId);

    // Send system message
    await sendSystemMessage(
      matchId,
      'Number exchange declined.',
      { type: 'exchange_declined' }
    );

    setExchangeRequest(null);
  } catch (error) {
    console.error('Error declining exchange:', error);
  }
};
```

Add modal prompt when limit reached (after line 322):

```javascript
{/* Show modal when message limit reached */}
{myMessageCount >= MESSAGE_LIMIT && !exchangeRequest && (
  <Modal
    visible={true}
    transparent
    animationType="fade"
  >
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Message Limit Reached</Text>
        <Text style={styles.modalText}>
          You've sent {MESSAGE_LIMIT} messages.{'\n'}
          Request {otherUser.name}'s number to continue?
        </Text>
        <View style={styles.modalButtons}>
          <TouchableOpacity
            style={styles.modalButtonSecondary}
            onPress={() => {/* close modal */}}
          >
            <Text style={styles.modalButtonTextSecondary}>Not Now</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.modalButtonPrimary}
            onPress={() => {
              /* close modal */
              handleRequestNumber();
            }}
          >
            <Text style={styles.modalButtonText}>Request Number</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
)}
```

Update MessageInput call (line 343):

```javascript
<MessageInput
  onSendText={handleSendText}
  onSendImage={handleSendImage}
  onRequestNumber={handleRequestNumber} // NEW
  disabled={myMessageCount >= MESSAGE_LIMIT}
  messageCount={myMessageCount} // NEW
/>
```

Add modal styles:

```javascript
modalOverlay: {
  flex: 1,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  justifyContent: 'center',
  alignItems: 'center',
},
modalContent: {
  backgroundColor: COLORS.white,
  borderRadius: 16,
  padding: SPACING.xl,
  marginHorizontal: SPACING.xl,
  alignItems: 'center',
},
modalTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: COLORS.black,
  marginBottom: SPACING.sm,
},
modalText: {
  fontSize: 16,
  color: COLORS.gray,
  textAlign: 'center',
  marginBottom: SPACING.xl,
  lineHeight: 22,
},
modalButtons: {
  flexDirection: 'row',
  gap: SPACING.md,
},
modalButtonPrimary: {
  backgroundColor: COLORS.purple,
  paddingHorizontal: SPACING.xl,
  paddingVertical: SPACING.md,
  borderRadius: 24,
},
modalButtonSecondary: {
  backgroundColor: COLORS.grayLight,
  paddingHorizontal: SPACING.xl,
  paddingVertical: SPACING.md,
  borderRadius: 24,
},
modalButtonText: {
  color: COLORS.white,
  fontWeight: '600',
  fontSize: 16,
},
modalButtonTextSecondary: {
  color: COLORS.gray,
  fontWeight: '600',
  fontSize: 16,
},
```

## Acceptance Criteria

### Functional Requirements

- [ ] Phone button (📞) appears in message input after user sends 5+ messages
- [ ] Tapping phone button opens confirmation: "Request [Name]'s number?"
- [ ] If user has no phone number, show error: "Please add phone number in settings"
- [ ] If other user has no phone number, show: "[Name] hasn't set a phone number yet"
- [ ] Modal automatically appears when either user reaches 10 messages
- [ ] Modal shows: "Request [Name]'s number to continue?" with "Not Now" / "Request Number"
- [ ] System message appears in chat: "[Name] requested to exchange phone numbers"
- [ ] Receiver sees Alert: "Accept exchange?" with Decline/Accept buttons
- [ ] On Accept: Both users navigate to VaultScreen
- [ ] On Decline: System message shows "Exchange declined"
- [ ] System messages are centered, gray, non-interactive (except request message with buttons)
- [ ] Real-time: Requests appear immediately via subscription
- [ ] Only works between matched users (not possible before match)

### Non-Functional Requirements

- [ ] Phone button disabled when message limit reached
- [ ] No duplicate exchange requests (check for existing pending)
- [ ] Handles race conditions (both users request simultaneously)
- [ ] Graceful error handling for network failures
- [ ] Works offline (queues request when back online)
- [ ] Numbers never stored permanently in messages table

### Quality Gates

- [ ] Test with 2 real devices (iOS/Android mix)
- [ ] Test request while offline, then reconnect
- [ ] Test simultaneous requests from both users
- [ ] Verify numbers appear in Vault after acceptance
- [ ] Verify 15-minute countdown starts correctly
- [ ] Code reviewed against existing patterns

## Success Metrics

**Engagement:**
- % of users who reach 10-message limit
- % of users who request number exchange
- % of requests that are accepted vs declined
- Average time from match → number exchange

**Technical:**
- Real-time delivery < 2 seconds
- Zero duplicate exchange records
- Zero crashes from modal interactions

## Dependencies & Prerequisites

**Database:**
- [ ] Run SQL migration to add 'system' message type
- [ ] Verify exchanges table has all columns (should be complete)

**Prerequisites:**
- [ ] User must have phone_number field populated
- [ ] Both users must be matched (mutual flick)
- [ ] Chat must be active (not unmatched)

**No External Dependencies** - All infrastructure exists.

## Risk Analysis & Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Users spam requests | Medium | Low | Rate limit: 1 request per 5 minutes |
| Both users request simultaneously | Low | Medium | Database UNIQUE constraint prevents duplicates |
| Phone numbers not set | High | High | Check before allowing request, show helpful error |
| Modal blocks UI | Medium | Low | Dismissible with "Not Now" button |
| Real-time subscription fails | High | Low | Fallback: Poll every 10 seconds for pending exchanges |

## Technical Considerations

### Database Schema Changes

**Migration Required:**

```sql
-- Update message_type enum
ALTER TABLE messages
DROP CONSTRAINT IF EXISTS messages_message_type_check;

ALTER TABLE messages
ADD CONSTRAINT messages_message_type_check
CHECK (message_type IN ('text', 'image', 'location', 'emoji_reaction', 'system'));

-- Add metadata column for system messages (if doesn't exist)
ALTER TABLE messages
ADD COLUMN IF NOT EXISTS metadata JSONB;
```

### Performance Considerations

- System messages don't count toward 10-message limit
- Real-time subscription adds minimal overhead (~50 bytes per event)
- Modal renders only when condition met (not always in tree)

### Security Considerations

- Validate matchId before allowing exchange request
- Verify both users are in the match (prevent spoofing)
- Phone numbers encrypted in transit (HTTPS)
- Numbers deleted after 15 minutes (handled by existing vault system)

## Implementation Files

### Modified Files

1. **src/screens/ChatScreen.js** (~150 new lines)
   - Add exchange subscription
   - Add request/accept/decline handlers
   - Add modal for 10-message prompt
   - Pass props to MessageInput

2. **src/components/MessageInput.js** (~20 new lines)
   - Add phone button
   - Add onRequestNumber prop
   - Conditionally show based on messageCount

3. **src/components/MessageBubble.js** (~80 new lines)
   - Add system message rendering case
   - Add styles for system messages
   - Add Accept/Decline button styles

4. **src/lib/messages.js** (~30 new lines)
   - Add sendSystemMessage() function
   - Export in module

5. **supabase-setup.sql** (~5 lines)
   - Add 'system' to message_type enum
   - Add metadata column

### Reused Files (No Changes)

- ✅ `src/lib/vault.js` - Complete
- ✅ `src/screens/VaultScreen.js` - Complete
- ✅ Exchanges database schema - Complete

**Total Implementation Effort:** ~285 new lines across 5 files.

## References & Research

### Internal References

- Exchange system: `src/lib/vault.js` (lines 1-262)
- Vault UI: `src/screens/VaultScreen.js` (lines 20-272)
- Message limit: `src/screens/ChatScreen.js:29` (MESSAGE_LIMIT = 10)
- Alert pattern: `src/components/MessageInput.js:45` (action sheets)
- Modal pattern: `src/components/MessageBubble.js:107-126` (full-screen modals)
- Real-time subscriptions: `src/screens/ChatScreen.js:85-112`

### Documentation

- NUMBER_EXCHANGE_SETUP.md - Complete flow specification
- CHAT_SETUP.md - Real-time patterns and match creation
- TESTING_CHECKLIST.md - Scenario 5 (Number Exchange flow)

### Related Work

- Vault infrastructure: ✅ Complete
- 10-message limit: ✅ Complete (commit 4ea1610)
- System messages: ❌ Not implemented (this plan)
- Phone number field in users: ✅ Complete

---

**Ready for Implementation** - All dependencies met, patterns documented, vault system complete. This plan integrates existing infrastructure with minimal new code.
