module.exports = {
  testMatch: ["**/__tests__/*-test.(js|ts)"],
  transform: {
    "\\.[jt]sx?$": "./jest-transformer.js",
  },
  globals: {
    __DEV__: true,
  },
  setupFiles: ["./__tests__/setup.ts"],
};
