import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import semver from "semver";
import { colorize, colors } from "./utils/color.ts";
import { logAndExec } from "./utils/process.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const packageDirNames = fs
  .readdirSync("packages")
  .filter((name) => fs.statSync(`packages/${name}`).isDirectory());

const command = process.argv[2];
const { values: args } = parseArgs({
  args: process.argv.slice(3).filter((arg) => arg !== "--"),
  options: {
    "dry-run": {
      type: "boolean",
      default: false,
    },
    version: {
      type: "string",
    },
  },
});
const dryRun = args["dry-run"];

if (!dryRun) {
  let status = logAndExec("git status --porcelain", true).trim();
  let lines = status.split("\n");
  invariant(
    lines.every((line) => line === "" || line.startsWith("?")),
    "Working directory is not clean. Please commit or stash your changes.",
  );
}

if (command === "version") {
  invariant(args.version, "Missing required --version argument");
  await bumpVersion(args.version);
} else if (command === "publish") {
  await publishPackages();
} else {
  console.error(
    `Usage: node scripts/prerelease.ts [version --version <version> | publish] [--dry-run]`,
  );
  process.exit(1);
}

async function bumpVersion(version: string) {
  invariant(
    semver.valid(version) && semver.prerelease(version),
    `Invalid prerelease version: ${version}`,
  );

  for (let packageDirName of packageDirNames) {
    if (dryRun) {
      console.log(
        colorize(
          `  [Dry Run] Would update ${packageDirName} to version ${version}`,
          colors.yellow,
        ),
      );
    } else {
      let packageName = updatePackageJson(packageDirName, (pkg) => {
        pkg["version"] = version;
      });
      console.log(
        colorize(
          `  Updated ${packageName} to version ${version}`,
          colors.green,
        ),
      );
    }
  }

  if (dryRun) {
    console.log();
    console.log(
      colorize(
        `  [Dry Run] Would commit and tag version react-router@${version}`,
        colors.yellow,
      ),
    );
  } else {
    logAndExec(`git commit -am "Version ${version}"`);
    logAndExec(`git tag -am "Version ${version}" react-router@${version}`);
    console.log(
      colorize(`  Committed and tagged version ${version}`, colors.green),
    );
  }
}

async function publishPackages() {
  // Ensure we are in CI. We don't do this manually without --dry-run
  invariant(
    dryRun || process.env.CI,
    `You should always run the publish script from the CI environment!`,
  );

  // Get the current react-router tag, which has the release version number
  let tags = logAndExec("git tag --list --points-at HEAD", true)
    .split("\n")
    .filter((tag) => tag.startsWith("react-router@"));

  invariant(
    tags.length === 1,
    tags.length === 0
      ? "Missing react-router prerelease tag"
      : `Found multiple react-router prerelease tags at HEAD: ${tags.join(", ")}`,
  );

  let version = tags[0].replace(/^react-router@/, "");
  invariant(
    semver.valid(version) && semver.prerelease(version),
    `Invalid prerelease version from tag: ${tags[0]}`,
  );

  // Ensure build versions match the release version
  for (let packageDirName of packageDirNames) {
    let pkgVersion = readPackageJson(packageDirName).version;
    invariant(
      pkgVersion === version,
      `Package ${packageDirName} is on version ${pkgVersion}, but should be on ${version}`,
    );
  }

  // 4. Publish to npm
  let tag = "pre";
  let publishCommand = `pnpm publish --recursive --filter "./packages/*" --access public --tag ${tag} --no-git-checks`;
  if (dryRun) {
    console.log(
      colorize(
        `  [Dry Run] Would publish version ${version} to npm with tag "${tag}" via command:\n` +
          `  ${publishCommand}`,
        colors.yellow,
      ),
    );
  } else {
    console.log(`  Publishing version ${version} to npm with tag "${tag}"`);
    logAndExec(publishCommand);
    console.log(`  Publishing completed`);
  }
}

// --- Utilities ---

function invariant(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function readPackageJson(packageDirName: string): Record<string, unknown> {
  let file = path.join(rootDir, "packages", packageDirName, "package.json");
  let raw: unknown = JSON.parse(fs.readFileSync(file, "utf-8"));
  invariant(
    typeof raw === "object" && raw !== null,
    `Invalid package.json at ${file}`,
  );
  return raw as Record<string, unknown>;
}

function updatePackageJson(
  packageDirName: string,
  transform: (pkg: Record<string, unknown>) => void,
): string | undefined {
  let file = path.join(rootDir, "packages", packageDirName, "package.json");
  let pkg = readPackageJson(packageDirName);
  transform(pkg);
  fs.writeFileSync(file, JSON.stringify(pkg, null, 2) + "\n");
  let name = pkg["name"];
  return typeof name === "string" ? name : undefined;
}
