const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

function exec(cmd) {
  execSync(cmd, { env: process.env, stdio: 'inherit' });
}

let target = process.argv[2];
let allPackages = fs.readdirSync(path.resolve(__dirname, '../packages'));

if (target && !allPackages.includes(target)) {
  target = undefined;
}

let config = path.resolve(
  __dirname,
  target ? `builds/${target}.js` : 'builds/index.js'
);

exec(`rollup -c ${config} -w`);
