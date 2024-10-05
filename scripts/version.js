const fs = require("node:fs");
const { execSync } = require("child_process");
const chalk = require("chalk");
const semver = require("semver");

const {
  ensureCleanWorkingDirectory,
  invariant,
  updatePackageConfig,
} = require("./utils");

async function run() {
  try {
    let args = process.argv.slice(2);
    let skipGit = args.includes("--skip-git");

    let givenVersion = args[0];
    invariant(
      givenVersion != null,
      `Missing next version. Usage: node version.js [nextVersion]`
    );

    // 0. Make sure the working directory is clean
    if (!skipGit) {
      ensureCleanWorkingDirectory();
    }

    // 1. Get the next version number
    let version = semver.valid(givenVersion);
    invariant(version != null, `Invalid version specifier: ${givenVersion}`);

    // 2. Bump package versions
    let packageDirNamesToBump = fs
      .readdirSync("packages")
      .filter((name) => fs.statSync(`packages/${name}`).isDirectory());

    for (let packageDirName of packageDirNamesToBump) {
      let packageName;
      await updatePackageConfig(packageDirName, (pkg) => {
        packageName = pkg.name;
        pkg.version = version;
      });
      console.log(
        chalk.green(`  Updated ${packageName} to version ${version}`)
      );
    }

    // 3. Commit and tag
    if (!skipGit) {
      execSync(`git commit --all --message="Version ${version}"`);
      execSync(`git tag -a -m "Version ${version}" v${version}`);
      console.log(chalk.green(`  Committed and tagged version ${version}`));
    }
  } catch (error) {
    console.log();
    console.error(chalk.red(`  ${error.message}`));
    console.log();
    return 1;
  }

  return 0;
}

run().then((code) => {
  process.exit(code);
});
