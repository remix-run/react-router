module.exports = {
  preset: "react-native",
  rootDir: "../..",
  testRunner: "jest-circus/runner",
  testMatch: ["<rootDir>/packages/react-router-native/__tests__/*.js"],
  restoreMocks: true,
  moduleNameMapper: {
    "^react-router$": "<rootDir>/node_modules/react-router/cjs/react-router.js"
  }
};
