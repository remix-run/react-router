const preset = require("react-native/jest-preset");

function mapValues(obj, mapper) {
  const mapped = {};

  Object.keys(obj).forEach(key => {
    mapped[key] = mapper(obj[key]);
  });

  return mapped;
}

function resolveName(packageName) {
  switch (process.env.TEST_ENV) {
    case "cjs":
      return `<rootDir>/../${packageName}/cjs/${packageName}.js`;
    case "umd":
      return `<rootDir>/../${packageName}/umd/${packageName}.js`;
    case "module":
    default:
      return `<rootDir>/../${packageName}/modules/index.js`;
  }
}

module.exports = {
  ...preset,
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  moduleNameMapper: {
    "^react-router$": resolveName("react-router"),
    "^react-router-dom$": resolveName("react-router-dom"),
    "^react-router-config": resolveName("react-router-config")
  },
  transform: mapValues(preset.transform, transformer =>
    transformer === "babel-jest"
      ? ["babel-jest", { rootMode: "upward" }]
      : transformer
  )
};
