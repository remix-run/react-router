import fs from "node:fs";

import * as Path from "pathe";
import pc from "picocolors";

import * as Logger from "../logger";
import { createConfigLoader } from "../config/config";

import { generate } from "./generate";
import type { Context } from "./context";
import { getTypesDir, getTypesPath } from "./paths";

export async function run(rootDirectory: string) {
  const ctx = await createContext({ rootDirectory, watch: false });
  await writeAll(ctx);
}

export async function watch(rootDirectory: string) {
  const watchStart = performance.now();
  const ctx = await createContext({ rootDirectory, watch: true });

  await writeAll(ctx);
  Logger.info("generated initial types", {
    durationMs: performance.now() - watchStart,
  });

  ctx.configLoader.onChange(
    async ({ result, routeConfigChanged, event, path }) => {
      const eventStart = performance.now();

      if (result.ok) {
        ctx.config = result.value;

        if (routeConfigChanged) {
          await writeAll(ctx);
          Logger.info("changed route config", {
            durationMs: performance.now() - eventStart,
          });

          const route = findRoute(ctx, path);
          if (route && (event === "add" || event === "unlink")) {
            Logger.info(
              `${event === "add" ? "added" : "removed"} route ${pc.blue(
                route.file
              )}`,
              { durationMs: performance.now() - eventStart }
            );
            return;
          }
        }
      } else {
        Logger.error(result.error, {
          durationMs: performance.now() - eventStart,
        });
      }
    }
  );
}

async function createContext({
  rootDirectory,
  watch,
}: {
  rootDirectory: string;
  watch: boolean;
}): Promise<Context> {
  const configLoader = await createConfigLoader({ rootDirectory, watch });
  const configResult = await configLoader.getConfig();

  if (!configResult.ok) {
    throw new Error(configResult.error);
  }

  const config = configResult.value;

  return {
    configLoader,
    rootDirectory,
    config,
  };
}

function findRoute(ctx: Context, path: string) {
  return Object.values(ctx.config.routes).find(
    (route) => path === Path.join(ctx.config.appDirectory, route.file)
  );
}

async function writeAll(ctx: Context): Promise<void> {
  const typegenDir = getTypesDir(ctx);

  fs.rmSync(typegenDir, { recursive: true, force: true });
  Object.values(ctx.config.routes).forEach((route) => {
    const typesPath = getTypesPath(ctx, route);
    const content = generate(ctx, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}
