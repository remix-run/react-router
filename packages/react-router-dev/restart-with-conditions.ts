import { spawn, type ChildProcess } from "node:child_process";
import process from "node:process";

/**
 * Restarts the current Node process, appending new flags to the
 * existing NODE_OPTIONS. SIGINT/SIGTERM are always forwarded to the child.
 */
export function restartWithMergedOptions(nodeOptions: string): void {
  if (process.env.REACT_ROUTER_DEV_RESTARTED === "true") {
    throw new Error(
      "restartWithMergedOptions() was called, but the process has already been restarted. This is likely a bug in @react-router/dev.",
    );
  }
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
      REACT_ROUTER_DEV_RESTARTED: "true",
    },
    stdio: "inherit",
  });

  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  let signalHandlers = signals.map((sig) => {
    let handler = () => {
      child.kill(sig);
    };
    process.on(sig, handler);
    return [sig, handler] as const;
  });

  child.on("exit", (code, signal) => {
    for (let [sig, handler] of signalHandlers) {
      process.off(sig, handler);
    }

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
}
