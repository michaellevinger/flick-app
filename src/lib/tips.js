import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'tips_seen';

export async function hasSeenTip(tipId) {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const seen = raw ? JSON.parse(raw) : [];
  return seen.includes(tipId);
}

export async function markTipSeen(tipId) {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const seen = raw ? JSON.parse(raw) : [];
  if (!seen.includes(tipId)) {
    seen.push(tipId);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(seen));
  }
}

export async function resetTips() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
