type PackageManager = "npm" | "pnpm" | "yarn";

/**
 * Determine which package manager the user prefers.
 *
 * npm, pnpm and Yarn set the user agent environment variable
 * that can be used to determine which package manager ran
 * the command.
 */
export const getPreferredPackageManager = () =>
  ((process.env.npm_config_user_agent ?? "").split("/")[0] ||
    "npm") as PackageManager;
