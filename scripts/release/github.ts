import type { RestEndpointMethodTypes } from "@octokit/rest";
import * as semver from "semver";

import {
  PR_FILES_STARTS_WITH,
  NIGHTLY_BRANCH,
  DEFAULT_BRANCH,
  PACKAGE_VERSION_TO_FOLLOW,
  AWAITING_RELEASE_LABEL,
} from "./constants";
import { gql, graphqlWithAuth, octokit } from "./octokit";
import type { MinimalTag } from "./utils";
import { cleanupTagName } from "./utils";
import { checkIfStringStartsWith } from "./utils";

type PullRequest =
  RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][number];

type PullRequestFiles =
  RestEndpointMethodTypes["pulls"]["listFiles"]["response"]["data"];

interface PrsMergedSinceLastTagOptions {
  owner: string;
  repo: string;
  githubRef: string;
}

interface PrsMergedSinceLastTagResult {
  merged: Awaited<ReturnType<typeof getPullRequestWithFiles>>;
  previousTag: string;
}

export async function prsMergedSinceLastTag({
  owner,
  repo,
  githubRef,
}: PrsMergedSinceLastTagOptions): Promise<PrsMergedSinceLastTagResult> {
  let tags = await getTags(owner, repo);
  let { currentTag, previousTag } = getPreviousTagFromCurrentTag(
    githubRef,
    tags
  );

  console.log(`Getting PRs merged ${previousTag.tag}...${currentTag.tag}`);

  /**
    nightly > nightly => 'dev'
    nightly > stable => 'main'
    stable > nightly => 'dev'
   */
  let prs: Awaited<ReturnType<typeof getMergedPRsBetweenTags>> = [];

  // if both the current and previous tags are prereleases
  // we can just get the PRs for the "dev" branch
  // but if one of them is stable, we should wind up all of them from both the main and dev branches
  if (currentTag.isPrerelease && previousTag.isPrerelease) {
    prs = await getMergedPRsBetweenTags(
      owner,
      repo,
      previousTag,
      currentTag,
      NIGHTLY_BRANCH
    );
  } else {
    let [nightly, stable] = await Promise.all([
      getMergedPRsBetweenTags(
        owner,
        repo,
        previousTag,
        currentTag,
        NIGHTLY_BRANCH
      ),
      getMergedPRsBetweenTags(
        owner,
        repo,
        previousTag,
        currentTag,
        DEFAULT_BRANCH
      ),
    ]);
    prs = nightly.concat(stable);
  }

  let prsThatTouchedFiles = await getPullRequestWithFiles(owner, repo, prs);

  return {
    merged: prsThatTouchedFiles,
    previousTag: previousTag.tag,
  };
}

type PullRequestWithFiles = PullRequest & {
  files: PullRequestFiles;
};

async function getPullRequestWithFiles(
  owner: string,
  repo: string,
  prs: Array<PullRequest>
): Promise<Array<PullRequestWithFiles>> {
  let prsWithFiles = await Promise.all(
    prs.map(async (pr) => {
      let files = await octokit.paginate(octokit.pulls.listFiles, {
        owner,
        repo,
        per_page: 100,
        pull_number: pr.number,
      });

      return { ...pr, files };
    })
  );

  return prsWithFiles.filter((pr) => {
    return pr.files.some((file) => {
      return checkIfStringStartsWith(file.filename, PR_FILES_STARTS_WITH);
    });
  });
}

function getPreviousTagFromCurrentTag(
  currentTag: string,
  tags: Awaited<ReturnType<typeof getTags>>
): {
  previousTag: MinimalTag;
  currentTag: MinimalTag;
} {
  let validTags = tags
    .map((tag) => {
      let tagName = cleanupTagName(tag.name);
      let isPrerelease = semver.prerelease(tagName) !== null;

      let date = tag.target.committer?.date
        ? new Date(tag.target.committer.date)
        : tag.target.tagger?.date
        ? new Date(tag.target.tagger.date)
        : undefined;

      if (!date) return undefined;

      return { tag: tagName, date, isPrerelease };
    })
    .filter((v: any): v is MinimalTag => typeof v !== "undefined");

  let currentTagIndex = validTags.findIndex((tag) => tag.tag === currentTag);
  let currentTagInfo: MinimalTag | undefined = validTags.at(currentTagIndex);
  let previousTagInfo: MinimalTag | undefined;

  if (!currentTagInfo) {
    throw new Error(`Could not find last tag ${currentTag}`);
  }

  // if the currentTag was a stable tag, then we want to find the previous stable tag
  if (!currentTagInfo.isPrerelease) {
    validTags = validTags
      .filter((tag) => !tag.isPrerelease)
      .sort((a, b) => semver.rcompare(a.tag, b.tag));

    currentTagIndex = validTags.findIndex((tag) => tag.tag === currentTag);
    currentTagInfo = validTags.at(currentTagIndex);
    if (!currentTagInfo) {
      throw new Error(`Could not find last stable tag ${currentTag}`);
    }
  }

  previousTagInfo = validTags.at(currentTagIndex + 1);
  if (!previousTagInfo) {
    throw new Error(
      `Could not find previous prerelease tag from ${currentTag}`
    );
  }

  return {
    currentTag: currentTagInfo,
    previousTag: previousTagInfo,
  };
}

