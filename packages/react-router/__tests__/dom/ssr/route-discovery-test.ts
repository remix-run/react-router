import type { AssetsManifest } from "../../../lib/dom/ssr/entry";
import type { EntryRoute } from "../../../lib/dom/ssr/routes";
import type { RouterFetch } from "../../../lib/dom/ssr/single-fetch";
import { RouteDiscoveryRuntime } from "../../../lib/dom/ssr/route-discovery";
import { URL_LIMIT } from "../../../lib/dom/ssr/fog-of-war";
import { createMemoryHistory } from "../../../lib/router/history";
import { createRouter } from "../../../lib/router/router";
import { createDeferred, tick } from "../../router/utils/utils";

function entry(id: string, path: string, parentId?: string): EntryRoute {
  return {
    id,
    path,
    parentId,
    module: `/assets/${id}.js`,
    hasAction: false,
    hasLoader: false,
    hasClientAction: false,
    hasClientLoader: false,
    hasClientMiddleware: false,
    hasErrorBoundary: false,
  };
}
function setup({
  basename = "/",
  complete = false,
  ssr = true,
  hmr = false,
  fetchImplementation,
  serverOrigin,
}: {
  basename?: string;
  complete?: boolean;
  ssr?: boolean;
  hmr?: boolean;
  fetchImplementation?: RouterFetch;
  serverOrigin?: string;
} = {}) {
  let root = entry("root", "");
  let manifest: AssetsManifest = {
    url: "/assets/manifest-a.js",
    version: "a",
    entry: { module: "/assets/entry.js", imports: [] },
    routes: { root },
    ...(hmr ? { hmr: { runtime: "/@vite/client" } } : {}),
  };
  let full = {
    ...manifest,
    routes: { root, a: entry("a", "a", "root"), b: entry("b", "b", "root") },
  };
  let ssrInfo: ConstructorParameters<typeof RouteDiscoveryRuntime>[0] = {
    manifest,
    routeModules: {},
    router: undefined,
    context: {
      ssr,
      routeDiscovery: {
        mode: complete ? "initial" : "lazy",
        manifestPath: "/__manifest",
      },
      isSpaMode: false,
      basename,
      unstable_apiServerOrigin: serverOrigin,
    },
  };
  let load = jest.fn(async () => full);
  let runtime = new RouteDiscoveryRuntime(ssrInfo, {
    loadManifest: load,
    fetch: fetchImplementation,
  });
  // Match HydratedRouter's order: create the runtime first, then assign the
  // router before initialization can start discovery.
  let router = createRouter({
    basename,
    history: createMemoryHistory({ initialEntries: [basename] }),
    routes: [{ id: "root", path: "" }],
  });
  ssrInfo.router = router;
  return { manifest, full, router, load, runtime };
}
let originalFetch = global.fetch;
let fetchMock: jest.Mock;
beforeEach(() => {
  fetchMock = jest.fn(async () => Response.json({}));
  global.fetch = fetchMock;
});
afterEach(() => {
  global.fetch = originalFetch;
  jest.restoreAllMocks();
});
const mismatch = () =>
  new Response(null, {
    status: 204,
    headers: { "X-Remix-Reload-Document": "true" },
  });

test.each(["eager", "navigation", "fetcher", "imperative"] as const)(
  "%s discovery uses custom fetch with the configured origin and cancellation signal",
  async (source) => {
    let pending = createDeferred<Response>();
    let fetchImplementation = jest.fn<
      ReturnType<RouterFetch>,
      Parameters<RouterFetch>
    >(() => pending.promise);
    let { runtime } = setup({
      basename: "/app",
      fetchImplementation,
      serverOrigin: "https://api.example.com",
    });
    let controller = new AbortController();
    let discovery =
      source === "imperative"
        ? runtime.discoverRoutes(["/a"], { signal: controller.signal })
        : runtime.discover(["/app/a"], source, null, controller.signal);
    await tick();
    expect(fetchImplementation).toHaveBeenCalledWith(expect.any(Request), {
      type: "manifest",
    });
    let [request] = fetchImplementation.mock.calls[0];
    let url = new URL(request.url);
    expect(url.origin).toBe("https://api.example.com");
    expect(url.pathname).toBe("/app/__manifest");
    expect(url.searchParams.get("paths")).toContain("/app/a");
    expect(url.searchParams.get("version")).toBe("a");
    expect(request.signal.aborted).toBe(false);
    controller.abort();
    expect(request.signal.aborted).toBe(true);
    await pending.resolve(Response.json({}));
    expect(await discovery).toEqual({ type: "aborted" });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(runtime.discoveredPaths.size).toBe(0);
  },
);

