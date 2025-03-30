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
import * as Params from "./params";
import * as Route from "./route";

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

  const virtualPath = Path.join(typegenDir, "+virtual.d.ts");
  fs.writeFileSync(virtualPath, virtual);
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

  const indexPaths = new Set(
    Object.values(ctx.config.routes)
      .filter((route) => route.index)
      .map((route) => route.path)
  );

  const typeParams = t.tsTypeAliasDeclaration(
    t.identifier("Params"),
    null,
    t.tsTypeLiteral(
      Object.values(ctx.config.routes)
        .map((route) => {
          // filter out pathless (layout) routes
          if (route.id !== "root" && !route.path) return undefined;

          // filter out layout routes that have a corresponding index
          if (!route.index && indexPaths.has(route.path)) return undefined;

          const lineage = Route.lineage(ctx.config.routes, route);
          const fullpath = Route.fullpath(lineage);
          const params = Params.parse(fullpath);
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
        .filter((x): x is Babel.Babel.TSPropertySignature => x !== undefined)
    )
  );

  return [register, Babel.generate(typeParams).code].join("\n\n");
}

const virtual = ts`
  declare module "virtual:react-router/server-build" {
    import type { ServerBuild } from "react-router";
    // Whilst this uses the CommonJS 'export =' syntax, which is technically not
    // ESM-compliant, it is intentionally implemented this way to properly support
    // optional properties in the ServerBuild type.
    //
    // TypeScript's type system does not provide an elegant solution for defining
    // optional exports at the module level in ESM syntax, so this approach offers
    // the most accurate type definitions for maintainability.
    //
    // This ensures all properties of ServerBuild, including optional ones, are
    // properly type-checked when using this module.
    const serverBuild: ServerBuild;
    export = serverBuild;
  }
`;
