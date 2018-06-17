let mappedModule;
switch (process.env.TEST_ENV) {
  case "cjs":
    mappedModule = "<rootDir>/index";
    break;
  case "es":
    mappedModule = "<rootDir>/es/index";
    break;
  case "umd":
    mappedModule = "<rootDir>/umd/react-router-dom.js";
    break;
  case "min":
    mappedModule = "<rootDir>/umd/react-router-dom.min.js";
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
