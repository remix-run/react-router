import fs from "node:fs/promises";
import * as Path from "pathe";

export async function withTypegenLock<T>(
  dotReactRouterDir: string,
  action: () => Promise<T>
): Promise<T> {
  await fs.mkdir(dotReactRouterDir, { recursive: true });
  const lockPath = Path.join(dotReactRouterDir, ".typegen.lock");

  while (true) {
    try {
      await fs.mkdir(lockPath);
      break;
    } catch (err: any) {
      if (err.code !== "EEXIST") throw err;

      try {
        const stats = await fs.stat(lockPath);
        if (Date.now() - stats.mtimeMs > 5000) {
          await fs.rm(lockPath, { recursive: true, force: true });
        }
      } catch (statErr: any) {
        if (statErr.code !== "ENOENT") throw statErr;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  try {
    return await action();
  } finally {
    await fs.rm(lockPath, { recursive: true, force: true }).catch(() => {});
  }
}