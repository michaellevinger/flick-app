# Chat Feature Documentation

## Overview

The chat feature enables real-time messaging between mutually matched users (users who have flicked each other). Messages are ephemeral with a 20-minute TTL to maintain the app's privacy-first philosophy.

## Features

- **Real-time messaging** via Supabase subscriptions
- **Text messages** with rich formatting
- **Image sharing** via camera or gallery
- **Location sharing** with GPS coordinates
- **Emoji reactions** to messages (UI ready, implementation in progress)
- **20-minute message TTL** - auto-deletion for privacy
- **Unread badges** on Matches tab
- **Match creation trigger** - automatic on mutual flicks

## Database Schema

### Tables

#### `matches`
Tracks mutual flicks and chat metadata.

```sql
CREATE TABLE matches (
  id TEXT PRIMARY KEY,                    -- Format: "user1_id|user2_id" (alphabetically sorted)
  user1_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user2_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count_user1 INTEGER DEFAULT 0,
  unread_count_user2 INTEGER DEFAULT 0,
  UNIQUE(user1_id, user2_id)
);
```

#### `messages`
Stores all chat messages with 20-minute expiration.

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id TEXT NOT NULL,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  recipient_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL,              -- 'text', 'image', 'location', 'emoji_reaction'
  content TEXT,                            -- Text or JSON data
  image_url TEXT,                          -- Supabase Storage URL
  location GEOGRAPHY(POINT, 4326),         -- PostGIS location
  reaction_to_message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '20 minutes')
);
```

### SQL Functions

#### `get_match_id(user_a, user_b)`
Generates a consistent match ID by alphabetically sorting user IDs.

#### `create_match_on_mutual_flick()`
Trigger function that automatically creates a match record when mutual flicks are detected.

#### `delete_expired_messages()`
Deletes all messages past their 20-minute TTL. Called by Edge Function every 5 minutes.

## Architecture

### File Structure

```
src/
├── lib/
│   ├── messages.js          # Message operations (send, fetch, subscribe)
│   └── matchesContext.js    # React Context for matches state
├── screens/
│   ├── MatchesScreen.js     # List of active chat conversations
│   └── ChatScreen.js        # Individual chat conversation
└── components/
    ├── MessageBubble.js     # Individual message display
    ├── MessageInput.js      # Text/media input component
    └── MatchCard.js         # Match list item
