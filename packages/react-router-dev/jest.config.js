import sharedConfig from "../../jest/jest.config.shared.js";

/** @type {import('jest').Config} */
export default {
  ...sharedConfig,
  displayName: "dev",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setupAfterEnv.ts"],
};
