/** @jest-environment node */

import type { AssetsManifest } from "../../../lib/dom/ssr/entry";
import { getPatchRoutesOnNavigationFunction } from "../../../lib/dom/ssr/fog-of-war";
import {
  getCustomPatchRoutesOnNavigationFunction,
  RouteDiscoveryRuntime,
} from "../../../lib/dom/ssr/route-discovery";
import { createMemoryHistory } from "../../../lib/router/history";
import { createRouter } from "../../../lib/router/router";

describe("fetcher manifest recovery after navigation", () => {
  let originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );
  let href: string;
  let reload: jest.Mock;
  let windowEvents: EventTarget;

  beforeEach(() => {
    jest.useFakeTimers();
    href = "http://localhost/";
    reload = jest.fn();
    windowEvents = new EventTarget();
    let stored = new Map<string, string>();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        document: { createElement: () => ({}) },
        addEventListener: windowEvents.addEventListener.bind(windowEvents),
        removeEventListener:
          windowEvents.removeEventListener.bind(windowEvents),
        location: {
          origin: "http://localhost",
          get href() {
            return href;
          },
          set href(path: string) {
            reload(path);
          },
          reload() {
            reload(href);
          },
        },
      },
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
        removeItem: (key: string) => stored.delete(key),
      },
    });
    sessionStorage.setItem(
      "react-router-manifest-recovery",
      JSON.stringify({ attempts: 1, expiresAt: Date.now() + 30_000 }),
    );
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(async () => {
    windowEvents.dispatchEvent(
      Object.assign(new Event("pageshow"), { persisted: true }),
    );
    await jest.advanceTimersByTimeAsync(0);
    jest.clearAllTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
    for (let [key, descriptor] of [
      ["window", originalWindow],
      ["sessionStorage", originalStorage],
    ] as const) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, key);
      }
    }
  });

  it.each(["default", "custom", "custom handler"])(
    "reloads the current page when a navigation completes during %s discovery backoff",
    async (discovery) => {
      let routeDiscovery = {
        mode: "lazy",
        manifestPath: "/__manifest",
      } as const;
      let manifest: AssetsManifest = {
        version: "v1",
        url: "/manifest.js",
        entry: { module: "/entry.js", imports: [] },
        routes: {},
      };
      let signal: AbortSignal | undefined;
      let fetchImplementation = jest.fn(async (request: Request) => {
        signal = request.signal;
        return new Response(null, {
          status: 204,
          headers: { "X-Remix-Reload-Document": "true" },
        });
      });
      let ssrInfo = {
        manifest,
        routeModules: {},
        router: undefined as ReturnType<typeof createRouter> | undefined,
        context: { ssr: true, isSpaMode: false, routeDiscovery },
      };
      let runtime = new RouteDiscoveryRuntime(ssrInfo, {
        fetch: fetchImplementation,
      });
      if (discovery === "custom handler") {
        runtime.register({
          current: { onManifestMismatch: (event) => event.defaultBehavior() },
        });
      }
      let router: ReturnType<typeof createRouter>;
      let getRouter = () => router;
      router = createRouter({
        history: createMemoryHistory({ initialEntries: ["/"] }),
        routes: [
          {
            id: "root",
            path: "/",
            children: [
              { id: "index", index: true },
              { id: "current", path: "current" },
              { id: "splat", path: "*", loader: () => "stale" },
            ],
          },
        ],
        patchRoutesOnNavigation:
          discovery === "default"
            ? getPatchRoutesOnNavigationFunction(
                getRouter,
                manifest,
                {},
                true,
                routeDiscovery,
                false,
                "/",
                fetchImplementation,
              )
            : getCustomPatchRoutesOnNavigationFunction(getRouter, runtime),
      });
      ssrInfo.router = router;
      try {
        let settled = jest.fn();
        router.fetch("root-fetcher", "root", "/unknown").then(settled, settled);
        await jest.advanceTimersByTimeAsync(0);
        expect(fetchImplementation).toHaveBeenCalledTimes(1);
        expect(reload).not.toHaveBeenCalled();

        await router.navigate("/current?query=1#hash");
        href = "http://localhost/current?query=1#hash";
        expect(router.state.location.pathname).toBe("/current");
        expect(router.state.navigation.state).toBe("idle");
        expect(router.getFetcher("root-fetcher").state).toBe("loading");
        expect(signal?.aborted).toBe(false);
        expect(settled).not.toHaveBeenCalled();

        await jest.advanceTimersByTimeAsync(1000);
        expect(reload.mock.calls).toEqual([[href]]);
      } finally {
        router.dispose();
      }
    },
  );
});
