/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require("../../jest/jest.config.shared"),
  displayName: "testing",
  setupFiles: [],
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["@testing-library/jest-dom", "./jest.setup.js"],
};
