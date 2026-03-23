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

export function logAndExec(command: string, captureOutput = false): string {
  console.log(`$ ${command}`);
  if (captureOutput) {
    return cp.execSync(command, { stdio: "pipe", encoding: "utf-8" }).trim();
  } else {
    cp.execSync(command, { stdio: "inherit" });
    return "";
  }
}
