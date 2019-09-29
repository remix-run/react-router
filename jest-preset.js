const { jest: lernaAliases } = require("lerna-alias");
const { TEST_ENV } = process.env;

const moduleType = ["cjs", "umd"].includes(TEST_ENV) ? TEST_ENV : "modules";

const mapValues = (obj, mapper) => {
  const mapped = {};
  Object.keys(obj).forEach(key => {
    mapped[key] = mapper(obj[key]);
  });
  return mapped;
};

const mapAliasPathToSourceEntry = path =>
  path.replace("/src/index", `/${moduleType}/index`);

const mapAliasPathToDistEntry = path =>
  path.replace(/\/([a-z-]+)\/src\/index/, (match, pkgName) =>
    match.replace("/src/index", `/${moduleType}/${pkgName}`)
  );

module.exports = {
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  globals: {
    __DEV__: true
  },
  moduleNameMapper: mapValues(
    lernaAliases(),
    moduleType === "modules"
      ? mapAliasPathToSourceEntry
      : mapAliasPathToDistEntry
  ),
  setupFiles: ["raf/polyfill"],
  testMatch: ["**/__tests__/**/*-test.js"],
  transform: {
    "^.+\\.[jt]sx?$": "babel-jest"
  },
  testURL: "http://localhost/"
};