test("shares full loading, preserves manifest identity/version, and disables incremental discovery", async () => {
  let { runtime, manifest, full, router, load } = setup();
  let dfd = createDeferred<AssetsManifest>();
  load.mockImplementation(() => dfd.promise);
  let states: string[] = [];
  runtime.subscribe(() => states.push(runtime.state));
  let first = runtime.loadAllRoutes();
  expect(runtime.loadAllRoutes()).toBe(first);
  expect(runtime.state).toBe("loading");
  await dfd.resolve(full);
  await first;
  expect(states).toEqual(["loading", "complete"]);
  expect(manifest.routes).toEqual(full.routes);
  expect(manifest.version).toBe("a");
  expect(router.match("/b")?.at(-1)?.route.id).toBe("b");
  await runtime.loadAllRoutes();
  expect(await runtime.discoverRoutes(["/b"])).toEqual({ type: "success" });
  expect(load).toHaveBeenCalledTimes(1);
  expect(fetchMock).not.toHaveBeenCalled();
});

test("rejects version mismatches without completing and allows retry", async () => {
  let { runtime, manifest, full, load } = setup();
  load.mockResolvedValueOnce({ ...full, version: "b" });
  await expect(runtime.loadAllRoutes()).rejects.toThrow("client version");
  expect(runtime.state).toBe("partial");
  expect(Object.keys(manifest.routes)).toEqual(["root"]);
  await runtime.loadAllRoutes();
  expect(runtime.state).toBe("complete");
});

test.each(["event", "hook"])(
  "cancels after a mismatch full-load failure through the %s reference and reports it once",
  async (reference) => {
    let { runtime, load } = setup();
    fetchMock.mockImplementation(async () => mismatch());
    let error = new Error("retained asset missing");
    let onError = jest.fn();
    runtime.onError = onError;
    load.mockRejectedValue(error);
    let earlier = jest.fn();
    runtime.register({ current: { onManifestMismatch: earlier } });
    let { loadAllRoutes } = runtime;
    runtime.register({
      current: {
        onManifestMismatch: (event) =>
          reference === "event" ? event.loadAllRoutes() : loadAllRoutes(),
      },
    });
    expect(await runtime.discoverRoutes(["/a"])).toEqual({
      type: "version-mismatch",
    });
    expect(earlier).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBe(error);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(runtime.state).toBe("partial");
  },
);

test.each(["event", "hook"])(
  "consumers can catch full-load failure through the %s reference without a framework error",
  async (reference) => {
    let { runtime, load } = setup();
    let error = new Error("missing");
    load.mockRejectedValue(error);
    runtime.onError = jest.fn();
    let caught = jest.fn();
    let { loadAllRoutes } = runtime;
    runtime.register({
      current: {
        onManifestMismatch: async (event) => {
          try {
            await (reference === "event"
              ? event.loadAllRoutes()
              : loadAllRoutes());
          } catch (error) {
            caught(error);
          }
        },
      },
    });
    fetchMock.mockImplementation(async () => mismatch());
    expect(await runtime.discoverRoutes(["/a"])).toEqual({
      type: "version-mismatch",
    });
    expect(caught).toHaveBeenCalledTimes(1);
    expect(caught).toHaveBeenCalledWith(error);
    expect(runtime.onError).not.toHaveBeenCalled();
  },
);

