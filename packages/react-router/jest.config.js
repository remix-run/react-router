module.exports = {
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    'react-router$': '<rootDir>/../../build/react-router'
  },
  testMatch: ['**/__tests__/*-test.js'],
  transform: {
    '\\.js$': './jest-transformer.js'
  },
  '//':
    'Tests use built files, so ignore the source. This means you have to manually kick off tests again after the build completes because Jest does not watch the build directory',
  watchPathIgnorePatterns: ['<rootDir>/modules/index.js']
};
