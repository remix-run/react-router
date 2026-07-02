/**
 * Runs a set of checks against a PR and applies the resulting actions.
 *
 * Two-phase to avoid running with write permissions on PRs from forks.
 * See https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/
 *
 *   check    Inspects the PR via the GitHub API and writes a list of
 *            "actions" to the given result file. Safe to run with a
 *            read-only token (Workflow A: 🔍 Check PR).
 *
 *   actions  Reads the given result file and applies each action. Runs
 *            in Workflow B (PR (Actions)) under `workflow_run` with
 *            write permissions but never executes any PR code.
 *
 * Usage:
 *   node scripts/pr.ts check <result-file>
 *   node scripts/pr.ts actions <result-file>
 *
 * Environment (check):
 *   GITHUB_TOKEN  - Required (read-only PR scope is enough).
 *   PR_NUMBER     - Required. github.event.pull_request.number
 *   PR_BASE       - Required. github.event.pull_request.base.ref
 *   PR_AUTHOR     - Required. github.event.pull_request.user.login
 *   PR_HEAD_OWNER - Required. github.event.pull_request.head.repo.owner.login
 *   PR_HEAD_REPO  - Required. github.event.pull_request.head.repo.name
 *   PR_HEAD_REF   - Required. github.event.pull_request.head.ref
 *   LABEL_NAME    - Optional. github.event.label.name (set when github.event.action == "labeled")
 *
 * Environment (actions):
 *   GITHUB_TOKEN  - Required (issues:write + pull-requests:write).
 */
import * as fs from "node:fs";
import * as util from "node:util";

import {
  addPrLabels,
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
  | { type: "add-label"; label: string }
  | { type: "remove-label"; label: string }
  | { type: "close-pr" };

type CheckContext = {
  prNumber: number;
  baseBranch: string;
  author: string;
  headOwner: string;
  headRepo: string;
  headRef: string;
  labelName: string;
};

type CheckResult = {
  actions: Action[];
  failureMessage?: string;
};

type Check = (ctx: CheckContext) => Promise<CheckResult>;

const CHANGE_FILE_MARKER = "<!-- change-file-check -->";
const CLA_MARKER = "<!-- cla-check -->";
const CLA_SIGNED_LABEL = "CLA Signed";

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

const CLA_SIGNED_COMMENT = `${CLA_MARKER}
### ✅ CLA Signed

Thanks for signing the [Contributor License Agreement](https://github.com/remix-run/react-router/blob/main/CLA.md).`;

function getClaMissingComment(ctx: CheckContext) {
  return `${CLA_MARKER}
### ⚠️ CLA Signature Required

Hi @${ctx.author}, thanks for contributing to React Router!

Before we consider your pull request, we ask that you sign our **Contributor License Agreement** (CLA). We require this only once.

You may [review the CLA](https://github.com/remix-run/react-router/blob/main/CLA.md) and sign it by [adding your GitHub username to contributors.yml](https://github.com/${ctx.headOwner}/${ctx.headRepo}/edit/${ctx.headRef}/contributors.yml).

Once the CLA is signed, the \`${CLA_SIGNED_LABEL}\` label will be added to the pull request and the CI check will pass.

Thanks!

\\- The Remix team
`;
}

let { positionals } = util.parseArgs({ allowPositionals: true });
let [mode, filename] = positionals;

if (!filename) {
  usage();
}

if (mode === "check") {
  await runChecks();
} else if (mode === "actions") {
  await runActions();
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

  let checks: Check[] = [claCheck, changeFileCheck, featurePrCheck];

  let ctx: CheckContext = {
    prNumber,
    baseBranch: requireEnv("PR_BASE"),
    author: requireEnv("PR_AUTHOR"),
    headOwner: requireEnv("PR_HEAD_OWNER"),
    headRepo: requireEnv("PR_HEAD_REPO"),
    headRef: requireEnv("PR_HEAD_REF"),
    labelName: process.env.LABEL_NAME ?? "",
  };
  console.log("ctx:", ctx);

  let result: { prNumber: number; actions: Action[] } = {
    prNumber,
    actions: [],
  };
  let failures = "";

  for (let check of checks) {
    let checkResult = await check(ctx);
    result.actions.push(...checkResult.actions);
    failures += checkResult.failureMessage
      ? ` - ${checkResult.failureMessage}\n`
      : "";
  }

  console.log(`Checks result:`);
  console.log(
    JSON.stringify(
      result,
      (_, value) =>
        typeof value === "string" && value.length > 60
          ? value.substring(0, 60) + "..."
          : value,
      2,
    ),
  );

  console.log(`Writing ${filename}`);
  fs.writeFileSync(filename, JSON.stringify(result));

  if (failures.length > 0) {
    console.error(`Failures:\n${failures}`);
    process.exit(1);
  }
}

async function claCheck(ctx: CheckContext): Promise<CheckResult> {
  let author = ctx.author.toLowerCase();
  if (author === "dependabot[bot]") {
    console.log(`claCheck: ignoring ${ctx.author}`);
    return { actions: [] };
  }

  let contributors = fs
    .readFileSync("contributors.yml", "utf8")
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*-\s*(.+?)\s*$/)?.[1]?.toLowerCase())
    .filter((contributor): contributor is string => Boolean(contributor));
  let signedCla = contributors.includes(author);
  console.log(`claCheck: ${ctx.author} signed CLA: ${signedCla}`);

  if (signedCla) {
    return {
      actions: [
        { type: "add-label", label: CLA_SIGNED_LABEL },
        {
          type: "upsert-sticky-comment",
          marker: CLA_MARKER,
          body: CLA_SIGNED_COMMENT,
        },
      ],
    };
  }

  return {
    actions: [
      {
        type: "upsert-sticky-comment",
        marker: CLA_MARKER,
        body: getClaMissingComment(ctx),
      },
    ],
    failureMessage: `CLA check failed: ${ctx.author} is not listed in contributors.yml`,
  };
}

