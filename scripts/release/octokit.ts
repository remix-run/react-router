import { Octokit as RestOctokit } from "@octokit/rest";
import type { Octokit as OctokitType } from "@octokit/rest";
import { paginateRest } from "@octokit/plugin-paginate-rest";
import { throttling } from "@octokit/plugin-throttling";
import { graphql } from "@octokit/graphql";

import { GITHUB_TOKEN } from "./constants";

export const graphqlWithAuth = graphql.defaults({
  headers: { authorization: `token ${GITHUB_TOKEN}` },
});

const Octokit = RestOctokit.plugin(paginateRest, throttling);

export const octokit = new Octokit({
  auth: GITHUB_TOKEN,
  throttle: {
    onRateLimit(retryAfter: number, options: any, octokit: OctokitType) {
      octokit.log.warn(
        `Request quota exhausted for request ${options.method} ${options.url}`
      );

      if (options.request.retryCount === 0) {
        // only retries once
        octokit.log.info(`Retrying after ${retryAfter} seconds!`);
        return true;
      }
    },
    onSecondaryRateLimit(
      _retryAfter: number,
      options: any,
      octokit: OctokitType
    ) {
      // does not retry, only logs a warning
      octokit.log.warn(
        `SecondaryRateLimit detected for request ${options.method} ${options.url}`
      );
    },
  },
});

export const gql = String.raw;
