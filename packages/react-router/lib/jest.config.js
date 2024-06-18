/** @type {import('jest').Config} */
module.exports = {
  ...require("../../../jest/jest.config.shared"),
  displayName: "react-router",
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  testEnvironment: "jsdom",
};
