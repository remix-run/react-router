// FIXME: @remix-run/router isn't being automatically versioned
const path = require("path");
const { execSync } = require("child_process");
const fsp = require("fs/promises");
const chalk = require("chalk");
const semver = require("semver");

const {
  ensureCleanWorkingDirectory,
  getPackageVersion,
  invariant,
  updateExamplesPackageConfig,
  updatePackageConfig,
} = require("./utils");
const { EXAMPLES_DIR } = require("./constants");

async function run() {
  try {
    let args = process.argv.slice(2);
    let skipGit = args.includes("--skip-git");

    let givenVersion = args[0];
    invariant(
      givenVersion != null,
      `Missing next version. Usage: node version.js [nextVersion]`
    );

    let isSnapshotVersion = givenVersion.startsWith("0.0.0-");

    // 0. Make sure the working directory is clean
    if (!skipGit) {
      ensureCleanWorkingDirectory();
    }

    // 1. Get the next version number
    let currentRouterVersion = await getPackageVersion("router");
    let version = semver.valid(givenVersion);
    invariant(version != null, `Invalid version specifier: ${givenVersion}`);

    // We will only bump the router version if this is an experimental
    let routerVersion = currentRouterVersion;

    // 2. Bump package versions
    let packageDirNamesToBump = [
      // We only handle @remix-run/router for snapshot versions since in normal/pre
      // releases it's versioned independently from the rest of the packages
      ...(isSnapshotVersion ? ["router"] : []),
      "react-router",
      "react-router-dom",
      "react-router-dom-v5-compat",
      "react-router-native",
      "remix-dev",
      "remix-express",
      "remix-node",
      "remix-serve",
      "remix-server-runtime",
      "remix-testing",
    ];
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

    // 3. Update react-router and react-router-dom versions in the examples
    let examples = await fsp.readdir(EXAMPLES_DIR);
    for (const example of examples) {
      let stat = await fsp.stat(path.join(EXAMPLES_DIR, example));
      if (!stat.isDirectory()) continue;

      await updateExamplesPackageConfig(example, (config) => {
        if (config.dependencies["@remix-run/router"]) {
          config.dependencies["@remix-run/router"] = routerVersion;
        }
        if (config.dependencies["react-router"]) {
          config.dependencies["react-router"] = version;
        }
        if (config.dependencies["react-router-dom"]) {
          config.dependencies["react-router-dom"] = version;
        }
      });
    }

    // 4. Commit and tag
    if (!skipGit) {
      execSync(`git commit --all --message="Version ${version}"`);
      execSync(`git tag -a -m "Version ${version}" v${version}`);
      console.log(chalk.green(`  Committed and tagged version ${version}`));
    }

    if (!isSnapshotVersion) {
      console.log(
        chalk.red(
          `  🚨 @remix-run/router isn't handled by this script, do it manually!`
        )
      );
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
