import { renderHook, act } from '@testing-library/react-native';
import { useFlicks } from '../useFlicks';

// Mock the flick service module
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

jest.mock('../../lib/tips', () => ({
  hasSeenTip: jest.fn(() => Promise.resolve(false)),
  markTipSeen: jest.fn(() => Promise.resolve()),
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

const makeMaleUser = () => ({
  id: 'user_male',
  gender: 'male',
  lookingFor: 'female',
});

const makeFemaleUser = () => ({
  id: 'user_female',
  gender: 'female',
  lookingFor: 'male',
});

const makeTarget = (gender = 'female') => ({
  id: 'user_target',
  gender,
  lookingFor: 'male',
});

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  sendFlick.mockResolvedValue({ success: true });
  checkMutualMatch.mockResolvedValue(false);
  getFlicksSentByUser.mockResolvedValue([]);
  getFlicksForUser.mockResolvedValue([]);
});

describe('useFlicks — gender rules (ladies first)', () => {
  it('blocks a straight male from flicking a female who has not flicked him first', async () => {
    const user = makeMaleUser();
    const onAdvance = jest.fn();
    const { result } = renderHook(() => useFlicks(user, mockNavigation, onAdvance));

    // Female target who has NOT flicked the male yet
    const femaleTarget = makeTarget('female');

    await act(async () => {
      await result.current.handleFlick(femaleTarget);
    });

    // sendFlick must NOT have been called — the gender rule blocked it
    expect(sendFlick).not.toHaveBeenCalled();
    // The Alert should have been shown (ladies-first tip, first time seeing it)
    expect(Alert.alert).toHaveBeenCalledTimes(1);
  });

  it('allows a straight male to flick a female once she has flicked him first', async () => {
    const user = makeMaleUser();
    // Pre-populate: the female already flicked the male
    getFlicksForUser.mockResolvedValue([{ from_user_id: 'user_target' }]);
    checkMutualMatch.mockResolvedValue(true);

    const { result } = renderHook(() => useFlicks(user, mockNavigation, jest.fn()));

    // Wait for the initial load to complete
    await act(async () => {});

    const femaleTarget = makeTarget('female');
    await act(async () => {
      await result.current.handleFlick(femaleTarget);
    });

    expect(sendFlick).toHaveBeenCalledWith(user.id, femaleTarget.id);
  });

  it('allows a female to flick anyone without restriction', async () => {
    const user = makeFemaleUser();
    const { result } = renderHook(() => useFlicks(user, mockNavigation, jest.fn()));

    const maleTarget = makeTarget('male');
    await act(async () => {
      await result.current.handleFlick(maleTarget);
    });

    expect(sendFlick).toHaveBeenCalledWith(user.id, maleTarget.id);
  });

  it('allows a male to flick another male (non-straight match, no restriction)', async () => {
    const user = { id: 'user_m', gender: 'male', lookingFor: 'male' };
    const { result } = renderHook(() => useFlicks(user, mockNavigation, jest.fn()));

    const maleTarget = { id: 'user_m2', gender: 'male', lookingFor: 'male' };
    await act(async () => {
      await result.current.handleFlick(maleTarget);
    });

    expect(sendFlick).toHaveBeenCalledWith(user.id, maleTarget.id);
  });
});

describe('useFlicks — flick state management', () => {
  it('adds a successfully flicked user to the flickedUsers set', async () => {
    const user = { id: 'user_a', gender: 'female', lookingFor: 'male' };
    const target = { id: 'user_b', gender: 'male', lookingFor: 'female' };
    const { result } = renderHook(() => useFlicks(user, mockNavigation, jest.fn()));

    await act(async () => {
      await result.current.handleFlick(target);
    });

    expect(result.current.flickedUsers.has(target.id)).toBe(true);
  });

  it('removes a user from flickedUsers when unflicking', async () => {
    const user = { id: 'user_a', gender: 'female', lookingFor: 'male' };
    const target = { id: 'user_b', gender: 'male', lookingFor: 'female' };
    deleteFlick.mockResolvedValue();

    const { result } = renderHook(() => useFlicks(user, mockNavigation, jest.fn()));

    // Flick first
    await act(async () => {
      await result.current.handleFlick(target);
    });
    expect(result.current.flickedUsers.has(target.id)).toBe(true);

    // Unflick (second press removes from set)
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

    const { result } = renderHook(() => useFlicks(user, mockNavigation, jest.fn()));

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

    const { result } = renderHook(() => useFlicks(user, mockNavigation, jest.fn()));

    await act(async () => {
      await result.current.handleFlick(target);
    });

    expect(mockNavigation.navigate).not.toHaveBeenCalled();
  });
});
