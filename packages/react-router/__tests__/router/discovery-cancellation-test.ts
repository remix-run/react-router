import { createMemoryHistory } from "../../lib/router/history";
import { createRouter } from "../../lib/router/router";
import { DiscoveryCancelledError, redirect } from "../../lib/router/utils";
import { getFetcherData } from "./utils/data-router-setup";
import { createDeferred, createFormData, tick } from "./utils/utils";

describe("application-controlled discovery cancellation", () => {
  test.each(["navigation", "submission", "fetcher", "fetcher submission"])(
    "a late canceled %s cannot settle or abort its replacement",
    async (operation) => {
      let data = createDeferred();
      let next: Promise<void> | undefined;
      let signal: AbortSignal | undefined;
      let fetcherData: unknown;
      let fetcher = operation.startsWith("fetcher");
      let router = createRouter({
        future: { unstable_customRouteDiscovery: true },
        history: createMemoryHistory(),
        routes: [
          { id: "root", path: "/" },
          {
            id: "known",
            path: "/known",
            loader: ({ request }) => {
              signal = request.signal;
              return data.promise;
            },
          },
        ],
        patchRoutesOnNavigation() {
          // Supersede discovery between its cancellation and the caller's
          // continuation. Only the replacement now owns pending router state.
          queueMicrotask(() => {
            next = fetcher
              ? router.fetch("editor", "root", "/known")
              : router.navigate("/known");
          });
          throw new DiscoveryCancelledError();
        },
      }).initialize();
      router.subscribe((state) => {
        if (state.fetchers.has("editor"))
          fetcherData = state.fetchers.get("editor")?.data;
      });
      let opts = operation.includes("submission")
        ? {
            formMethod: "post" as const,
            formData: createFormData({ draft: "keep" }),
          }
        : undefined;
      try {
        await (fetcher
          ? router.fetch("editor", "root", "/unknown", opts)
          : router.navigate("/unknown", opts));
        await tick();
        expect(signal?.aborted).toBe(false);
        expect(
          fetcher
            ? router.getFetcher("editor").state
            : router.state.navigation.state,
        ).toBe("loading");
        await data.resolve("replacement");
        await next;
        expect(fetcher ? fetcherData : router.state.loaderData.known).toBe(
          "replacement",
        );
        expect(router.state.errors).toBeNull();
      } finally {
        router.dispose();
      }
    },
  );

  test.each(["navigation", "submission", "fetcher", "fetcher submission"])(
    "settles %s without executing the partial match",
    async (operation) => {
      let handler = jest.fn();
      let router = createRouter({
        future: { unstable_customRouteDiscovery: true },
        history: createMemoryHistory(),
        routes: [
          {
            id: "root",
            path: "/",
            children: [
              { index: true },
              { path: "*", loader: handler, action: handler },
            ],
          },
        ],
        patchRoutesOnNavigation() {
          throw new DiscoveryCancelledError();
        },
      }).initialize();
      let opts = operation.includes("submission")
        ? {
            formMethod: "post" as const,
            formData: createFormData({ draft: "keep" }),
          }
        : undefined;
      try {
        if (operation.startsWith("fetcher")) {
          await router.fetch("editor", "root", "/unknown", opts);
        } else {
          await router.navigate("/unknown", opts);
        }
        expect(router.getFetcher("editor").state).toBe("idle");
        expect(router.state.navigation.state).toBe("idle");
        expect(router.state.location.pathname).toBe("/");
        expect(router.state.errors).toBeNull();
        expect(handler).not.toHaveBeenCalled();
      } finally {
        router.dispose();
      }
    },
  );

  test.each([
    {
      direction: "Back",
      initialEntries: ["/unknown", "/"],
      initialIndex: 1,
      delta: -1,
    },
    {
      direction: "Forward",
      initialEntries: ["/", "/unknown"],
      initialIndex: 0,
      delta: 1,
    },
  ])(
    "restores the previous history entry when $direction is canceled",
    async ({ initialEntries, initialIndex, delta }) => {
      let history = createMemoryHistory({ initialEntries, initialIndex });
      let router = createRouter({
        future: { unstable_customRouteDiscovery: true },
        history,
        routes: [{ path: "/" }],
        patchRoutesOnNavigation() {
          throw new DiscoveryCancelledError();
        },
      }).initialize();
      try {
        await router.navigate(delta);
        expect(history.location.pathname).toBe("/");
        expect(history.index).toBe(initialIndex);
        expect(router.state.location.pathname).toBe("/");
        expect(router.state.navigation.state).toBe("idle");
        expect(router.state.errors).toBeNull();
      } finally {
        router.dispose();
      }
    },
  );

  test("superseding a fetcher during discovery never executes its submission", async () => {
    let discovery = createDeferred();
    let action = jest.fn();
    let router = createRouter({
      future: { unstable_customRouteDiscovery: true },
      history: createMemoryHistory(),
      routes: [
        { id: "root", path: "/" },
        { path: "known", loader: () => "new data" },
        { path: "*", action },
      ],
      patchRoutesOnNavigation: () => discovery.promise,
    }).initialize();
    try {
      let latestData: unknown;
      router.subscribe((state) => {
        if (state.fetchers.has("editor"))
          latestData = state.fetchers.get("editor")?.data;
      });
      let first = router.fetch("editor", "root", "/unknown", {
        formMethod: "post",
        formData: createFormData({ draft: "keep" }),
      });
      await tick();
      await router.fetch("editor", "root", "/known");
      await discovery.resolve();
      await first;
      expect(action).not.toHaveBeenCalled();
      expect(router.getFetcher("editor").state).toBe("idle");
      expect(latestData).toBe("new data");
    } finally {
      router.dispose();
    }
  });
});

