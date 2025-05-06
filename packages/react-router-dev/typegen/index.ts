import fs from "node:fs/promises";

import * as Path from "pathe";
import { green, red } from "picocolors";
import type vite from "vite";

import { type Context, createContext } from "./context";
import {
  type VirtualFile,
  typesDirectory,
  generateFuture,
  generateRouteModuleAnnotations,
  generatePages,
  generateRoutes,
  generateServerBuild,
} from "./generate";

async function clearRouteModuleAnnotations(ctx: Context) {
  await fs.rm(
    Path.join(typesDirectory(ctx), Path.basename(ctx.config.appDirectory)),
    { recursive: true, force: true }
  );
}

async function write(...files: Array<VirtualFile>) {
  return Promise.all(
    files.map(async ({ filename, content }) => {
      await fs.mkdir(Path.dirname(filename), { recursive: true });
      await fs.writeFile(filename, content);
    })
  );
}

export async function run(rootDirectory: string, { mode }: { mode: string }) {
  const ctx = await createContext({ rootDirectory, mode, watch: false });
  await fs.rm(typesDirectory(ctx), { recursive: true, force: true });
  await write(
    generateFuture(ctx),
    generatePages(ctx),
    generateRoutes(ctx),
    generateServerBuild(ctx),
    ...generateRouteModuleAnnotations(ctx)
  );
}

export type Watcher = {
  close: () => Promise<void>;
};

export async function watch(
  rootDirectory: string,
  { mode, logger }: { mode: string; logger?: vite.Logger }
): Promise<Watcher> {
  const ctx = await createContext({ rootDirectory, mode, watch: true });
  await fs.rm(typesDirectory(ctx), { recursive: true, force: true });
  await write(
    generateFuture(ctx),
    generatePages(ctx),
    generateRoutes(ctx),
    generateServerBuild(ctx),
    ...generateRouteModuleAnnotations(ctx)
  );
  logger?.info(green("generated types"), { timestamp: true, clear: true });

  ctx.configLoader.onChange(
    async ({ result, configChanged, routeConfigChanged }) => {
      if (!result.ok) {
        logger?.error(red(result.error), { timestamp: true, clear: true });
        return;
      }
      ctx.config = result.value;

      if (configChanged) {
        await write(generateFuture(ctx));
        logger?.info(green("regenerated types"), {
          timestamp: true,
          clear: true,
        });
      }

      if (routeConfigChanged) {
        await clearRouteModuleAnnotations(ctx);
        await write(
          generatePages(ctx),
          generateRoutes(ctx),
          ...generateRouteModuleAnnotations(ctx)
        );
        logger?.info(green("regenerated types"), {
          timestamp: true,
          clear: true,
        });
      }
    }
  );

  return {
    close: async () => await ctx.configLoader.close(),
  };
}
