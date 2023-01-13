const fs = require("fs");
const path = require("path");

module.exports = function rollup(options) {
  return [
    "router",
    "react-router",
    "react-router-dom",
    "react-router-dom-v5-compat",
    "react-router-native",
  ]
    .flatMap((dir) => {
      // if (dir !== "router") return null;
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
