import { spawn, type ChildProcess } from "node:child_process";
import process from "node:process";

/**
 * Build the child process invocation used to relaunch the CLI with extra flags.
 *
 * Extra flags are placed on argv immediately after the runtime binary. Putting
 * them in NODE_OPTIONS is not portable: Bun silently ignores `--conditions`
 * there, so the child would restart again and hit the already-restarted guard.
 */
export function resolveRestartSpawn(
  argv: readonly string[],
  extraOptions: string,
  env: NodeJS.ProcessEnv,
): { command: string; args: string[]; env: NodeJS.ProcessEnv } {
  const extraArgs = extraOptions.split(/\s+/).filter(Boolean);
  const [command, ...args] = argv;
  return {
    command: command as string,
    args: [...extraArgs, ...args],
    env: {
      ...env,
      REACT_ROUTER_DEV_RESTARTED: "true",
    },
  };
}

/**
 * Restarts the current process with extra CLI flags after argv[0].
 * SIGINT/SIGTERM are always forwarded to the child.
 */
export function restartWithMergedOptions(nodeOptions: string): void {
  if (process.env.REACT_ROUTER_DEV_RESTARTED === "true") {
    throw new Error(
      "restartWithMergedOptions() was called, but the process has already been restarted. This is likely a bug in @react-router/dev.",
    );
  }

  const { command, args, env } = resolveRestartSpawn(
    process.argv,
    nodeOptions,
    process.env,
  );

  console.log(`[restart] Relaunching with ${nodeOptions}`);

  const child: ChildProcess = spawn(command, args, {
    env,
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
