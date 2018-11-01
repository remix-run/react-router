let mappedModule;
switch (process.env.TEST_ENV) {
  case "cjs":
    mappedModule = "<rootDir>/cjs/react-router-config.js";
    break;
  case "umd":
    mappedModule = "<rootDir>/umd/react-router-config.js";
    break;
  default:
    mappedModule = "<rootDir>/modules/index.js";
}

module.exports = {
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    "^react-router$": "<rootDir>/../react-router/cjs/react-router.js",
    "^react-router-config$": mappedModule
  },
  modulePaths: ["<rootDir>/node_modules"],
  setupFiles: ["raf/polyfill"],
  testMatch: ["**/__tests__/**/*-test.js"],
  testURL: "http://localhost/"
};
