/** @type {import('jest').Config} */
module.exports = {
  ...require("../../jest/jest.config.shared"),
  preset: "react-native",
  transform: {
    "\\.[jt]sx?$": "./jest-transformer.js",
  },
  globals: {
    __DEV__: true,
  },
  transformIgnorePatterns: [],
};
