/** @type {import('jest').Config} */
module.exports = {
  ...require("../../jest/jest.config.shared"),
  testEnvironment: "jsdom",
  globals: {
    __DEV__: true,
  },
};
