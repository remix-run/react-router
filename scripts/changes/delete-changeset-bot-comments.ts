/**
 * Finds and deletes comments from `changeset-bot` on open PRs created since 1/1/2026
 *
 * Usage:
 *   node scripts/changes/delete-changeset-bot-comments.ts [--dry-run]
 *
 * Environment:
 *   GITHUB_TOKEN - Required. GitHub token with pull-requests:write permission.
 */
import {
  createPrComment,
  deletePrComment,
  getPrComments,
  listOpenPrs,
} from "../utils/github.ts";

const CHANGESET_BOT = "changeset-bot[bot]";
const CUTOFF = new Date(2026, 0, 1);

const ADD_CHANGE_FILE =
  "👋 We've moved away from Changesets to our own internal " +
  "[changes process](https://github.com/remix-run/react-router/blob/main/docs/community/contributing.md#change-files)]. " +
  "Please manually add a change file to this branch, or you can merge in the " +
  "latest `dev` branch and run `pnpm run changes:add` to add a change file.";

const MIGRATE_CHANGE_FILE =
  "👋 We've moved away from Changesets to our own internal " +
  "[changes process](https://github.com/remix-run/react-router/blob/main/docs/community/contributing.md#change-files)]. " +
  "Please convert your changesets file to a change file in the proper package directory " +
  "(i.e., `packages/react-router/.changes/patch.fix-some-bug.md`).";

const dryRun = process.argv.includes("--dry-run");

if (dryRun) {
  console.log("[DRY RUN] No comments will be deleted.\n");
}

console.log(
  `Fetching open PRs created after ${CUTOFF.toISOString().slice(0, 10)}...\n`,
);

let prs = await listOpenPrs({
  createdAfter: CUTOFF,
  base: "dev",
  // TODO: For testing
  author: "brophdawg11",
});
console.log(`Found ${prs.length} open PR${prs.length === 1 ? "" : "s"}.\n`);

let totalDeleted = 0;
let totalSkipped = 0;

for (let pr of prs) {
  let comments = await getPrComments(pr.number);
  let botComments = comments.filter((c) => c.user?.login === CHANGESET_BOT);

  if (botComments.length === 0) continue;

  console.log(`PR #${pr.number}: ${pr.title}`);

  for (let comment of botComments) {
    let preview = (comment.body ?? "").slice(0, 80).replace(/\n/g, " ");
    if (dryRun) {
      console.log(
        `  [DRY RUN] Would delete comment #${comment.id}: "${preview}"`,
      );
      totalSkipped++;
    } else {
      let hasChangeFile = comment.body?.includes("Changeset detected");
      await deletePrComment(comment.id);
      await createPrComment(
        pr.number,
        hasChangeFile ? MIGRATE_CHANGE_FILE : ADD_CHANGE_FILE,
      );
      console.log(`  Deleted comment #${comment.id}: "${preview}"`);
      totalDeleted++;
    }
  }

  console.log();
}

if (dryRun) {
  console.log(
    `Done (dry run): ${totalSkipped} comment${totalSkipped === 1 ? "" : "s"} would be deleted.`,
  );
} else {
  console.log(
    `Done: ${totalDeleted} comment${totalDeleted === 1 ? "" : "s"} deleted.`,
  );
}
