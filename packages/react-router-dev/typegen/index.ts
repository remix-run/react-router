import fs from "node:fs";

import tsx from "dedent";
import * as Path from "pathe";
import pc from "picocolors";
import type vite from "vite";

import { createConfigLoader } from "../config/config";
import type { RouteManifestEntry } from "../config/routes";
import * as Babel from "../vite/babel";

import { generate } from "./generate";
import type { Context } from "./context";
import { getTypesDir, getTypesPath } from "./paths";

const { t } = Babel;

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

  Object.values(ctx.config.routes).map((route) =>
    t.tsPropertySignature(
      t.stringLiteral(route.id),
      t.tsTypeAnnotation(
        t.tsTypeLiteral([
          t.tsPropertySignature(
            t.identifier("parentId"),
            t.tsTypeAnnotation(
              route.parentId
                ? t.tsLiteralType(t.stringLiteral(route.parentId))
                : t.tsUndefinedKeyword()
            )
          ),
          t.tsPropertySignature(
            t.identifier("path"),
            t.tsTypeAnnotation(
              route.path
                ? t.tsLiteralType(t.stringLiteral(route.path))
                : t.tsUndefinedKeyword()
            )
          ),
          t.tsPropertySignature(
            t.identifier("module"),
            t.tsTypeAnnotation(
              t.tsTypeQuery(t.tsImportType(t.stringLiteral(route.file)))
            )
          ),
        ])
      )
    )
  );
  const registerPath = Path.join(typegenDir, "+register.ts");
  fs.writeFileSync(registerPath, register(ctx));
}

function register(ctx: Context) {
  const routes = Babel.generate(
    t.tsTypeAliasDeclaration(
      t.identifier("Routes"),
      null,
      t.tsTypeLiteral(
        Object.values(ctx.config.routes).map((route) =>
          t.tsPropertySignature(
            t.stringLiteral(route.id),
            t.tsTypeAnnotation(
              t.tsTypeLiteral([
                t.tsPropertySignature(
                  t.identifier("parentId"),
                  t.tsTypeAnnotation(
                    route.parentId
                      ? t.tsLiteralType(t.stringLiteral(route.parentId))
                      : t.tsUndefinedKeyword()
                  )
                ),
                t.tsPropertySignature(
                  t.identifier("path"),
                  t.tsTypeAnnotation(
                    route.path
                      ? t.tsLiteralType(t.stringLiteral(route.path))
                      : t.tsUndefinedKeyword()
                  )
                ),
                t.tsPropertySignature(
                  t.identifier("module"),
                  t.tsTypeAnnotation(
                    t.tsTypeQuery(
                      t.tsImportType(
                        t.stringLiteral(compiledModulePath(ctx, route))
                      )
                    )
                  )
                ),
              ])
            )
          )
        )
      )
    )
  ).code;
  const registerTypes = tsx`
    import "react-router/types";

    declare module "react-router/types" {
      interface Register {
        routes: Routes;
      }
    }
  `;

  return [registerTypes, routes].join("\n\n");
}

function compiledModulePath(ctx: Context, route: RouteManifestEntry) {
  return (
    "./" +
    Path.relative(
      ctx.rootDirectory,
      Path.join(ctx.config.appDirectory, route.file)
    ).replace(/\.(js|ts)x?$/, ".js")
  );
}