async function changeFileCheck(ctx: CheckContext): Promise<CheckResult> {
  if (ctx.baseBranch !== "main") return { actions: [] };

  let files = await getPrFiles(ctx.prNumber);
  let touchesPackageFiles = files.some((f) =>
    f.filename.startsWith("packages/"),
  );
  let regex =
    /^packages\/[^/]+\/\.changes\/(major|minor|patch|unstable)\.[^/]+\.md$/;
  let summaries: ChangeFileSummary[] = files
    .filter((f) => f.status !== "removed" && regex.test(f.filename))
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

  if (summaries.length === 0 && !touchesPackageFiles) {
    console.log("changeFileCheck: no package files changed");
    return { actions: [] };
  }

  let body = CHANGE_FILE_MISSING_COMMENT;

  if (summaries.length > 0) {
    body = [
      CHANGE_FILE_FOUND_COMMENT,
      "| Type | Change |",
      "| --- | --- |",
      ...summaries.map(
        (s) => `| \`${s.type}\` | ${s.firstLine.replaceAll("|", "\\|")} |`,
      ),
    ].join("\n");
  }

  return {
    actions: [
      {
        type: "upsert-sticky-comment",
        marker: CHANGE_FILE_MARKER,
        body,
      },
    ],
  };
}

async function featurePrCheck(ctx: CheckContext): Promise<CheckResult> {
  if (ctx.labelName === "feature-request") {
    console.log(`featurePrCheck: closing PR ${ctx.prNumber}`);
    return {
      actions: [
        { type: "create-comment", body: CLOSE_FEATURE_PR_COMMENT },
        { type: "remove-label", label: ctx.labelName },
        { type: "close-pr" },
      ],
    };
  }

  return { actions: [] };
}

// ---------- Action dispatch ----------

async function runActions() {
  if (!fs.existsSync(filename)) {
    console.log(`No result file found at ${filename}; skipping actions`);
    return;
  }

  let { prNumber, actions } = JSON.parse(fs.readFileSync(filename, "utf8")) as {
    prNumber: number;
    actions: Action[];
  };

  if (actions.length === 0) {
    console.log("No actions to apply");
    return;
  }

  console.log(actions);

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
        break;
      }
      case "create-comment": {
        console.log("Creating comment");
        await createPrComment(prNumber, action.body);
        break;
      }
      case "add-label": {
        console.log(`Adding label '${action.label}'`);
        await addPrLabels(prNumber, [action.label]);
        break;
      }
      case "remove-label": {
        console.log(`Removing label '${action.label}'`);
        await removePrLabel(prNumber, action.label);
        break;
      }
      case "close-pr": {
        console.log(`Closing PR ${prNumber}`);
        await closePr(prNumber);
        break;
      }
    }
  }
}

// Utils

function usage(): never {
  console.error(
    "Usage:\n" +
      "  node scripts/pr.ts check <result-file>\n" +
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
