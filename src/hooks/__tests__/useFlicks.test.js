import { renderHook, act } from '@testing-library/react-native';
import { useFlicks } from '../useFlicks';

jest.mock('../../lib/flicks', () => ({
  sendFlick: jest.fn(),
  checkMutualMatch: jest.fn(),
  subscribeToFlicks: jest.fn(() => ({ unsubscribe: jest.fn() })),
  getFlicksSentByUser: jest.fn(() => Promise.resolve([])),
  getFlicksForUser: jest.fn(() => Promise.resolve([])),
  deleteFlick: jest.fn(),
  createMatch: jest.fn(() => Promise.resolve()),
  getMatchedUserInfo: jest.fn(),
}));

import {
  sendFlick,
  checkMutualMatch,
  deleteFlick,
  getFlicksSentByUser,
  getFlicksForUser,
  createMatch,
} from '../../lib/flicks';
import { Alert } from 'react-native';

const mockNavigation = { navigate: jest.fn() };

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  sendFlick.mockResolvedValue({ success: true });
  checkMutualMatch.mockResolvedValue(false);
  getFlicksSentByUser.mockResolvedValue([]);
  getFlicksForUser.mockResolvedValue([]);
});

describe('useFlicks — flick rules', () => {
  it('allows a male to flick a female first (no restriction on flicking)', async () => {
    const user = { id: 'user_male', gender: 'male', lookingFor: 'female' };
    const target = { id: 'user_female', gender: 'female', lookingFor: 'male' };
    const { result } = renderHook(() => useFlicks(user, mockNavigation));

    await act(async () => {
      await result.current.handleFlick(target);
    });

    expect(sendFlick).toHaveBeenCalledWith(user.id, target.id);
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('allows a female to flick a male first', async () => {
    const user = { id: 'user_female', gender: 'female', lookingFor: 'male' };
    const target = { id: 'user_male', gender: 'male', lookingFor: 'female' };
    const { result } = renderHook(() => useFlicks(user, mockNavigation));

    await act(async () => {
      await result.current.handleFlick(target);
    });

    expect(sendFlick).toHaveBeenCalledWith(user.id, target.id);
  });
});

describe('useFlicks — flick state management', () => {
  it('adds a successfully flicked user to the flickedUsers set', async () => {
    const user = { id: 'user_a', gender: 'female', lookingFor: 'male' };
    const target = { id: 'user_b', gender: 'male', lookingFor: 'female' };
    const { result } = renderHook(() => useFlicks(user, mockNavigation));

    await act(async () => {
      await result.current.handleFlick(target);
    });

    expect(result.current.flickedUsers.has(target.id)).toBe(true);
  });

  it('removes a user from flickedUsers when unflicking', async () => {
    const user = { id: 'user_a', gender: 'female', lookingFor: 'male' };
    const target = { id: 'user_b', gender: 'male', lookingFor: 'female' };
    deleteFlick.mockResolvedValue();

    const { result } = renderHook(() => useFlicks(user, mockNavigation));

    await act(async () => {
      await result.current.handleFlick(target);
    });
    expect(result.current.flickedUsers.has(target.id)).toBe(true);

    await act(async () => {
      await result.current.handleFlick(target);
    });
    expect(result.current.flickedUsers.has(target.id)).toBe(false);
    expect(deleteFlick).toHaveBeenCalledWith(user.id, target.id);
  });

  it('navigates to GreenLight when the flick creates a mutual match', async () => {
    const user = { id: 'user_a', gender: 'female', lookingFor: 'male' };
    const target = { id: 'user_b', gender: 'male', lookingFor: 'female' };
    checkMutualMatch.mockResolvedValue(true);

    const { result } = renderHook(() => useFlicks(user, mockNavigation));

    await act(async () => {
      await result.current.handleFlick(target);
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('GreenLight', { matchedUser: target });
    expect(createMatch).toHaveBeenCalledWith(user.id, target.id);
  });

  it('does not navigate to GreenLight when the match is not mutual', async () => {
    const user = { id: 'user_a', gender: 'female', lookingFor: 'male' };
    const target = { id: 'user_b', gender: 'male', lookingFor: 'female' };
    checkMutualMatch.mockResolvedValue(false);

    const { result } = renderHook(() => useFlicks(user, mockNavigation));

    await act(async () => {
      await result.current.handleFlick(target);
    });

    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});
