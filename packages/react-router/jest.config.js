module.exports = {
  testMatch: ['**/__tests__/*-test.js'],
  transform: {
    '\\.js$': './jest-transformer.js'
  },
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    '^react-router$': '<rootDir>/../../build/react-router'
  }
};
