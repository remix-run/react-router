const preset = require("react-native/jest-preset");
const { jest: lernaAliases } = require("lerna-alias");

const mapValues = (obj, mapper) => {
  const mapped = {};
  Object.keys(obj).forEach(key => {
    mapped[key] = mapper(obj[key]);
  });
  return mapped;
};

const omitBy = (obj, predicate) => {
  const mapped = {};
  Object.keys(obj).forEach(key => {
    if (predicate(obj[key], key)) {
      return;
    }
    mapped[key] = obj[key];
  });
  return mapped;
};

const monorepoAliases = lernaAliases();
const transpilableAliases = omitBy(monorepoAliases, (_, key) =>
  key.includes("react-router-native")
);

module.exports = {
  ...preset,
  testRunner: "jest-circus/runner",
  restoreMocks: true,
  moduleNameMapper: mapValues(transpilableAliases, path =>
    path.replace("/src/index", `/modules/index`)
  ),
  transform: mapValues(preset.transform, transformer =>
    transformer === "babel-jest"
      ? ["babel-jest", { rootMode: "upward" }]
      : transformer
  )
};
