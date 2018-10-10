const path = require("path");
const execSync = require("child_process").execSync;

function exec(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

const cwd = process.cwd();

[
  "react-router",
  "react-router-dom",
  "react-router-config",
  "react-router-native"
].forEach(packageName => {
  console.log("Testing %s ...", packageName);
  process.chdir(path.resolve(__dirname, "../packages/" + packageName));
  exec("npm run test");
  console.log();
});

process.chdir(cwd);
