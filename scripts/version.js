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
  prompt,
  updateExamplesPackageConfig,
  updatePackageConfig,
} = require("./utils");
const { EXAMPLES_DIR } = require("./constants");

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

  let nextVersion;
  if (givenVersion === "experimental") {
    let hash = execSync(`git rev-parse --short HEAD`).toString().trim();
    nextVersion = `0.0.0-experimental-${hash}`;
  } else {
    // @ts-ignore
    nextVersion = semver.inc(currentVersion, givenVersion, prereleaseId);
  }

  invariant(nextVersion != null, `Invalid version specifier: ${givenVersion}`);

  return nextVersion;
}

async function run() {
  try {
    let args = process.argv.slice(2);
    let givenVersion = args[0];
    let prereleaseId = args[1];
    let isExperimental = givenVersion === "experimental";

    // 0. Make sure the working directory is clean
    ensureCleanWorkingDirectory();

    // 1. Get the next version number
    let currentRouterVersion = await getPackageVersion("router");
    let currentVersion = await getPackageVersion("react-router");
    let version = semver.valid(givenVersion);
    if (version == null) {
      version = getNextVersion(currentVersion, givenVersion, prereleaseId);
    }

    // We will only bump the router version if this is an experimental
    let routerVersion = currentRouterVersion;

    // 2. Confirm the next version number
    let answer = await prompt(
      `Are you sure you want to bump version ${currentVersion} to ${version}? [Yn] `
    );

    if (answer === false) return 0;

    // We only handle @remix-run/router for experimental since in normal/pre
    // releases it's versioned independently from the rest of the packages
    if (isExperimental) {
      routerVersion = version;
      // 2.5. Update @remix-run/router version
      await updatePackageConfig("router", (config) => {
        config.version = routerVersion;
      });
      console.log(
        chalk.green(`  Updated @remix-run/router to version ${version}`)
      );
    }

    // 3. Update react-router version
    await updatePackageConfig("react-router", (config) => {
      config.version = version;
      if (isExperimental) {
        config.dependencies["@remix-run/router"] = routerVersion;
      }
    });
    console.log(chalk.green(`  Updated react-router to version ${version}`));

    // 4. Update react-router-dom version + react-router dep
    await updatePackageConfig("react-router-dom", (config) => {
      config.version = version;
      if (isExperimental) {
        config.dependencies["@remix-run/router"] = routerVersion;
      }
      config.dependencies["react-router"] = version;
    });
    console.log(
      chalk.green(`  Updated react-router-dom to version ${version}`)
    );

    // 4.1 Update react-router-dom-v5-compat version + react-router dep
    await updatePackageConfig("react-router-dom-v5-compat", (config) => {
      config.version = version;
      config.dependencies["react-router"] = version;
    });
    console.log(
      chalk.green(`  Updated react-router-dom-v5-compat to version ${version}`)
    );

    // 5. Update react-router-native version + react-router dep
    await updatePackageConfig("react-router-native", (config) => {
      config.version = version;
      config.dependencies["react-router"] = version;
    });
    console.log(
      chalk.green(`  Updated react-router-native to version ${version}`)
    );

    // 6. Update react-router and react-router-dom versions in the examples
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

    // 7. Sync up the pnpm-lock.yaml for pnpm if this is an experimental release
    if (isExperimental) {
      console.log(chalk.green("  Syncing pnpm lockfile..."));
      execSync("pnpm install --no-frozen-lockfile");
    }

    // 8. Commit and tag
    execSync(`git commit --all --message="Version ${version}"`);
    execSync(`git tag -a -m "Version ${version}" v${version}`);
    console.log(chalk.green(`  Committed and tagged version ${version}`));

    if (givenVersion !== "experimental") {
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
