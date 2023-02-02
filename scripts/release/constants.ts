import { cleanupRef, cleanupTagName, isNightly, isStable } from "./utils";

if (!process.env.DEFAULT_BRANCH) {
  throw new Error("DEFAULT_BRANCH is required");
}
if (!process.env.RELEASE_BRANCH) {
  throw new Error("RELEASE_BRANCH is required");
}
if (!process.env.GITHUB_TOKEN) {
  throw new Error("GITHUB_TOKEN is required");
}
if (!process.env.GITHUB_REPOSITORY) {
  throw new Error("GITHUB_REPOSITORY is required");
}
if (!process.env.VERSION) {
  throw new Error("VERSION is required");
}
if (!/^refs\/tags\//.test(process.env.VERSION)) {
  throw new Error("VERSION must start with refs/tags/");
}
if (!process.env.PACKAGE_VERSION_TO_FOLLOW) {
  throw new Error("PACKAGE_VERSION_TO_FOLLOW is required");
}

export const [OWNER, REPO] = process.env.GITHUB_REPOSITORY.split("/");
export const PACKAGE_VERSION_TO_FOLLOW = process.env.PACKAGE_VERSION_TO_FOLLOW;
export const VERSION = cleanupTagName(cleanupRef(process.env.VERSION));
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const GITHUB_REPOSITORY = process.env.GITHUB_REPOSITORY;
export const DEFAULT_BRANCH = process.env.DEFAULT_BRANCH;
export const RELEASE_BRANCH = process.env.RELEASE_BRANCH;
export const PR_FILES_STARTS_WITH = ["packages/"];
export const IS_NIGHTLY_RELEASE = isNightly(VERSION);
export const AWAITING_RELEASE_LABEL = "awaiting release";
export const IS_STABLE_RELEASE = isStable(VERSION);
export const DRY_RUN = process.env.DRY_RUN === "true";