```

### Key Functions (`src/lib/messages.js`)

- **`getMatchId(userId1, userId2)`** - Generate match ID
- **`sendTextMessage(senderId, recipientId, content)`** - Send text
- **`sendImageMessage(senderId, recipientId, imageUri)`** - Upload & send image
- **`sendLocationMessage(senderId, recipientId, location)`** - Send GPS coordinates
- **`sendEmojiReaction(senderId, recipientId, messageId, emoji)`** - React to message
- **`fetchMessages(matchId, limit)`** - Get message history
- **`fetchMatches(userId)`** - Get all active matches
- **`subscribeToMessages(matchId, callback)`** - Real-time updates
- **`subscribeToMatches(userId, callback)`** - New match notifications
- **`markMessagesAsRead(matchId, userId)`** - Reset unread count

## Navigation

The app uses a hybrid navigation structure:

```
Stack Navigator (Root)
├── QRScanner (Onboarding)
├── Camera (Onboarding)
├── Setup (Onboarding)
├── Dashboard (Tab Navigator)
│   ├── DashboardTab (Radar)
│   └── MatchesTab (Chat List)
├── Chat (Modal)
├── GreenLight (Modal)
└── Vault (Modal)
```

## User Flow

1. **Match Creation**
   - User A flicks User B
   - User B flicks User A back
   - Trigger fires → Match record created automatically
   - Both users see Green Light screen

2. **Starting a Chat**
   - From Green Light screen: Tap "Start Chat" button
   - From Matches tab: Tap any match in the list
   - Opens ChatScreen with full conversation

3. **Sending Messages**
   - **Text**: Type and tap "Send"
   - **Image**: Tap camera icon → Choose camera/gallery → Send
   - **Location**: Tap location icon → Auto-sends current GPS
   - **Reaction**: Long-press message → Select emoji (in progress)

4. **Message Lifecycle**
   - Message created with `expires_at = NOW() + 20 minutes`
   - Displayed in chat until expiration
   - Deleted by Edge Function cleanup (runs every 5 minutes)

5. **Distance-Based Dissolution**
   - Heartbeat checks distance to all matches every 60s
   - If distance > 500m:
     - Delete both flicks
     - Delete match record
     - Messages cascade-deleted
     - Chat becomes inaccessible

## Real-Time Updates

### Message Subscriptions
Each open chat subscribes to new messages for that `match_id`:

```javascript
subscribeToMessages(matchId, (newMessage) => {
  // Append to message list
  // Auto-scroll to bottom
  // Mark as read
});
```

### Match Subscriptions
MatchesContext subscribes to new matches for the current user:

```javascript
subscribeToMatches(userId, (newMatch) => {
  // Reload matches list
  // Update unread count
});
```

## Unread Count System

- **Increment**: When a message is sent, recipient's unread count increases
- **Decrement**: When ChatScreen is opened/focused, unread count resets to 0
- **Badge**: Matches tab shows total unread count across all matches

## Storage

### Supabase Storage Bucket: `chat-images`
- **Public**: Yes (URLs accessible without auth)
- **File naming**: `{matchId}_{timestamp}.jpg`
- **Upload**: Base64 encoding via `expo-file-system`
- **Cleanup**: Images deleted when parent message expires

## Privacy & Security

- **Ephemeral Messages**: 20-minute TTL enforced
- **No Message History**: Old messages automatically purged
- **Distance-Based Cleanup**: Matches dissolve when users separate
- **Anonymous Sessions**: No persistent chat logs
- **Cascade Deletion**: User deletion removes all messages

## Edge Function Integration

The existing `auto-cleanup` Edge Function now includes message cleanup:

```typescript
// Clean up expired messages
const { data: deletedMessages } = await supabase.rpc('delete_expired_messages');
```

**Schedule**: Runs every 5 minutes via pg_cron.

## Testing Checklist

### Match Creation
- [ ] User A flicks B, B flicks A → Match appears in both Matches tabs
- [ ] Match ID is consistent (alphabetically sorted)
- [ ] Green Light screen shows "Start Chat" button

### Text Messaging
- [ ] Send text → Appears instantly in recipient's chat
- [ ] Sender messages appear on right (rose background)
- [ ] Recipient messages appear on left (gray background)
- [ ] Timestamps display correctly

### Unread Count
- [ ] Send message → Unread badge increments
- [ ] Open chat → Badge clears
- [ ] Total unread count shows on Matches tab badge

### Image Sharing
- [ ] Tap camera icon → Camera/gallery options
- [ ] Take photo → Uploads → Displays in chat
- [ ] Choose from library → Uploads → Displays in chat
- [ ] Tap image → Opens full-screen preview

### Location Sharing
- [ ] Tap location icon → Sends current GPS
- [ ] Location displays with coordinates
- [ ] Tap location → Shows on map (future enhancement)

### 20-Minute TTL
- [ ] Wait 20+ minutes → Messages auto-delete
- [ ] Edge Function cleanup runs every 5 minutes
- [ ] Chat shows "no messages" after cleanup

### Distance Dissolution
- [ ] Move >500m apart → Match dissolves
- [ ] Chat becomes inaccessible
- [ ] Messages cascade-deleted

### Logout
- [ ] User logs out → All matches deleted
- [ ] All messages cascade-deleted

## Future Enhancements

- [ ] **Push Notifications** - Notify when new message arrives
- [ ] **End-to-End Encryption** - Encrypted message content
- [ ] **Voice Messages** - Audio recording/playback
- [ ] **Read Receipts** - Show when messages are read
- [ ] **Typing Indicators** - "User is typing..." status
- [ ] **GIF Support** - Send animated GIFs
- [ ] **Message Editing** - Edit sent messages (before expiration)
- [ ] **Message Deletion** - Manual message deletion
- [ ] **Link Previews** - Rich previews for shared URLs

## Performance Considerations

- **Message Pagination**: Currently loads last 50 messages (configurable)
- **Image Compression**: Quality set to 0.7 to reduce upload size
- **Real-time Subscriptions**: One per open chat (cleaned up on unmount)
- **Database Indexes**: All key queries indexed for performance

## Known Limitations

- **Emoji Reactions**: UI ready but not fully implemented (long-press handler exists)
- **No Thread History**: Messages >20 minutes old are permanently deleted
- **No Offline Support**: Messages require active connection
- **Single Device**: No sync across multiple devices (session-based)

## Deployment Notes

1. **Run SQL Schema**: Execute chat section of `supabase-setup.sql`
2. **Create Storage Bucket**: Create `chat-images` bucket in Supabase dashboard
3. **Deploy Edge Function**: Updated `auto-cleanup` includes message deletion
4. **Test Real-time**: Verify Supabase Realtime is enabled for `matches` and `messages` tables

## Support

For issues or questions:
- Check Supabase logs for Edge Function errors
- Verify Realtime subscriptions are active
- Test with 2 devices/simulators for real-time behavior
- Check PostGIS extension is enabled for location features
