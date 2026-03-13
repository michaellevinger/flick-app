import * as Haptics from 'expo-haptics';

/**
 * Provides haptic feedback utilities.
 * triggerHapticPulse fires the 3-stage sequence used on the GreenLight match screen.
 */
export function useHaptics() {
  const triggerHapticPulse = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 200);

    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 400);
  };

  return { triggerHapticPulse };
}
