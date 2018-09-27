const fs = require("fs");
const execSync = require("child_process").execSync;
const prettyBytes = require("pretty-bytes");
const gzipSize = require("gzip-size");

function exec(command, extraEnv) {
  execSync(command, {
    stdio: "inherit",
    env: Object.assign({}, process.env, extraEnv)
  });
}

console.log("Building CommonJS modules ...");

exec("babel modules -d . --ignore __tests__", {
  BUILD_FORMAT: "cjs"
});

console.log("\nBuilding ES modules ...");

exec("babel modules -d es --ignore __tests__", {
  BUILD_FORMAT: "esm"
});

console.log("\nBuilding react-router-config.js ...");

exec("rollup -c -f umd -o umd/react-router-config.js", {
  BUILD_FORMAT: "umd",
  NODE_ENV: "development"
});

console.log("\nBuilding react-router.min.js ...");

exec("rollup -c -f umd -o umd/react-router-config.min.js", {
  BUILD_FORMAT: "umd",
  NODE_ENV: "production"
});

const size = gzipSize.sync(fs.readFileSync("umd/react-router-config.min.js"));

console.log("\ngzipped, the UMD build is %s", prettyBytes(size));
