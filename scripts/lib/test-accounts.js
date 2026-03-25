/**
 * Fixed test account definitions.
 * These are the two persistent dev accounts used for manual testing.
 * IDs always start with 'test_dor_' so they are never touched by seed cleanup.
 */

const TEST_ACCOUNTS = {
  male: {
    id: 'test_dor_male',
    name: 'Dor (M)',
    age: 28,
    gender: 'male',
    looking_for: 'female',
    selfie_url:
      'https://ui-avatars.com/api/?name=M&size=400&background=4A90E2&color=fff&bold=true&font-size=0.5',
    photos: [
      'https://ui-avatars.com/api/?name=M&size=400&background=4A90E2&color=fff&bold=true&font-size=0.5',
    ],
    status: true,
    phone_number: '+15550100',
    height: 180,
    bio: '[DEV] Male test account',
    festival_id: 'test-festival',
  },
  female: {
    id: 'test_dor_female',
    name: 'Dor (F)',
    age: 26,
    gender: 'female',
    looking_for: 'male',
    selfie_url:
      'https://ui-avatars.com/api/?name=F&size=400&background=E24A90&color=fff&bold=true&font-size=0.5',
    photos: [
      'https://ui-avatars.com/api/?name=F&size=400&background=E24A90&color=fff&bold=true&font-size=0.5',
    ],
    status: true,
    phone_number: '+15550101',
    height: 165,
    bio: '[DEV] Female test account',
    festival_id: 'test-festival',
  },
};

// IDs of fixed test accounts — never deleted by seed cleanup
const FIXED_TEST_IDS = Object.values(TEST_ACCOUNTS).map((a) => a.id);

module.exports = { TEST_ACCOUNTS, FIXED_TEST_IDS };
