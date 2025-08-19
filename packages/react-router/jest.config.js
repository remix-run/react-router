/** @type {import('jest').Config} */
module.exports = {
  ...require("../../jest/jest.config.shared"),
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  testEnvironment: "jsdom",
};
