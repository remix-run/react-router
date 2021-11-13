module.exports = {
  testMatch: ["**/__tests__/*-test.[jt]s?(x)"],
  transform: {
    "\\.[jt]sx?$": "./jest-transformer.js"
  },
  globals: {
    __DEV__: true
  }
};
