import fs from "node:fs";

import * as Path from "pathe";
import * as Pathe from "pathe/utils";
import pc from "picocolors";

import * as Logger from "../logger";
import { generate } from "./generate";
import {
  type ResolvedReactRouterConfig,
  type ConfigLoader,
  createConfigLoader,
} from "../config/config";

type Context = {
  rootDirectory: string;
  configLoader: ConfigLoader;
  config: ResolvedReactRouterConfig;
};

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

          // TODO: Can these values be calculated within the config loader?
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
  const typegenDir = Path.join(ctx.rootDirectory, ".react-router/types");

  fs.rmSync(typegenDir, { recursive: true, force: true });
  Object.values(ctx.config.routes).forEach((route) => {
    if (!fs.existsSync(Path.join(ctx.config.appDirectory, route.file))) return;
    const typesPath = Path.join(
      typegenDir,
      Path.relative(ctx.rootDirectory, ctx.config.appDirectory),
      Path.dirname(route.file),
      "+types." + Pathe.filename(route.file) + ".d.ts"
    );
    const content = generate(ctx.config.routes, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}
