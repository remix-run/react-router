import { Octokit as RestOctokit } from "@octokit/rest";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { graphql } from "@octokit/graphql";

import {
  GITHUB_TOKEN,
  GITHUB_REPOSITORY,
  PR_FILES_STARTS_WITH,
} from "./constants.mjs";

const graphqlWithAuth = graphql.defaults({
  headers: { authorization: `token ${GITHUB_TOKEN}` },
});

const Octokit = RestOctokit.plugin(paginateRest);
const octokit = new Octokit({ auth: GITHUB_TOKEN });

const gql = String.raw;

export async function prsMergedSinceLast({
  owner,
  repo,
  lastRelease: lastReleaseVersion,
}) {
  let releases = await octokit.paginate(octokit.rest.repos.listReleases, {
    owner,
    repo,
    per_page: 100,
  });

  let sorted = releases
    .sort((a, b) => {
      return new Date(b.published_at) - new Date(a.published_at);
    })
    .filter((release) => {
      return release.tag_name.includes("experimental") === false;
    });

  let lastReleaseIndex = sorted.findIndex((release) => {
    return release.tag_name === lastReleaseVersion;
  });

  let lastRelease = sorted[lastReleaseIndex];
  if (!lastRelease) {
    throw new Error(
      `Could not find last release ${lastRelease} in ${GITHUB_REPOSITORY}`
    );
  }

  // if the lastRelease was a stable release, then we want to find the previous stable release
  let previousRelease;
  if (lastRelease.prerelease === false) {
    let stableReleases = sorted.filter((release) => {
      return release.prerelease === false;
    });
    previousRelease = stableReleases.at(1);
  } else {
    previousRelease = sorted.at(lastReleaseIndex + 1);
  }

  if (!previousRelease) {
    throw new Error(`Could not find previous release in ${GITHUB_REPOSITORY}`);
  }

  let startDate = new Date(previousRelease.created_at);
  let endDate = new Date(lastRelease.created_at);

  let prs = await octokit.paginate(octokit.pulls.list, {
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
  });

  let mergedPullRequestsSinceLastTag = prs.filter((pullRequest) => {
    if (!pullRequest.merged_at) return false;
    let mergedDate = new Date(pullRequest.merged_at);
    return mergedDate > startDate && mergedDate < endDate;
  });

  let prsWithFiles = await Promise.all(
    mergedPullRequestsSinceLastTag.map(async (pr) => {
      let files = await octokit.paginate(octokit.pulls.listFiles, {
        owner,
        repo,
        per_page: 100,
        pull_number: pr.number,
      });

      return {
        ...pr,
        files,
      };
    })
  );

  return {
    previousRelease: previousRelease.tag_name,
    merged: prsWithFiles.filter((pr) => {
      return pr.files.some((file) => {
        return checkIfStringStartsWith(file.filename, PR_FILES_STARTS_WITH);
      });
    }),
  };
}

export async function commentOnPullRequest({ owner, repo, pr, version }) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pr,
    body: `🤖 Hello there,\n\nWe just published version \`${version}\` which includes this pull request. If you'd like to take it for a test run please try it out and let us know what you think!\n\nThanks!`,
  });
}

export async function commentOnIssue({ owner, repo, issue, version }) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: issue,
    body: `🤖 Hello there,\n\nWe just published version \`${version}\` which involves this issue. If you'd like to take it for a test run please try it out and let us know what you think!\n\nThanks!`,
  });
}

async function getIssuesLinkedToPullRequest(prHtmlUrl, nodes = [], after) {
  let res = await graphqlWithAuth(
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
  nodes.push(...newNodes);

  if (res?.resource?.closingIssuesReferences?.pageInfo?.hasNextPage) {
    return getIssuesLinkedToPullRequest(
      prHtmlUrl,
      nodes,
      res?.resource?.closingIssuesReferences?.pageInfo?.endCursor
    );
  }

  return nodes;
}

export async function getIssuesClosedByPullRequests(prHtmlUrl, prBody) {
  let linked = await getIssuesLinkedToPullRequest(prHtmlUrl);
  if (!prBody) return linked;

  /**
   * This regex matches for one of github's issue references for auto linking an issue to a PR
   * as that only happens when the PR is sent to the default branch of the repo
   * https://docs.github.com/en/issues/tracking-your-work-with-issues/linking-a-pull-request-to-an-issue#linking-a-pull-request-to-an-issue-using-a-keyword
   */
  let regex =
    /(close|closes|closed|fix|fixes|fixed|resolve|resolves|resolved)\s#([0-9]+)/gi;
  let matches = prBody.match(regex);
  if (!matches) return linked;

  let issues = matches.map((match) => {
    let [, issueNumber] = match.split(" #");
    return { number: parseInt(issueNumber, 10) };
  });

  return [...linked, ...issues.filter((issue) => issue !== null)];
}

function checkIfStringStartsWith(string, substrings) {
  return substrings.some((substr) => string.startsWith(substr));
}
