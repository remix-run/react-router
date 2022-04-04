import { execFileSync } from "child_process";

import * as colors from "./colors";

export const checkGitStatus = (projectDir: string, { force = false }) => {
  let clean = false;
  let errorMessage = "Unable to determine if git directory is clean";

  try {
    clean = isGitClean(projectDir);
    errorMessage = "Git directory is not clean";
  } catch (err: any) {
    if (err?.stderr.indexOf("Not a git repository") >= 0) {
      clean = true;
    }
  }

  if (clean) {
    return;
  }

  if (force) {
    console.log(
      colors.warning(`WARNING: ${errorMessage}. Forcibly continuing.`)
    );
  } else {
    console.log(
      colors.warning(
        "\nBefore we continue, please stash or commit your git changes."
      )
    );
    console.log(
      "\nYou may use the --force flag to override this safety check."
    );

    process.exit(1);
  }
};

const TEN_MEBIBYTE = 1024 * 1024 * 10;
const isGitClean = (dir: string = process.cwd()) =>
  // Simplified version of `sync` method of `is-git-clean` package
  !execFileSync("git", ["status", "--porcelain"], {
    cwd: dir,
    encoding: "utf8",
    maxBuffer: TEN_MEBIBYTE,
  })?.trim();
