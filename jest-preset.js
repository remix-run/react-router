function resolveName(packageName) {
  switch (process.env.TEST_ENV) {
    case "cjs":
      return `<rootDir>/../${packageName}/cjs/${packageName}.js`;
    case "umd":
      return `<rootDir>/../${packageName}/umd/${packageName}.js`;
    case "module":
    default:
      return `<rootDir>/../${packageName}/modules/index.js`;
  }
}

module.exports = {
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    "^react-router$": resolveName("react-router"),
    "^react-router-config$": resolveName("react-router-config"),
    "^react-router-dom$": resolveName("react-router-dom")
  },
  setupFiles: ["raf/polyfill"],
  testMatch: ["**/__tests__/**/*-test.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  testURL: "http://localhost/"
};
