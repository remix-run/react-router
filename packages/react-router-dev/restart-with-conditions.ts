import { spawn, type ChildProcess } from "node:child_process";
import process from "node:process";

/**
 * Restarts the current Node process, appending new flags to the
 * existing NODE_OPTIONS. SIGINT/SIGTERM are always forwarded to the child.
 */
export function restartWithMergedOptions(nodeOptions: string): void {
  const mergedOptions = [process.env.NODE_OPTIONS, nodeOptions]
    .filter(Boolean)
    .join(" ")
    .trim();

  console.log(`[restart] Relaunching with NODE_OPTIONS: ${mergedOptions}`);

  const [cmd, ...args] = process.argv;

  const child: ChildProcess = spawn(cmd, args, {
    env: {
      ...process.env,
      NODE_OPTIONS: mergedOptions,
    },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
    } else {
      process.exit(code ?? 0);
    }
  });

  child.on("error", (err) => {
    console.error("[restart] Failed to spawn child process:", err);
    process.exit(1);
  });

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const sig of signals) {
    process.on(sig, () => {
      child.kill(sig);
    });
  }
}
