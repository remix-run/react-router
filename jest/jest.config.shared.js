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
    "@react-router/dev$": "<rootDir>/../react-router-dev/index.ts",
    "@react-router/express$": "<rootDir>/../react-router-express/index.ts",
    "@react-router/node$": "<rootDir>/../react-router-node/index.ts",
    "@react-router/serve$": "<rootDir>/../react-router-serve/index.ts",
    "^react-router$": "<rootDir>/../react-router/index.ts",
    "^@web3-storage/multipart-parser$": require.resolve(
      "@web3-storage/multipart-parser"
    ),
  },
  modulePathIgnorePatterns: ignorePatterns,
  testMatch: ["<rootDir>/**/*-test.[jt]s?(x)"],
  transform: {
    "\\.[jt]sx?$": require.resolve("./transform"),
  },
  watchPathIgnorePatterns: [...ignorePatterns, "\\/node_modules\\/"],
  globals: {
    __DEV__: true,
  },
};
