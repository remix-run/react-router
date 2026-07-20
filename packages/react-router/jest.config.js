import sharedConfig from "../../jest/jest.config.shared.js";

/** @type {import('jest').Config} */
export default {
  ...sharedConfig,
  setupFiles: [...sharedConfig.setupFiles, "<rootDir>/__tests__/setup.ts"],
  setupFilesAfterEnv: ["@testing-library/jest-dom"],
  testEnvironment: "jest-environment-jsdom",
};
