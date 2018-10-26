module.exports = {
  preset: "react-native",
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  moduleNameMapper: {
    "^react-router$": "<rootDir>/../react-router/cjs/react-router.js"
  }
};
