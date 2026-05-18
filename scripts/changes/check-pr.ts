/**
 * Checks whether the current PR contains a change file and posts (or
 * updates) a sticky comment on the PR with the result.
 *
 * Two-phase to avoid running with write permissions in PRs from forks
 * See https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/
 *
 *   check    Reads the PR file list and writes pr-check-result.json.
 *            Safe to run with a read-only token (Workflow A).
 *
 *   comment  Reads pr-check-result.json and posts/updates the sticky
 *            comment. Runs in Workflow B (workflow_run) with write
 *            permissions; never sees PR contents.
 *
 * Usage:
 *   node scripts/changes/check-pr.ts check <pr-number>
 *   node scripts/changes/check-pr.ts comment <result-file>
 *
 * Environment:
 *   GITHUB_TOKEN - Required. GitHub token with appropriate permissions
 *                  for the selected mode.
 */
import * as fs from "node:fs";
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

// Needs to match change-file.yml/change-file-comment.yml
const ARTIFACT_FILE = "pr-check-result.json"; //

let [mode, arg] = process.argv.slice(2);

if (mode === "check") {
  let prNumber = parseInt(arg ?? "", 10);
  if (isNaN(prNumber)) usage();
  await check(prNumber);
} else if (mode === "comment") {
  if (!arg) usage();
  await comment(arg);
} else {
  usage();
}

async function check(prNumber: number) {
  let files = await getPrFiles(prNumber);
  let found = files.some((f) => CHANGE_FILE_RE.test(f.filename));
  console.log(
    `Writing artifact to ${ARTIFACT_FILE}:`,
    JSON.stringify({ prNumber, found }),
  );
  fs.writeFileSync(ARTIFACT_FILE, JSON.stringify({ prNumber, found }));
}

async function comment(resultPath: string) {
  let { prNumber, found } = JSON.parse(fs.readFileSync(resultPath, "utf8"));
  let body = found ? COMMENT_FOUND : COMMENT_MISSING;

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

function usage(): never {
  console.error(
    "Usage:\n" +
      "  node scripts/changes/check-pr.ts check <pr-number>\n" +
      "  node scripts/changes/check-pr.ts comment <result-file>",
  );
  process.exit(1);
}
