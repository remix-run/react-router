const fs = require("fs");
const path = require("path");
const execSync = require("child_process").execSync;

function exec(cmd) {
  execSync(cmd, { stdio: "inherit", env: process.env });
}

let target = process.argv[2];
let allPackages = fs.readdirSync(path.resolve(__dirname, "../packages"));

if (!target || !allPackages.includes(target)) {
  target = "*";
}

exec(`jest --projects packages/${target}`);
