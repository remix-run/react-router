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
    "@react-router/dev$": "<rootDir>/../remix-dev/index.ts",
    "@react-router/express$": "<rootDir>/../remix-express/index.ts",
    "@react-router/node$": "<rootDir>/../remix-node/index.ts",
    "@react-router/serve$": "<rootDir>/../remix-serve/index.ts",
    "@react-router/server-runtime$":
      "<rootDir>/../remix-server-runtime/index.ts",
    "^react-router$": "<rootDir>/../react-router/index.ts",
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
  globals: {
    __DEV__: true,
  },
};
