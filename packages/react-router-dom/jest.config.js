module.exports = {
  testMatch: ['**/__tests__/*-test.js'],
  transform: {
    '\\.js$': './jest-transformer.js'
  },
  globals: {
    __DEV__: true
  },
  // Add the build directory so Jest can find the built packages
  modulePaths: ['<rootDir>/../../build'],
  // Tests use built files, so ignore source files. This means
  // you have to manually kick off tests again after the build
  // completes because Jest does not watch the build directory
  watchPathIgnorePatterns: ['<rootDir>/\\w+.js']
};
