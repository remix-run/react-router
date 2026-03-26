/**
 * Publishes packages to npm and creates tags/releases for what was published.
 *
 * This script uses pnpm publish with --report-summary, reads the summary file,
 * and creates Git tags + GitHub releases. When the remix package is in prerelease
 * mode (has .changes/config.json with prereleaseChannel), it publishes in two phases:
 * all other packages as "latest", then remix with the "next" tag.
 *
 * This script is designed for CI use. For previewing releases, use `pnpm changes:preview`.
 *
 * Usage:
 *   node scripts/publish.ts [--skip-ci-check] [--dry-run]
 *
 * Options:
 *   --skip-ci-check  Bypass the CI environment check
 *   --dry-run        Show what would be published without actually publishing.
 *                    Queries npm to determine unpublished packages and previews
 *                    what the GitHub releases would look like.
 */
import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";

import { tagExists } from "../utils/git.ts";
import { createRelease } from "../utils/github.ts";
import { getRootDir, logAndExec } from "../utils/process.ts";
import {
  getAllPackageDirNames,
  getPackageFile,
  getGitTag,
} from "../utils/packages.ts";
import { readJson, fileExists } from "../utils/fs.ts";

let rootDir = getRootDir();

let args = process.argv.slice(2);
let skipCiCheck = args.includes("--skip-ci-check");
let dryRun = args.includes("--dry-run");

interface PublishedPackage {
  packageName: string;
  version: string;
  tag: string;
}

interface PublishSummary {
  publishedPackages: Array<{
    name: string;
    version: string;
  }>;
}

/**
 * Read published packages from pnpm's publish summary file.
 * See https://pnpm.io/cli/publish#--report-summary
 */
function readPublishSummary(): PublishedPackage[] {
  let summaryPath = path.join(rootDir, "pnpm-publish-summary.json");

  if (!fs.existsSync(summaryPath)) {
    throw new Error(
      `pnpm-publish-summary.json not found. This is unexpected after a successful publish.`,
    );
  }

  let summary: PublishSummary = JSON.parse(
    fs.readFileSync(summaryPath, "utf-8"),
  );

  return summary.publishedPackages.map((pkg) => ({
    packageName: pkg.name,
    version: pkg.version,
    tag: getGitTag(pkg.name, pkg.version),
  }));
}

/**
 * Check if a specific version of a package is published on npm.
 */
async function isVersionPublished(
  packageName: string,
  version: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    cp.exec(
      `npm view ${packageName}@${version} version`,
      { encoding: "utf-8" },
      (_error, stdout) => {
        // If we get output that matches the version, it exists
        resolve(stdout.trim() === version);
      },
    );
  });
}

interface LocalPackage {
  dirName: string;
  npmName: string;
  localVersion: string;
}

/**
 * Get all packages that have versions not yet published to npm.
 */
async function getUnpublishedPackages(): Promise<PublishedPackage[]> {
  let packageDirNames = getAllPackageDirNames();

  // Collect all local package info first
  let localPackages: LocalPackage[] = [];
  for (let packageDirName of packageDirNames) {
    let packageJsonPath = getPackageFile(packageDirName, "package.json");

    // Skip directories without a package.json
    if (!fileExists(packageJsonPath)) {
      continue;
    }

    let packageJson = readJson(packageJsonPath);
    localPackages.push({
      dirName: packageDirName,
      npmName: packageJson.name as string,
      localVersion: packageJson.version as string,
    });
  }

  // Query npm for all packages in parallel
  let npmResults = await Promise.all(
    localPackages.map(async (pkg) => ({
      pkg,
      isPublished: await isVersionPublished(pkg.npmName, pkg.localVersion),
    })),
  );

  // Filter to unpublished packages
  let unpublished: PublishedPackage[] = [];
  for (let { pkg, isPublished } of npmResults) {
    if (!isPublished) {
      unpublished.push({
        packageName: pkg.npmName,
        version: pkg.localVersion,
        tag: getGitTag(pkg.npmName, pkg.localVersion),
      });
    }
  }

  return unpublished;
}

function getGithubReleaseBody(version: string) {
  return `See the changelog for release notes: https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v${version.replace(/\./g, "")}`;
}

