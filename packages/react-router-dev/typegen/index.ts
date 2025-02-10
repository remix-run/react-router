import fs from "node:fs";

import ts from "dedent";
import * as Path from "pathe";
import pc from "picocolors";
import type vite from "vite";

import { createConfigLoader } from "../config/config";
import * as Babel from "../vite/babel";

import { generate } from "./generate";
import type { Context } from "./context";
import { getTypesDir, getTypesPath } from "./paths";
import type { RouteManifest, RouteManifestEntry } from "../config/routes";

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

async function writeAll(ctx: Context): Promise<void> {
  const typegenDir = getTypesDir(ctx);

  fs.rmSync(typegenDir, { recursive: true, force: true });
  Object.values(ctx.config.routes).forEach((route) => {
    const typesPath = getTypesPath(ctx, route);
    const content = generate(ctx, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });

  const registerPath = Path.join(typegenDir, "+register.ts");
  fs.writeFileSync(registerPath, register(ctx));
}

function register(ctx: Context) {
  const register = ts`
    import "react-router";

    declare module "react-router" {
      interface Register {
        params: Params;
      }
    }
  `;

  const { t } = Babel;
  const typeParams = t.tsTypeAliasDeclaration(
    t.identifier("Params"),
    null,
    t.tsTypeLiteral(
      Object.values(ctx.config.routes).map((route) => {
        // TODO: filter out layout (pathless) routes?
        const lineage = getRouteLineage(ctx.config.routes, route);
        const fullpath = lineage.map((route) => route.path).join("/");
        const params = parseParams(fullpath);
        return t.tsPropertySignature(
          t.stringLiteral(fullpath),
          t.tsTypeAnnotation(
            t.tsTypeLiteral(
              Object.entries(params).map(([param, isRequired]) => {
                const property = t.tsPropertySignature(
                  t.stringLiteral(param),
                  t.tsTypeAnnotation(t.tsStringKeyword())
                );
                property.optional = !isRequired;
                return property;
              })
            )
          )
        );
      })
    )
  );

  return [register, Babel.generate(typeParams).code].join("\n\n");
}

function parseParams(fullpath: string) {
  const result: Record<string, boolean> = {};

  let segments = fullpath.split("/");
  segments.forEach((segment) => {
    const match = segment.match(/^:([\w-]+)(\?)?/);
    if (!match) return;
    const param = match[1];
    const isRequired = match[2] === undefined;

    result[param] ||= isRequired;
    return;
  });

  const hasSplat = segments.at(-1) === "*";
  if (hasSplat) result["*"] = true;
  return result;
}

function getRouteLineage(routes: RouteManifest, route: RouteManifestEntry) {
  const result: RouteManifestEntry[] = [];
  while (route) {
    result.push(route);
    if (!route.parentId) break;
    route = routes[route.parentId];
  }
  result.reverse();
  return result;
}
