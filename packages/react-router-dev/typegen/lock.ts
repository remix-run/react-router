import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import exitHook from "exit-hook";

export function createLock(
  lockPath: string,
  { timeoutMs = 30_000 }: { timeoutMs?: number } = {},
) {
  return {
    async act<T>(callback: () => T | Promise<T>): Promise<T> {
      await fsp.mkdir(path.dirname(lockPath), { recursive: true });
      let deadline = performance.now() + timeoutMs;

      while (true) {
        let fd;
        try {
          fd = await fsp.open(lockPath, "wx");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
            throw error;
          }

          // Never unlink another owner's lock: a stale observation can refer to a
          // lock that has since been released and acquired by a different process.
          let remaining = deadline - performance.now();
          if (remaining <= 0) {
            throw new Error(
              `Timed out waiting for the typegen lock at ${lockPath}. ` +
                `Stop other react-router dev/typegen processes. ` +
                `If no typegen process is running, remove the lock file and try again.`,
            );
          }
          await new Promise((resolve) =>
            setTimeout(resolve, Math.min(50, remaining)),
          );
          continue;
        }

        let released = false;
        let unsubscribe = exitHook(release);
        function release() {
          if (released) return;
          fs.rmSync(lockPath, { force: true });
          released = true;
          unsubscribe();
        }

        try {
          try {
            await fd.write(String(process.pid));
          } finally {
            await fd.close();
          }
          return await callback();
        } finally {
          release();
        }
      }
    },
  };
}
