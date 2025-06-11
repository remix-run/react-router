import * as fsp from "node:fs/promises";
import * as path from "node:path";
import { pathToFileURL } from "node:url";

import type { Config as ParcelConfig } from "@parcel/types";
import { Resolver } from "@parcel/plugin";
import type { Config } from "@react-router/dev/config";
import {
  type RouteConfig,
  type RouteConfigEntry,
} from "@react-router/dev/routes";
import { createJiti } from "jiti";

const configLoader = createJiti(pathToFileURL(__filename).href);

// We disable the module cache for this loader so we get fresh routes from the
// file system every time we import routes.ts. Note that the module cache is
// shared with Node if it's enabled, which makes it difficult to manage the
// cache without causing other issues since we also need to invalidate any of
// routes.ts' dependant modules.
const routesLoader = createJiti(pathToFileURL(__filename).href, {
  moduleCache: false,
});

const resolver = new Resolver({
  async loadConfig({ config: parcelConfig }) {
    await fsp.mkdir(".react-router-parcel/types", { recursive: true });
    await fsp.writeFile(
      ".react-router-parcel/types/+virtual-parcel.d.ts",
      `
declare module "virtual:react-router/request-handler" {
  const requestHandler: (request: Request) => Promise<Response>;
  export default requestHandler;
}

declare module "virtual:react-router/express" {
  import { Express } from "express";
  const createExpressApp: (options?: {
    /** Parcel's \`distDir\` option. When using multiple targets without setting a custom \`distDir\`, this should be \`dist/\${targetName}\`. Defaults to \`dist\`. */
    distDir?: string;
  }) => Express;
  export default createExpressApp;
}

declare module "virtual:react-router/routes" {
  import { type unstable_ServerRouteObject } from "react-router/rsc";
  const routes: unstable_ServerRouteObject[];
  export default routes;
}`.trim()
    );

    // These aren't used by the build, but written as an example to copy and paste if
    // the user wants to take over control of the entry points.
    await fsp.mkdir("./.react-router-parcel/entries", { recursive: true });
    await Promise.all([
      fsp.copyFile(
        path.join(__dirname, "entry.browser.tsx"),
        "./.react-router-parcel/entries/entry.browser.tsx"
      ),
      fsp.copyFile(
        path.join(__dirname, "entry.rsc.ts"),
        "./.react-router-parcel/entries/entry.rsc.ts"
      ),
      fsp.copyFile(
        path.join(__dirname, "entry.request-handler.ts"),
        "./.react-router-parcel/entries/entry.request-handler.ts"
      ),
      fsp.copyFile(
        path.join(__dirname, "entry.express.tsx"),
        "./.react-router-parcel/entries/entry.express.tsx"
      ),
    ]);

    // const configPath = path.resolve(process.cwd(), "react-router.config.ts");
    const configPath = await findCodeFile(process.cwd(), "react-router.config");

    if (configPath) {
      parcelConfig.invalidateOnFileChange(configPath);
      parcelConfig.invalidateOnFileCreate({
        filePath: configPath,
      });
    } else {
      parcelConfig.invalidateOnFileCreate({
        filePath: path.join(process.cwd(), "react-router.config.ts"),
      });
      parcelConfig.invalidateOnFileCreate({
        filePath: path.join(process.cwd(), "react-router.config.tsx"),
      });
      parcelConfig.invalidateOnFileCreate({
        filePath: path.join(process.cwd(), "react-router.config.js"),
      });
      parcelConfig.invalidateOnFileCreate({
        filePath: path.join(process.cwd(), "react-router.config.jsx"),
      });
    }

    const rrConfig = configPath
      ? await configLoader
          .import(configPath)
          .then((mod) => {
            return (mod as { default: Config }).default;
          })
          .catch((): Config => {
            return {};
          })
      : ({} satisfies Config);

    const appDirectory = path.resolve(
      process.cwd(),
      rrConfig.appDirectory || "app"
    );
    const routesPath = await findCodeFile(appDirectory, "routes");

    if (!routesPath) {
      throw new Error(
        `Could not find routes.[ts|tsx|js|jsx] in ${appDirectory}. Please create one.`
      );
    }

    parcelConfig.invalidateOnFileChange(routesPath);
    parcelConfig.invalidateOnFileCreate({
      filePath: routesPath,
    });

    global.__reactRouterAppDirectory = appDirectory;
    let routes = await routesLoader
      .import(routesPath)
      .then(
        (mod) =>
          (mod as { default: RouteConfig }).default ?? (mod as RouteConfig)
      );

    const rootFile = await findCodeFile(appDirectory, "root");

    if (!rootFile) {
      throw new Error(
        `Could not find root.[ts|tsx|js|jsx] in ${appDirectory}. Please create one.`
      );
    }

    routes = [
      {
        id: "root",
        path: "",
        file: path.basename(rootFile),
        children: routes,
      },
    ];

    parcelConfig.invalidateOnFileCreate({
      filePath: appDirectory,
      glob: "**/*.+(ts|tsx|js|jsx)",
    });

    invalidateConfigOnRoutesChange({
      appDirectory,
      parcelConfig,
      routes,
    });

    return { appDirectory, routes, routesPath };
  },
  async resolve({ config, specifier, options }) {
    if (specifier === "virtual:react-router/request-handler") {
      const filePath = path.resolve(__dirname, "./entry.request-handler.ts");
      const code = await fsp.readFile(filePath, "utf-8");
      return {
        filePath,
        code,
      };
    }

    if (specifier === "virtual:react-router/express") {
      const filePath = path.resolve(__dirname, "./entry.express.tsx");
      const code = await fsp.readFile(filePath, "utf-8");
      return {
        filePath,
        code,
      };
    }

    if (specifier === "virtual:react-router/routes") {
      let code = "export default [";

      const closeRouteSymbol = Symbol("CLOSE_ROUTE");
      let stack: Array<typeof closeRouteSymbol | RouteConfigEntry> = [
        ...config.routes,
      ];
      while (stack.length > 0) {
        const route = stack.pop();
        if (!route) break;
        if (route === closeRouteSymbol) {
          code += "]},";
          continue;
        }

        code += "{";
        code += `lazy: () => import(${JSON.stringify(
          "route-module:/" +
            path.relative(
              options.projectRoot,
              path.resolve(config.appDirectory, route.file)
            )
        )}),`;

        code += `id: ${JSON.stringify(
          route.id || createRouteId(route.file, config.appDirectory)
        )},`;
        if (typeof route.path === "string") {
          code += `path: ${JSON.stringify(route.path)},`;
        }
        if (route.index) {
          code += `index: true,`;
        }
        if (route.caseSensitive) {
          code += `caseSensitive: true,`;
        }
        if (route.children) {
          code += ["children:["];
          stack.push(closeRouteSymbol);
          stack.push(...[...route.children].reverse());
        } else {
          code += "},";
        }
      }

      code += "];\n";

      return {
        filePath: config.routesPath,
        code,
      };
    }
  },
});

function invalidateConfigOnRoutesChange({
  appDirectory,
  parcelConfig,
  routes,
}: {
  appDirectory: string;
  parcelConfig: ParcelConfig;
  routes: RouteConfigEntry[];
}) {
  for (const route of routes) {
    if (route.file) {
      const routeFilePath = path.resolve(appDirectory, route.file);
      parcelConfig.invalidateOnFileChange(routeFilePath);
    }
    if (route.children) {
      invalidateConfigOnRoutesChange({
        appDirectory,
        parcelConfig,
        routes: route.children,
      });
    }
  }
}

function createRouteId(file: string, appDirectory: string) {
  return path
    .relative(appDirectory, file)
    .replace(/\\+/, "/")
    .slice(0, -path.extname(file).length);
}

async function findFileWithExtension(
  dir: string,
  base: string,
  extensions: string[]
) {
  for (const ext of extensions) {
    const filePath = path.join(dir, base + ext);
    if (await fsp.stat(filePath).catch(() => false)) {
      return filePath;
    }
  }
  return null;
}

function findCodeFile(dir: string, base: string) {
  return findFileWithExtension(dir, base, [".ts", ".tsx", ".js", ".jsx"]);
}

export default resolver;
