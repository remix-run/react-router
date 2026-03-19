import { fileURLToPath } from "node:url";

const ignorePatterns = [
  "\\/build\\/",
  "\\/coverage\\/",
  "\\/\\.vscode\\/",
  "\\/\\.tmp\\/",
  "\\/\\.cache\\/",
];

/** @type {import('jest').Config} */
export default {
  moduleNameMapper: {
    "@react-router/dev$": "<rootDir>/../react-router-dev/index.ts",
    "@react-router/express$": "<rootDir>/../react-router-express/index.ts",
    "@react-router/node$": "<rootDir>/../react-router-node/index.ts",
    "@react-router/serve$": "<rootDir>/../react-router-serve/index.ts",
    "^react-router$": "<rootDir>/../react-router/index.ts",
  },
  modulePathIgnorePatterns: ignorePatterns,
  extensionsToTreatAsEsm: [".ts", ".tsx"],
  setupFiles: [fileURLToPath(new URL("./setup-globals.js", import.meta.url))],
  testMatch: ["<rootDir>/**/*-test.[jt]s?(x)"],
  transform: {
    "\\.[jt]sx?$": fileURLToPath(new URL("./transform.js", import.meta.url)),
  },
  watchPathIgnorePatterns: [...ignorePatterns, "\\/node_modules\\/"],
  globals: {
    __DEV__: true,
  },
};
