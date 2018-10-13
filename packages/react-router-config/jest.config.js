module.exports = {
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    "^react-router$": "<rootDir>/../react-router/cjs/react-router.js",
    "^react-router-config$": "<rootDir>/cjs/react-router-config.js"
  },
  modulePaths: ["<rootDir>/node_modules"],
  setupFiles: ["raf/polyfill"],
  testMatch: ["**/__tests__/**/*-test.js"],
  testURL: "http://localhost/"
};
