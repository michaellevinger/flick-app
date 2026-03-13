import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

/**
 * Manages the GreenLight screen's fade-in and continuous pulse animation.
 * Returns the Animated.Value refs directly so the screen can apply them to any element.
 */
export function usePulseAnimation() {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnimRef = useRef(null);

  useEffect(() => {
    // Fade the whole screen in on mount
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Continuous scale pulse
    pulseAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimRef.current.start();

    return () => pulseAnimRef.current?.stop();
  }, []);

  return { pulseAnim, fadeAnim };
}
