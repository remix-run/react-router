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

exec(`rollup -c ${config}`);

for (const PACKAGE_NAME of [
  'react-router',
  'react-router-dom',
  'react-router-native'
]) {
  try {
    exec(
      `tsc --outFile build/${PACKAGE_NAME}/${PACKAGE_NAME}.d.ts packages/${PACKAGE_NAME}/index.tsx global.d.ts`
    );
  } catch (error) {
    console.log(error);
  }
}
