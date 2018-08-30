const execSync = require("child_process").execSync;

function exec(cmd, env) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

if (process.env.CI && process.env.TRAVIS_BRANCH !== "website") {
  exec(
    "lerna bootstrap --stream --hoist --nohoist react-native --nohoist react-test-renderer --ignore react-router-website"
  );
} else {
  exec(
    "lerna bootstrap --stream --hoist --nohoist react-native --nohoist react-test-renderer"
  );
}
