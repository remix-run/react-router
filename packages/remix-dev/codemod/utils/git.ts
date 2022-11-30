import execa from "execa";

type GitStatus = "not a git repository" | "clean" | "dirty";

const TEN_MEBIBYTE = 1024 * 1024 * 10;
export const status = async (
  dir: string = process.cwd()
): Promise<GitStatus> => {
  // Simplified version of `sync` method of `is-git-clean` package
  try {
    let gitStatus = await execa("git", ["status", "--porcelain"], {
      cwd: dir,
      encoding: "utf8",
      maxBuffer: TEN_MEBIBYTE,
    });

    return gitStatus.stdout === "" ? "clean" : "dirty";
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes(
        "fatal: not a git repository (or any of the parent directories): .git"
      )
    ) {
      return "not a git repository";
    }
    throw error;
  }
};
