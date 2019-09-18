let RouterMappedModule;
let RouterConfigMappedModule;
let RouterDomMappedModule;

switch (process.env.TEST_ENV) {
  case "cjs":
    RouterMappedModule = "<rootDir>/packages/react-router/cjs/react-router.js";
    RouterConfigMappedModule =
      "<rootDir>/packages/react-router-config/cjs/react-router-config.js";
    RouterDomMappedModule =
      "<rootDir>/packages/react-router-dom/cjs/react-router-dom.js";
    break;
  case "umd":
    RouterMappedModule = "<rootDir>/packages/react-router/umd/react-router.js";
    RouterConfigMappedModule =
      "<rootDir>/packages/react-router-config/umd/react-router-config.js";
    RouterDomMappedModule =
      "<rootDir>/packages/react-router-dom/umd/react-router-dom.js";
    break;
  default:
    RouterMappedModule = "<rootDir>/packages/react-router/modules/index.js";
    RouterConfigMappedModule =
      "<rootDir>/packages/react-router-config/modules/index.js";
    RouterDomMappedModule =
      "<rootDir>/packages/react-router-dom/modules/index.js";
}

module.exports = {
  // preset: "react-native",
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    "^react-router$": RouterMappedModule,
    "^react-router-config$": RouterConfigMappedModule,
    "^react-router-dom$": RouterDomMappedModule
  },
  modulePaths: ["<rootDir>/node_modules"],
  setupFiles: ["raf/polyfill"],
  testMatch: ["**/__tests__/**/*-test.js"],
  testURL: "http://localhost/"
};