test("runs handlers in reverse registration order, with identity cleanup and stable update priority", async () => {
  let { runtime } = setup();
  fetchMock.mockImplementation(async () => mismatch());
  let calls: string[] = [];
  let first = {
    current: {
      onManifestMismatch: () => {
        calls.push("first");
      },
    },
  };
  let second = {
    current: {
      onManifestMismatch: () => {
        calls.push("second");
      },
    },
  };
  let removeFirst = runtime.register(first);
  let removeSecond = runtime.register(second);
  first.current = {
    onManifestMismatch: () => {
      calls.push("updated first");
    },
  };
  await runtime.discoverRoutes(["/a"]);
  expect(calls).toEqual(["second", "updated first"]);
  removeFirst();
  calls = [];
  await runtime.discoverRoutes(["/b"]);
  expect(calls).toEqual(["second"]);
  removeSecond();
});

test("stopPropagation does not itself resolve a mismatch", async () => {
  let { runtime, load } = setup();
  let earlier = jest.fn((event) => event.loadAllRoutes());
  runtime.register({ current: { onManifestMismatch: earlier } });
  runtime.register({
    current: { onManifestMismatch: (event) => event.stopPropagation() },
  });
  fetchMock.mockImplementation(async () => mismatch());
  expect(await runtime.discoverRoutes(["/a"])).toEqual({
    type: "version-mismatch",
  });
  expect(earlier).not.toHaveBeenCalled();
  expect(load).not.toHaveBeenCalled();
});

test("concurrent mismatches share the initiating event while an aborted participant exits promptly", async () => {
  let { runtime } = setup();
  let recovery = createDeferred();
  let handler = jest.fn(async (event) => {
    await recovery.promise;
    await event.loadAllRoutes();
  });
  runtime.register({ current: { onManifestMismatch: handler } });
  fetchMock.mockImplementation(async () => mismatch());
  let ac = new AbortController();
  let first = runtime.discover(["/a"], "navigation", "/a?q=1#hash", ac.signal);
  await tick();
  let second = runtime.discoverRoutes(["/b"]);
  await tick();
  ac.abort();
  expect(await first).toEqual({ type: "aborted" });
  expect(handler).toHaveBeenCalledTimes(1);
  expect(handler.mock.calls[0][0]).toMatchObject({
    source: "navigation",
    reloadUrl: "/a?q=1#hash",
    version: "a",
  });
  await recovery.resolve();
  expect(await second).toEqual({ type: "success" });
});

test("a later mismatch starts a new chain after a canceled recovery", async () => {
  let { runtime } = setup();
  let handler = jest.fn();
  runtime.register({ current: { onManifestMismatch: handler } });
  fetchMock.mockImplementation(async () => mismatch());
  await runtime.discoverRoutes(["/a"]);
  await runtime.discoverRoutes(["/a"]);
  expect(handler).toHaveBeenCalledTimes(2);
});

test("imperative mismatches without handlers do not reload or populate discovery caches", async () => {
  let { runtime } = setup();
  fetchMock.mockImplementation(async () => mismatch());
  expect(await runtime.discoverRoutes(["/a"])).toEqual({
    type: "version-mismatch",
  });
  expect(runtime.discoveredPaths.size).toBe(0);
});

test("batches all requested paths within the URL limit and normalizes basename/search/hash", async () => {
  let { runtime } = setup({ basename: "/app" });
  let paths = Array.from(
    { length: 1000 },
    (_, i) => `/destination-${i}?query#hash`,
  );
  await runtime.discoverRoutes(paths);
  expect(fetchMock.mock.calls.length).toBeGreaterThan(1);
  let discovered = new Set<string>();
  for (let [request] of fetchMock.mock.calls) {
    let url = new URL(request.url);
    expect(url.href.length).toBeLessThanOrEqual(URL_LIMIT);
    expect(url.pathname).toBe("/app/__manifest");
    for (let path of url.searchParams.get("paths").split(","))
      discovered.add(path);
  }
  expect(paths.every((_, i) => discovered.has(`/app/destination-${i}`))).toBe(
    true,
  );
  expect(runtime.state).toBe("partial");
});

