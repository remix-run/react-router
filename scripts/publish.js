// const path = require("path");
// const jsonfile = require("jsonfile");
// const semver = require("semver");
// const execSync = require("child_process").execSync;
// const rootDir = path.resolve(__dirname, "..");

// const args = process.argv.slice(2);

// /**
//  * @param {*} cond
//  * @param {string} message
//  * @returns {asserts cond}
//  */
// function invariant(cond, message) {
//   if (!cond) throw new Error(message);
// }

// /**
//  * @returns {string}
//  */
// function getTaggedVersion() {
//   let output = execSync("git tag --list --points-at HEAD").toString();
//   return output.replace(/^v|\n+$/g, "");
// }

// /**
//  *
//  * @param {SemverRelease} [semverRelease]
//  */
// function bumpVersion(semverRelease = "patch") {
//   // lerna version --no-push --exact
//   execSync(`yarn lerna version ${semverRelease} --no-push --exact --yes`);
// }

// /**
//  * @param {string} packageName
//  * @param {string|number} version
//  */
// async function ensureBuildVersion(packageName, version) {
//   let file = path.join(rootDir, "packages", packageName, "package.json");
//   let json = await jsonfile.readFile(file);
//   invariant(
//     json.version === version,
//     `Package ${packageName} is on version ${json.version}, but should be on ${version}`
//   );
// }

// /**
//  * @param {string} packageName
//  * @param {string} tag
//  */
// function publishBuild(packageName, tag) {
//   let buildDir = path.join(rootDir, "packages", packageName);
//   console.log();
//   console.log(`  npm publish ${buildDir} --tag ${tag}`);
//   console.log();
//   execSync(`npm publish ${buildDir} --tag ${tag}`, { stdio: "inherit" });
// }

// /**
//  * @param {SemverRelease|null} [semverRelease]
//  * @returns {Promise<1 | 0>}
//  */
// async function run(semverRelease) {
//   try {
//     // 0. Ensure we are in CI. We don't do this manually
//     invariant(
//       process.env.CI,
//       `You should always run the publish script from the CI environment!`
//     );

//     // 1. Update the release version with a git tag + commit
//     bumpVersion(semverRelease);

//     // 2. Get the current tag, which has the release version number
//     let version = getTaggedVersion();
//     invariant(
//       version !== "",
//       "Missing release version. Run the version script first."
//     );

//     // 3. Determine the appropriate npm tag to use
//     let tag = semver.prerelease(version) == null ? "latest" : null;

//     console.log();
//     console.log(
//       `  Publishing version ${version} to npm` + tag ? ` with tag "${tag}"` : ""
//     );

//     // 3. Ensure build versions match the release version
//     await ensureBuildVersion("react-router", version);
//     await ensureBuildVersion("react-router-dom", version);
//     await ensureBuildVersion("react-router-native", version);

//     // 4. Publish to npm
//     publishBuild("react-router", tag);
//     publishBuild("react-router-dom", tag);
//     publishBuild("react-router-native", tag);
//   } catch (error) {
//     console.log();
//     console.error(`  ${error.message}`);
//     console.log();
//     return 1;
//   }

//   return 0;
// }

// run().then(code => {
//   process.exit(code);
// });

// /**
//  * @typedef {'major'|'minor'|'patch'|'premajor'|'preminor'|'prepatch'|'prerelease'} SemverRelease
//  */
