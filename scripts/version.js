import path from "path";
import { fileURLToPath } from "url";
import { execSync } from "child_process";
import fs from 'fs/promises'
import chalk from "chalk";
import Confirm from "prompt-confirm";
import jsonfile from "jsonfile";
import semver from "semver";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, "..");

/**
 * @param {string} packageName
 * @param {string} [directory]
 * @returns {string}
 */
function packageJson(packageName, directory = "packages") {
  return path.join(rootDir, directory, packageName, "package.json");
}

/**
 * @param {*} cond
 * @param {string} message
 * @returns {asserts cond}
 */
function invariant(cond, message) {
  if (!cond) throw new Error(message);
}

function ensureCleanWorkingDirectory() {
  let status = execSync(`git status --porcelain`).toString().trim();
  let lines = status.split("\n");
  invariant(
    lines.every(line => line === "" || line.startsWith("?")),
    "Working directory is not clean. Please commit or stash your changes."
  );
}

/**
 * @param {string} currentVersion
 * @param {string} givenVersion
 * @param {string} [prereleaseId]
 * @returns {string}
 */
function getNextVersion(currentVersion, givenVersion, prereleaseId) {
  invariant(
    givenVersion != null,
    `Missing next version. Usage: node version.js [nextVersion]`
  );

  if (/^pre/.test(givenVersion)) {
    invariant(
      prereleaseId != null,
      `Missing prerelease id. Usage: node version.js ${givenVersion} [prereleaseId]`
    );
  }

  let nextVersion = semver.inc(currentVersion, givenVersion, prereleaseId);

  invariant(nextVersion != null, `Invalid version specifier: ${givenVersion}`);

  return nextVersion;
}

/**
 * @param {string} question
 * @returns {Promise<string>}
 */
async function prompt(question) {
  let confirm = new Confirm(question);
  let answer = await confirm.run();
  return answer;
}

/**
 * @param {string} packageName
 */
async function getPackageVersion(packageName) {
  let file = packageJson(packageName);
  let json = await jsonfile.readFile(file);
  return json.version;
}

/**
 * @param {string} packageName
 * @param {(json: string) => any} transform
 */
async function updatePackageConfig(packageName, transform) {
  let file = packageJson(packageName);
  let json = await jsonfile.readFile(file);
  transform(json);
  await jsonfile.writeFile(file, json, { spaces: 2 });
}

/**
 * @param {string} example
 * @param {(json: string) => any} transform
 */
 async function updateExamplesPackageConfig(example, transform) {
  let file = packageJson(example, "examples");
  let json = await jsonfile.readFile(file);
  transform(json);
  await jsonfile.writeFile(file, json, { spaces: 2 });
}

/**
*
* @param {string} example
* @param {string} version
*/
async function updateExampleReadmeUrl(example, version) {
  let filePath = path.join(rootDir, "examples", example, "README.md")
  let fileBuffer = await fs.readFile(filePath)
  let file = fileBuffer.toString().replace(
    /https:\/\/stackblitz.com\/github\/remix-run\/react-router\/tree\/[^/+]+\/examples\/\w+/,
    `https://stackblitz.com/github/remix-run/react-router/tree/${version}/examples/${example}`
  );

  await fs.writeFile(filePath, file, "utf8");
}


async function run() {
  try {
    let args = process.argv.slice(2);
    let givenVersion = args[0];
    let prereleaseId = args[1];

    // 0. Make sure the working directory is clean
    ensureCleanWorkingDirectory();

    // 1. Get the next version number
    let currentVersion = await getPackageVersion("react-router");
    let version = semver.valid(givenVersion);
    if (version == null) {
      version = getNextVersion(currentVersion, givenVersion, prereleaseId);
    }

    // 2. Confirm the next version number
    let answer = await prompt(
      `Are you sure you want to bump version ${currentVersion} to ${version}? [Yn] `
    );

    if (answer === false) return 0;

    // 3. Update react-router version
    await updatePackageConfig("react-router", config => {
      config.version = version;
    });
    console.log(chalk.green(`  Updated react-router to version ${version}`));

    // 4. Update react-router-dom version + react-router dep
    await updatePackageConfig("react-router-dom", config => {
      config.version = version;
      config.dependencies["react-router"] = version;
    });
    console.log(
      chalk.green(`  Updated react-router-dom to version ${version}`)
    );

    // 5. Update react-router-native version + react-router dep
    await updatePackageConfig("react-router-native", config => {
      config.version = version;
      config.dependencies["react-router"] = version;
    });
    console.log(
      chalk.green(`  Updated react-router-native to version ${version}`)
    );

    // 6. Update react-router and react-router-dom versions in the examples
    let examples = await fs.readdir(path.join(rootDir, "examples"));
    for (const example of examples) {
      await updateExampleReadmeUrl(example, version)
      await updateExamplesPackageConfig(example, config => {
        config.dependencies["react-router"] = version;
        config.dependencies["react-router-dom"] = version;
      })
    }

    // 7. Commit and tag
    execSync(`git commit --all --message="Version ${version}"`);
    execSync(`git tag -a -m "Version ${version}" v${version}`);
    console.log(chalk.green(`  Committed and tagged version ${version}`));
  } catch (error) {
    console.log();
    console.error(chalk.red(`  ${error.message}`));
    console.log();
    return 1;
  }

  return 0;
}

run().then(code => {
  process.exit(code);
});