test("warns and skips individually oversized paths without caching them", async () => {
  let { runtime } = setup();
  let warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  let oversized = "/" + "a".repeat(URL_LIMIT);
  expect(await runtime.discoverRoutes([oversized, "/b"])).toEqual({
    type: "success",
  });
  expect(warn).toHaveBeenCalledTimes(1);
  expect(runtime.discoveredPaths.has(oversized)).toBe(false);
  expect(runtime.discoveredPaths.has("/b")).toBe(true);
});

test("cached discoveries skip requests", async () => {
  let { runtime } = setup();
  await runtime.discoverRoutes(["/a"]);
  await runtime.discoverRoutes(["/a"]);
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test("full completion supersedes an in-flight incremental mismatch", async () => {
  let { runtime } = setup();
  let response = createDeferred<Response>();
  let handler = jest.fn();
  runtime.register({ current: { onManifestMismatch: handler } });
  fetchMock.mockImplementation(() => response.promise);
  let discovery = runtime.discoverRoutes(["/a"]);
  await tick();
  await runtime.loadAllRoutes();
  await response.resolve(mismatch());
  expect(await discovery).toEqual({ type: "success" });
  expect(handler).not.toHaveBeenCalled();
});

test("actual handler errors reject and stop propagation", async () => {
  let { runtime } = setup();
  fetchMock.mockImplementation(async () => mismatch());
  let earlier = jest.fn();
  runtime.register({ current: { onManifestMismatch: earlier } });
  runtime.register({
    current: {
      onManifestMismatch: () => {
        throw new Error("handler failed");
      },
    },
  });
  await expect(runtime.discoverRoutes(["/a"])).rejects.toThrow(
    "handler failed",
  );
  expect(earlier).not.toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});

test.each(["event", "hook"])(
  "an unrelated handler error after a caught %s full-load failure still rejects",
  async (reference) => {
    let { runtime, load } = setup();
    fetchMock.mockImplementation(async () => mismatch());
    load.mockRejectedValue(new Error("missing retained asset"));
    runtime.onError = jest.fn();
    let handlerError = new Error("handler failed");
    let { loadAllRoutes } = runtime;
    runtime.register({
      current: {
        onManifestMismatch: async (event) => {
          try {
            await (reference === "event"
              ? event.loadAllRoutes()
              : loadAllRoutes());
          } catch {
            throw handlerError;
          }
        },
      },
    });
    await expect(runtime.discoverRoutes(["/a"])).rejects.toBe(handlerError);
    expect(runtime.onError).not.toHaveBeenCalled();
    expect(runtime.state).toBe("partial");
  },
);

test.each([
  "../a",
  "a",
  "https://other.test/a",
  "//other.test/a",
  "/\\other.test/a",
])("rejects unsupported path %s", async (path) => {
  await expect(setup().runtime.discoverRoutes([path])).rejects.toThrow(
    "application-root",
  );
});

test.each([
  ["initial", { complete: true }],
  ["SPA", { ssr: false }],
  ["development", { hmr: true }],
] as const)("%s manifests need no loading or handlers", async (_, options) => {
  let { runtime, load } = setup(options);
  let handler = jest.fn();
  runtime.register({ current: { onManifestMismatch: handler } });
  await runtime.loadAllRoutes();
  await runtime.discoverRoutes(["/a"]);
  expect(runtime.state).toBe("complete");
  expect(load).not.toHaveBeenCalled();
  expect(fetchMock).not.toHaveBeenCalled();
  expect(handler).not.toHaveBeenCalled();
});

test("a cached wrong-version module still rejects when loading is retried", async () => {
  let { manifest, router } = setup();
  manifest.url = new URL(
    "./fixtures/discovery-manifest.ts",
    import.meta.url,
  ).href;
  window.__reactRouterManifest = manifest;
  let runtime = new RouteDiscoveryRuntime({
    router,
    manifest,
    routeModules: {},
    context: {
      ssr: true,
      routeDiscovery: { mode: "lazy", manifestPath: "/__manifest" },
      isSpaMode: false,
      basename: undefined,
    },
  });
  try {
    await expect(runtime.loadAllRoutes()).rejects.toThrow("client version");
    await expect(runtime.loadAllRoutes()).rejects.toThrow("client version");
    expect(runtime.state).toBe("partial");
    expect(window.__reactRouterManifest).toBe(manifest);
  } finally {
    delete window.__reactRouterManifest;
  }
});

test.each(["fetch", "body"])(
  "full completion supersedes an in-flight incremental %s failure",
  async (phase) => {
    let { runtime } = setup();
    let pending = createDeferred();
    if (phase === "fetch") {
      fetchMock.mockImplementation(() => pending.promise);
    } else {
      fetchMock.mockResolvedValue({
        ok: true,
        status: 200,
        headers: new Headers(),
        json: () => pending.promise,
      });
    }
    let discovery = runtime.discoverRoutes(["/a"]);
    await tick();
    await runtime.loadAllRoutes();
    await pending.reject(new Error("incremental request failed"));
    expect(await discovery).toEqual({ type: "success" });
  },
);

test("default eager recovery is available before hooks mount", async () => {
  let { runtime } = setup();
  let warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  fetchMock.mockImplementation(async () => mismatch());
  expect(await runtime.discover(["/a"], "eager", null)).toEqual({
    type: "version-mismatch",
  });
  expect(warn).toHaveBeenCalledWith(
    expect.stringContaining("eager route discovery"),
  );
});

test("custom handlers override default recovery until removed", async () => {
  let { runtime } = setup();
  let warn = jest.spyOn(console, "warn").mockImplementation(() => {});
  fetchMock.mockImplementation(async () => mismatch());
  let custom = jest.fn();
  let remove = runtime.register({ current: { onManifestMismatch: custom } });
  runtime.register({ current: {} });
  await runtime.discover(["/a"], "eager", null);
  expect(custom).toHaveBeenCalledTimes(1);
  expect(warn).not.toHaveBeenCalled();
  remove();
  await runtime.discover(["/a"], "eager", null);
  expect(custom).toHaveBeenCalledTimes(1);
  expect(warn).toHaveBeenCalledTimes(1);
});

test.each(["eager", "imperative"] as const)(
  "%s defaultBehavior is explicit and shared by every handler for the event",
  async (source) => {
    let { runtime } = setup();
    let warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockImplementation(async () => mismatch());
    let fallback: Promise<void> | undefined;
    runtime.register({
      current: {
        onManifestMismatch: (event) => {
          expect(event.defaultBehavior()).toBe(fallback);
          return event.defaultBehavior();
        },
      },
    });
    runtime.register({
      current: {
        onManifestMismatch: (event) => {
          fallback = event.defaultBehavior();
          expect(event.defaultBehavior()).toBe(fallback);
          return fallback;
        },
      },
    });
    expect(await runtime.discover(["/a"], source, null)).toEqual({
      type: "version-mismatch",
    });
    expect(warn).toHaveBeenCalledTimes(source === "eager" ? 1 : 0);
  },
);

test.each(["eager", "imperative"] as const)(
  "concurrent %s and navigation mismatches keep source-specific default recovery",
  async (source) => {
    let { runtime } = setup();
    let warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    fetchMock.mockImplementation(async () => mismatch());
    // Make default navigation recovery reject via its reload-loop guard, instead
    // of starting a document navigation that jsdom cannot perform.
    sessionStorage.setItem("react-router-manifest-version", "a");
    try {
      let [eager, navigation] = await Promise.allSettled([
        runtime.discover(["/a"], source, null),
        runtime.discover(["/b"], "navigation", "/b"),
      ]);
      expect(eager).toEqual({
        status: "fulfilled",
        value: { type: "version-mismatch" },
      });
      expect(navigation).toEqual({
        status: "rejected",
        reason: new Error(
          "Unable to discover routes due to manifest version mismatch.",
        ),
      });
      expect(warn).toHaveBeenCalledTimes(source === "eager" ? 1 : 0);
    } finally {
      sessionStorage.removeItem("react-router-manifest-version");
    }
  },
);
