import fs from "node:fs";

import ts from "dedent";
import * as Path from "pathe";
import pc from "picocolors";
import type vite from "vite";

import { createConfigLoader } from "../config/config";

import { generate } from "./generate";
import type { Context } from "./context";
import { getTypesDir, getTypesPath } from "./paths";
import type { RouteManifestEntry } from "../config/routes";

export async function run(rootDirectory: string) {
  const ctx = await createContext({ rootDirectory, watch: false });
  await writeAll(ctx);
}

export type Watcher = {
  close: () => Promise<void>;
};

export async function watch(
  rootDirectory: string,
  { logger }: { logger?: vite.Logger } = {}
): Promise<Watcher> {
  const ctx = await createContext({ rootDirectory, watch: true });
  await writeAll(ctx);
  logger?.info(pc.green("generated types"), { timestamp: true, clear: true });

  ctx.configLoader.onChange(async ({ result, routeConfigChanged }) => {
    if (!result.ok) {
      logger?.error(pc.red(result.error), { timestamp: true, clear: true });
      return;
    }

    ctx.config = result.value;
    if (routeConfigChanged) {
      await writeAll(ctx);
      logger?.info(pc.green("regenerated types"), {
        timestamp: true,
        clear: true,
      });
    }
  });

  return {
    close: async () => await ctx.configLoader.close(),
  };
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

function asJS(path: string) {
  return path.replace(/\.(js|ts)x?$/, ".js");
}

function formatRoute({ id, path, file, parentId }: RouteManifestEntry) {
  return [
    `"${id}": {`,
    `  parentId: ${JSON.stringify(parentId)}`,
    `  path: ${JSON.stringify(path)}`,
    `  module: typeof import("./app/${asJS(file)}")`,
    `}`,
  ]
    .map((line) => `  ${line}`)
    .join("\n");
}

async function writeAll(ctx: Context): Promise<void> {
  let routes = Object.values(ctx.config.routes);

  const typegenDir = getTypesDir(ctx);
  fs.rmSync(typegenDir, { recursive: true, force: true });

  const newTypes = Path.join(typegenDir, "routes.ts");
  fs.mkdirSync(Path.dirname(newTypes), { recursive: true });
  fs.writeFileSync(
    newTypes,
    `type UserRoutes = {\n${routes.map(formatRoute).join("\n")}\n}\n\n` +
      ts`
        declare module "react-router/types" {
          interface Register {
            routes: UserRoutes
          }
        }

        export {}
    `
  );

  Object.values(ctx.config.routes).forEach((route) => {
    const typesPath = getTypesPath(ctx, route);
    const content = generate(route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}
