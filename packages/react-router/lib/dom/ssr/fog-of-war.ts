import * as React from "react";

import type { Router } from "../../router";
import { matchRoutes } from "../../router";
import type { unstable_PatchRoutesOnMissFunction } from "../../components";
import type { AssetsManifest } from "./entry";
import type { RouteModules } from "./routeModules";
import { createClientRoutes } from "./routes";

declare global {
  interface Navigator {
    connection?: { saveData: boolean };
  }
}

type FogOfWarInfo = {
  controller: AbortController | null;
  // Currently rendered links that may need prefetching
  nextPaths: Set<string>;
  // Paths we know the client can already match, so no need to perform client-side
  // matching or prefetching for them.  Just an optimization to avoid re-matching
  // on a larger and larger route tree over time
  knownGoodPaths: Set<string>;
  // Routes the server was unable to match - don't ask for them again
  known404Paths: Set<string>;
};

let fogOfWar: FogOfWarInfo | null = null;

export function isFogOfWarEnabled(isSpaMode: boolean) {
  return !isSpaMode;
}

export function getPartialManifest(manifest: AssetsManifest, matches: any[]) {
  let rootIndexRoute = Object.values(manifest.routes).find(
    (r) => r.parentId === "root" && r.index === true
  );
  let matchesContainsIndex =
    rootIndexRoute && !matches.some((m) => m.route.id === rootIndexRoute!.id);
  return {
    ...manifest,
    routes: {
      // Include the root index route if we enter on a different route, otherwise
      // we can get a false positive when client-side matching on a link back to
      // `/` since we will match the root route
      ...(matchesContainsIndex
        ? {
            [rootIndexRoute!.id]: rootIndexRoute,
          }
        : {}),
      ...matches.reduce(
        (acc, m) =>
          Object.assign(acc, {
            [m.route.id]: manifest.routes[m.route.id],
          }),
        {}
      ),
    },
  };
}

export function initFogOfWar(
  manifest: AssetsManifest,
  routeModules: RouteModules,
  isSpaMode: boolean,
  basename: string | undefined
): {
  enabled: boolean;
  patchRoutesOnMiss?: unstable_PatchRoutesOnMissFunction;
} {
  if (!isFogOfWarEnabled(isSpaMode)) {
    return { enabled: false };
  }

  fogOfWar = {
    controller: null,
    nextPaths: new Set<string>(),
    knownGoodPaths: new Set<string>(),
    known404Paths: new Set<string>(),
  };

  return {
    enabled: true,
    patchRoutesOnMiss: async ({ path, patch }) => {
      if (fogOfWar!.known404Paths.has(path)) return;
      await fetchAndApplyManifestPatches(
        [path],
        fogOfWar!.known404Paths,
        manifest,
        routeModules,
        isSpaMode,
        basename,
        patch
      );
    },
  };
}