async function main() {
  // Safety check: this script should only run in CI when not in dry run mode
  if (!process.env.CI && !skipCiCheck && !dryRun) {
    console.error("The publish script is designed for CI use only.");
    console.error("Use --skip-ci-check to bypass this check for local use.");
    console.error("Use --dry-run to preview the publish process.");
    console.error("\nFor previewing releases, use: pnpm changes:preview");
    process.exit(1);
  }

  if (dryRun) {
    console.log("🔍 DRY RUN MODE - No packages will be published\n");
  }

  // Publish packages to npm
  console.log("Publishing packages to npm...\n");

  // Single-phase publish: everything as latest
  let publishCommand =
    'pnpm publish --recursive --filter "./packages/*" --access public --no-git-checks --report-summary';

  // In dry run mode, query npm to determine what would be published
  // and preview the GitHub releases. This is designed to be run against
  // the contents of the "Release" PR / `pnpm changes:version` output.
  if (dryRun) {
    console.log("Would run:");
    console.log(`  $ ${publishCommand}`);
    console.log();

    console.log("Checking npm for unpublished versions...\n");

    let unpublished = await getUnpublishedPackages();

    if (unpublished.length === 0) {
      console.log("All package versions are already published to npm.");
      console.log("\n🔍 Dry run complete.");
      return;
    }

    console.log(
      `${unpublished.length} package${unpublished.length === 1 ? "" : "s"} would be published:\n`,
    );
    for (let pkg of unpublished) {
      console.log(`  • ${pkg.packageName}@${pkg.version}`);
    }
    console.log();

    let rrPkg = unpublished.find((pkg) => pkg.packageName === "react-router");
    if (!rrPkg) {
      throw new Error(
        "Expected react-router to be among the unpublished packages in dry run mode.",
      );
    }

    console.log("GitHub Release Preview:");
    console.log();

    let tagName = getGitTag(rrPkg.packageName, rrPkg.version);
    let releaseName = `v${rrPkg.version}`;
    let body = getGithubReleaseBody(rrPkg.version);

    console.log(`  Tag:  ${tagName}`);
    console.log(`  Name: ${releaseName}`);
    console.log(`  Body: ${body}`);
    console.log();

    console.log(
      "🔍 Dry run complete. No packages published, no git tags or GitHub releases created.",
    );
    return;
  }

  // Publish to npm
  logAndExec(publishCommand);
  let published = readPublishSummary();

  if (published.length === 0) {
    console.log("\nNo packages were published.");
    return;
  }

  console.log(
    `\n${published.length} package${published.length === 1 ? "" : "s"} published:`,
  );
  for (let pkg of published) {
    console.log(`  • ${pkg.packageName}@${pkg.version}`);
  }

  // Configure git
  console.log("\nConfiguring git...");
  logAndExec('git config user.name "Remix Run Bot"');
  logAndExec('git config user.email "hello@remix.run"');

  // Create tags (skip if already exist)
  console.log(`\nCreating tag${published.length === 1 ? "" : "s"}...`);
  let tagsCreated = 0;
  for (let pkg of published) {
    if (tagExists(pkg.tag)) {
      console.log(`  ⊘ ${pkg.tag} (already exists)`);
    } else {
      cp.execSync(`git tag ${pkg.tag}`);
      console.log(`  ✓ ${pkg.tag}`);
      tagsCreated++;
    }
  }

  // Push tags if any were created
  if (tagsCreated > 0) {
    console.log(`\nPushing tag${tagsCreated === 1 ? "" : "s"}...`);
    logAndExec("git push --tags");
  } else {
    console.log("\nNo new tags to push.");
  }

  // Create GitHub releases (skip if already exists)
  console.log("\nCreating GitHub releases...");
  let failedReleases: Array<{ pkg: PublishedPackage; error: string }> = [];

  for (let pkg of published) {
    if (pkg.packageName !== "react-router") {
      continue;
    }

    let result = await createRelease(
      pkg.packageName,
      pkg.version,
      getGithubReleaseBody(pkg.version),
    );
    if (result.status === "created") {
      console.log(`  ✓ ${pkg.packageName} v${pkg.version}`);
    } else if (result.status === "skipped") {
      console.log(
        `  ⊘ ${pkg.packageName} v${pkg.version} (${result.reason.toLowerCase()})`,
      );
    } else {
      console.log(`  ✗ ${pkg.packageName} v${pkg.version} (failed)`);
      failedReleases.push({ pkg, error: result.error });
    }
  }

  // Report any failures
  if (failedReleases.length > 0) {
    console.error("\n⚠️  Some GitHub releases failed to create:");
    for (let { pkg, error } of failedReleases) {
      console.error(`  • ${pkg.packageName} v${pkg.version}: ${error}`);
    }
    console.error("\nYou may need to create these releases manually.");
    process.exit(1);
  }

  console.log("\n✅ Done.");
}

main();
