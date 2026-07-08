import fs from "node:fs/promises";

import * as Path from "pathe";
import pc from "picocolors";
import type { Logger } from "vite";

import { type Context, createContext } from "./context";
import {
  type VirtualFile,
  typesDirectory,
  generateRoutes,
  generateServerBuild,
} from "./generate";
import { acquire } from "./lock";

const { green, red } = pc;

const RETRY_ON = ["ENOTEMPTY", "EBUSY", "EPERM"];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function rmWithRetry(
  path: string,
  options: { recursive: boolean; force: boolean },
): Promise<void> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await fs.rm(path, options);
      return;
    } catch (err: any) {
      if (attempt === 2 || !RETRY_ON.includes(err.code)) {
        throw err;
      }
      await sleep(100);
    }
  }
}

async function clearRouteModuleAnnotations(ctx: Context) {
  await rmWithRetry(
    Path.join(typesDirectory(ctx), Path.basename(ctx.config.appDirectory)),
    { recursive: true, force: true },
  );
}

async function write(...files: Array<VirtualFile>) {
  return Promise.all(
    files.map(async ({ filename, content }) => {
      await fs.mkdir(Path.dirname(filename), { recursive: true });
      await fs.writeFile(filename, content);
    }),
  );
}

export async function run(
  rootDirectory: string,
  { mode, rsc }: { mode: string; rsc: boolean },
) {
  const ctx = await createContext({ rootDirectory, mode, rsc, watch: false });
  const lockPath = Path.join(rootDirectory, ".react-router", ".typegen.lock");
  const release = await acquire(lockPath);
  try {
    await rmWithRetry(typesDirectory(ctx), {
      recursive: true,
      force: true,
    });
    await write(generateServerBuild(ctx), ...generateRoutes(ctx));
  } finally {
    release();
  }
}

export type Watcher = {
  close: () => Promise<void>;
};

export async function watch(
  rootDirectory: string,
  { mode, logger, rsc }: { mode: string; logger?: Logger; rsc: boolean },
): Promise<Watcher> {
  const ctx = await createContext({ rootDirectory, mode, rsc, watch: true });
  const lockPath = Path.join(rootDirectory, ".react-router", ".typegen.lock");

  const release = await acquire(lockPath);
  try {
    await rmWithRetry(typesDirectory(ctx), {
      recursive: true,
      force: true,
    });
    await write(generateServerBuild(ctx), ...generateRoutes(ctx));
  } finally {
    release();
  }
  logger?.info(green("generated types"), { timestamp: true, clear: true });

  ctx.configLoader.onChange(async ({ result, routeConfigChanged }) => {
    if (!result.ok) {
      logger?.error(red(result.error), { timestamp: true, clear: true });
      return;
    }
    ctx.config = result.value;

    if (routeConfigChanged) {
      const release = await acquire(lockPath);
      try {
        await clearRouteModuleAnnotations(ctx);
        await write(...generateRoutes(ctx));
      } finally {
        release();
      }
      logger?.info(green("regenerated types"), {
        timestamp: true,
        clear: true,
      });
    }
  });

  return {
    close: async () => await ctx.configLoader.close(),
  };
}
