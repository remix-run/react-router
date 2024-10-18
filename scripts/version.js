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


function getNextVersion(currentVersion, givenVersion, prereleaseId, isExperimental) {
  if (!givenVersion) {
    throw new Error("Missing next version. Usage: node version.js [nextVersion]");
  }

  if (/^pre/.test(givenVersion) && !prereleaseId) {
    throw new Error(`Missing prerelease id for version ${givenVersion}`);
  }

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
    const isExperimental = givenVersion && givenVersion.includes("0.0.0-experimental");
   ensureCleanWorkingDirectory();
    const currentRouterVersion = await getPackageVersion("router");
    const currentVersion = await getPackageVersion("react-router");
    let version = semver.valid(givenVersion) || getNextVersion(currentVersion, givenVersion, prereleaseId, isExperimental);
    let routerVersion = currentRouterVersion;
    if (!isExperimental) {
      const confirm = await prompt(`Bump version ${currentVersion} to ${version}? [Y/n] `);
      if (!confirm) return;
    }
    if (isExperimental) {
      routerVersion = version;
      await updatePackageConfig("router", config => {
        config.version = routerVersion;
      });
      console.log(chalk.green(`Updated @remix-run/router to version ${version}`));
    }
    await updatePackageConfig("react-router", config => {
      config.version = version;
      if (isExperimental) config.dependencies["@remix-run/router"] = routerVersion;
    });
    console.log(chalk.green(`Updated react-router to version ${version}`));
    await updatePackageConfig("react-router-dom", config => {
      config.version = version;
      config.dependencies["react-router"] = version;
      if (isExperimental) config.dependencies["@remix-run/router"] = routerVersion;
    });
    console.log(chalk.green(`Updated react-router-dom to version ${version}`));
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
    if (isExperimental) {
      console.log(chalk.green("Syncing pnpm lockfile..."));
      execSync("pnpm install --no-frozen-lockfile");
    }    
    execSync(`git commit --all --message="Version ${version}"`);
    execSync(`git tag -a -m "Version ${version}" v${version}`);
    console.log(chalk.green(`Committed and tagged version ${version}`));
    if (!isExperimental) {
      console.log(chalk.red(`@remix-run/router must be handled manually!`));
    }

  } catch (error) {
    console.error(chalk.red(`Error: ${error.message}`));
  }
}
run().then(() => process.exit(0));
