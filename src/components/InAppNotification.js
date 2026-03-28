import React, { useEffect, useRef } from 'react';
import { Animated, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '../constants/theme';

const DISPLAY_DURATION = 3500;

/**
 * Animated banner that slides down from the top of the screen
 * when the app receives a push notification in the foreground.
 *
 * @param {object}   notification  { title, body, data }
 * @param {function} onPress       Called when the banner is tapped
 * @param {function} onDismiss     Called when the banner auto-hides
 */
export default function InAppNotification({ notification, onPress, onDismiss }) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (!notification) return;

    // Slide in
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();

    // Auto-dismiss
    timerRef.current = setTimeout(() => {
      dismiss();
    }, DISPLAY_DURATION);

    return () => clearTimeout(timerRef.current);
  }, [notification]);

  const dismiss = () => {
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: 200,
      useNativeDriver: true,
    }).start(() => onDismiss?.());
  };

  const handlePress = () => {
    clearTimeout(timerRef.current);
    dismiss();
    onPress?.(notification.data);
  };

  if (!notification) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + 8, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <TouchableOpacity style={styles.content} onPress={handlePress} activeOpacity={0.8}>
        <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.body} numberOfLines={2}>{notification.body}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: SPACING.sm,
    paddingBottom: SPACING.sm,
    backgroundColor: COLORS.black,
  },
  content: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  title: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  body: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
  },
});
