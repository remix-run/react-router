import type { DataRouteMatch } from "../../../lib/router/utils";
import type { AssetsManifest } from "../../../lib/dom/ssr/entry";
import type { RouteModules } from "../../../lib/dom/ssr/routeModules";
import type { LinkDescriptor } from "../../../lib/router/links";
import { getKeyedPrefetchLinks } from "../../../lib/dom/ssr/links";

// Minimal fakes for the pure prefetch-link transform. `getKeyedPrefetchLinks`
// only reads `match.route.id`, `manifest.routes[id]`, and the cached route
// module's `links()`, so we stub just those.
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
  it("preserves descriptor crossOrigin while transforming links", async () => {
    let [link] = await prefetchLinks([
      {
        rel: "stylesheet",
        href: "/assets/styles.css",
        crossOrigin: "use-credentials",
      },
    ]);
    expect(link).toMatchObject({
      rel: "prefetch",
      as: "style",
      href: "/assets/styles.css",
      crossOrigin: "use-credentials",
    });
  });

  it("leaves descriptor crossOrigin undefined when config provides one", async () => {
    let [link] = await prefetchLinks(
      [{ rel: "preload", as: "font", href: "/assets/font.woff2" }],
      "anonymous",
    );
    expect(link).toMatchObject({
      rel: "prefetch",
      href: "/assets/font.woff2",
    });
    expect(link.crossOrigin).toBeUndefined();
  });
});
