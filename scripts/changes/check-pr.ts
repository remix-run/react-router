/**
 * Checks whether the current PR contains a change file and posts (or
 * updates) a sticky comment on the PR with the result.
 *
 * Usage (called by the changes-file GitHub Actions workflow):
 *   node scripts/changes/check-pr.ts
 *
 * Usage:
 *   node scripts/changes/check-pr.ts <pr-number>
 *
 * Environment:
 *   GITHUB_TOKEN - Required. GitHub token with pull-requests:write permission.
 */
import {
  createPrComment,
  getPrComments,
  getPrFiles,
  updatePrComment,
} from "../utils/github.ts";

const COMMENT_MARKER = "<!-- change-file-check -->";

const COMMENT_FOUND = `${COMMENT_MARKER}
### ✅ Change File Found

A [change file](https://github.com/remix-run/react-router/blob/main/docs/community/contributing.md#change-files) file exists in this PR. Thanks!`;

const COMMENT_MISSING = `${COMMENT_MARKER}
### ⚠️ No Change File Found

This PR doesn't include a [change file](https://github.com/remix-run/react-router/blob/main/docs/community/contributing.md#change-files) which is used for automated release notes.
If your change affects users, please add one (or more) change files and commit the generated file(s).

\`\`\`sh
pnpm run changes:add
\`\`\`

> This script requires Node 24+. If you are on a lower version, please [add a file manually](https://github.com/remix-run/react-router/blob/main/docs/community/contributing.md#change-files)

> Not every PR needs a change file — you can skip this step if the change is internal-only
> (tests, tooling, docs)`;

// Matches packages/*/.changes/*.md but not .gitkeep
const CHANGE_FILE_RE = /^packages\/[^/]+\/\.changes\/[^/]+\.md$/;

async function main() {
  let arg = process.argv[2];
  let prNumber = arg ? parseInt(arg, 10) : NaN;
  if (!arg || isNaN(prNumber)) {
    console.error("Usage: node scripts/changes/check-pr.ts <pr-number>");
    process.exit(1);
  }

  // Check for change files via the GitHub API — no git fetch needed
  let files = await getPrFiles(prNumber);
  let found = files.some((f) => CHANGE_FILE_RE.test(f.filename));
  let body = found ? COMMENT_FOUND : COMMENT_MISSING;
  console.log(`Change files found: ${found}`);

  // Find existing sticky comment
  let comments = await getPrComments(prNumber);
  let existing = comments.find(
    (c) =>
      c.user?.login === "github-actions[bot]" &&
      c.body?.includes(COMMENT_MARKER),
  );

  if (existing) {
    console.log(`Updating existing comment #${existing.id}`);
    await updatePrComment(existing.id, body);
  } else {
    console.log("Creating new comment");
    await createPrComment(prNumber, body);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
