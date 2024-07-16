const fs = require("fs");
const path = require("path");

module.exports = function rollup(options) {
  return [
    "react-router",
    "react-router-architect",
    "react-router-cloudflare",
    "react-router-dom",
    "react-router-dev",
    "react-router-express",
    "react-router-node",
    "react-router-serve",
  ]
    .flatMap((dir) => {
      let configPath = path.join("packages", dir, "rollup.config.js");
      try {
        fs.readFileSync(configPath);
      } catch (e) {
        console.error(
          "⚠️ Skipping build for package directory without rollup.config.js:",
          dir
        );
        return null;
      }
      let packageBuild = require(`.${path.sep}${configPath}`);
      return packageBuild(options);
    })
    .filter((p) => p);
};
