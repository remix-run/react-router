// Bundle type "cjs" | "umd" | "modules"
const moduleType = process.env.TEST_ENV || "modules";

module.exports = {
  projects: [
    "<rootDir>",
    "<rootDir>/packages/react-router-native/jest.config.js"
  ],
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    "^react-router$": `<rootDir>/packages/react-router/${moduleType}/index.js`,
    "^react-router-config$": `<rootDir>/packages/react-router-config/${moduleType}/index.js`,
    "^react-router-dom$": `<rootDir>/packages/react-router-dom/${moduleType}/index.js`
  },
  modulePaths: ["<rootDir>/node_modules"],
  setupFiles: ["raf/polyfill"],
  testMatch: ["<rootDir>/packages/**/__tests__/**/*-test.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  testURL: "http://localhost/"
};
