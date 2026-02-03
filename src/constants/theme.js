// BLUP Design System: Electric Lime on Near-Black

export const COLORS = {
  black: '#0B0F0E', // Near-black background
  white: '#FFFFFF',
  green: '#2EFF4D', // Electric Lime
  greenGlow: '#2EFF4D33', // 20% opacity for glow effect
  gray: '#808080',
  grayLight: '#F5F5F5',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const TYPOGRAPHY = {
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.black,
  },
  subtitle: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.black,
  },
  body: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.black,
  },
  caption: {
    fontSize: 14,
    fontWeight: '400',
    color: COLORS.gray,
  },
};

export const PROXIMITY_RADIUS = 100; // meters
export const HEARTBEAT_INTERVAL = 60000; // 60 seconds
export const AUTO_WIPE_TIMEOUT = 1200000; // 20 minutes
