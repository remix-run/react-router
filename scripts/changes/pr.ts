/**
 * Opens or updates the release PR.
 *
 * Usage:
 *   node scripts/pr.ts [--preview]
 *
 * Environment:
 *   GITHUB_TOKEN - Required (unless --preview)
 */
import { closePr, createPr, findOpenPr, updatePr } from "../utils/github.ts";
import { logAndExec } from "../utils/process.ts";
import type { PackageRelease } from "./changes.ts";
import {
  generateChangelogContent,
  generateCommitMessage,
  parseAllChangeFiles,
} from "./changes.ts";

let args = process.argv.slice(2);
let preview = args.includes("--preview");

let baseBranch = logAndExec("git rev-parse --abbrev-ref HEAD", true).trim();
if (!preview && !["release", "hotfix"].includes(baseBranch)) {
  throw new Error(
    "Error: script must be run from the hotfix or release branch",
  );
}

let prBranch = baseBranch === "hotfix" ? "hotfix-pr" : "release-pr";

// GitHub has a 65,536 character limit for PR body. We use 60,000 to be safe.
let maxBodyLength = 60_000;

async function main() {
  console.log(preview ? "🔍 PREVIEW MODE\n" : "");

  // Parse and validate changes
  console.log("Validating change files...");
  let result = parseAllChangeFiles();

  if (!result.valid) {
    console.error("Validation errors found:");
    for (let error of result.errors) {
      console.error(`  ${error.packageDirName}/${error.file}: ${error.error}`);
    }
    process.exit(1);
  }

  let { releases } = result;

  if (releases.length === 0) {
    console.log("No pending changes to release.");

    // Check if there's a stale PR that should be closed
    if (!preview && process.env.GITHUB_TOKEN) {
      let existingPr = await findOpenPr(prBranch, baseBranch);
      if (existingPr) {
        console.log(`\nClosing stale PR #${existingPr.number}...`);
        await closePr(
          existingPr.number,
          "Closing automatically — all change files have been removed or released.",
        );
        console.log(`✅ Closed PR: ${existingPr.html_url}`);
      }
    }

    process.exit(0);
  }

  console.log(
    `\nFound ${releases.length} package${releases.length === 1 ? "" : "s"} with changes:`,
  );
  for (let release of releases) {
    console.log(
      `  • ${release.packageName}: ${release.currentVersion} → ${release.nextVersion}`,
    );
  }
  console.log();

  // Generate content
  let commitMessage = generateCommitMessage(releases);
  let prTitle = `${baseBranch === "hotfix" ? "Hotfix Release" : "Release"} ${releases[0].nextVersion}`;
  let prBody = generatePrBody(releases);

  if (preview) {
    console.log("Would create/update PR with:");
    console.log(`  Branch: ${prBranch}`);
    console.log(`  Base: ${baseBranch}`);
    console.log(`  Title: ${prTitle}`);
    console.log(`  Commit: ${commitMessage.split("\n")[0]}`);
    console.log("\nPR Body:");
    console.log("─".repeat(60));
    console.log(prBody);
    console.log("─".repeat(60));
    console.log("\nPreview complete. No changes made.");
    process.exit(0);
  }

  // Require token for non-preview
  if (!process.env.GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN environment variable is required");
    process.exit(1);
  }

  // Configure git
  console.log("Configuring git...");
  logAndExec('git config user.name "Remix Run Bot"');
  logAndExec('git config user.email "hello@remix.run"');

  // Create or switch to PR branch
  console.log(`\nSwitching to branch: ${prBranch}`);
  logAndExec(`git checkout -B ${prBranch}`);

  // Reset to base branch
  logAndExec(`git reset --hard origin/${baseBranch}`);

  // Run version command
  console.log("\nRunning pnpm changes:version...");
  logAndExec("pnpm changes:version");

  console.log("\nPushing branch...");
  logAndExec(`git push origin ${prBranch} --force`);

  // Create or update PR
  console.log("\nChecking for existing PR...");
  let existingPr = await findOpenPr(prBranch, baseBranch);

  if (existingPr) {
    console.log(`Updating existing PR #${existingPr.number}...`);
    await updatePr(existingPr.number, { title: prTitle, body: prBody });
    console.log(`\n✅ Updated PR: ${existingPr.html_url}`);
  } else {
    console.log("Creating new PR...");
    let newPr = await createPr({
      title: prTitle,
      body: prBody,
      head: prBranch,
      base: baseBranch,
    });
    console.log(`\n✅ Created PR #${newPr.number}: ${newPr.html_url}`);
  }
}

main().catch((error) => {
  console.error("Error:", error.message);
  process.exit(1);
});

/**
 * Generates the PR body for a release PR
 */
export function generatePrBody(releases: PackageRelease[]): string {
  let header = generateHeader();
  let releasesTable = generateReleasesTable(releases);
  let changelogs = generateChangelogs(releases);

  let fullBody = [header, releasesTable, changelogs].join("\n\n");

  // If under limit, return full body
  if (fullBody.length <= maxBodyLength) {
    return fullBody;
  }

  // Truncate changelogs section to fit
  let baseLength = header.length + releasesTable.length + 100; // buffer for truncation notice
  let availableForChangelogs = maxBodyLength - baseLength;
  let truncatedChangelogs = truncateChangelogs(
    releases,
    availableForChangelogs,
  );

  return [header, releasesTable, truncatedChangelogs].join("\n\n");
}

function generateHeader(): string {
  return (
    "This PR is managed by the " +
    "[`release`](https://github.com/remix-run/react-router/blob/main/.github/workflows/release.yml) " +
    "workflow. Do not edit it manually."
  );
}

function generateReleasesTable(releases: PackageRelease[]): string {
  let lines = [
    "# Releases",
    "",
    "| Package | Version |",
    "|---------|---------|",
  ];

  for (let release of releases) {
    lines.push(
      `| ${release.packageName} | \`${release.currentVersion}\` → \`${release.nextVersion}\` |`,
    );
  }

  return lines.join("\n");
}

function generateChangelogs(releases: PackageRelease[]): string {
  let lines = ["# Changelogs"];

  for (let release of releases) {
    lines.push("");
    lines.push(generatePackageChangelog(release));
  }

  return lines.join("\n");
}

function generatePackageChangelog(release: PackageRelease): string {
  return generateChangelogContent(release, {
    includePackageName: true,
    headingLevel: 2,
  });
}

function truncateChangelogs(
  releases: PackageRelease[],
  maxLength: number,
): string {
  let lines = ["# Changelogs"];
  let currentLength = lines.join("\n").length;
  let includedCount = 0;

  for (let release of releases) {
    let changelog = "\n\n" + generatePackageChangelog(release);
    if (currentLength + changelog.length <= maxLength) {
      lines.push("");
      lines.push(generatePackageChangelog(release));
      currentLength += changelog.length;
      includedCount++;
    } else {
      break;
    }
  }

  let omittedCount = releases.length - includedCount;

  if (omittedCount > 0) {
    lines.push("");
    lines.push(
      `> ⚠️ ${omittedCount} changelog${omittedCount === 1 ? "" : "s"} omitted due to size limits. See the PR diff for full details.`,
    );
  }

  return lines.join("\n");
}
