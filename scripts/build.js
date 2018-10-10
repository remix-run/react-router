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
    console.log("Building %s ...", packageName);
    process.chdir(path.resolve(__dirname, "../packages/" + packageName));
    exec("npm run build");
    console.log();
  }
);

if (!process.env.CI) {
  // Don't bother building the website now. Instead, build it in
  // deploy-website.sh when we're on the "website" branch.
  console.log("Building the website ...");
  process.chdir(path.resolve(__dirname, "../website"));
  exec("npm run build");
  console.log();
}

process.chdir(cwd);
