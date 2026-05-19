import * as cp from "node:child_process";

function execGit(args: string[]): string {
  return cp
    .execFileSync("git", args, { stdio: "pipe", encoding: "utf-8" })
    .trim();
}

function parseVersionFromPackageJson(content: string): string | null {
  try {
    let parsed = JSON.parse(content) as Record<string, unknown>;
    return typeof parsed.version === "string" ? parsed.version : null;
  } catch {
    return null;
  }
}

function getPackageVersionAtRef(
  ref: string,
  packageJsonPath: string,
): string | null {
  try {
    let content = execGit(["show", `${ref}:${packageJsonPath}`]);
    return parseVersionFromPackageJson(content);
  } catch {
    return null;
  }
}

/**
 * Finds the commit that introduced a specific version in a package.json file.
 * Returns null when the version can't be found in the available git history.
 */
export function findVersionIntroductionCommit(
  packageJsonPath: string,
  version: string,
): string | null {
  let normalizedPath = packageJsonPath.replaceAll("\\", "/");

  let output: string;
  try {
    output = execGit(["log", "--format=%H", "--", normalizedPath]);
  } catch {
    return null;
  }

  if (output.length === 0) {
    return null;
  }

  let commits = output.split("\n").filter((line) => line.length > 0);

  for (let commit of commits) {
    let commitVersion = getPackageVersionAtRef(commit, normalizedPath);
    if (commitVersion !== version) {
      continue;
    }

    let parentLine = execGit(["rev-list", "--parents", "-n", "1", commit]);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    let [_commit, ...parents] = parentLine
      .split(" ")
      .filter((line) => line.length > 0);

    if (parents.length === 0) {
      return commit;
    }

    let introducedInCommit = false;
    for (let parent of parents) {
      let parentVersion = getPackageVersionAtRef(parent, normalizedPath);
      if (parentVersion !== version) {
        introducedInCommit = true;
        break;
      }
    }

    if (introducedInCommit) {
      return commit;
    }
  }

  return null;
}

/**
 * Gets the local commit target for a tag.
 * Returns null when the tag does not exist locally.
 */
export function getLocalTagTarget(tag: string): string | null {
  try {
    return execGit(["rev-parse", "--verify", `refs/tags/${tag}^{commit}`]);
  } catch {
    return null;
  }
}

/**
 * Gets the remote commit target for a tag from origin.
 * Returns null when the tag does not exist remotely.
 */
export function getRemoteTagTarget(tag: string): string | null {
  try {
    let output = execGit([
      "ls-remote",
      "--tags",
      "origin",
      `refs/tags/${tag}`,
      `refs/tags/${tag}^{}`,
    ]);
    let lines = output.split("\n").filter((line) => line.length > 0);
    if (lines.length === 0) {
      return null;
    }

    let peeledLine = lines.find((line) => line.endsWith(`refs/tags/${tag}^{}`));
    if (peeledLine) {
      return peeledLine.split("\t")[0];
    }

    return lines[0].split("\t")[0];
  } catch {
    return null;
  }
}

/**
 * Check if a git tag exists
 */
export function tagExists(tag: string): boolean {
  return getLocalTagTarget(tag) !== null || getRemoteTagTarget(tag) !== null;
}

/**
 * Gets the git SHA of the commit that introduced a file (the add commit),
 * so subsequent edits don't steal credit from the PR that introduced it.
 * Falls back to HEAD if the file has no git history (e.g., untracked or newly staged).
 */
export function getFileSha(filePath: string): string {
  let normalizedPath = filePath.replaceAll("\\", "/");
  try {
    let sha = execGit([
      "log",
      "-1",
      "--diff-filter=A",
      "--format=%H",
      "--",
      normalizedPath,
    ]);
    if (sha) return sha;
  } catch {}
  return execGit(["rev-parse", "HEAD"]);
}

/**
 * Gets the subject line (first line) of a commit message for a given SHA.
 */
export function getCommitSubject(sha: string): string {
  return execGit(["log", "-1", "--format=%s", sha]);
}

/**
 * Parses a GitHub PR number from a commit subject line.
 * Supports squash merge format "description (#123)" and
 * merge commit format "Merge pull request #123 from ...".
 */
export function parsePrNumber(subject: string): number | null {
  let squashMatch = subject.match(/\(#(\d+)\)\s*$/);
  if (squashMatch) return parseInt(squashMatch[1], 10);

  let mergeMatch = subject.match(/^Merge pull request #(\d+)/i);
  if (mergeMatch) return parseInt(mergeMatch[1], 10);

  return null;
}