test("canceling an approved blocked navigation restores the blocker for subsequent navigations", async () => {
  let router = createRouter({
    future: { unstable_customRouteDiscovery: true },
    history: createMemoryHistory(),
    routes: [{ path: "/" }, { path: "/known" }],
    patchRoutesOnNavigation() {
      throw new DiscoveryCancelledError();
    },
  }).initialize();
  let block = jest.fn(() => true);
  router.getBlocker("draft", block);
  try {
    await router.navigate("/unknown");
    expect(router.state.blockers.get("draft")?.state).toBe("blocked");
    router.state.blockers.get("draft")?.proceed?.();
    await tick();
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.blockers.get("draft")?.state).toBe("unblocked");
    await router.navigate("/known");
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.blockers.get("draft")?.state).toBe("blocked");
    expect(block).toHaveBeenCalledTimes(2);
  } finally {
    router.dispose();
  }
});

test("multiple superseding POPs cancel back to the committed entry", async () => {
  let history = createMemoryHistory({ initialEntries: ["/a", "/b", "/"] });
  let discovery = createDeferred();
  let router = createRouter({
    future: { unstable_customRouteDiscovery: true },
    history,
    routes: [{ path: "/" }],
    async patchRoutesOnNavigation() {
      await discovery.promise;
      throw new DiscoveryCancelledError();
    },
  }).initialize();
  try {
    let first = router.navigate(-1);
    let second = router.navigate(-1);
    await discovery.resolve();
    await Promise.all([first, second]);
    expect(history.location.pathname).toBe("/");
    expect(history.index).toBe(2);
    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.errors).toBeNull();
  } finally {
    router.dispose();
  }
});

test.each(["navigation", "fetcher"])(
  "without the flag a %s discovery error retains ordinary error handling",
  async (operation) => {
    let error = new DiscoveryCancelledError();
    let router = createRouter({
      history: createMemoryHistory(),
      routes: [{ id: "root", path: "/" }],
      patchRoutesOnNavigation() {
        throw error;
      },
    }).initialize();
    try {
      await (operation === "navigation"
        ? router.navigate("/unknown")
        : router.fetch("key", "root", "/unknown"));
      expect(router.state.errors).toEqual({ root: error });
      expect(router.state.location.pathname).toBe(
        operation === "navigation" ? "/unknown" : "/",
      );
    } finally {
      router.dispose();
    }
  },
);

test.each(["load", "submission", "revalidating load"])(
  "settles a fetcher %s when discovery cancels its redirect destination",
  async (operation) => {
    let loader = jest.fn(() => "fresh data");
    let handler = jest.fn(() =>
      redirect(
        "/undiscovered",
        operation === "revalidating load"
          ? { headers: { "X-Remix-Revalidate": "yes" } }
          : undefined,
      ),
    );
    let discover = jest.fn(() => {
      throw new DiscoveryCancelledError();
    });
    let router = createRouter({
      future: { unstable_customRouteDiscovery: true },
      history: createMemoryHistory(),
      routes: [
        { id: "root", path: "/", loader },
        { path: "/known", loader: handler, action: handler },
      ],
      hydrationData: { loaderData: { root: "stale data" } },
      patchRoutesOnNavigation: discover,
    }).initialize();
    try {
      await router.fetch(
        "redirecting-fetcher",
        "root",
        "/known",
        operation === "submission"
          ? { formMethod: "post", formData: createFormData({ draft: "saved" }) }
          : undefined,
      );

      // The known route executes once; only its redirect needs discovery.
      expect(handler).toHaveBeenCalledTimes(1);
      expect(discover).toHaveBeenCalledTimes(1);
      expect(discover).toHaveBeenCalledWith(
        expect.objectContaining({ path: "/undiscovered" }),
      );
      expect(router.state.location.pathname).toBe("/");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.errors).toBeNull();
      expect(router.getFetcher("redirecting-fetcher").state).toBe("idle");
      expect(loader).not.toHaveBeenCalled();
      expect(router.state.loaderData.root).toBe("stale data");
    } finally {
      router.dispose();
    }
  },
);

