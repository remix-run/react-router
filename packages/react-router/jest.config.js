module.exports = {
  testMatch: ["**/__tests__/*-test.[jt]s?(x)"],
  transform: {
    "\\.[jt]sx?$": "./jest-transformer.js",
  },
  globals: {
    __DEV__: true,
  },
  setupFiles: ["./__tests__/setup.ts"],
  moduleNameMapper: {
    "^@remix-run/router$": "<rootDir>/../router/index.ts",
    "^react-router$": "<rootDir>/index.ts",
  },
};
