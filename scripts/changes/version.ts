/**
 * Updates package.json versions, CHANGELOG.md files, and creates a release commit.
 *
 * Usage:
 *   pnpm changes:version [--no-commit] [--preview]
 *
 * Options:
 *   --no-commit  Only update files, don't commit (for manual review)
 *   --preview    Print what would change without making any changes
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { parseArgs } from "node:util";
import { colorize, colors } from "../utils/color.ts";
import { readFile, readJson, writeFile, writeJson } from "../utils/fs.ts";
import { getPackageFile, getPackagePath } from "../utils/packages.ts";
import { getRootDir, logAndExec } from "../utils/process.ts";
import {
  formatValidationErrors,
  generateChangelogContent,
  generateCommitMessage,
  parseAllChangeFiles,
} from "./changes.ts";

let { values } = parseArgs({
  options: {
    "no-commit": {
      type: "boolean",
      short: "n",
    },
    preview: {
      type: "boolean",
      short: "p",
    },
  },
});

let skipCommit = values["no-commit"];
let preview = values.preview;

console.log("Validating change files...\n");

let result = parseAllChangeFiles();

if (!result.valid) {
  console.error(colorize("Validation failed", colors.red) + "\n");
  console.error(formatValidationErrors(result.errors));
  console.error();
  process.exit(1);
}

let { releases } = result;

if (releases.length === 0) {
  console.log("No packages have changes to release.\n");
  process.exit(0);
}

console.log(colorize("Validation passed!", colors.lightGreen) + "\n");
console.log("═".repeat(80));
console.log(
  colorize(
    preview
      ? "PREVIEWING VERSION"
      : skipCommit
        ? "UPDATING VERSION"
        : "PREPARING RELEASE",
    colors.lightBlue,
  ),
);
console.log("═".repeat(80));
console.log();

// Process each package
for (let release of releases) {
  console.log(
    colorize(`${release.packageName}:`, colors.gray) +
      ` ${release.currentVersion} → ${release.nextVersion}`,
  );

  // Update package.json
  updatePackageJson(release.packageDirName, release.nextVersion);

  // Update CHANGELOG.md
  let changelogContent = generateChangelogContent(release);

  updateChangelog(release.packageDirName, changelogContent);

  // Delete change files
  deleteChangeFiles(release.packageDirName);

  console.log();
}

// Update root CHANGELOG.md with combined changes
console.log(colorize(`Root React Router Release:`, colors.gray));
let { currentVersion, nextVersion, bump } = releases[0];
let rootContent = generateChangelogContent(
  {
    packageName: "react-router",
    packageDirName: "/",
    currentVersion,
    nextVersion,
    bump,
    dependencyBumps: [],
    changes: releases.flatMap((r) =>
      r.changes
        .filter((c) => c.file !== "no-changes--lockstep.md")
        .map((c) => ({
          ...c,
          content: `\`${r.packageName}\` - ${c.content}`,
        })),
    ),
  },
  {
    footerLines: [
      `**Full Changelog**: [\`v${currentVersion}...v${nextVersion}\`]` +
        `(https://github.com/remix-run/react-router/compare/react-router@${currentVersion}...react-router@${nextVersion})`,
    ],
    skipSort: true,
    includeDate: true,
  },
);
updateChangelog("/", rootContent);
updateTableOfContents();

commitChanges();

/**
 * Updates package.json version
 */
function updatePackageJson(packageDirName: string, newVersion: string) {
  if (preview) {
    console.log(`  • Would update package.json to ${newVersion}`);
    return;
  }

  let packageJsonPath = getPackageFile(packageDirName, "package.json");
  let packageJson = readJson(packageJsonPath);
  packageJson.version = newVersion;
  writeJson(packageJsonPath, packageJson);
  console.log(`  ✓ Updated package.json to ${newVersion}`);
}

/**
 * Updates CHANGELOG.md with new content
 */
function updateChangelog(packageDirName: string, newContent: string) {
  let changelogPath =
    packageDirName === "/"
      ? path.join(getRootDir(), "CHANGELOG.md")
      : getPackageFile(packageDirName, "CHANGELOG.md");

  if (preview) {
    console.log(
      `  • Would update ${path.relative(process.cwd(), changelogPath)}:\n`,
    );
    console.log(
      newContent
        .split("\n")
        .map((line) => `    ${line}`)
        .join("\n"),
    );
    return;
  }

  let existingChangelog = readFile(changelogPath);

  let lines = existingChangelog.split("\n");

  // Find the first ## version entry
  let firstVersionIndex = lines.findIndex((line) => line.startsWith("## "));

  let updatedChangelog: string;
  if (firstVersionIndex !== -1) {
    // Insert before the first version entry
    lines.splice(firstVersionIndex, 0, newContent);
    updatedChangelog = lines.join("\n");
  } else {
    // No version entries yet - append to the end
    updatedChangelog = existingChangelog.trimEnd() + "\n\n" + newContent + "\n";
  }

  writeFile(changelogPath, updatedChangelog);
  console.log(`  ✓ Updated CHANGELOG.md`);
}

