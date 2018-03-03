const execSync = require("child_process").execSync;

function exec(cmd, env) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

if (process.env.CI) {
  exec("lerna run build --stream --ignore react-router-website");
} else {
  exec("lerna run build --stream");
}
