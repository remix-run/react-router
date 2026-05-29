/**
 * Migrates changeset files from `.changeset/` to `packages/<pkg>/.changes/<bump>.<name>.md`.
 *
 * Changeset files use YAML frontmatter to declare which packages they affect and with
 * what semver bump type, followed by the change description:
 *
 *   ---
 *   "react-router": minor
 *   "@react-router/node": patch
 *   ---
 *
 *   Description of the change
 *
 * Each package entry becomes a separate change file in the new system.
 *
 * Usage:
 *   node scripts/changes/migrate-changesets-files.ts [--dry-run]
 */

import * as cp from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import {
  GITHUB_REPO_URL,
  packageNameToDirectoryName,
} from "../utils/packages.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const changesetsDir = path.join(repoRoot, ".changeset");
const packagesDir = path.join(repoRoot, "packages");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const validBumps = new Set(["major", "minor", "patch"]);

interface ParsedChangeset {
  /** Map from npm package name to bump type */
  packages: Map<string, string>;
  /** The change description (everything after the frontmatter) */
  description: string;
}

function parseChangeset(content: string): ParsedChangeset | null {
  // Changeset files start and end frontmatter with "---"
  if (!content.startsWith("---")) {
    return null;
  }

  let closingIndex = content.indexOf("\n---", 3);
  if (closingIndex === -1) {
    return null;
  }

  let frontmatter = content.slice(3, closingIndex).trim();
  let description = content.slice(closingIndex + 4).trim();

  let packages = new Map<string, string>();

  for (let line of frontmatter.split("\n")) {
    line = line.trim();
    if (!line) continue;

    // Lines look like: "package-name": bump
    // The package name may be quoted with double quotes.
    let match = line.match(/^"([^"]+)":\s*(\S+)$/);
    if (!match) {
      console.warn(`  ⚠️  Could not parse frontmatter line: ${line}`);
      continue;
    }

    let [, packageName, bump] = match;
    packages.set(packageName, bump);
  }

  return { packages, description };
}

/**
 * Returns a markdown link to the PR or commit that introduced the given file.
 * Prefers a PR link like `([#123](...))`, falls back to a short SHA link.
 */
function getSourceLink(filePath: string): string {
  let result = cp.spawnSync(
    "git",
    ["log", "--format=%H %s", "-1", "--", filePath],
    { encoding: "utf-8" },
  );

  let line = result.stdout.trim();
  if (!line) return "";

  let spaceIndex = line.indexOf(" ");
  let sha = line.slice(0, spaceIndex);
  let subject = line.slice(spaceIndex + 1);

  let prMatch = subject.match(/\(#(\d+)\)$/);
  if (prMatch) {
    let pr = prMatch[1];
    return ` ([#${pr}](${GITHUB_REPO_URL}/pull/${pr}))`;
  }

  let shortSha = sha.slice(0, 8);
  return ` ([${shortSha}](${GITHUB_REPO_URL}/commit/${sha}))`;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  if (!fs.existsSync(changesetsDir)) {
    console.log("No .changeset directory found — nothing to migrate.");
    return;
  }

  let files = fs
    .readdirSync(changesetsDir)
    .filter((f) => f.endsWith(".md") && f !== "README.md");

  if (files.length === 0) {
    console.log("No changeset files found — nothing to migrate.");
    return;
  }

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Migrating ${files.length} changeset file${files.length === 1 ? "" : "s"}...\n`,
  );

  let totalCreated = 0;
  let totalSkipped = 0;
  let totalDeleted = 0;

  for (let file of files) {
    let filePath = path.join(changesetsDir, file);
    let content = fs.readFileSync(filePath, "utf-8");
    let baseName = path.basename(file, ".md");

    console.log(`📄 ${file}`);

    let parsed = parseChangeset(content);
    if (!parsed) {
      console.warn(`  ⚠️  Could not parse changeset file — skipping\n`);
      totalSkipped++;
      continue;
    }

    if (parsed.packages.size === 0) {
      console.warn(`  ⚠️  No packages found in frontmatter — skipping\n`);
      totalSkipped++;
      continue;
    }

    if (!parsed.description) {
      console.warn(`  ⚠️  Empty description — skipping\n`);
      totalSkipped++;
      continue;
    }

    let allValid = true;

    for (let [packageName, bump] of parsed.packages) {
      if (!validBumps.has(bump)) {
        console.warn(
          `  ⚠️  Unknown bump type "${bump}" for "${packageName}" — skipping file\n`,
        );
        allValid = false;
        break;
      }

      let dirName = packageNameToDirectoryName(packageName);
      if (!dirName) {
        console.warn(
          `  ⚠️  Could not resolve directory for package "${packageName}" — skipping file\n`,
        );
        allValid = false;
        break;
      }

      let changesDir = path.join(packagesDir, dirName, ".changes");
      if (!fs.existsSync(changesDir)) {
        console.warn(
          `  ⚠️  .changes directory does not exist for "${packageName}" (${dirName}) — skipping file\n`,
        );
        allValid = false;
        break;
      }
    }

    if (!allValid) {
      totalSkipped++;
      continue;
    }

    // Write one change file per package entry
    for (let [packageName, bump] of parsed.packages) {
      let dirName = packageNameToDirectoryName(packageName)!;
      let changesDir = path.join(packagesDir, dirName, ".changes");
      let slug = slugify(baseName);
      let destFileName = `${bump}.${slug}.md`;
      let destPath = path.join(changesDir, destFileName);

      // Avoid overwriting existing files by appending a counter
      let counter = 1;
      while (fs.existsSync(destPath)) {
        destFileName = `${bump}.${slug}-${counter}.md`;
        destPath = path.join(changesDir, destFileName);
        counter++;
      }

      let destRelative = path.relative(repoRoot, destPath);
      console.log(`  ✅ ${packageName} → ${destRelative}`);

      if (!dryRun) {
        let link = getSourceLink(filePath);
        let lines = parsed.description.trim().split("\n");
        lines[0] += link;
        let content = lines.join("\n") + "\n";
        fs.writeFileSync(destPath, content, "utf-8");
      }

      totalCreated++;
    }

    // Delete the original changeset file
    let fileRelative = path.relative(repoRoot, filePath);
    console.log(`  🗑️  Deleting ${fileRelative}`);

    if (!dryRun) {
      fs.unlinkSync(filePath);
    }

    totalDeleted++;
    console.log();
  }

  console.log(
    `${dryRun ? "[DRY RUN] " : ""}Done: ${totalCreated} change file${totalCreated === 1 ? "" : "s"} created, ` +
      `${totalDeleted} changeset file${totalDeleted === 1 ? "" : "s"} deleted, ` +
      `${totalSkipped} skipped.`,
  );
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});
