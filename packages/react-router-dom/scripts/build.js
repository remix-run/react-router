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

exec("rollup -c -i modules/index.js -o cjs/react-router-dom.js -f cjs", {
  NODE_ENV: "development"
});

exec("rollup -c -i modules/index.js -o cjs/react-router-dom.min.js -f cjs", {
  NODE_ENV: "production"
});

exec("rollup -c -i modules/index.js -o esm/react-router-dom.js -f esm", {
  NODE_ENV: "development"
});

exec("rollup -c -i modules/index.js -o esm/react-router-dom.min.js -f esm", {
  NODE_ENV: "production"
});

exec("rollup -c -i modules/index.js -o umd/react-router-dom.js -f umd", {
  NODE_ENV: "development"
});

exec("rollup -c -i modules/index.js -o umd/react-router-dom.min.js -f umd", {
  NODE_ENV: "production"
});

const size = gzipSize.sync(fs.readFileSync("umd/react-router-dom.min.js"));

console.log("\ngzipped, the UMD build is %s", prettyBytes(size));
