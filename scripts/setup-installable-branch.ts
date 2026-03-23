import * as fsp from "node:fs/promises";
import * as path from "node:path";
import * as util from "node:util";
import { logAndExec } from "./utils/process.ts";

/**
 * This script prepares a base branch (usually `dev`) to be PNPM-installable
 * directly from GitHub via a new branch (usually `preview/dev`):
 *
 *   pnpm install "remix-run/react-router#preview/dev&path:packages/react-router"
 *
 * To do this, we can run a build, make some minor changes to the repo, and
 * commit the build + changes to the new branch. These changes would never be
 * down-merged back to the source branch.
 *
 * This script does the following:
 *  - Checks out the new branch and resets it to the base (current) branch
 *  - Runs a build
 *  - Removes `dist/` from `.gitignore`
 *  - Updates all internal `@react-router/*` deps to use the github format for the
 *    given installable branch
 *  - Copies all `publishConfig`'s down so we get `exports` from `dist/` instead of `src/`
 *  - Commits the changes
 *
 * Then, after pushing, `pnpm install "remix-run/react-router#preview/dev&path:packages/react-router"`
 * sees the `react-router` nested deps and they all point to github with similar URLs so
 * they install as nested deps the same way.
 */

let { positionals } = util.parseArgs({
  allowPositionals: true,
});

let installableBranch = positionals[0];
if (!installableBranch) {
  throw new Error("Error: You must provide an installable branch name");
}

// Error if git status is not clean
let gitStatus = logAndExec("git status --porcelain", true);
if (gitStatus) {
  throw new Error(
    "Error: Git working directory is not clean. Commit or stash changes first.",
  );
}

main();

async function main() {
  // Capture the current branch name
  let sha = logAndExec("git rev-parse --short HEAD ", true).trim();

  console.log(
    `Preparing installable branch \`${installableBranch}\` from sha ${sha}`,
  );

  // Switch to new branch and reset to current commit on base branch
  logAndExec(`git checkout -B ${installableBranch}`);

  // Build dist/ folders
  logAndExec("pnpm build");

  await updateGitignore();
  await updatePackageDependencies();

  logAndExec("git add .");
  logAndExec(`git commit -a -m "installable build from ${sha}"`);

  console.log(
    [
      "",
      `✅ Done!`,
      "",
      `You can now push the \`${installableBranch}\` branch to GitHub and install via:`,
      "",
      `  pnpm install "remix-run/react-router#${installableBranch}&path:packages/react-router"`,
    ].join("\n"),
  );
}

// Remove `dist` from gitignore so we include built code in the repo
async function updateGitignore() {
  let gitignorePath = path.join(process.cwd(), ".gitignore");
  let content = await fsp.readFile(gitignorePath, "utf-8");
  let filtered = content
    .split("\n")
    .filter((line) => !line.trim().startsWith("dist"))
    .join("\n");
  await fsp.writeFile(gitignorePath, filtered);
  console.log("Updated .gitignore");
}

// Update `package.json` files to point to this branch on github
async function updatePackageDependencies() {
  let packagesDir = path.join(process.cwd(), "packages");

  let packageDirNames = await fsp.readdir(packagesDir, { withFileTypes: true });

  for (let dir of packageDirNames) {
    if (!dir.isDirectory()) continue;

    let packageJsonPath = path.join(packagesDir, dir.name, "package.json");
    let content = await fsp.readFile(packageJsonPath, "utf-8");
    let pkg = JSON.parse(content);

    // Point all `@react-router/` dependencies to this branch on github
    if (pkg.dependencies) {
      for (let name of Object.keys(pkg.dependencies)) {
        if (
          name.startsWith("@react-router/") ||
          ["react-router", "react-router-dom", "create-react-router"].includes(
            name,
          )
        ) {
          let packageDirName = name.startsWith("@react-router/")
            ? name.replace(/^@react-router\//, "")
            : name;
          pkg.dependencies[name] =
            `remix-run/react-router#${installableBranch}&path:packages/${packageDirName}`;
        }
      }
    }

    await fsp.writeFile(packageJsonPath, JSON.stringify(pkg, null, 2) + "\n");
    console.log(`Updated ${dir.name}`);
  }

  console.log("Done");
}
