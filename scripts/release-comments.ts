// 1. get all tags sorted by creation date
// 2. get all commits between current and last tag that changed ./packages using `git`
// 3. check if commit is a PR and get the number,title,body using `gh`
// 4. get issues that are linked in the PR using `gh api`
// 5. comment on PRs and issues with the release version using `gh issue comment` and `gh pr comment`
// 6. close issues that are referenced in the PRs using `gh issue close`

import semver from "semver";
import { logAndExec } from "./utils/process.ts";

let PACKAGE_NAME = "react-router"; // Package name used in git tags: react-router@x.x.x
let DIRECTORY_TO_CHECK = "packages/.";
let GITHUB_REPOSITORY = "remix-run/react-router";
let PR_LABELS_TO_REMOVE = "awaiting release";
let ISSUE_LABELS_TO_REMOVE = "awaiting release";
let ISSUE_LABELS_TO_KEEP_OPEN = "🗺️Roadmap";
let DRY_RUN = process.argv.includes("--dry-run");

if (DRY_RUN) {
  console.log("⚠️ Running in dry-run mode -- no changes will be made");
}

let { latest, previous } = findBoundingTags();

// Find the git comments between the tags
let gitCommits = getCommits(previous, latest);

// Find any PRs associated with those commits
let prs = await findMergedPRs(gitCommits, latest);

let plural = prs.length > 1 ? "s" : "";
debug(
  `> found ${prs.length} merged PR${plural} that changed ${DIRECTORY_TO_CHECK}`,
);

// Comment on PRs + comment on/close linked issues
for (let pr of prs) {
  await commentOnPrAndLinkedIssues(pr, latest);
}

function findBoundingTags() {
  // Determine the tags making up the delta from the prior release to this release
  let packageRegex = new RegExp(`^${PACKAGE_NAME}@`);
  let stdout = logAndExec(
    [
      "git tag",
      `-l ${PACKAGE_NAME}@*`,
      "--sort -creatordate",
      "--format %\\(refname:strip=2\\)",
    ],
    true,
  );
  let stableGitTags = stdout
    .split("\n")
    .map((tag): Tag => ({ raw: tag, clean: tag.replace(packageRegex, "") }));

  let latest = stableGitTags[0];
  let expectedMajor = semver.major(latest.clean);
  if (semver.minor(latest.clean) === 0 && semver.patch(latest.clean) === 0) {
    expectedMajor -= 1;
  }
  let previous = stableGitTags.find(
    (t) => t.clean !== latest.clean && semver.major(t.clean) === expectedMajor,
  );
  invariant(
    previous,
    `No previous stable release found for prior major version ${expectedMajor}`,
  );
  debug(JSON.stringify({ latest, previous }));

  return { previous, latest };
}

function getCommits(from: Tag, to: Tag): Array<string> {
  let stdout = logAndExec(
    [
      "git",
      "log",
      "--pretty=format:%H",
      `${from.raw}...${to.raw}`,
      DIRECTORY_TO_CHECK!,
    ],
    true,
  );

  invariant(stdout.trim() !== "", "No commits found between tags");

  let gitCommits = stdout.split("\n");
  debug(`> commitCount: ${gitCommits.length}`);
  return gitCommits;
}

async function commentOnPrAndLinkedIssues(pr: MergedPR, latest: Tag) {
  let prComment = `🤖 Hello there,\n\nWe just published version \`${latest.clean}\` which includes this pull request. If you'd like to take it for a test run please try it out and let us know what you think!\n\nThanks!`;

  debug(`\nPR: https://github.com/${GITHUB_REPOSITORY}/pull/${pr.number}`);

  if (DRY_RUN) {
    debug(`[dry-run] would comment on PR #${pr.number}`);
  } else {
    // Comment on PR
    logAndExec(["gh", "pr", "comment", String(pr.number), "--body", prComment]);

    // Remove PR labels
    logAndExec([
      "gh",
      "pr",
      "edit",
      String(pr.number),
      "--remove-label",
      PR_LABELS_TO_REMOVE,
    ]);
  }

  let promises = pr.issues.map((issue) => commentOnIssue(issue, latest));

  let results = await Promise.allSettled(promises);
  let failures = results.filter((result) => result.status === "rejected");
  if (failures.length > 0) {
    throw new Error(
      `the following commands failed: ${JSON.stringify(failures)}`,
    );
  }
}

async function commentOnIssue(issue: number, latest: Tag) {
  let issueComment = `🤖 Hello there,\n\nWe just published version \`${latest.clean}\` which involves this issue. If you'd like to take it for a test run please try it out and let us know what you think!\n\nThanks!`;

  debug(`Issue: https://github.com/${GITHUB_REPOSITORY}/issues/${issue}`);

  let shouldClose = true;
  if (ISSUE_LABELS_TO_KEEP_OPEN) {
    try {
      let labels = getIssueLabels(String(issue));
      console.log("Labels on issue #" + issue + ": " + labels.join(", "));
      shouldClose = !labels.includes(ISSUE_LABELS_TO_KEEP_OPEN);
    } catch (err) {
      debug(`⚠️ Unable to get labels for issue #${issue}: ${String(err)}`);
    }
  }

  if (DRY_RUN) {
    debug(`[dry-run] would comment on issue #${issue}`);
    if (shouldClose) {
      debug(`[dry-run] would close issue #${issue}`);
    }
    debug(
      `[dry-run] would remove label "${ISSUE_LABELS_TO_REMOVE}" from issue #${issue}`,
    );
  } else {
    // Comment on linked issue
    logAndExec([
      "gh",
      "issue",
      "comment",
      String(issue),
      "--body",
      issueComment,
    ]);

    // Close linked issue
    if (shouldClose) {
      logAndExec(["gh", "issue", "close", String(issue)]);
    } else {
      debug(
        `Skipping close of issue #${issue} due to "${ISSUE_LABELS_TO_KEEP_OPEN}" label`,
      );
    }

    // Remove labels from linked issue
    logAndExec([
      "gh",
      "issue",
      "edit",
      String(issue),
      "--remove-label",
      ISSUE_LABELS_TO_REMOVE,
    ]);
  }
}

