module.exports = {
  testMatch: ["**/__tests__/*-test.(js|ts)"],
  transform: {
    "\\.[jt]sx?$": "./jest-transformer.js",
  },
  setupFiles: ["./__tests__/setup.ts"],
  moduleNameMapper: {
    "^@remix-run/router$": "<rootDir>/index.ts",
  },
};
