const ignorePatterns = [
  "\\/build\\/",
  "\\/coverage\\/",
  "\\/\\.vscode\\/",
  "\\/\\.tmp\\/",
  "\\/\\.cache\\/",
];

/** @type {import('jest').Config} */
module.exports = {
  moduleNameMapper: {
    "^@remix-run/router$": "<rootDir>/../router/index.ts",
    "^react-router$": "<rootDir>/../react-router/index.ts",
    "^react-router-dom$": "<rootDir>/../react-router-dom/index.tsx",
    "^react-router-dom-v5-compat$":
      "<rootDir>/../react-router-dom-v5-compat/index.ts",
    "^react-router-native$": "<rootDir>/../react-router-native/index.tsx",
    "^@web3-storage/multipart-parser$": require.resolve(
      "@web3-storage/multipart-parser"
    ),
  },
  modulePathIgnorePatterns: ignorePatterns,
  setupFiles: ["<rootDir>/__tests__/setup.ts"],
  testMatch: ["<rootDir>/**/*-test.[jt]s?(x)"],
  transform: {
    "\\.[jt]sx?$": require.resolve("./transform"),
  },
  watchPathIgnorePatterns: [...ignorePatterns, "\\/node_modules\\/"],
};
