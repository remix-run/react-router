const path = require("path");
const { execSync } = require("child_process");

const jsonfile = require("jsonfile");
const semver = require("semver");

const rootDir = path.resolve(__dirname, "..");

/**
 * @param {*} cond
 * @param {string} message
 * @returns {asserts cond}
 */
function invariant(cond, message) {
  if (!cond) throw new Error(message);
}

/**
 * @returns {string}
 */
function getTaggedVersion() {
  let output = execSync("git tag --list --points-at HEAD").toString();
  return output.replace(/^v|\n+$/g, "");
}

/**
 * @param {string} packageName
 * @param {string|number} version
 */
async function ensureBuildVersion(packageName, version) {
  let file = path.join(rootDir, "packages", packageName, "package.json");
  let json = await jsonfile.readFile(file);
  invariant(
    json.version === version,
    `Package ${packageName} is on version ${json.version}, but should be on ${version}`
  );
}

/**
 * @param {string} packageName
 * @param {string} tag
 */
function publishBuild(packageName, tag) {
  let buildDir = path.join(rootDir, "packages", packageName);
  let args = ["--access public", `--tag ${tag}`];
  if (tag === "experimental") {
    args.push(`--no-git-checks`);
  } else {
    args.push("--publish-branch release-next");
  }
  console.log();
  console.log(`  pnpm publish ${buildDir} --tag ${tag} --access public`);
  console.log();
  execSync(`pnpm publish ${buildDir} ${args.join(" ")}`, {
    stdio: "inherit",
  });
}

/**
 * @returns {Promise<1 | 0>}
 */
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
      version !== "",
      "Missing release version. Run the version script first."
    );

    // 2. Determine the appropriate npm tag to use
    let tag = version.includes("experimental")
      ? "experimental"
      : semver.prerelease(version) == null
      ? "latest"
      : "pre";

    console.log();
    console.log(`  Publishing version ${version} to npm with tag "${tag}"`);

    // 3. Ensure build versions match the release version
    if (version.includes("experimental")) {
      // FIXME: @remix-run/router is versioned differently and is only handled
      // for experimental releases here
      await ensureBuildVersion("router", version);
    }
    await ensureBuildVersion("react-router", version);
    await ensureBuildVersion("react-router-dom", version);
    await ensureBuildVersion("react-router-dom-v5-compat", version);
    await ensureBuildVersion("react-router-native", version);

    // 4. Publish to npm
    publishBuild("router", tag);
    publishBuild("react-router", tag);
    publishBuild("react-router-dom", tag);
    publishBuild("react-router-dom-v5-compat", tag);
    publishBuild("react-router-native", tag);
  } catch (error) {
    console.log();
    console.error(`  ${error.message}`);
    console.log();
    return 1;
  }

  return 0;
}

run().then((code) => {
  process.exit(code);
});
