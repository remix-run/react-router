module.exports = {
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    "^react-router-dom$": "<rootDir>/cjs/react-router-dom.js"
  },
  modulePaths: ["<rootDir>/node_modules"],
  setupFiles: ["raf/polyfill"],
  testMatch: ["**/__tests__/**/*-test.js"],
  testURL: "http://localhost/"
};
