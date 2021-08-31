import { execSync } from "child_process";

execSync(`find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +`, {
  env: process.env,
  stdio: "inherit"
});

execSync(`git clean -e '!/website-deploy-key' -e '!/website-deploy-key.pub' -fdX .`, {
  env: process.env,
  stdio: "inherit"
});
