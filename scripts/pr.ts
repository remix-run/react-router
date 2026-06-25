/**
 * Runs a set of checks against a PR and applies the resulting actions.
 *
 * Two-phase to avoid running with write permissions on PRs from forks.
 * See https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/
 *
 *   check    Inspects the PR via the GitHub API and writes a list of
 *            "actions" to pr-checks-result.json. Safe to run with a
 *            read-only token (Workflow A: 🔍 Check PR).
 *
 *   actions  Reads pr-checks-result.json and applies each action. Runs
 *            in Workflow B (PR (Actions)) under `workflow_run` with
 *            write permissions but never executes any PR code.
 *
 * Usage:
 *   node scripts/pr.ts check
 *   node scripts/pr.ts actions <result-file>
 *
 * Environment (check):
 *   GITHUB_TOKEN  - Required (read-only PR scope is enough).
 *   PR_NUMBER     - Required. github.event.pull_request.number
 *   PR_BASE       - Required. github.event.pull_request.base.ref
 *   EVENT_ACTION  - Required. github.event.action (opened|synchronize|reopened|labeled)
 *   LABEL_NAME    - Optional. github.event.label.name (set when EVENT_ACTION=labeled)
 *
 * Environment (actions):
 *   GITHUB_TOKEN  - Required (issues:write + pull-requests:write).
 */
import * as fs from "node:fs";
import * as util from "node:util";

import {
  closePr,
  createPrComment,
  getPrComments,
  getPrFiles,
  removePrLabel,
  updatePrComment,
} from "./utils/github.ts";

type Action =
  | { type: "upsert-sticky-comment"; marker: string; body: string }
  | { type: "create-comment"; body: string }
  | { type: "remove-label"; label: string }
  | { type: "close-pr" };

type CheckContext = {
  prNumber: number;
  baseBranch: string;
  eventAction: string;
  labelName: string;
};

type Check = (ctx: CheckContext) => Promise<Action[]>;

const CHANGE_FILE_MARKER = "<!-- change-file-check -->";

type ChangeFileSummary = {
  type: string;
  firstLine: string;
};

const CHANGE_FILE_FOUND_COMMENT = `${CHANGE_FILE_MARKER}
### ✅ Change File Found

One or more [change files](https://github.com/remix-run/react-router/blob/main/docs/community/contributing.md#change-files) found.
`;

const CHANGE_FILE_MISSING_COMMENT = `${CHANGE_FILE_MARKER}
### ⚠️ No Change File Found

This PR doesn't include a [change file](https://github.com/remix-run/react-router/blob/main/docs/community/contributing.md#change-files) which is used for automated release notes.
If your change affects users, please add one (or more) change files and commit the generated file(s).

\`\`\`sh
pnpm run changes:add
\`\`\`

> This script requires Node 24+. If you are on a lower version, please [add a file manually](https://github.com/remix-run/react-router/blob/main/docs/community/contributing.md#change-files)

> Not every PR needs a change file — you can skip this step if the change is internal-only
> (tests, tooling, docs)`;

const CLOSE_FEATURE_PR_COMMENT = `\
To align with our new [Open Governance](https://remix.run/blog/rr-governance) model, we are now asking that all new features go through the [Proposal/RFC process](https://github.com/remix-run/react-router/blob/main/GOVERNANCE.md#new-feature-process) and that we don't open PRs until a proposal has been accepted and advanced to Stage 1.

If this feature doesn't have a Proposal, please [open one](https://github.com/remix-run/react-router/discussions/new?category=proposals) so we can evaluate/discuss the proposed feature. You can link to this PR as an example of a potential implementation and we can re-open it if the proposal advances.

If this PR already has a Proposal but it has not yet been accepted, let's continue the discussion in the Proposal until it gets accepted and then we can look to open a PR. Feel free to link to this PR or to a branch in a forked repo to show what a potential implementation might look like.

If you have any questions, you can always reach out on [Discord](https://remix.run/discord). Thanks again for providing feedback and helping us make React Router even better!
`;

let { positionals } = util.parseArgs({ allowPositionals: true });
let [mode, arg] = positionals;

if (mode === "check") {
  await runChecks();
} else if (mode === "actions") {
  if (!arg) usage();
  await runActions(arg);
} else {
  usage();
}

// ---------- Checks ----------