type MergedPR = {
  number: number;
  issues: Array<number>;
};

type Tag = {
  clean: string;
  raw: string;
};

function getIssuesClosedViaBody(prBody: string): Array<number> {
  if (!prBody) return [];

  /**
   * This regex matches for one of github's issue references for auto linking an issue to a PR
   * as that only happens when the PR is sent to the default branch of the repo
   * https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
   */
  let regex =
    /(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)(:)?\s#([0-9]+)/gi;

  let matches = prBody.match(regex);
  if (!matches) return [];

  let issuesMatch = matches.map((match) => {
    let [, issueNumber] = match.split(" #");
    return parseInt(issueNumber, 10);
  });

  return issuesMatch;
}

type PRResult = { number: number; title: string; url: string; body: string };

async function findMergedPRs(
  commits: Array<string>,
  tag: Tag,
): Promise<MergedPR[]> {
  let result = await Promise.all(
    commits.map(async (commit) => {
      let stdout = logAndExec(
        [
          "gh",
          "pr",
          "list",
          "--search",
          commit,
          "--state",
          "merged",
          "--json",
          "number,title,url,body",
        ],
        true,
      );

      let parsed = JSON.parse(stdout);

      if (parsed.length === 0) return;

      let pr = (parsed[0] as PRResult) ?? null;

      if (!pr) return;

      if (pr.title.includes(`Release ${tag.clean}`)) {
        debug(`skipping release PR ${pr.number}`);
        return;
      }

      let linkedIssues = getIssuesLinkedToPullRequest(pr.url);
      let issuesClosedViaBody = getIssuesClosedViaBody(pr.body);

      debug(
        JSON.stringify({ pr: pr.number, linkedIssues, issuesClosedViaBody }),
      );

      let uniqueIssues = new Set([...linkedIssues, ...issuesClosedViaBody]);

      return {
        number: pr.number,
        issues: [...uniqueIssues],
      };
    }),
  );

  return result.filter((pr: any): pr is MergedPR => pr != null);
}

type ReferencedIssueResult = {
  data: {
    resource: { closingIssuesReferences: { nodes: Array<{ number: number }> } };
  };
};

function getIssuesLinkedToPullRequest(prHtmlUrl: string): Array<number> {
  let gql = String.raw;

  let query = gql`
    query ($prHtmlUrl: URI!, $endCursor: String) {
      resource(url: $prHtmlUrl) {
        ... on PullRequest {
          closingIssuesReferences(first: 100, after: $endCursor) {
            nodes {
              number
            }
            pageInfo {
              hasNextPage
              endCursor
            }
          }
        }
      }
    }
  `;

  let stdout = logAndExec(
    [
      "gh api graphql",
      "--paginate",
      `--field prHtmlUrl=${prHtmlUrl}`,
      `--raw-field query='${trimNewlines(query)}'`,
    ],
    true,
  );

  debug(stdout);

  let parsed = JSON.parse(stdout);

  return (
    parsed as ReferencedIssueResult
  ).data.resource.closingIssuesReferences.nodes.map((node) => node.number);
}

type IssueLabelsResult = {
  data: {
    repository: { issue: { labels: { nodes: Array<{ name: string }> } } };
  };
};

function getIssueLabels(number: string): Array<string> {
  let gql = String.raw;

  let query = gql`
    query ($owner: String!, $repo: String!, $number: Int!) {
      repository(owner: $owner, name: $repo) {
        issue(number: $number) {
          number
          title
          url
          labels(first: 25) {
            nodes {
              name
            }
          }
        }
      }
    }
  `;

  let [owner, repo] = GITHUB_REPOSITORY.split("/");
  let stdout = logAndExec(
    [
      "gh api graphql",
      `--field owner=${owner}`,
      `--field repo=${repo}`,
      `--field number=${number}`,
      `--raw-field query='${trimNewlines(query)}'`,
    ],
    true,
  );

  debug(stdout);

  let parsed = JSON.parse(stdout);

  return (parsed as IssueLabelsResult).data.repository.issue.labels.nodes.map(
    (node) => node.name,
  );
}

function trimNewlines(str: string) {
  return str.replace(/[\n\r]+/g, "").replace(/ +/g, " ");
}

function debug(message: string) {
  console.debug(message);
}

export function invariant(value: boolean, message?: string): asserts value;
export function invariant<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T;
export function invariant(value: any, message?: string) {
  if (value === false || value === null || typeof value === "undefined") {
    console.warn("Test invariant failed:", message);
    throw new Error(message);
  }
}