/**
 * Deletes all change files (except README.md)
 */
function deleteChangeFiles(packageDirName: string) {
  let changesDir = path.join(getPackagePath(packageDirName), ".changes");
  let changeFiles = fs
    .readdirSync(changesDir)
    .filter((file) => file !== "README.md" && file.endsWith(".md"));

  if (preview) {
    if (changeFiles.length === 0) {
      console.log(`  • No change files to delete`);
    } else {
      console.log(
        `  • Would delete ${changeFiles.length} change file${changeFiles.length === 1 ? "" : "s"}:`,
      );
      console.log(changeFiles.map((f) => `    - ${f}`).join("\n"));
    }
    return;
  }

  for (let file of changeFiles) {
    fs.unlinkSync(path.join(changesDir, file));
  }

  console.log(
    `  ✓ Deleted ${changeFiles.length} change file${changeFiles.length === 1 ? "" : "s"}`,
  );
}

/**
 * Regenerates the Table of Contents in the root CHANGELOG.md.
 * Uses GitHub's heading anchor algorithm with duplicate tracking.
 */
function updateTableOfContents() {
  let changelogPath = path.join(getRootDir(), "CHANGELOG.md");

  if (preview) {
    console.log("  • Would update Table of Contents");
    return;
  }

  let content = readFile(changelogPath);

  // Strip the existing <details> block before parsing headings so that
  // links inside the TOC don't skew the duplicate-anchor counters
  let contentWithoutDetails = content.replace(
    /<details>[\s\S]*?<\/details>/,
    "",
  );

  // Build TOC: include h1, h2 (versions), and h4+ items nested under
  // "What's Changed" h3 sections (shown at h3 indent level).
  let tocLines: string[] = [];
  let inWhatsChanged = false;

  for (let line of contentWithoutDetails.split("\n")) {
    let match = line.match(/^(#{1,6})\s+(.+)$/);
    if (!match) continue;

    let level = match[1].length;
    let text = match[2].trim();
    let anchor = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-");

    if (level <= 2) {
      inWhatsChanged = false;
      tocLines.push(`${"  ".repeat(level - 1)}- [${text}](#${anchor})`);
    } else if (level === 3) {
      inWhatsChanged = text.toLowerCase() === "what's changed";
    } else if (inWhatsChanged) {
      // Render at indent level 2 (child of version, same depth h3 used to occupy)
      tocLines.push(`    - [${text}](#${anchor})`);
    }
  }

  let newDetails =
    `<details>\n  <summary>Table of Contents</summary>\n\n` +
    tocLines.join("\n") +
    `\n\n</details>`;

  let updated = content.replace(/<details>[\s\S]*?<\/details>/, newDetails);
  writeFile(changelogPath, updated);
  console.log("  ✓ Updated Table of Contents");
}

/**
 * Stages and commits changes, or prints the commit message in preview mode
 */
function commitChanges() {
  let commitMessage = generateCommitMessage(releases);

  if (preview) {
    console.log(`  • Would commit with message: ${commitMessage}`);
    console.log();
  } else if (skipCommit) {
    console.log("═".repeat(80));
    console.log(colorize("VERSION UPDATED", colors.lightGreen));
    console.log("═".repeat(80));
    console.log();
    console.log("Files updated. Review the changes, then manually commit:");
    console.log();
    console.log(`  git add .`);
    console.log(`  git commit -m "${commitMessage}"`);
    console.log();
  } else {
    // Stage all changes
    console.log("Staging changes...");
    logAndExec("git add .");
    console.log();

    // Create commit
    console.log("Creating commit...");
    logAndExec(`git commit -m "${commitMessage}"`);
    console.log();

    // Success message (skip in CI since the workflow handles the rest)
    if (!process.env.CI) {
      console.log("═".repeat(80));
      console.log("✅ RELEASE PREPARED");
      console.log("═".repeat(80));
      console.log();
      console.log("Release commit has been created locally.");
      console.log();
      console.log(
        "To publish, push and the publish workflow will handle the rest:",
      );
      console.log();
      console.log("  git push");
      console.log();
    }
  }
}
