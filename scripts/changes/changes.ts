import * as fs from "node:fs";
import * as path from "node:path";
import * as semver from "semver";
import { fileExists, readFile, readJson } from "../utils/fs.ts";
import {
  getAllPackageDirNames,
  getGitHubReleaseUrl,
  getGitTag,
  getPackageDependencies,
  getPackageFile,
  getPackagePath,
  packageNameToDirectoryName,
} from "../utils/packages.ts";
import { getCommitSubject, getFileSha, parsePrNumber } from "../utils/git.ts";

const bumpTypes = ["major", "minor", "patch", "unstable"] as const;
type BumpType = (typeof bumpTypes)[number];

/**
 * Calculates the next version based on current version, bump type, and changes config.
 */
function getNextVersion(currentVersion: string, bumpType: BumpType): string {
  if (bumpType === "unstable") {
    throw new Error(
      "`unstable` bump type should be normalized to a semver bump before calling `getNextVersion`",
    );
  }
  // Normal stable release
  let nextVersion = semver.inc(currentVersion, bumpType as semver.ReleaseType);
  if (nextVersion == null) {
    throw new Error(
      `Invalid version increment: ${currentVersion} + ${bumpType}`,
    );
  }
  return nextVersion;
}

interface ChangeFile {
  file: string;
  bump: BumpType;
  content: string;
  gitSha?: string;
  prNumber?: number;
}

interface ValidationError {
  packageDirName: string;
  file: string;
  error: string;
}

type ParsedPackageChanges =
  | { valid: true; changes: ChangeFile[] }
  | { valid: false; errors: ValidationError[] };

/**
 * Parses and validates all change files for a package.
 * Returns changes if valid, or errors if invalid.
 */
