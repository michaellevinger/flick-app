import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChatMessages } from '../useChatMessages';

jest.mock('../../lib/chatService', () => ({
  fetchMessages: jest.fn(() => Promise.resolve([])),
  subscribeToMessages: jest.fn(() => ({ unsubscribe: jest.fn() })),
  sendTextMessage: jest.fn(),
  sendImageMessage: jest.fn(),
  getMessageCount: jest.fn(() => Promise.resolve(0)),
}));

jest.mock('../../lib/matchService', () => ({
  markMessagesAsRead: jest.fn(() => Promise.resolve()),
}));

import { fetchMessages, sendTextMessage, getMessageCount } from '../../lib/chatService';
import { Alert } from 'react-native';

const MATCH_ID = 'user_a|user_b';
const USER_ID = 'user_a';
const OTHER_ID = 'user_b';

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  fetchMessages.mockResolvedValue([]);
  getMessageCount.mockResolvedValue(0);
});

describe('useChatMessages — loading', () => {
  it('starts in loading state and transitions to loaded', async () => {
    const { result } = renderHook(() => useChatMessages(MATCH_ID, USER_ID, OTHER_ID));

    expect(result.current.loading).toBe(true);

    await act(async () => {});

    expect(result.current.loading).toBe(false);
  });

  it('populates messages from fetchMessages on mount', async () => {
    const stored = [
      { id: 'msg_1', content: 'Hello', sender_id: OTHER_ID, created_at: '2026-01-01T10:00:00Z' },
      { id: 'msg_2', content: 'Hi!', sender_id: USER_ID, created_at: '2026-01-01T10:01:00Z' },
    ];
    fetchMessages.mockResolvedValue([...stored].reverse()); // DB returns newest first

    const { result } = renderHook(() => useChatMessages(MATCH_ID, USER_ID, OTHER_ID));
    await act(async () => {});

    expect(result.current.messages).toHaveLength(2);
  });
});

describe('useChatMessages — optimistic updates', () => {
  it('adds an optimistic placeholder immediately before the API call resolves', async () => {
    let resolveApi;
    sendTextMessage.mockReturnValue(new Promise((res) => { resolveApi = res; }));

    const { result } = renderHook(() => useChatMessages(MATCH_ID, USER_ID, OTHER_ID));
    await act(async () => {});

    act(() => {
      result.current.handleSendText('Hello!');
    });

    // The optimistic message should be in the list before the API responds
    expect(result.current.messages.some((m) => m.content === 'Hello!' && m.sending === true)).toBe(true);

    // Resolve the API
    const confirmed = { id: 'msg_real', content: 'Hello!', sender_id: USER_ID, sending: false };
    await act(async () => { resolveApi(confirmed); });

    // The placeholder should now be replaced by the confirmed message
    expect(result.current.messages.some((m) => m.sending === true)).toBe(false);
    expect(result.current.messages.some((m) => m.id === 'msg_real')).toBe(true);
  });

  it('removes the optimistic placeholder if the API call fails', async () => {
    sendTextMessage.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useChatMessages(MATCH_ID, USER_ID, OTHER_ID));
    await act(async () => {});

    await act(async () => {
      await result.current.handleSendText('This will fail');
    });

    // No messages should remain after a failure
    expect(result.current.messages.filter((m) => m.content === 'This will fail')).toHaveLength(0);
  });
});

describe('useChatMessages — message limit', () => {
  it('shows an alert and does not send when the user has reached MESSAGE_LIMIT (10)', async () => {
    getMessageCount.mockImplementation((_, senderId) =>
      senderId === USER_ID ? Promise.resolve(10) : Promise.resolve(0)
    );

    const { result } = renderHook(() => useChatMessages(MATCH_ID, USER_ID, OTHER_ID));
    await act(async () => {});

    await act(async () => {
      await result.current.handleSendText('Over the limit');
    });

    expect(sendTextMessage).not.toHaveBeenCalled();
    expect(Alert.alert).toHaveBeenCalled();
  });

  it('allows sending when the user is under the message limit', async () => {
    getMessageCount.mockResolvedValue(0);
    sendTextMessage.mockResolvedValue({ id: 'msg_ok', content: 'Fine', sender_id: USER_ID });

    const { result } = renderHook(() => useChatMessages(MATCH_ID, USER_ID, OTHER_ID));
    await act(async () => {});

    await act(async () => {
      await result.current.handleSendText('Fine');
    });

    expect(sendTextMessage).toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });
});
