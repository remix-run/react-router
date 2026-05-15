import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { colorize, colors } from "./utils/color.ts";
import { logAndExec } from "./utils/process.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

const packageDirNames = fs
  .readdirSync("packages")
  .filter((name) => fs.statSync(`packages/${name}`).isDirectory());

const command = process.argv[2];
const args = process.argv.slice(3);
const dryRun = args.includes("--dry-run");

if (command === "version") {
  await bumpVersion();
} else if (command === "publish") {
  await publishPackages();
} else {
  console.error(
    `Usage: node scripts/experimental.ts [version | publish] [--dry-run] `,
  );
  process.exit(1);
}

async function bumpVersion() {
  if (!dryRun) {
    let status = logAndExec("git status --porcelain", true).trim();
    let lines = status.split("\n");
    invariant(
      lines.every((line) => line === "" || line.startsWith("?")),
      "Working directory is not clean. Please commit or stash your changes.",
    );
  }

  let sha = logAndExec("git rev-parse --short HEAD", true);
  invariant(sha != null, "Failed to get git SHA");
  let version = `0.0.0-experimental-${sha}`;
  let branch = `experimental/${sha}`;
  if (dryRun) {
    console.log(
      colorize(
        `  [Dry Run] Would create and switch to branch ${branch}\n`,
        colors.yellow,
      ),
    );
  } else {
    logAndExec(`git checkout -b ${branch}`);
  }

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

  if (!dryRun) {
    logAndExec(`git commit -am "Version ${version}"`);
    logAndExec(`git tag -am "Version ${version}" v${version}`);
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

  // Get the current tag, which has the release version number
  let version = logAndExec("git tag --list --points-at HEAD", true)
    .split("\n")
    .find((t) => t.includes("experimental"))
    ?.replace(/^v/, "");

  invariant(version, "Missing experimental version");

  // Ensure build versions match the release version
  for (let packageDirName of packageDirNames) {
    let pkgVersion = readPackageJson(packageDirName).version;
    invariant(
      pkgVersion === version,
      `Package ${packageDirName} is on version ${pkgVersion}, but should be on ${version}`,
    );
  }

  // 4. Publish to npm
  let tag = "experimental";
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