function parsePackageChanges(packageDirName: string): ParsedPackageChanges {
  let packagePath = getPackagePath(packageDirName);
  let changesDir = path.join(packagePath, ".changes");
  let changes: ChangeFile[] = [];
  let errors: ValidationError[] = [];

  // Changes directory should exist (with at least .gitkeep)
  if (!fs.existsSync(changesDir)) {
    return {
      valid: false,
      errors: [
        {
          packageDirName,
          file: ".changes/",
          error: "Changes directory does not exist",
        },
      ],
    };
  }

  // .gitkeep should exist in .changes directory so it persists between releases
  let gitkeepPath = path.join(changesDir, ".gitkeep");
  if (!fs.existsSync(gitkeepPath)) {
    errors.push({
      packageDirName,
      file: ".changes/.gitkeep",
      error: ".gitkeep is missing from .changes directory",
    });
  }

  // Get package version to determine validation rules
  let packageJsonPath = getPackageFile(packageDirName, "package.json");
  let packageJson = readJson(packageJsonPath);
  let currentVersion = packageJson.version as string;

  // Read all files in .changes directory
  let changeFileNames = fs
    .readdirSync(changesDir)
    .filter((file) => file.endsWith(".md"));

  for (let file of changeFileNames) {
    // Parse and validate filename format (e.g. "minor.add-feature.md")
    let bump: BumpType | null = null;

    let withoutExt = path.basename(file, ".md");
    let dotIndex = withoutExt.indexOf(".");
    if (dotIndex !== -1) {
      let bumpStr = withoutExt.slice(0, dotIndex);
      let name = withoutExt.slice(dotIndex + 1);
      if (bumpTypes.includes(bumpStr as BumpType) && name.length > 0) {
        bump = bumpStr as BumpType;
      }
    }

    if (bump == null) {
      errors.push({
        packageDirName,
        file,
        error:
          'Change file must be a ".md" file starting with "major.", "minor.", ' +
          '"patch.", or "unstable." (e.g. "minor.add-feature.md")',
      });
      continue;
    }

    // Read file content
    let filePath = path.join(changesDir, file);
    let content = fs.readFileSync(filePath, "utf-8").trim();

    // Check if file is not empty
    if (content.length === 0) {
      errors.push({
        packageDirName,
        file,
        error: "Change file cannot be empty",
      });
      continue;
    }

    // Check if first line starts with a bullet point
    let firstLine = content.split("\n")[0].trim();
    if (firstLine.startsWith("- ") || firstLine.startsWith("* ")) {
      errors.push({
        packageDirName,
        file,
        error:
          "Change file should not start with a bullet point (- or *). The bullet will be added automatically in the CHANGELOG. Just write the text directly.",
      });
      continue;
    }

    // Check for headings that aren't level 4, 5, or 6
    let invalidHeadingMatch = content.match(/^(#{1,3}|#{7,})\s+/m);
    if (invalidHeadingMatch) {
      let headingLevel = invalidHeadingMatch[1].length;
      errors.push({
        packageDirName,
        file,
        error: `Headings in change files must be level 4 (####), 5 (#####), or 6 (######), but found level ${headingLevel}. This is because change files are nested within the changelog which already uses heading levels 1-3.`,
      });
      continue;
    }

    // Validate breaking change prefix matches the correct bump type (only for stable releases)
    // In prerelease mode, breaking changes don't need special handling since we're just bumping counter
    let isBreakingChange = hasBreakingChangePrefix(content);

    if (isBreakingChange && bump !== "major") {
      errors.push({
        packageDirName,
        file,
        error: `Breaking changes in v1+ packages must use "major." prefix (current version: ${currentVersion}). Rename to "major.${file.slice(file.indexOf(".") + 1)}"`,
      });
      continue;
    }

    // File is valid, add to changes
    let gitSha = getFileSha(filePath).substring(0, 7);
    let prNumber = parsePrNumber(getCommitSubject(gitSha)) ?? undefined;
    changes.push({ file, bump, content, gitSha, prNumber });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, changes };
}

/**
 * Represents a dependency that was bumped, triggering this release.
 */
export interface DependencyBump {
  packageName: string;
  version: string;
  releaseUrl: string;
}

export interface PackageRelease {
  packageDirName: string;
  packageName: string;
  currentVersion: string;
  nextVersion: string;
  bump: BumpType;
  changes: ChangeFile[];
  /** Dependencies that were bumped, triggering this release (if any) */
  dependencyBumps: DependencyBump[];
}

type ParsedChanges =
  | { valid: true; releases: PackageRelease[] }
  | { valid: false; errors: ValidationError[] };

/**
 * Parses and validates all change files across all packages.
 * Also includes packages that need to be released due to dependency changes.
 * Returns releases if valid, or errors if invalid.
 */
export function parseAllChangeFiles(): ParsedChanges {
  let packageDirNames = getAllPackageDirNames();
  let errors: ValidationError[] = [];

  // Build maps for lookup
  let dirNameToPackageName = new Map<string, string>();
  let packageNameToDirName = new Map<string, string>();

  // First pass: collect package info and validate change files
  interface ParsedPackageInfo {
    packageDirName: string;
    packageName: string;
    currentVersion: string;
    changes: ChangeFile[];
  }
  let parsedPackages: ParsedPackageInfo[] = [];

  for (let packageDirName of packageDirNames) {
    let parsed = parsePackageChanges(packageDirName);

    if (!parsed.valid) {
      errors.push(...parsed.errors);
      continue;
    }

    let packageJsonPath = getPackageFile(packageDirName, "package.json");
    let packageJson = readJson(packageJsonPath);
    let packageName = packageJson.name as string;
    let currentVersion = packageJson.version as string;

    dirNameToPackageName.set(packageDirName, packageName);
    packageNameToDirName.set(packageName, packageDirName);

    parsedPackages.push({
      packageDirName,
      packageName,
      currentVersion,
      changes: parsed.changes,
    });
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  let allChanges = new Set(
    parsedPackages.flatMap((p) => p.changes.flatMap((c) => c.bump)),
  );

  if (allChanges.size === 0) {
    return { valid: true, releases: [] };
  }

  let bump: BumpType = allChanges.has("major")
    ? "major"
    : allChanges.has("minor")
      ? "minor"
      : "patch";
  let nextVersion = getNextVersion(parsedPackages[0].currentVersion, bump);

  // Find packages with direct changes
  let directlyChangedPackages = new Set<string>();
  for (let pkg of parsedPackages) {
    if (pkg.changes.length > 0) {
      directlyChangedPackages.add(pkg.packageName);
    }
  }

  // All packages that will be released
  let allReleasingPackages = new Set<string>(
    parsedPackages.map((p) => p.packageName),
  );

  // Now build the final releases with dependency bumps
  let releases: PackageRelease[] = [];

  for (let pkg of parsedPackages) {
    // Compute dependency bumps: which of this package's direct dependencies are being released?
    let dependencyBumps: DependencyBump[] = [];
    let deps = getPackageDependencies(pkg.packageName);

    for (let depName of deps) {
      if (allReleasingPackages.has(depName)) {
        dependencyBumps.push({
          packageName: depName,
          version: nextVersion,
          releaseUrl: getGitHubReleaseUrl(depName, nextVersion),
        });
      }
    }

    // Sort dependency bumps by package name
    dependencyBumps.sort((a, b) =>
      packageNameComparator(a.packageName, b.packageName),
    );

    if (dependencyBumps.length === 0 && pkg.changes.length === 0) {
      pkg.changes.push({
        file: "no-changes--lockstep.md",
        bump: "patch",
        content: "_No changes_",
      });
    }

    releases.push({
      packageDirName: pkg.packageDirName,
      packageName: pkg.packageName,
      currentVersion: pkg.currentVersion,
      nextVersion,
      bump,
      changes: pkg.changes,
      dependencyBumps,
    });
  }

  // Sort releases with custom ordering: react-router first, then react-router-dom,
  // then @react-router/* packages sorted alphabetically, then others
  releases.sort((a, b) => packageNameComparator(a.packageName, b.packageName));

  return { valid: true, releases };
}

function packageNameComparator(a: string, b: string) {
  const order = (name: string): [number, string] => {
    if (name === "react-router") return [0, name];
    if (name === "react-router-dom") return [1, name];
    if (name.startsWith("@react-router/")) return [2, name];
    return [3, name];
  };

  const [orderA, nameA] = order(a);
  const [orderB, nameB] = order(b);

  if (orderA !== orderB) return orderA - orderB;
  return nameA.localeCompare(nameB);
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  let errorsByPackageDirName: Record<string, ValidationError[]> = {};
  for (let error of errors) {
    if (!errorsByPackageDirName[error.packageDirName]) {
      errorsByPackageDirName[error.packageDirName] = [];
    }
    errorsByPackageDirName[error.packageDirName].push(error);
  }

  let lines: string[] = [];

  for (let [packageDirName, packageErrors] of Object.entries(
    errorsByPackageDirName,
  )) {
    lines.push(`📦 ${packageDirName}:`);
    for (let error of packageErrors) {
      lines.push(`   ${error.file}: ${error.error}`);
    }
    lines.push("");
  }

  let packageCount = Object.keys(errorsByPackageDirName).length;
  lines.push(
    `Found ${errors.length} error${errors.length === 1 ? "" : "s"} in ${packageCount} package${packageCount === 1 ? "" : "s"}`,
  );

  return lines.join("\n");
}

/**
 * Checks if content starts with "BREAKING CHANGE: " (case-insensitive,
 * ignoring markdown formatting and leading whitespace)
 */
function hasBreakingChangePrefix(content: string): boolean {
  return content
    .trimStart()
    .replace(/^[*_]+/, "")
    .toLowerCase()
    .startsWith("breaking change: ");
}

/**
 * Formats a changelog entry from change file content
 */
function formatChangelogEntry(change: ChangeFile): string {
  let lines = change.content.trim().split("\n");
  let base = "https://github.com/remix-run/react-router";
  let link = change.prNumber
    ? ` ([#${change.prNumber}](${base}/pull/${change.prNumber}))`
    : change.gitSha
      ? ` ([[${change.gitSha}](${base}/commit/${change.gitSha}))`
      : "";

  if (lines.length === 1) {
    return `- ${lines[0]}${link}`;
  }

  // Multi-line: first line is bullet, rest are indented
  let [firstLine, ...restLines] = lines;
  let formatted = [`- ${firstLine}${link}`];

  for (let line of restLines) {
    // Add proper indentation for continuation lines
    formatted.push(line ? `  ${line}` : "");
  }

  return formatted.join("\n");
}

/**
 * Generates a section for a specific bump type (e.g., "### Major Changes")
 */
const sectionTitles: Record<BumpType, string> = {
  major: "Major Changes",
  minor: "Minor Changes",
  patch: "Patch Changes",
  unstable: "Unstable Changes",
};

function generateBumpTypeSection(
  _changes: PackageRelease["changes"],
  bumpType: BumpType,
  subheadingLevel: number,
  options: { skipSort?: boolean } = {},
): string | null {
  let changes = _changes.filter((c) => c.bump === bumpType);

  if (changes.length === 0) {
    return null;
  }

  // Sort with breaking changes hoisted to top, then alphabetically by filename
  if (!options.skipSort) {
    changes.sort((a, b) => {
      let aBreaking = hasBreakingChangePrefix(a.content);
      let bBreaking = hasBreakingChangePrefix(b.content);
      if (aBreaking !== bBreaking) return aBreaking ? -1 : 1;
      return a.file.localeCompare(b.file);
    });
  }

  let lines: string[] = [];
  let subheadingPrefix = "#".repeat(subheadingLevel);

  lines.push(`${subheadingPrefix} ${sectionTitles[bumpType]}`);
  lines.push("");

  if (bumpType === "unstable") {
    lines.push(
      "⚠️  _[Unstable features](https://reactrouter.com/community/api-development-strategy#unstable-flags) " +
        "are not recommended for production use_",
    );
    lines.push("");
  }

  let includeBlankLine = changes.some((change) =>
    change.content.trim().includes("\n\n"),
  );

  for (let change of changes) {
    lines.push(formatChangelogEntry(change.content));
    if (includeBlankLine) {
      lines.push("");
    }
  }

  return lines.join("\n") + (!includeBlankLine ? "\n" : "");
}

/**
 * Generates changelog content for a package release
 */
export function generateChangelogContent(
  release: PackageRelease,
  options: {
    /** Whether to include package name in heading. Default: false */
    includePackageName?: boolean;
    /** Whether to include the date in heading. Default: false */
    includeDate?: boolean;
    /** Markdown heading level (2 = ##, 3 = ###). Default: 2 */
    headingLevel?: 2 | 3;
    /** Optional footer to append at the end */
    footerLines?: string[];
    /** Whether to skip sorting changes (for root changelog generation). Default: false */
    skipSort?: boolean;
  } = {},
): string {
  let { includePackageName = false, headingLevel = 2 } = options;
  let lines: string[] = [];

  let headingPrefix = "#".repeat(headingLevel);
  let packagePart = includePackageName ? `${release.packageName} ` : "";
  lines.push(`${headingPrefix} ${packagePart}v${release.nextVersion}`);
  lines.push("");

  if (options.includeDate) {
    let now = new Date();
    // Generate a YYYY-MM-DD date for the local timezone, not GMT
    let dateStr = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours() - now.getTimezoneOffset() / 60,
    )
      .toISOString()
      .substring(0, 10);
    lines.push(`Date: ${dateStr}`);
    lines.push("");
  }

  let subheadingLevel = headingLevel + 1;

  // Generate sections in order: major, minor, patch (skipping empty sections)
  for (let bumpType of bumpTypes) {
    let section = generateBumpTypeSection(
      release.changes,
      bumpType,
      subheadingLevel,
      { skipSort: options.skipSort },
    );
    if (section) {
      lines.push(section);
    }
  }

  // Add dependency bumps section if there are any
  // Only add if there are no other patch changes (to avoid duplicate "Patch Changes" heading)
  if (release.dependencyBumps.length > 0) {
    let hasPatchChanges = release.changes.some((c) => c.bump === "patch");
    if (!hasPatchChanges) {
      let subheadingPrefix = "#".repeat(subheadingLevel);
      lines.push(`${subheadingPrefix} Patch Changes`);
      lines.push("");
    } else if (lines[lines.length - 1].endsWith("\n")) {
      lines[lines.length - 1] = lines[lines.length - 1].trimEnd();
    }

    lines.push("- Updated dependencies:");
    for (let dep of release.dependencyBumps) {
      let tag = getGitTag(dep.packageName, dep.version);
      lines.push(`  - [\`${tag}\`](${dep.releaseUrl})`);
    }
    lines.push("");
  }

  if (options.footerLines) {
    lines.push(...options.footerLines);
    lines.push("");
  }

  return lines.join("\n");
}

/**
 * Generates the commit message for the release
 */
export function generateCommitMessage(releases: PackageRelease[]): string {
  // We use lock-step versioning in RR, so just grab the first release version
  return `Release v${releases[0].nextVersion}`;
}

// =============================================================================
// CHANGELOG.md parsing utilities (for reading already-released changes)
// =============================================================================

interface ChangelogEntry {
  version: string;
  date?: Date;
  body: string;
}

type AllChangelogEntries = Record<string, ChangelogEntry>;

/**
 * Parses a package's CHANGELOG.md and returns all version entries
 */
function parseChangelog(packageDirName: string): AllChangelogEntries | null {
  let changelogPath = getPackageFile(packageDirName, "CHANGELOG.md");

  if (!fileExists(changelogPath)) {
    return null;
  }

  let changelog = readFile(changelogPath);
  let parser = /^## ([a-z\d.-]+)(?: \(([^)]+)\))?$/gim;

  let result: AllChangelogEntries = {};

  let match;
  while ((match = parser.exec(changelog))) {
    let [, versionString, dateString] = match;
    let lastIndex = parser.lastIndex;
    let version = versionString.startsWith("v")
      ? versionString.slice(1)
      : versionString;
    let date = dateString ? new Date(dateString) : undefined;
    let nextMatch = parser.exec(changelog);
    let body = changelog
      .slice(lastIndex, nextMatch ? nextMatch.index : undefined)
      .trim();
    result[version] = { version, date, body };
    parser.lastIndex = lastIndex;
  }

  return result;
}

/**
 * Gets a specific version's entry from a package's CHANGELOG.md.
 * Accepts an npm package name (e.g., "@react-router/node" or "react-router").
 */
export function getChangelogEntry({
  packageName,
  version,
}: {
  packageName: string;
  version: string;
}): ChangelogEntry | null {
  let dirName = packageNameToDirectoryName(packageName);
  if (dirName === null) {
    return null;
  }

  let allEntries = parseChangelog(dirName);
  if (allEntries !== null) {
    return allEntries[version] ?? null;
  }

  return null;
}
