import { getPrFiles } from "./utils/github.ts";

const CHANGE_FILE_PATTERN =
  /^\.changes\/(?:major|minor|patch|unstable)\.[^/]*\.md$/;
const SOURCE_FILE_PATTERN = /\.(?:cjs|cts|js|jsx|mjs|mts|ts|tsx)$/;

const prNumber = process.env.PR_NUMBER;
if (!prNumber || !/^[1-9][0-9]*$/.test(prNumber)) {
  throw new Error("Invalid PR_NUMBER: must be a positive integer");
}

const changedFiles = await getPrFiles(Number(prNumber));
const sourcePackages = new Set<string>();
const changePackages = new Set<string>();

for (let { filename, status } of changedFiles) {
  let match = filename.match(/^packages\/([a-z0-9-]+)\/(.+)$/);
  if (!match) continue;

  let [, packageName, relativePath] = match;
  if (CHANGE_FILE_PATTERN.test(relativePath)) {
    if (status !== "removed") {
      changePackages.add(packageName);
    }
  } else if (SOURCE_FILE_PATTERN.test(relativePath)) {
    sourcePackages.add(packageName);
  }
}

for (let packageName of sourcePackages) {
  if (!changePackages.has(packageName)) {
    process.exitCode = 1;
    console.log(
      `::warning title=Missing change file::Source code changed in packages/${packageName}, but no change file was provided for that package.`,
    );
  }
}
