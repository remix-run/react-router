// Bundle type "cjs" | "umd" | "modules"
const moduleType = process.env.TEST_ENV || "modules";

module.exports = {
  rootDir: ".",
  preset: "react-native",
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  moduleNameMapper: {
    "^react-router$": `<rootDir>/../react-router/${moduleType}/index.js`
  },
  modulePaths: ["<rootDir>/node_modules"],
  testMatch: ["<rootDir>/__tests__/**/*.js"],
  transform: {
    "^.+\\.[jt]sx?$": [
      "babel-jest",
      {
        // Add Babel config inline to avoide Babel's file config merge behaviour
        rootMode: "root",
        presets: ["module:metro-react-native-babel-preset"],
        plugins: [["@babel/plugin-proposal-class-properties", { loose: true }]]
      }
    ]
  }
};
