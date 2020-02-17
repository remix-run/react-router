module.exports = {
  preset: 'react-native',
  testMatch: ['**/__tests__/*-test.js'],
  transform: {
    '\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js'
  },
  globals: {
    __DEV__: true
  },
  setupFiles: ['<rootDir>/__tests__/setup.js'],
  modulePaths: [
    '<rootDir>/node_modules', // for react-native
    '<rootDir>/../../build' // for react-router
  ],
  // Just modulePaths doesn't seem to work, index.tsx still gets picked up
  moduleNameMapper: {
    'react-router$': '<rootDir>/../../build/react-router',
    'react-router-native$': '<rootDir>/../../build/react-router-native'
  },
  // Tests use built files, so ignore source files. This means
  // you have to manually kick off tests again after the build
  // completes because Jest does not watch the build directory
  watchPathIgnorePatterns: ['<rootDir>/\\w+.js']
};