export function useFogOFWarDiscovery(
  router: Router,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  isSpaMode: boolean
) {
  React.useEffect(() => {
    // Don't prefetch if not enabled or if the user has `saveData` enabled
    if (
      !isFogOfWarEnabled(isSpaMode) ||
      navigator.connection?.saveData === true
    ) {
      return;
    }

    // Register a link href for patching
    function registerPath(path: string | null) {
      let { knownGoodPaths, known404Paths, nextPaths } = fogOfWar!;
      if (path && !knownGoodPaths.has(path) && !known404Paths.has(path)) {
        nextPaths.add(path);
      }
    }

    // Fetch patches for all currently rendered links
    async function fetchPatches() {
      fogOfWar?.controller?.abort();

      let lazyPaths = getFogOfWarPaths(fogOfWar!, router);
      if (lazyPaths.length === 0) {
        return;
      }

      try {
        fogOfWar!.controller = new AbortController();
        await fetchAndApplyManifestPatches(
          lazyPaths,
          fogOfWar!.known404Paths,
          manifest,
          routeModules,
          isSpaMode,
          router.basename,
          router.patchRoutes,
          fogOfWar!.controller.signal
        );
      } catch (e) {
        console.error("Failed to fetch manifest patches", e);
      }
    }

    // Register and fetch patches for all initially-rendered links
    document.body
      .querySelectorAll("a[data-discover]")
      .forEach((a) => registerPath(a.getAttribute("href")));

    fetchPatches();

    // Setup a MutationObserver to fetch all subsequently rendered links
    let debouncedFetchPatches = debounce(fetchPatches, 100);

    function isElement(node: Node): node is Element {
      return node.nodeType === Node.ELEMENT_NODE;
    }

    let observer = new MutationObserver((records) => {
      records.forEach((r) => {
        [r.target, ...r.addedNodes].forEach((node) => {
          if (!isElement(node)) return;
          if (node.tagName === "A" && node.getAttribute("data-discover")) {
            registerPath(node.getAttribute("href"));
          } else if (node.tagName !== "A") {
            node
              .querySelectorAll("a[data-discover]")
              .forEach((el) => registerPath(el.getAttribute("href")));
          }
          debouncedFetchPatches();
        });
      });
    });

    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["data-discover", "href"],
    });

    return () => {
      fogOfWar?.controller?.abort();
      observer.disconnect();
    };
  }, [isSpaMode, manifest, routeModules, router]);
}

function getFogOfWarPaths(fogOfWar: FogOfWarInfo, router: Router) {
  let { knownGoodPaths, known404Paths, nextPaths } = fogOfWar;
  return Array.from(nextPaths.keys()).filter((path) => {
    if (knownGoodPaths.has(path)) {
      nextPaths.delete(path);
      return false;
    }

    if (known404Paths.has(path)) {
      nextPaths.delete(path);
      return false;
    }

    let matches = matchRoutes(router.routes, path, router.basename);
    if (matches) {
      knownGoodPaths.add(path);
      nextPaths.delete(path);
      return false;
    }

    return true;
  });
}

export async function fetchAndApplyManifestPatches(
  paths: string[],
  known404Paths: Set<string>,
  manifest: AssetsManifest,
  routeModules: RouteModules,
  isSpaMode: boolean,
  basename: string | undefined,
  patchRoutes: Router["patchRoutes"],
  signal?: AbortSignal
): Promise<void> {
  let manifestPath = `${basename != null ? basename : "/"}/__manifest`.replace(
    /\/+/g,
    "/"
  );
  let url = new URL(manifestPath, window.location.origin);
  url.searchParams.set("version", manifest.version);
  paths.forEach((path) => url.searchParams.append("paths", path));
  let data = (await fetch(url, { signal }).then((res) => res.json())) as {
    notFoundPaths: string[];
    patches: AssetsManifest["routes"];
  };

  // Capture this before we apply the patches to the manifest
  let knownRoutes = new Set(Object.keys(manifest.routes));

  // Patch routes we don't know about yet into the manifest
  let patches: AssetsManifest["routes"] = Object.values(data.patches).reduce(
    (acc, route) =>
      !knownRoutes.has(route.id)
        ? Object.assign(acc, { [route.id]: route })
        : acc,
    {}
  );
  Object.assign(manifest.routes, patches);

  // Track legit 404s so we don't try to fetch them again
  data.notFoundPaths.forEach((p: string) => known404Paths.add(p));

  // Identify all parentIds for which we have new children to add and patch
  // in their new children
  let parentIds = new Set<string | undefined>();
  Object.values(patches).forEach((patch) => {
    if (!patch.parentId || !patches[patch.parentId]) {
      parentIds.add(patch.parentId);
    }
  });
  parentIds.forEach((parentId) =>
    patchRoutes(
      parentId || null,
      createClientRoutes(patches, routeModules, null, isSpaMode, parentId)
    )
  );
}

// Thanks Josh!
// https://www.joshwcomeau.com/snippets/javascript/debounce/
function debounce(callback: (...args: unknown[]) => unknown, wait: number) {
  let timeoutId: number | undefined;
  return (...args: unknown[]) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => callback(...args), wait);
  };
}
