module.exports = {
  testMatch: ["**/__tests__/*-test.(js|ts)"],
  preset: "ts-jest",
  globals: {
    __DEV__: true,
  },
  setupFiles: ["./__tests__/setup.ts"],
};
