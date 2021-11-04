module.exports = {
  preset: "react-native",
  testMatch: ["**/__tests__/*-test.[jt]s?(x)"],
  transform: {
    "\\.[jt]sx?$": "<rootDir>/node_modules/react-native/jest/preprocessor.js"
  },
  globals: {
    __DEV__: true
  },
  modulePaths: [
    "<rootDir>/node_modules" // for react-native
  ],
  setupFiles: ["<rootDir>/__tests__/setup.ts"]
};
