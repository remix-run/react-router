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
console.log();

exec("babel modules -d . --ignore __tests__", {
  BABEL_ENV: "build-cjs"
});

console.log();
console.log("Building ES modules ...");
console.log();

exec("babel modules -d es --ignore __tests__", {
  BABEL_ENV: "build-esm"
});

console.log();
console.log("Building react-router.js ...");

exec("rollup -c -i modules/index.js -o umd/react-router.js", {
  BABEL_ENV: "build-esm",
  NODE_ENV: "development"
});

console.log();
console.log("Building react-router.min.js ...");

exec("rollup -c -i modules/index.js -o umd/react-router.min.js", {
  BABEL_ENV: "build-esm",
  NODE_ENV: "production"
});

const size = gzipSize.sync(fs.readFileSync("umd/react-router.min.js"));

console.log("\ngzipped, the UMD build is %s", prettyBytes(size));