async function getMergedPRsBetweenTags(
  owner: string,
  repo: string,
  startTag: MinimalTag,
  endTag: MinimalTag,
  baseRef: string,
  page: number = 1,
  nodes: Array<PullRequest> = []
): Promise<Array<PullRequest>> {
  let pulls = await octokit.pulls.list({
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: 100,
    page,
    base: baseRef,
  });

  let merged = pulls.data.filter((pull) => {
    if (!pull.merged_at) return false;
    let mergedDate = new Date(pull.merged_at);
    return mergedDate > startTag.date && mergedDate < endTag.date;
  });

  if (pulls.data.length !== 0) {
    return getMergedPRsBetweenTags(
      owner,
      repo,
      startTag,
      endTag,
      baseRef,
      page + 1,
      [...nodes, ...merged]
    );
  }

  return [...nodes, ...merged];
}

interface GitHubGraphqlTag {
  name: string;
  target: {
    oid: string;
    committer?: {
      date: string;
    };
    tagger?: {
      date: string;
    };
  };
}
interface GitHubGraphqlTagResponse {
  repository: {
    refs: {
      nodes: Array<GitHubGraphqlTag>;
    };
  };
}

async function getTags(owner: string, repo: string) {
  let response: GitHubGraphqlTagResponse = await graphqlWithAuth(
    gql`
      query GET_TAGS($owner: String!, $repo: String!) {
        repository(owner: $owner, name: $repo) {
          refs(
            refPrefix: "refs/tags/"
            first: 100
            orderBy: { field: TAG_COMMIT_DATE, direction: DESC }
          ) {
            nodes {
              name
              target {
                oid
                ... on Commit {
                  committer {
                    date
                  }
                }
                ... on Tag {
                  tagger {
                    date
                  }
                }
              }
            }
          }
        }
      }
    `,
    { owner, repo }
  );

  return response.repository.refs.nodes.filter((node) => {
    return (
      node.name.startsWith(PACKAGE_VERSION_TO_FOLLOW) ||
      node.name.startsWith("v0.0.0-nightly-")
    );
  });
}

export async function getIssuesClosedByPullRequests(
  prHtmlUrl: string,
  prBody: string | null
): Promise<Array<{ number: number }>> {
  let linkedIssues = await getIssuesLinkedToPullRequest(prHtmlUrl);
  if (!prBody) {
    return linkedIssues.map((issue) => {
      return { number: issue.number };
    });
  }

  /**
   * This regex matches for one of github's issue references for auto linking an issue to a PR
   * as that only happens when the PR is sent to the default branch of the repo
   * https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
   */
  let regex =
    /(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)(:)?\s#([0-9]+)/gi;
  let matches = prBody.match(regex);
  if (!matches) {
    return linkedIssues.map((issue) => {
      return { number: issue.number };
    });
  }

  let issuesMatch = matches.map((match) => {
    let [, issueNumber] = match.split(" #");
    return { number: parseInt(issueNumber, 10) };
  });

  let issues = await Promise.all(
    issuesMatch.map(async (issue) => {
      return { number: issue.number };
    })
  );

  return [...linkedIssues, ...issues.filter((issue) => issue !== null)];
}

interface GitHubClosingIssueReference {
  resource: {
    closingIssuesReferences: {
      pageInfo: {
        endCursor: string;
        hasNextPage: boolean;
      };
      nodes: Array<{ number: number }>;
    };
  };
}

type IssuesLinkedToPullRequest = Array<{ number: number }>;

async function getIssuesLinkedToPullRequest(
  prHtmlUrl: string,
  nodes: IssuesLinkedToPullRequest = [],
  after?: string
): Promise<IssuesLinkedToPullRequest> {
  let res: GitHubClosingIssueReference = await graphqlWithAuth(
    gql`
      query GET_ISSUES_CLOSED_BY_PR($prHtmlUrl: URI!, $after: String) {
        resource(url: $prHtmlUrl) {
          ... on PullRequest {
            closingIssuesReferences(first: 100, after: $after) {
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
    `,
    { prHtmlUrl, after }
  );

  let newNodes = res?.resource?.closingIssuesReferences?.nodes ?? [];
  nodes.push(
    ...newNodes.map((node) => {
      return { number: node.number };
    })
  );

  if (res?.resource?.closingIssuesReferences?.pageInfo?.hasNextPage) {
    return getIssuesLinkedToPullRequest(
      prHtmlUrl,
      nodes,
      res?.resource?.closingIssuesReferences?.pageInfo?.endCursor
    );
  }

  return nodes;
}

export async function commentOnPullRequest({
  owner,
  repo,
  pr,
  version,
}: {
  owner: string;
  repo: string;
  pr: number;
  version: string;
}) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pr,
    body: `🤖 Hello there,\n\nWe just published version \`${version}\` which includes this pull request. If you'd like to take it for a test run please try it out and let us know what you think!\n\nThanks!`,
  });
}

export async function commentOnIssue({
  owner,
  repo,
  issue,
  version,
}: {
  owner: string;
  repo: string;
  issue: number;
  version: string;
}) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issue,
    body: `🤖 Hello there,\n\nWe just published version \`${version}\` which involves this issue. If you'd like to take it for a test run please try it out and let us know what you think!\n\nThanks!`,
  });
}

export async function closeIssue({
  owner,
  repo,
  issue,
}: {
  owner: string;
  repo: string;
  issue: number;
}) {
  await octokit.issues.update({
    owner,
    repo,
    issue_number: issue,
    state: "closed",
  });
}

export async function removeLabel({
  owner,
  repo,
  issue,
}: {
  owner: string;
  repo: string;
  issue: number;
}) {
  await octokit.issues.removeLabel({
    owner,
    repo,
    issue_number: issue,
    name: AWAITING_RELEASE_LABEL,
  });
}
