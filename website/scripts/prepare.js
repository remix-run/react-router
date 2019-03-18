const execSync = require("child_process").execSync;

function exec(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

if (process.env.CI && process.env.TRAVIS_BRANCH === "website") {
  exec("npm run build");
}
