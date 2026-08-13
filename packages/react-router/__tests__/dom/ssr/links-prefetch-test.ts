import type { DataRouteMatch } from "../../../lib/router/utils";
import type { AssetsManifest } from "../../../lib/dom/ssr/entry";
import type { RouteModules } from "../../../lib/dom/ssr/routeModules";
import type { LinkDescriptor } from "../../../lib/router/links";
import { getKeyedPrefetchLinks } from "../../../lib/dom/ssr/links";

// Minimal fakes for the pure prefetch-link transform. `getKeyedPrefetchLinks`
// only reads `match.route.id`, `manifest.routes[id]`, `manifest.crossOrigin`,
// and the cached route module's `links()`, so we stub just those.
function setup(
  links: LinkDescriptor[],
  crossOrigin?: AssetsManifest["crossOrigin"],
) {
  let routeId = "routes/thing";
  let matches = [{ route: { id: routeId } }] as unknown as DataRouteMatch[];
  let manifest = {
    entry: { imports: [], module: "" },
    routes: {
      [routeId]: { id: routeId, module: `/assets/${routeId}.js` },
    },
    url: "/assets/manifest.js",
    version: "1",
    crossOrigin,
  } as unknown as AssetsManifest;
  // Pre-populate the cache so `loadRouteModule` resolves without importing.
  let routeModules = { [routeId]: { links: () => links } } as RouteModules;
  return { matches, manifest, routeModules };
}

async function prefetchLinks(
  links: LinkDescriptor[],
  crossOrigin?: AssetsManifest["crossOrigin"],
) {
  let { matches, manifest, routeModules } = setup(links, crossOrigin);
  let keyed = await getKeyedPrefetchLinks(matches, manifest, routeModules);
  return keyed.map((k) => k.link);
}

describe("getKeyedPrefetchLinks crossOrigin", () => {
  it("applies manifest.crossOrigin to prefetched stylesheet links", async () => {
    let [link] = await prefetchLinks(
      [{ rel: "stylesheet", href: "/assets/styles.css" }],
      "anonymous",
    );
    expect(link).toMatchObject({
      rel: "prefetch",
      as: "style",
      href: "/assets/styles.css",
      crossOrigin: "anonymous",
    });
  });

  it("applies manifest.crossOrigin to prefetched preload links", async () => {
    let [link] = await prefetchLinks(
      [{ rel: "preload", as: "font", href: "/assets/font.woff2" }],
      "use-credentials",
    );
    expect(link).toMatchObject({
      rel: "prefetch",
      href: "/assets/font.woff2",
      crossOrigin: "use-credentials",
    });
  });

  it("lets a per-descriptor crossOrigin win over manifest.crossOrigin", async () => {
    let [link] = await prefetchLinks(
      [
        {
          rel: "stylesheet",
          href: "/assets/styles.css",
          crossOrigin: "use-credentials",
        },
      ],
      "anonymous",
    );
    expect(link).toMatchObject({ crossOrigin: "use-credentials" });
  });

  it("leaves crossOrigin undefined when neither source provides one", async () => {
    let [link] = await prefetchLinks([
      { rel: "stylesheet", href: "/assets/styles.css" },
    ]);
    expect(link.crossOrigin).toBeUndefined();
  });
});
