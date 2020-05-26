import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

import jsonfile from 'jsonfile';
import semver from 'semver';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, '..');

function invariant(cond, message) {
  if (!cond) throw new Error(message);
}

function getTaggedVersion() {
  let output = execSync('git tag --list --points-at HEAD').toString();
  return output.replace(/^v|\n+$/g, '');
}

async function ensureBuildVersion(packageName, version) {
  let file = path.join(rootDir, 'build', packageName, 'package.json');
  let json = await jsonfile.readFile(file);
  invariant(
    json.version === version,
    `Package ${packageName} is on version ${json.version}, but should be on ${version}`
  );
}

function publishBuild(packageName, tag) {
  let buildDir = path.join(rootDir, 'build', packageName);
  console.log();
  console.log(`  npm publish ${buildDir} --tag ${tag}`);
  console.log();
  execSync(`npm publish ${buildDir} --tag ${tag}`, { stdio: 'inherit' });
}

async function run() {
  try {
    // 0. Ensure we are in CI. We don't do this manually
    invariant(
      process.env.CI,
      `You should always run the publish script from the CI environment!`
    );

    // 1. Get the current tag, which has the release version number
    let version = getTaggedVersion();
    invariant(
      version !== '',
      'Missing release version. Run the version script first.'
    );

    // 2. Determine the appropriate npm tag to use
    let tag = version.includes('-experimental-')
      ? 'experimental'
      : semver.prerelease(version) == null
      ? 'latest'
      : 'next';

    console.log();
    console.log(`  Publishing version ${version} to npm with tag "${tag}"`);

    // 3. Ensure build versions match the release version
    await ensureBuildVersion('react-router', version);
    await ensureBuildVersion('react-router-dom', version);
    await ensureBuildVersion('react-router-native', version);

    // 4. Publish to npm
    publishBuild('react-router', tag);
    publishBuild('react-router-dom', tag);
    publishBuild('react-router-native', tag);
  } catch (error) {
    console.log();
    console.error(`  ${error.message}`);
    console.log();
    return 1;
  }

  return 0;
}

run().then(code => {
  process.exit(code);
});
