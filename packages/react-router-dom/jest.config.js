let mappedModule;
switch (process.env.TEST_ENV) {
  case "cjs":
    mappedModule = "<rootDir>/index";
    break;
  case "es":
    mappedModule = "<rootDir>/es/index";
    break;
  default:
    mappedModule = "<rootDir>/modules/index";
}

module.exports = {
  testMatch: ["<rootDir>/modules/__tests__/*-test.js"],
  moduleNameMapper: {
    "^react-router-dom$": mappedModule
  }
};
