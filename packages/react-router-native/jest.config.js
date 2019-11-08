module.exports = {
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    'react-native$': '<rootDir>/node_modules/react-native',
    'react-router$': '<rootDir>/../../build/react-router',
    'react-router-native$': '<rootDir>/../../build/react-router-native'
  },
  preset: 'react-native',
  setupFiles: ['<rootDir>/modules/__tests__/setup.js'],
  testMatch: ['**/__tests__/*-test.js'],
  transform: {
    '\\.js$': '<rootDir>/node_modules/react-native/jest/preprocessor.js'
  }
};
