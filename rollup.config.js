const fs = require("fs");
const path = require("path");

module.exports = function rollup(options) {
  return [
    "react-router",
    "react-router-dom", // depends on react-router
    "react-router-node", // depends on react-router
    "react-router-express", // depends on react-router-node
    "react-router-serve", // depends on react-router-node/express
    "react-router-dev", // depends on react-router-node/express/serve
    "react-router-architect",
    "react-router-cloudflare",
    "react-router-fs-routes",
    "react-router-remix-config-routes-adapter",
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