test.each([
  { path: "/", pathname: "/" },
  { path: "/:id", pathname: "/retained" },
  { path: "/*", pathname: "/retained/splat" },
])(
  "cancels pending revalidation and retains the $path match when discovery cancels navigation",
  async ({ path, pathname }) => {
    let discovery = createDeferred();
    let freshData = createDeferred();
    let loader = jest.fn(() => freshData.promise);
    let discover = jest.fn(async () => {
      await discovery.promise;
      throw new DiscoveryCancelledError();
    });
    let router = createRouter({
      future: { unstable_customRouteDiscovery: true },
      history: createMemoryHistory({ initialEntries: [pathname] }),
      routes: [{ id: "root", path, loader }],
      hydrationData: { loaderData: { root: "stale data" } },
      patchRoutesOnNavigation: discover,
    }).initialize();
    try {
      let navigation = router.navigate("/undiscovered");
      await tick();
      expect(discover).toHaveBeenCalledTimes(1);
      expect(router.state.navigation.state).toBe("loading");

      let revalidated = false;
      let revalidation = router.revalidate().then(() => {
        revalidated = true;
      });
      await tick();
      expect(discover).toHaveBeenCalledTimes(2);
      expect(router.state.revalidation).toBe("loading");
      expect(loader).not.toHaveBeenCalled();

      await discovery.resolve();
      await tick();
      expect(router.state.location.pathname).toBe(pathname);
      expect(discover).toHaveBeenCalledTimes(2);
      // Both operations settle without reloading the retained screen.
      expect(revalidated).toBe(true);
      expect(loader).not.toHaveBeenCalled();

      await Promise.all([navigation, revalidation]);
      expect(router.state.loaderData).toEqual({ root: "stale data" });
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.revalidation).toBe("idle");
      expect(router.state.errors).toBeNull();
    } finally {
      router.dispose();
    }
  },
);

test("settles a fetcher interrupted by a canceled revalidation without restarting it", async () => {
  let discovery = createDeferred();
  let firstLoad = createDeferred();
  let signals: AbortSignal[] = [];
  let router = createRouter({
    future: { unstable_customRouteDiscovery: true },
    history: createMemoryHistory(),
    routes: [
      {
        id: "root",
        path: "/",
        children: [
          { index: true },
          {
            path: "resource",
            shouldRevalidate: () => false,
            loader({ request }) {
              signals.push(request.signal);
              return firstLoad.promise;
            },
          },
          { path: "other" },
        ],
      },
    ],
    async patchRoutesOnNavigation() {
      await discovery.promise;
      throw new DiscoveryCancelledError();
    },
  }).initialize();
  let data = getFetcherData(router);
  try {
    let fetch = router.fetch("resource", "root", "/resource");
    await tick();
    expect(signals).toHaveLength(1);
    expect(signals[0].aborted).toBe(false);

    let navigation = router.navigate("/undiscovered");
    await tick();
    expect(router.state.navigation.state).toBe("loading");
    let revalidation = router.revalidate();
    await tick();
    expect(signals[0].aborted).toBe(true);

    await discovery.resolve();
    await tick();
    expect(router.state.location.pathname).toBe("/");
    // Cancellation settles the aborted load without starting a replacement.
    expect(signals).toHaveLength(1);
    expect(router.getFetcher("resource").state).toBe("idle");

    await firstLoad.resolve("stale result");
    await fetch;
    expect(router.getFetcher("resource").state).toBe("idle");
    expect(data.get("resource")).toBeUndefined();

    await Promise.all([navigation, revalidation]);
    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.revalidation).toBe("idle");
    expect(router.state.errors).toBeNull();

    // Clear the interrupted-load bookkeeping too, so a later navigation
    // respects shouldRevalidate instead of replaying the canceled fetch.
    await router.navigate("/other");
    expect(signals).toHaveLength(1);
  } finally {
    router.dispose();
  }
});

