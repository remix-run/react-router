/** @type {import('jest').Config} */
module.exports = {
  ...require("../../jest/jest.config.shared"),
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  testEnvironment: "jsdom",
  globals: {
    __DEV__: true,
  },
};
