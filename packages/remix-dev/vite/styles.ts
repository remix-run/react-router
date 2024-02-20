import * as path from "node:path";
import { type ServerBuild } from "@remix-run/server-runtime";
import { matchRoutes } from "@remix-run/router";
import { type ModuleNode, type ViteDevServer } from "vite";

import { type RemixConfig as ResolvedRemixConfig } from "../config";
import { resolveFileUrl } from "./resolve-file-url";

type ServerRouteManifest = ServerBuild["routes"];
type ServerRoute = ServerRouteManifest[string];

// Style collection logic adapted from solid-start: https://github.com/solidjs/solid-start

// Vite doesn't expose these so we just copy the list for now
// https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/constants.ts#L49C23-L50
const cssFileRegExp =
  /\.(css|less|sass|scss|styl|stylus|pcss|postcss|sss)(?:$|\?)/;
// https://github.com/vitejs/vite/blob/d6bde8b03d433778aaed62afc2be0630c8131908/packages/vite/src/node/plugins/css.ts#L160
const cssModulesRegExp = new RegExp(`\\.module${cssFileRegExp.source}`);

const isCssFile = (file: string) => cssFileRegExp.test(file);
export const isCssModulesFile = (file: string) => cssModulesRegExp.test(file);

const getStylesForFiles = async ({
  viteDevServer,
  rootDirectory,
  cssModulesManifest,
  files,
}: {
  viteDevServer: ViteDevServer;
  rootDirectory: string;
  cssModulesManifest: Record<string, string>;
  files: string[];
}): Promise<string | undefined> => {
  let styles: Record<string, string> = {};
  let deps = new Set<ModuleNode>();

  try {
    for (let file of files) {
      let normalizedPath = path
        .resolve(rootDirectory, file)
        .replace(/\\/g, "/");
      let node = await viteDevServer.moduleGraph.getModuleById(normalizedPath);

      // If the module is only present in the client module graph, the module
      // won't have been found on the first request to the server. If so, we
      // request the module so it's in the module graph, then try again.
      if (!node) {
        try {
          await viteDevServer.transformRequest(
            resolveFileUrl({ rootDirectory }, normalizedPath)
          );
        } catch (err) {
          console.error(err);
        }
        node = await viteDevServer.moduleGraph.getModuleById(normalizedPath);
      }

      if (!node) {
        console.log(`Could not resolve module for file: ${file}`);
        continue;
      }

      await findDeps(viteDevServer, node, deps);
    }
  } catch (err) {
    console.error(err);
  }

  for (let dep of deps) {
    if (
      dep.file &&
      isCssFile(dep.file) &&
      !dep.url.endsWith("?url") // Ignore styles that resolved as URLs, otherwise we'll end up injecting URLs into the style tag contents
    ) {
      try {
        let css = isCssModulesFile(dep.file)
          ? cssModulesManifest[dep.file]
          : (await viteDevServer.ssrLoadModule(dep.url)).default;

        if (css === undefined) {
          throw new Error();
        }

        styles[dep.url] = css;
      } catch {
        console.warn(`Could not load ${dep.file}`);
        // this can happen with dynamically imported modules, I think
        // because the Vite module graph doesn't distinguish between
        // static and dynamic imports? TODO investigate, submit fix
      }
    }
  }

  return (
    Object.entries(styles)
      .map(([fileName, css], i) => [
        `\n/* ${fileName
          // Escape comment syntax in file paths
          .replace(/\/\*/g, "/\\*")
          .replace(/\*\//g, "*\\/")} */`,
        css,
      ])
      .flat()
      .join("\n") || undefined
  );
};

const findDeps = async (
  vite: ViteDevServer,
  node: ModuleNode,
  deps: Set<ModuleNode>
) => {
  // since `ssrTransformResult.deps` contains URLs instead of `ModuleNode`s, this process is asynchronous.
  // instead of using `await`, we resolve all branches in parallel.
  let branches: Promise<void>[] = [];

  async function addFromNode(node: ModuleNode) {
    if (!deps.has(node)) {
      deps.add(node);
      await findDeps(vite, node, deps);
    }
  }

  async function addFromUrl(url: string) {
    let node = await vite.moduleGraph.getModuleByUrl(url);

    if (node) {
      await addFromNode(node);
    }
  }

  if (node.ssrTransformResult) {
    if (node.ssrTransformResult.deps) {
      node.ssrTransformResult.deps.forEach((url) =>
        branches.push(addFromUrl(url))
      );
    }
  } else {
    node.importedModules.forEach((node) => branches.push(addFromNode(node)));
  }

  await Promise.all(branches);
};

const groupRoutesByParentId = (manifest: ServerRouteManifest) => {
  let routes: Record<string, Omit<ServerRoute, "children">[]> = {};

  Object.values(manifest).forEach((route) => {
    let parentId = route.parentId || "";
    if (!routes[parentId]) {
      routes[parentId] = [];
    }
    routes[parentId].push(route);
  });

  return routes;
};

// Create a map of routes by parentId to use recursively instead of
// repeatedly filtering the manifest.
const createRoutes = (
  manifest: ServerRouteManifest,
  parentId: string = "",
  routesByParentId: Record<
    string,
    Omit<ServerRoute, "children">[]
  > = groupRoutesByParentId(manifest)
): ServerRoute[] => {
  return (routesByParentId[parentId] || []).map((route) => ({
    ...route,
    children: createRoutes(manifest, route.id, routesByParentId),
  }));
};

export const getStylesForUrl = async ({
  viteDevServer,
  rootDirectory,
  remixConfig,
  entryClientFilePath,
  cssModulesManifest,
  build,
  url,
}: {
  viteDevServer: ViteDevServer;
  rootDirectory: string;
  remixConfig: Pick<ResolvedRemixConfig, "appDirectory" | "routes">;
  entryClientFilePath: string;
  cssModulesManifest: Record<string, string>;
  build: ServerBuild;
  url: string | undefined;
}): Promise<string | undefined> => {
  if (url === undefined || url.includes("?_data=")) {
    return undefined;
  }

  let routes = createRoutes(build.routes);
  let appPath = path.relative(process.cwd(), remixConfig.appDirectory);
  let documentRouteFiles =
    matchRoutes(routes, url, build.basename)?.map((match) =>
      path.join(appPath, remixConfig.routes[match.route.id].file)
    ) ?? [];

  let styles = await getStylesForFiles({
    viteDevServer,
    rootDirectory,
    cssModulesManifest,
    files: [
      // Always include the client entry file when crawling the module graph for CSS
      path.relative(rootDirectory, entryClientFilePath),
      // Then include any styles from the matched routes
      ...documentRouteFiles,
    ],
  });

  return styles;
};
