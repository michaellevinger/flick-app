// Flick Design System: Electric Lime on Near-Black

export const COLORS = {
  // Brand
  black: '#0B0F0E',        // Near-black background
  white: '#FFFFFF',
  green: '#00FF00',        // Action Green (matches, CTAs, status)
  greenGlow: '#00FF0033',  // 20% opacity for glow effect
  purple: '#C44CE0',       // Primary brand purple
  pink: '#FF6B9D',         // Pink accent
  violet: '#7B5EE3',       // Gradient third stop (pink → purple → violet)

  // Grays
  gray: '#808080',
  grayLight: '#F5F5F5',
  grayDark: '#333333',         // Headings, emphasis text
  grayMedium: '#666666',       // Body text, secondary content
  graySubtle: '#999999',       // Placeholders, captions, inactive
  grayBorder: '#EEEEEE',       // Dividers, card borders
  grayDisabled: '#CCCCCC',     // Disabled states
  grayFlicked: '#9CA3AF',      // Disabled flick button (light)
  grayFlickedDark: '#6B7280',  // Disabled flick button (dark)

  // Semantic
  danger: '#FF3B30',       // Errors, destructive actions
  dangerLight: '#FFE4E1',  // Error banner background
  dangerBorder: '#FFB6B6', // Error banner border
  dangerDark: '#D32F2F',   // Error text
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

export const GENDER = {
  male: 'male',
  female: 'female',
  other: 'other',
};

export const LOOKING_FOR = {
  male: 'male',
  female: 'female',
  both: 'both',
};

export const MESSAGE_LIMIT = 10; // Max messages per person per chat

export const ERROR_CODES = {
  DUPLICATE_KEY: '23505',  // PostgreSQL unique constraint violation
  NOT_FOUND: 'PGRST116',  // Supabase row not found
};
