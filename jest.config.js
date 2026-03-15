module.exports = {
  preset: 'jest-expo',

  testMatch: ['**/__tests__/**/*.test.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
  moduleNameMapper: {
    // Static asset imports (images, fonts)
    '\\.(jpg|jpeg|png|gif|svg)$': '<rootDir>/__mocks__/fileMock.js',
    // Expo ESM-only winter runtime — not compatible with Jest's CommonJS transform
    'expo/src/winter/(.*)': '<rootDir>/__mocks__/emptyMock.js',
    // RN 0.81 TurboModule that is not available in Jest
    'react-native/src/private/devsupport/devmenu/(.*)': '<rootDir>/__mocks__/emptyMock.js',
  },
  // expoPatch must run first (before anything that calls structuredClone or
  // __ExpoImportMetaRegistry), then the AsyncStorage mock.
  setupFiles: [
    './__mocks__/expoPatch.js',
    './node_modules/@react-native-async-storage/async-storage/jest/async-storage-mock.js',
  ],
};
