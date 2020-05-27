import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const dirname = path.dirname(fileURLToPath(import.meta.url));

let target = process.argv[2];
let allPackages = fs.readdirSync(path.resolve(dirname, '../packages'));

if (target && !allPackages.includes(target)) {
  target = undefined;
}

let config = path.resolve(
  dirname,
  target ? `rollup/${target}.js` : 'rollup/index.js'
);

execSync(`rollup -c ${config}`, {
  env: process.env,
  stdio: 'inherit'
});
