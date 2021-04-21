import path from "path";
import { promises as fsp } from "fs";
import type { OutputBundle, Plugin, RenderedModule } from "rollup";

import invariant from "../../invariant";
import { getBundleHash } from "../crypto";
import { routeModuleProxy, emptyRouteModule } from "./routeModules";
import type { RemixConfig } from "./remixConfig";
import { getRemixConfig } from "./remixConfig";

/**
 * Generates 2 files:
 *
 * - An "assets manifest" file in the assets build directory that contains the
 *   URLs for all bundles needed in the browser
 * - An `assets.json` file in the server build directory that contains the URL
 *   for the assets manifest file
 */
export default function assetsManifestPlugin({
  fileName = "manifest-[hash].js",
  globalVar = "__remixManifest"
}: {
  fileName?: string;
  globalVar?: string;
} = {}): Plugin {
  let config: RemixConfig;

  return {
    name: "assetsManifest",

    async buildStart({ plugins }) {
      config = await getRemixConfig(plugins);
    },

    async generateBundle(_options, bundle) {
      let manifest = getAssetsManifest(
        bundle,
        config.routes,
        config.publicPath
      );

      fileName = fileName.replace("[hash]", manifest.version);

      manifest.url = config.publicPath + fileName;

      // Emit the manifest for direct consumption by the browser.
      let source = getGlobalScript(manifest, globalVar);
      this.emitFile({ type: "asset", fileName, source });

      // Write the manifest to the server build directory so it knows the asset
      // URLs when server rendering and the URL of the manifest.
      let assetsFile = path.join(config.serverBuildDirectory, "assets.json");
      await fsp.mkdir(path.dirname(assetsFile), { recursive: true });
      await fsp.writeFile(assetsFile, JSON.stringify(manifest, null, 2));
    }
  };
}

interface AssetsManifest {
  version: string;
  url?: string;
  entry: {
    module: string;
    imports: string[];
  };
  routes: {
    [routeId: string]: {
      id: string;
      parentId?: string;
      path: string;
      caseSensitive?: boolean;
      module: string;
      imports?: string[];
      hasAction?: boolean;
      hasLoader?: boolean;
    };
  };
}

function getAssetsManifest(
  bundle: OutputBundle,
  routeManifest: RemixConfig["routes"],
  publicPath: string
): AssetsManifest {
  let version = getBundleHash(bundle).slice(0, 8);

  let routeIds = Object.keys(routeManifest);
  let entry: AssetsManifest["entry"] | undefined;
  let routes: AssetsManifest["routes"] = Object.create(null);

  for (let key in bundle) {
    let chunk = bundle[key];
    if (chunk.type !== "chunk") continue;

    if (chunk.name === "entry.client") {
      entry = {
        module: publicPath + chunk.fileName,
        imports: chunk.imports.map(path => publicPath + path)
      };
    } else if (
      routeIds.includes(chunk.name) &&
      chunk.facadeModuleId?.endsWith(routeModuleProxy)
    ) {
      let route = routeManifest[chunk.name];

      // When we build route modules, we put a shim in front that ends with a
      // ?route-module-proxy string. Removing this suffix gets us back to the
      // original source module id.
      let sourceModuleId = chunk.facadeModuleId.replace(routeModuleProxy, "");

      // Usually the source module will be contained in this chunk, but if
      // someone imports a route module from within another route module, Rollup
      // will place the source module in a shared chunk. So we have to go find
      // the chunk with the source module in it. If the source module was empty,
      // it will have the ?empty-route-module suffix on it.
      let sourceModule =
        chunk.modules[sourceModuleId] ||
        chunk.modules[sourceModuleId + emptyRouteModule] ||
        findRenderedModule(bundle, sourceModuleId) ||
        findRenderedModule(bundle, sourceModuleId + emptyRouteModule);

      invariant(sourceModule, `Cannot find source module for ${route.id}`);

      routes[route.id] = {
        path: route.path,
        caseSensitive: route.caseSensitive,
        id: route.id,
        parentId: route.parentId,
        module: publicPath + chunk.fileName,
        imports: chunk.imports.map(path => publicPath + path),
        hasAction: sourceModule.removedExports.includes("action")
          ? true
          : // Using `undefined` here prevents this from showing up in the
            // manifest JSON when there is no action.
            undefined,
        hasLoader: sourceModule.removedExports.includes("loader")
          ? true
          : // Using `undefined` here prevents this from showing up in the
            // manifest JSON when there is no loader.
            undefined
      };
    }
  }

  invariant(entry, `Missing entry.client chunk`);

  // Slim down the overall size of the manifest by pruning imports from child
  // routes that their parents will have loaded already by the time they render.
  optimizeRoutes(routes, entry.imports);

  return { version, entry, routes };
}

function findRenderedModule(
  bundle: OutputBundle,
  name: string
): RenderedModule | undefined {
  for (let key in bundle) {
    let chunk = bundle[key];
    if (chunk.type === "chunk" && name in chunk.modules) {
      return chunk.modules[name];
    }
  }
}

type ImportsCache = { [routeId: string]: string[] };

function optimizeRoutes(
  routes: AssetsManifest["routes"],
  entryImports: string[]
): void {
  // This cache is an optimization that allows us to avoid pruning the same
  // route's imports more than once.
  let importsCache: ImportsCache = Object.create(null);

  for (let key in routes) {
    optimizeRouteImports(key, routes, entryImports, importsCache);
  }
}

function optimizeRouteImports(
  routeId: string,
  routes: AssetsManifest["routes"],
  parentImports: string[],
  importsCache: ImportsCache
): string[] {
  if (importsCache[routeId]) return importsCache[routeId];

  let route = routes[routeId];

  if (route.parentId) {
    parentImports = parentImports.concat(
      optimizeRouteImports(route.parentId, routes, parentImports, importsCache)
    );
  }

  let routeImports = (route.imports || []).filter(
    url => !parentImports.includes(url)
  );

  // Setting `route.imports = undefined` prevents `imports: []` from showing up
  // in the manifest JSON when there are no imports.
  route.imports = routeImports.length > 0 ? routeImports : undefined;

  // Cache so the next lookup for this route is faster.
  importsCache[routeId] = routeImports;

  return routeImports;
}

function getGlobalScript(manifest: AssetsManifest, globalVar: string): string {
  return `window.${globalVar} = ${JSON.stringify(manifest)}`;
}
