/**
 *
 * @param {string | undefined} publishedPackages
 * @param {string | undefined} packageVersionToFollow
 * @returns {string | undefined}
 */
function findReleaseFromChangeset(publishedPackages, packageVersionToFollow) {
  if (!publishedPackages) {
    throw new Error("No published packages found");
  }

  let packages = JSON.parse(publishedPackages);

  if (!Array.isArray(packages)) {
    throw new Error("Published packages is not an array");
  }

  /** @see https://github.com/changesets/action#outputs */
  /** @type { { name: string; version: string }[] }  */
  let typed = packages.filter((pkg) => "name" in pkg && "version" in pkg);

  let found = typed.find((pkg) => pkg.name === packageVersionToFollow);

  if (!found) {
    throw new Error(
      `${packageVersionToFollow} was not found in the published packages`
    );
  }

  let result = `${found.name}@${found.version}`;
  console.log(result);
  return result;
}

findReleaseFromChangeset(
  process.env.publishedPackages,
  process.env.packageVersionToFollow
);
