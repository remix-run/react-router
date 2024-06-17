const path = require("path");

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
    "@react-router/dev$": path.resolve(
      __dirname,
      "../packages/remix-dev/index.ts"
    ),
    "@react-router/express$": path.resolve(
      __dirname,
      "../packages/remix-express/index.ts"
    ),
    "@react-router/node$": path.resolve(
      __dirname,
      "../packages/remix-node/index.ts"
    ),
    "@react-router/serve$": path.resolve(
      __dirname,
      "../packages/remix-serve/index.ts"
    ),
    "^react-router$": path.resolve(
      __dirname,
      "../packages/react-router/index.ts"
    ),
    "^react-router/server-runtime$": path.resolve(
      __dirname,
      "../packages/react-router/server-runtime/index.ts"
    ),
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
