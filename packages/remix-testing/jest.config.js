/** @type {import('jest').Config} */
module.exports = {
  ...require("../../jest/jest.config.shared"),
  displayName: "testing",
  setupFiles: [],
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom", "./jest.setup.js"],
  globals: {
    __DEV__: true,
  },
};
