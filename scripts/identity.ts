/**
 * Fetches recent PR authors from a GitHub repo and analyzes their public
 * activity with @unveil/identity.
 *
 * Usage:
 *   node scripts/identity.ts
 *   node scripts/identity.ts --repo remix-run/react-router --limit 3
 *   node scripts/identity.ts --state all
 *   node scripts/identity.ts remix-run/react-router --limit 5
 *   node scripts/identity.ts --username brophdawg11
 *   node scripts/identity.ts --verbose
 *
 * Environment:
 *   GITHUB_TOKEN - Optional, increases GitHub API rate limits.
 */
import { parseArgs } from "node:util";

import { request } from "@octokit/request";
import { type IdentifyResult, identify } from "@unveil/identity";

let parsed: ReturnType<typeof parseArgs>;

try {
  parsed = parseArgs({
    args: process.argv.slice(2),
    allowPositionals: true,
    options: {
      help: {
        type: "boolean",
        short: "h",
      },
      limit: {
        type: "string",
        default: "3",
      },
      repo: {
        type: "string",
        default: "remix-run/react-router",
      },
      state: {
        type: "string",
        default: "open",
      },
      username: {
        type: "string",
      },
      verbose: {
        type: "boolean",
        short: "v",
      },
    },
    tokens: true,
  } as const);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  printHelp();
  process.exit(1);
}

if (
  parsed.values.help ||
  typeof parsed.values.repo !== "string" ||
  typeof parsed.values.limit !== "string" ||
  typeof parsed.values.state !== "string" ||
  (parsed.values.username != null && typeof parsed.values.username !== "string")
) {
  printHelp();
  process.exit(0);
}

let username = parsed.values.username;
let hasLimit = parsed.tokens?.some(
  (token) => token.kind === "option" && token.name === "limit",
);

if (username && hasLimit) {
  console.error("--username and --limit are mutually exclusive.");
  process.exit(1);
}

let authors = new Set<string>();

let headers = {
  ...(process.env.GITHUB_TOKEN
    ? { authorization: `token ${process.env.GITHUB_TOKEN}` }
    : {}),
};

if (username) {
  authors.add(username);
} else {
  let repo = parsed.positionals[0] ?? parsed.values.repo;
  let [owner, repoName] = repo.split("/");
  if (!owner || !repoName) {
    console.error(`Invalid repo "${repo}". Expected "owner/name".`);
    process.exit(1);
  }

  let limit = Number(parsed.values.limit);
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    console.error("--limit must be an integer between 1 and 100.");
    process.exit(1);
  }

  let state = parsed.values.state;
  if (state !== "open" && state !== "closed" && state !== "all") {
    console.error('--state must be one of "open", "closed", or "all".');
    process.exit(1);
  }

  let { data: pullRequests } = await request("GET /repos/{owner}/{repo}/pulls", {
    owner,
    repo: repoName,
    state,
    sort: "created",
    direction: "desc",
    per_page: limit,
    headers,
  });

  for (let pullRequest of pullRequests) {
    if (pullRequest.user?.login) {
      authors.add(pullRequest.user.login);
    }
  }
}

let results = new Map<string, IdentifyResult>();

for (let username of authors) {
  let [{ data: user }, { data: events }] = await Promise.all([
    request("GET /users/{username}", {
      username,
      headers,
    }),
    request("GET /users/{username}/events", {
      username,
      per_page: 100,
      headers,
    }),
  ]);

  results.set(
    username,
    identify({
      createdAt: user.created_at,
      reposCount: user.public_repos,
      accountName: user.login,
      events,
    }),
  );
}

let sortedResults = Array.from(results).sort(
  ([authorA, resultA], [authorB, resultB]) =>
    resultB.score - resultA.score || authorA.localeCompare(authorB),
);

if (parsed.values.verbose) {
  console.log(JSON.stringify(Object.fromEntries(sortedResults), null, 2));
} else if (username) {
  console.log(sortedResults[0]?.[1].score);
} else {
  printTable(sortedResults);
}

function printTable(results: [string, IdentifyResult][]) {
  let authorWidth = Math.max(
    "author".length,
    ...results.map(([author]) => author.length),
  );
  let scoreWidth = Math.max(
    "score".length,
    ...results.map(([, result]) => String(result.score).length),
  );

  console.log(`${"author".padEnd(authorWidth)} -> ${"score".padStart(scoreWidth)}`);
  console.log(`${"-".repeat(authorWidth)}    ${"-".repeat(scoreWidth)}`);

  for (let [author, result] of results) {
    console.log(
      `${author.padEnd(authorWidth)} -> ${String(result.score).padStart(scoreWidth)}`,
    );
  }
}

function printHelp() {
  console.log(`Usage:
  node scripts/identity.ts
  node scripts/identity.ts --repo remix-run/react-router --limit 3
  node scripts/identity.ts --state all
  node scripts/identity.ts remix-run/react-router --limit 5
  node scripts/identity.ts --username brophdawg11
  node scripts/identity.ts --verbose`);
}
