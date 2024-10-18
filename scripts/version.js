const path = require("path");
const { execSync } = require("child_process");
const fsp = require("fs/promises");
const chalk = require("chalk");
const semver = require("semver");

const {
  ensureCleanWorkingDirectory,
  getPackageVersion,
  prompt,
  updateExamplesPackageConfig,
  updatePackageConfig,
} = require("./utils");
const { EXAMPLES_DIR } = require("./constants");

/**
 * Get the next version based on current version and the provided version increment
 * 
 * @param {string} currentVersion - Current version of the package
 * @param {string} givenVersion - The version input by user (e.g. 'major', 'minor', 'patch')
 * @param {string} [prereleaseId] - Optional prerelease ID (for alpha/beta versions)
 * @param {boolean} isExperimental - Whether the version is experimental
 * @returns {string} - The next version
 */
function getNextVersion(currentVersion, givenVersion, prereleaseId, isExperimental) {
  if (!givenVersion) {
    throw new Error("Missing next version. Usage: node version.js [nextVersion]");
  }

  if (/^pre/.test(givenVersion) && !prereleaseId) {
    throw new Error(`Missing prerelease id for version ${givenVersion}`);
  }

  // If experimental, use the given version directly; otherwise, increment the current version
  const nextVersion = isExperimental
    ? givenVersion
    : semver.inc(currentVersion, givenVersion, prereleaseId);

  if (!nextVersion) {
    throw new Error(`Invalid version specifier: ${givenVersion}`);
  }

  return nextVersion;
}

async function run() {
  try {
    const args = process.argv.slice(2);
    const givenVersion = args[0];
    const prereleaseId = args[1];
    
    // Validate if version is experimental
    const isExperimental = givenVersion && givenVersion.includes("0.0.0-experimental");

    // Ensure working directory is clean (no uncommitted changes)
    ensureCleanWorkingDirectory();

    // Fetch current versions
    const currentRouterVersion = await getPackageVersion("router");
    const currentVersion = await getPackageVersion("react-router");

    // Determine the next version
    let version = semver.valid(givenVersion) || getNextVersion(currentVersion, givenVersion, prereleaseId, isExperimental);
    let routerVersion = currentRouterVersion;

    // Confirm version bump (skip for experimental releases)
    if (!isExperimental) {
      const confirm = await prompt(`Bump version ${currentVersion} to ${version}? [Y/n] `);
      if (!confirm) return;
    }

    // Update @remix-run/router for experimental releases
    if (isExperimental) {
      routerVersion = version;
      await updatePackageConfig("router", config => {
        config.version = routerVersion;
      });
      console.log(chalk.green(`Updated @remix-run/router to version ${version}`));
    }

    // Update react-router and its dependencies
    await updatePackageConfig("react-router", config => {
      config.version = version;
      if (isExperimental) config.dependencies["@remix-run/router"] = routerVersion;
    });
    console.log(chalk.green(`Updated react-router to version ${version}`));

    // Update react-router-dom and its dependencies
    await updatePackageConfig("react-router-dom", config => {
      config.version = version;
      config.dependencies["react-router"] = version;
      if (isExperimental) config.dependencies["@remix-run/router"] = routerVersion;
    });
    console.log(chalk.green(`Updated react-router-dom to version ${version}`));

    // Update other related packages
    await updatePackageConfig("react-router-dom-v5-compat", config => {
      config.version = version;
      config.dependencies["react-router"] = version;
    });
    console.log(chalk.green(`Updated react-router-dom-v5-compat to version ${version}`));

    await updatePackageConfig("react-router-native", config => {
      config.version = version;
      config.dependencies["react-router"] = version;
    });
    console.log(chalk.green(`Updated react-router-native to version ${version}`));

    // Update package versions in the examples folder
    const examples = await fsp.readdir(EXAMPLES_DIR);
    for (const example of examples) {
      const stat = await fsp.stat(path.join(EXAMPLES_DIR, example));
      if (!stat.isDirectory()) continue;

      await updateExamplesPackageConfig(example, config => {
        if (config.dependencies["@remix-run/router"]) config.dependencies["@remix-run/router"] = routerVersion;
        if (config.dependencies["react-router"]) config.dependencies["react-router"] = version;
        if (config.dependencies["react-router-dom"]) config.dependencies["react-router-dom"] = version;
      });
    }

    // Sync the pnpm lockfile if experimental
    if (isExperimental) {
      console.log(chalk.green("Syncing pnpm lockfile..."));
      execSync("pnpm install --no-frozen-lockfile");
    }

    // Commit and tag the new version
    execSync(`git commit --all --message="Version ${version}"`);
    execSync(`git tag -a -m "Version ${version}" v${version}`);
    console.log(chalk.green(`Committed and tagged version ${version}`));

    // Notify user about manual router update if necessary
    if (!isExperimental) {
      console.log(chalk.red(`@remix-run/router must be handled manually!`));
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}

// Run the script
run().then(() => process.exit(0));
