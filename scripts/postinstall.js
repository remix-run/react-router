const execSync = require("child_process").execSync;

function exec(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

if (process.env.CI) {
  if (process.env.TRAVIS_BRANCH !== "website") {
    exec("lerna bootstrap --ci --ignore react-router-website");
  } else {
    exec("lerna bootstrap --ci");
  }
} else {
  exec("lerna bootstrap");
}
