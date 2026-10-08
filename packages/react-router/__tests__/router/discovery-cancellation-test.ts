import { createMemoryHistory } from "../../lib/router/history";
import { createRouter } from "../../lib/router/router";
import { DiscoveryCancelledError } from "../../lib/router/utils";
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
