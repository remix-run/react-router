const path = require("path");
const fs = require("fs");
const babel = require("@rollup/plugin-babel").default;
const copy = require("rollup-plugin-copy");
const extensions = require("rollup-plugin-extensions");
const prettier = require("rollup-plugin-prettier");
const replace = require("@rollup/plugin-replace");
const typescript = require("@rollup/plugin-typescript");
const { terser } = require("rollup-plugin-terser");

module.exports = function rollup(options) {
  return fs
    .readdirSync("packages")
    .flatMap((dir) => {
      let configPath = path.join("packages", dir, "rollup.config.js");
      try {
        fs.readFileSync(configPath);
      } catch (e) {
        return null;
      }
      let packageBuild = require(`.${path.sep}${configPath}`);
      return packageBuild(options);
    })
    .filter((p) => p);
};

/**
 * @typedef {import('rollup').InputOptions} RollupInputOptions
 * @typedef {import('rollup').OutputOptions} RollupOutputOptions
 * @typedef {import('rollup').RollupOptions} RollupOptions
 * @typedef {import('rollup').Plugin} RollupPlugin
 */