async function runChecks() {
  let prNumber = parseInt(requireEnv("PR_NUMBER"), 10);
  if (isNaN(prNumber)) {
    console.error("PR_NUMBER must be numeric");
    process.exit(1);
  }

  let checks: Check[] = [changeFileCheck, featurePrCheck];

  let ctx: CheckContext = {
    prNumber,
    baseBranch: requireEnv("PR_BASE"),
    eventAction: requireEnv("EVENT_ACTION"),
    labelName: process.env.LABEL_NAME ?? "",
  };
  console.log("ctx:", ctx);

  let result: { prNumber: number; actions: Action[] } = {
    prNumber,
    actions: [],
  };

  for (let check of checks) {
    result.actions.push(...(await check(ctx)));
  }

  // Matches pr-checks.yml/pr-actions.yml workflow artifact name
  let filename = "pr-checks-result.json";
  console.log(`Writing ${filename}:`, JSON.stringify(result));
  fs.writeFileSync(filename, JSON.stringify(result));
}

async function changeFileCheck(ctx: CheckContext): Promise<Action[]> {
  if (ctx.baseBranch !== "main") return [];
  if (!["opened", "synchronize", "reopened"].includes(ctx.eventAction)) {
    return [];
  }

  let files = await getPrFiles(ctx.prNumber);
  let regex =
    /^packages\/[^/]+\/\.changes\/(major|minor|patch|unstable)\.[^/]+\.md$/;
  let summaries: ChangeFileSummary[] = files
    .filter((f) => regex.test(f.filename))
    .map((f) => {
      let type = f.filename.match(regex)?.[1] ?? "unknown";
      let firstLine =
        fs.readFileSync(f.filename, "utf8").split(/\r?\n/, 1)[0].trim() ??
        "_No first line found._";

      return {
        type,
        firstLine,
      };
    });

  console.log(`changeFileCheck: found ${summaries.length} change files`);

  let body = CHANGE_FILE_MISSING_COMMENT;

  if (summaries.length > 0) {
    body = [
      CHANGE_FILE_FOUND_COMMENT,
      "| Type | Change |",
      "| --- | --- |",
      ...summaries
        .map((s) => `| \`${s.type}\` | ${s.firstLine.replaceAll("|", "\\|")} |`)
        .join("\n"),
    ].join("\n");
  }

  return [
    {
      type: "upsert-sticky-comment",
      marker: CHANGE_FILE_MARKER,
      body,
    },
  ];
}

async function featurePrCheck(ctx: CheckContext): Promise<Action[]> {
  if (ctx.eventAction !== "labeled") return [];
  if (ctx.labelName !== "feature-request") return [];

  console.log(`featurePrCheck: closing PR ${ctx.prNumber}`);
  return [
    { type: "create-comment", body: CLOSE_FEATURE_PR_COMMENT },
    { type: "remove-label", label: ctx.labelName },
    { type: "close-pr" },
  ];
}

// ---------- Action dispatch ----------

async function runActions(resultPath: string) {
  let { prNumber, actions } = JSON.parse(
    fs.readFileSync(resultPath, "utf8"),
  ) as { prNumber: number; actions: Action[] };

  if (actions.length === 0) {
    console.log("No actions to apply");
    return;
  }

  for (let action of actions) {
    switch (action.type) {
      case "upsert-sticky-comment": {
        let comments = await getPrComments(prNumber);
        let existing = comments.find(
          (c) =>
            c.user?.login === "github-actions[bot]" &&
            c.body?.includes(action.marker),
        );
        if (existing) {
          console.log(`Updating sticky comment #${existing.id}`);
          await updatePrComment(existing.id, action.body);
        } else {
          console.log("Creating sticky comment");
          await createPrComment(prNumber, action.body);
        }
        return;
      }
      case "create-comment": {
        console.log("Creating comment");
        await createPrComment(prNumber, action.body);
        return;
      }
      case "remove-label": {
        console.log(`Removing label '${action.label}'`);
        await removePrLabel(prNumber, action.label);
        return;
      }
      case "close-pr": {
        console.log(`Closing PR ${prNumber}`);
        await closePr(prNumber);
        return;
      }
    }
  }
}

// Utils

function usage(): never {
  console.error(
    "Usage:\n" +
      "  node scripts/pr.ts check\n" +
      "  node scripts/pr.ts actions <result-file>",
  );
  process.exit(1);
}

function requireEnv(name: string): string {
  let value = process.env[name];
  if (!value) {
    console.error(`Missing required env var: ${name}`);
    process.exit(1);
  }
  return value;
}
