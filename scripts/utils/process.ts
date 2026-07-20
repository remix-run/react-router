import * as cp from "node:child_process";
import * as path from "node:path";

/**
 * Get the root directory of the monorepo (parent of scripts/).
 * Works whether called directly or via node --eval.
 */
export function getRootDir(): string {
  // import.meta.dirname is the directory containing this file (scripts/utils/)
  // Go up two levels to get the repo root
  if (import.meta.dirname) {
    return path.join(import.meta.dirname, "..", "..");
  }
  // Fallback for environments where import.meta.dirname isn't available
  return process.cwd();
}

export function logAndExec(args: string[], captureOutput?: boolean): string;
export function logAndExec(command: string, captureOutput?: boolean): string;
export function logAndExec(
  commandOrArgs: string | string[],
  captureOutput = false,
): string {
  let command: string;
  if (typeof commandOrArgs === "string") {
    command = commandOrArgs;
  } else {
    command = [
      commandOrArgs[0],
      // Quote each argument
      ...commandOrArgs
        .slice(1)
        .map((arg) =>
          arg.startsWith("-") ? arg : `'${arg.replaceAll("'", "'\\''")}'`,
        ),
    ].join(" ");
  }

  console.log(`$ ${command}`);
  if (captureOutput) {
    return cp.execSync(command, { stdio: "pipe", encoding: "utf-8" }).trim();
  } else {
    cp.execSync(command, { stdio: "inherit" });
    return "";
  }
}
