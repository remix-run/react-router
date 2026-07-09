import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import exitHook from "exit-hook";

const BACKOFF_MIN_MS = 50;
const BACKOFF_MAX_MS = 2000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function release(lockPath: string): void {
  fs.rmSync(lockPath, { force: true });
}

export async function acquire(lockPath: string): Promise<() => void> {
  await fsp.mkdir(path.dirname(lockPath), { recursive: true });

  let delay = BACKOFF_MIN_MS;

  while (true) {
    try {
      const fd = await fsp.open(lockPath, "wx");
      const cleanup = () => {
        release(lockPath);
      };

      // Write PID for debuggability
      await fd.write(String(process.pid));
      await fd.close();

      // Register cleanup on process exit
      const unsubscribe = exitHook(cleanup);

      return () => {
        unsubscribe();
        cleanup();
      };
    } catch (err: any) {
      if (err.code === "EEXIST") {
        await sleep(delay);
        delay = Math.min(delay * 2, BACKOFF_MAX_MS);
        continue;
      }
      throw err;
    }
  }
}
