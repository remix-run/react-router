import { GITHUB_REPOSITORY, PACKAGE_VERSION_TO_FOLLOW } from "./constants";

export function checkIfStringStartsWith(
  string: string,
  substrings: Array<string>
): boolean {
  return substrings.some((substr) => string.startsWith(substr));
}

export interface MinimalTag {
  tag: string;
  date: Date;
  isPrerelease: boolean;
}

export function getGitHubUrl(type: "pull" | "issue", number: number) {
  let segment = type === "pull" ? "pull" : "issues";
  return `https://github.com/${GITHUB_REPOSITORY}/${segment}/${number}`;
}

export function cleanupTagName(tagName: string) {
  if (PACKAGE_VERSION_TO_FOLLOW) {
    let regex = new RegExp(`^${PACKAGE_VERSION_TO_FOLLOW}@`);
    return tagName.replace(regex, "");
  }

  return tagName;
}

export function cleanupRef(ref: string) {
  return ref.replace(/^refs\/tags\//, "");
}

export function isNightly(tagName: string) {
  return tagName.startsWith("v0.0.0-nightly-");
}
