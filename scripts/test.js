const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

function exec(cmd) {
  execSync(cmd, { stdio: 'inherit', env: process.env });
}

let args = process.argv.slice(2);

let targetPackage = args.find(arg => !arg.startsWith('-'));
let allPackages = fs.readdirSync(path.resolve(__dirname, '../packages'));

let jestArgs = ['--projects'];

if (targetPackage && allPackages.includes(targetPackage)) {
  jestArgs.push(`packages/${targetPackage}`);
} else {
  jestArgs.push(`packages/*`);
}

if (args.includes('--watch')) {
  jestArgs.push('--watch');
}

exec(`jest ${jestArgs.join(' ')}`);
