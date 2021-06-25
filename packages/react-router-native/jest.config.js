module.exports = {
  preset: "react-native",
  testMatch: ["**/__tests__/*-test.[jt]s?(x)"],
  transform: {
    "\\.[jt]sx?$": "<rootDir>/node_modules/react-native/jest/preprocessor.js"
  },
  globals: {
    __DEV__: true
  },
  moduleNameMapper: {
    "^react-router$": "<rootDir>/../../build/react-router",
    "^react-router-native$": "<rootDir>/../../build/react-router-native"
  },
  modulePaths: [
    "<rootDir>/node_modules" // for react-native
  ],
  setupFiles: ["<rootDir>/__tests__/setup.js"]
};
