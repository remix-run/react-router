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
  let params = path === undefined ? {} : parseParams(path);
  return [
    `"${id}": {`,
    `  params: ${formatParams(params)}`,
    `  module: typeof import("./app/${asJS(file)}")`,
    `  parentId: ${JSON.stringify(parentId)}`,
    `}`,
  ]
    .map((line) => `  ${line}`)
    .join("\n");
}

function parseParams(path: string) {
  const result: Record<string, boolean> = {};

  let segments = path.split("/");
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

function formatParams(params: Record<string, boolean>) {
  let entries = Object.entries(params);
  if (entries.length === 0) return `{}`;
  return [
    "{",
    ...entries.map(
      ([param, isRequired]) =>
        `  ${JSON.stringify(param)}${isRequired ? "" : "?"}: string`
    ),
    "}",
  ]
    .map((line, index) => (index === 0 ? line : `    ${line}`))
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
    `export type Routes = {\n${routes.map(formatRoute).join("\n")}\n}\n\n` +
      ts`
        type Pretty<T> = { [K in keyof T]: T[K] } & {};

        type RouteId = keyof Routes

        type GetParents<T extends RouteId> = Routes[T] extends {
          parent: infer P extends RouteId;
        }
          ? [...GetParents<P>, P]
          : [];

        type _GetChildren<T extends RouteId> = {
          [K in RouteId]: Routes[K] extends { parent: T }
            ? [K, ..._GetChildren<K>]
            : [];
        }[RouteId];
        type GetChildren<T extends RouteId> = _GetChildren<T> extends []
          ? []
          : Exclude<_GetChildren<T>, []>;

        type GetBranch<T extends RouteId> = [
          ...GetParents<T>,
          T,
          ...GetChildren<T>
        ];

        type _GetBranchParams<Branch extends Array<RouteId>> = Branch extends [
          infer R extends RouteId,
          ...infer Rs extends Array<RouteId>
        ]
          ? Routes[R]["params"] & _GetBranchParams<Rs>
          : {};
        type GetBranchParams<Branch extends Array<RouteId>> = Pretty<
          _GetBranchParams<Branch>
        >;
        export type GetParams<T extends RouteId> = GetBranchParams<GetBranch<T>>;
    `
  );

  Object.values(ctx.config.routes).forEach((route) => {
    const typesPath = getTypesPath(ctx, route);
    const content = generate(ctx, route);
    fs.mkdirSync(Path.dirname(typesPath), { recursive: true });
    fs.writeFileSync(typesPath, content);
  });
}
