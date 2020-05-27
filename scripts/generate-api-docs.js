import { execSync } from 'child_process';

execSync(
  `typedoc --ignoreCompilerErrors --includeDeclarations --excludeExternals --out docs/api build`,
  {
    env: process.env,
    stdio: 'inherit'
  }
);