test("a navigation queued during POP restoration starts after revalidation is canceled", async () => {
  let history = createMemoryHistory({ initialEntries: ["/undiscovered", "/"] });
  let discovery = createDeferred();
  let restoration = createDeferred();
  let nextData = createDeferred();
  let loader = jest.fn(() => "new data");
  let go = history.go;
  jest.spyOn(history, "go").mockImplementation((delta) => {
    if (delta === 1) {
      restoration.promise.then(() => go(delta));
    } else {
      go(delta);
    }
  });
  let router = createRouter({
    future: { unstable_customRouteDiscovery: true },
    history,
    routes: [
      {
        id: "root",
        path: "/",
        loader,
      },
      { id: "next", path: "/next", loader: () => nextData.promise },
    ],
    hydrationData: { loaderData: { root: "stale data" } },
    async patchRoutesOnNavigation() {
      await discovery.promise;
      throw new DiscoveryCancelledError();
    },
  }).initialize();
  try {
    let pop = router.navigate(-1);
    let revalidated = false;
    let revalidation = router.revalidate().then(() => {
      revalidated = true;
    });
    await discovery.resolve();
    await tick();
    expect(history.go).toHaveBeenLastCalledWith(1);
    expect(loader).not.toHaveBeenCalled();
    expect(revalidated).toBe(false);
    let next = router.navigate("/next");

    await restoration.resolve();
    await tick();
    expect(loader).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.navigation.location?.pathname).toBe("/next");
    expect(revalidated).toBe(true);
    expect(router.state.revalidation).toBe("idle");
    expect(router.state.loaderData).toEqual({ root: "stale data" });

    await nextData.resolve("next data");
    await Promise.all([pop, revalidation, next]);
    expect(router.state.location.pathname).toBe("/next");
    expect(history.location.pathname).toBe("/next");
    expect(history.index).toBe(2);
    expect(router.state.loaderData).toEqual({ next: "next data" });
    expect(router.state.revalidation).toBe("idle");
    expect(router.state.errors).toBeNull();
  } finally {
    router.dispose();
  }
});

test("cancels revalidation when discovery cancels its loader redirect", async () => {
  let discovery = createDeferred();
  let repeatedLoad = createDeferred();
  let loader = jest
    .fn(() => repeatedLoad.promise)
    .mockImplementationOnce(() => Promise.resolve(redirect("/undiscovered")));
  let interruptedLoad = createDeferred();
  let resourceLoader = jest
    .fn(() => Promise.resolve("resource data"))
    .mockImplementationOnce(() => interruptedLoad.promise);
  let router = createRouter({
    future: { unstable_customRouteDiscovery: true },
    history: createMemoryHistory(),
    routes: [
      { id: "root", path: "/", loader },
      { path: "/resource", loader: resourceLoader },
    ],
    hydrationData: { loaderData: { root: "stale data" } },
    async patchRoutesOnNavigation() {
      await discovery.promise;
      throw new DiscoveryCancelledError();
    },
  }).initialize();
  try {
    let resource = router.fetch("resource", "root", "/resource");
    await tick();
    let revalidation = router.revalidate();
    await discovery.resolve();
    await tick();
    expect(loader).toHaveBeenCalledTimes(1);
    await revalidation;
    expect(resourceLoader).toHaveBeenCalledTimes(2);
    expect(router.getFetcher("resource").state).toBe("idle");
    await interruptedLoad.resolve("stale result");
    await resource;
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.loaderData).toEqual({ root: "stale data" });
    expect(router.state.navigation.state).toBe("idle");
    expect(router.state.revalidation).toBe("idle");
    expect(router.state.errors).toBeNull();
  } finally {
    router.dispose();
  }
});

test("canceling discovery leaves independent fetcher loads running", async () => {
  let resourceData = createDeferred();
  let signal: AbortSignal | undefined;
  let router = createRouter({
    future: { unstable_customRouteDiscovery: true },
    history: createMemoryHistory(),
    routes: [
      { id: "root", path: "/" },
      {
        path: "/resource",
        loader({ request }) {
          signal = request.signal;
          return resourceData.promise;
        },
      },
    ],
    patchRoutesOnNavigation() {
      throw new DiscoveryCancelledError();
    },
  }).initialize();
  let data = getFetcherData(router);
  try {
    let resource = router.fetch("resource", "root", "/resource");
    await router.navigate("/undiscovered");
    expect(router.state.navigation.state).toBe("idle");
    expect(router.getFetcher("resource").state).toBe("loading");
    expect(signal?.aborted).toBe(false);
    await resourceData.resolve("resource data");
    await resource;
    expect(router.getFetcher("resource").state).toBe("idle");
    expect(data.get("resource")).toBe("resource data");
  } finally {
    router.dispose();
  }
});
