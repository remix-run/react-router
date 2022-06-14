const fsp = require("fs").promises;
const path = require("path");
const { execSync } = require("child_process");
const jsonfile = require("jsonfile");
const Confirm = require("prompt-confirm");

const { ROOT_DIR, EXAMPLES_DIR } = require("./constants");

/**
 * @param {string} packageName
 * @param {string} [directory]
 * @returns {string}
 */
function packageJson(packageName, directory) {
  return path.join(ROOT_DIR, directory, packageName, "package.json");
}

/**
 * @param {string} packageName
 * @returns {Promise<string | undefined>}
 */
async function getPackageVersion(packageName) {
  let file = packageJson(packageName, "packages");
  let json = await jsonfile.readFile(file);
  return json.version;
}

/**
 * @returns {void}
 */
function ensureCleanWorkingDirectory() {
  let status = execSync(`git status --porcelain`).toString().trim();
  let lines = status.split("\n");
  invariant(
    lines.every((line) => line === "" || line.startsWith("?")),
    "Working directory is not clean. Please commit or stash your changes."
  );
}

/**
 * @param {string} question
 * @returns {Promise<string | boolean>}
 */
async function prompt(question) {
  let confirm = new Confirm(question);
  let answer = await confirm.run();
  return answer;
}

/**
 * @param {string} packageName
 * @param {(json: import('type-fest').PackageJson) => any} transform
 */
async function updatePackageConfig(packageName, transform) {
  let file = packageJson(packageName, "packages");
  let json = await jsonfile.readFile(file);
  transform(json);
  await jsonfile.writeFile(file, json, { spaces: 2 });
}

/**
 * @param {string} example
 * @param {(json: import('type-fest').PackageJson) => any} transform
 */
async function updateExamplesPackageConfig(example, transform) {
  let file = path.join(EXAMPLES_DIR, example, "package.json");
  if (!(await fileExists(file))) return;

  let json = await jsonfile.readFile(file);
  transform(json);
  await jsonfile.writeFile(file, json, { spaces: 2 });
}

/**
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function fileExists(filePath) {
  try {
    await fsp.stat(filePath);
    return true;
  } catch (_) {
    return false;
  }
}

/**
 * @param {*} cond
 * @param {string} message
 * @returns {asserts cond}
 */
function invariant(cond, message) {
  if (!cond) throw new Error(message);
}

module.exports = {
  fileExists,
  packageJson,
  getPackageVersion,
  ensureCleanWorkingDirectory,
  invariant,
  prompt,
  updatePackageConfig,
  updateExamplesPackageConfig,
};
