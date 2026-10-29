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
import { createLock } from "./lock";

const { green, red } = pc;

const rmOptions = {
  recursive: true,
  force: true,
  maxRetries: 2,
  retryDelay: 100,
};

async function clearRouteModuleAnnotations(ctx: Context) {
  await fs.rm(
    Path.join(typesDirectory(ctx), Path.basename(ctx.config.appDirectory)),
    rmOptions,
  );
}

async function write(...files: Array<VirtualFile>) {
  let results = await Promise.allSettled(
    files.map(async ({ filename, content }) => {
      await fs.mkdir(Path.dirname(filename), { recursive: true });
      await fs.writeFile(filename, content);
    }),
  );
  // Keep the lock until every started write finishes, even if one fails.
  for (let result of results) {
    if (result.status === "rejected") throw result.reason;
  }
}

export async function run(
  rootDirectory: string,
  { mode, rsc }: { mode: string; rsc: boolean },
) {
  const ctx = await createContext({ rootDirectory, mode, rsc, watch: false });
  const lock = createLock(
    Path.join(rootDirectory, ".react-router", ".typegen.lock"),
  );
  await lock.act(async () => {
    await fs.rm(typesDirectory(ctx), rmOptions);
    await write(generateServerBuild(ctx), ...generateRoutes(ctx));
  });
}

export type Watcher = {
  close: () => Promise<void>;
};

export async function watch(
  rootDirectory: string,
  { mode, logger, rsc }: { mode: string; logger?: Logger; rsc: boolean },
): Promise<Watcher> {
  const ctx = await createContext({ rootDirectory, mode, rsc, watch: true });
  const lock = createLock(
    Path.join(rootDirectory, ".react-router", ".typegen.lock"),
  );

  await lock.act(async () => {
    await fs.rm(typesDirectory(ctx), rmOptions);
    await write(generateServerBuild(ctx), ...generateRoutes(ctx));
  });
  logger?.info(green("generated types"), { timestamp: true, clear: true });

  ctx.configLoader.onChange(async ({ result, routeConfigChanged }) => {
    if (!result.ok) {
      logger?.error(red(result.error), { timestamp: true, clear: true });
      return;
    }
    ctx.config = result.value;

    if (routeConfigChanged) {
      await lock.act(async () => {
        await clearRouteModuleAnnotations(ctx);
        await write(...generateRoutes(ctx));
      });
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
