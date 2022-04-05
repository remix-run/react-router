/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  ...require("../jest/jest.config.shared"),
  displayName: "integration",
  preset: "jest-puppeteer",
  globalSetup: "<rootDir>/helpers/global-setup.ts",
  globalTeardown: "<rootDir>/helpers/global-teardown.ts",
  setupFilesAfterEnv: ["<rootDir>/helpers/setupAfterEnv.ts"],
  setupFiles: [],
};
