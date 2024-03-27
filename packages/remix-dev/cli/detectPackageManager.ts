type PackageManager = "npm" | "pnpm" | "yarn" | "bun";

/**
 * Determine which package manager the user prefers.
 *
 * npm, pnpm and Yarn set the user agent environment variable
 * that can be used to determine which package manager ran
 * the command.
 */
export const detectPackageManager = (): PackageManager | undefined => {
  let { npm_config_user_agent } = process.env;
  if (!npm_config_user_agent) return undefined;
  try {
    let pkgManager = npm_config_user_agent.split("/")[0];
    if (pkgManager === "npm") return "npm";
    if (pkgManager === "pnpm") return "pnpm";
    if (pkgManager === "yarn") return "yarn";
    if (pkgManager === "bun") return "bun";
    return undefined;
  } catch {
    return undefined;
  }
};
