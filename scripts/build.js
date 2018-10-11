const path = require("path");
const execSync = require("child_process").execSync;

function exec(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

const cwd = process.cwd();

// Note: We don't currently have a build step for react-router-native.
// Instead, we use the source files directly.
["react-router", "react-router-dom", "react-router-config"].forEach(
  packageName => {
    process.chdir(path.resolve(__dirname, "../packages/" + packageName));
    exec("npm run build");
  }
);

// Skip building the website in CI.
if (!process.env.CI) {
  process.chdir(path.resolve(__dirname, "../website"));
  exec("npm run build");
}

process.chdir(cwd);
