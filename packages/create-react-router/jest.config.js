/** @type {import('jest').Config} */
module.exports = {
  ...require("../../jest/jest.config.shared"),
  displayName: "create-react-router",
  setupFilesAfterEnv: ["<rootDir>/__tests__/setupAfterEnv.ts"],
  setupFiles: [],
};
