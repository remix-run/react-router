const path = require("path");

const resolvePackage = (pathname) =>
  path.resolve(__dirname, "..", "packages", pathname);

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
    "@react-router/dev$": resolvePackage("remix-dev/index.ts"),
    "@react-router/express$": resolvePackage("remix-express/index.ts"),
    "@react-router/node$": resolvePackage("remix-node/index.ts"),
    "@react-router/serve$": resolvePackage("remix-serve/index.ts"),
    "^react-router$": resolvePackage("react-router/index.ts"),
    "^react-router/server$": resolvePackage("react-router/server/index.ts"),
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
