import sharedConfig from "../../jest/jest.config.shared.js";

/** @type {import('jest').Config} */
export default {
  ...sharedConfig,
  displayName: "create-react-router",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setupAfterEnv.ts"],
};
