import type {
  MemoryHistory,
  MemoryHistoryOptions,
  Update,
} from "../../lib/router/history";
import { createMemoryHistory } from "../../lib/router/history";
import type { Router, RouterInit } from "../../lib/router/router";
import { createRouter, IDLE_BLOCKER } from "../../lib/router/router";
import { DiscoveryCancelledError, redirect } from "../../lib/router/utils";
import { createDeferred, tick } from "./utils/utils";

// Use the real history stack, but expose browser traversal and popstate as
// independently delivered tasks. A call to go cannot cancel an issued task.
function createAsyncHistory(options: MemoryHistoryOptions) {
  let memory = createMemoryHistory(options);
  let traversals: number[] = [];
  let events: Update[] = [];
  let issued: number[] = [];
  let writes: { pathname: string; pending: number }[] = [];
  let listener: Parameters<MemoryHistory["listen"]>[0] | undefined;
  let history: MemoryHistory = {
    get action() {
      return memory.action;
    },
    get location() {
      return memory.location;
    },
    get index() {
      return memory.index;
    },
    createHref: memory.createHref,
    createURL: memory.createURL,
    encodeLocation: memory.encodeLocation,
    push(to, state) {
      writes.push({
        pathname: typeof to === "string" ? to : to.pathname!,
        pending: traversals.length + events.length,
      });
      memory.push(to, state);
    },
    replace(to, state) {
      writes.push({
        pathname: typeof to === "string" ? to : to.pathname!,
        pending: traversals.length + events.length,
      });
      memory.replace(to, state);
    },
    go(delta) {
      issued.push(delta);
      traversals.push(delta);
    },
    listen(fn) {
      listener = fn;
      let unlisten = memory.listen((update) => events.push(update));
      return () => {
        listener = undefined;
        unlisten();
      };
    },
  };

  function flushTraversal() {
    expect(traversals.length).toBeGreaterThan(0);
    memory.go(traversals.shift()!);
  }

  function flushEvent() {
    expect(events.length).toBeGreaterThan(0);
    listener?.(events.shift()!);
  }

  function flushPop() {
    if (events.length === 0) flushTraversal();
    flushEvent();
  }

  async function flushAll() {
    // Bound the work so an accidental endless compensation loop fails clearly.
    for (let i = 0; i < 8; i++) {
      await tick();
      if (traversals.length + events.length === 0) return;
      flushPop();
    }
    expect(traversals.length + events.length).toBe(0);
  }

  return {
    history,
    issued,
    writes,
    flushTraversal,
    flushEvent,
    flushPop,
    flushAll,
    get pending() {
      return traversals.length + events.length;
    },
  };
}

describe("multiple blockers with asynchronous history", () => {
  let router: Router;
  let browser: ReturnType<typeof createAsyncHistory>;

  function initialize(options: Partial<RouterInit> = {}, initialIndex = 2) {
    browser = createAsyncHistory({
      initialEntries: ["/a", "/b", "/c"],
      initialIndex,
    });
    router = createRouter({
      history: browser.history,
      routes: ["/a", "/b", "/c", "/d", "/e"].map((path) => ({ path })),
      future: { unstable_multipleBlockers: true },
      ...options,
    }).initialize();
  }

  function blocker(key: string) {
    return router.state.blockers.get(key) || IDLE_BLOCKER;
  }

  function navigationCompleted(pathname: string) {
    if (
      router.state.location.pathname === pathname &&
      router.state.navigation.state === "idle"
    ) {
      return Promise.resolve();
    }
    return new Promise<void>((resolve) => {
      let unsubscribe = router.subscribe((state) => {
        if (
          state.location.pathname === pathname &&
          state.navigation.state === "idle"
        ) {
          unsubscribe();
          resolve();
        }
      });
    });
  }

  function registerTwo() {
    router.getBlocker("A", () => true);
    router.getBlocker("B", () => true);
  }

  function approveTwo() {
    expect(blocker("A").state).toBe("blocked");
    blocker("A").proceed?.();
    expect(blocker("B").state).toBe("blocked");
    blocker("B").proceed?.();
  }

  async function visit(delta: number, pathname: string) {
    let navigation = router.navigate(delta);
    await browser.flushAll();
    await navigation;
    expect(router.state.location.pathname).toBe(pathname);
    expect(browser.history.location.pathname).toBe(pathname);
  }

  afterEach(() => router?.dispose());

  it("restores C once and replays C to B once after both confirmations", async () => {
    let loader = jest.fn(() => "B");
    initialize({
      routes: [{ path: "/a" }, { path: "/b", loader }, { path: "/c" }],
    });
    registerTwo();
    let navigation = router.navigate(-1);
    browser.flushPop();
    await navigation;
    expect(blocker("A").state).toBe("blocked");
    expect(browser.history.location.pathname).toBe("/b");
    expect(router.state.location.pathname).toBe("/c");
    expect(loader).not.toHaveBeenCalled();
    expect(browser.issued).toEqual([-1, 1]);

    browser.flushPop();
    expect(browser.history.index).toBe(2);
    blocker("A").proceed?.();
    expect(blocker("B").state).toBe("blocked");
    expect(browser.history.location.pathname).toBe("/c");
    expect(loader).not.toHaveBeenCalled();
    blocker("B").proceed?.();
    await browser.flushAll();
    await navigationCompleted("/b");
    expect(browser.issued).toEqual([-1, 1, -1]);
    expect(browser.history.index).toBe(1);
    expect(loader).toHaveBeenCalledTimes(1);
    expect(browser.writes).toEqual([]);

    router.deleteBlocker("A");
    router.deleteBlocker("B");
    await visit(-1, "/a");
    await visit(1, "/b");
    await visit(1, "/c");
    expect(browser.history.index).toBe(2);
  });

  it("synchronous subscriber approvals wait for restoration before issuing replay", async () => {
    let loader = jest.fn(() => "B");
    initialize({
      routes: [{ path: "/a" }, { path: "/b", loader }, { path: "/c" }],
    });
    registerTwo();
    let approvals: string[] = [];
    router.subscribe((state) => {
      for (let [key, value] of state.blockers) {
        if (value.state === "blocked") {
          approvals.push(key);
          value.proceed();
        }
      }
    });

    let navigation = router.navigate(-1);
    browser.flushPop();
    await navigation;
    expect(approvals).toEqual(["A", "B"]);
    expect(browser.issued).toEqual([-1, 1]);
    expect(loader).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/c");
    browser.flushTraversal();
    expect(browser.history.location.pathname).toBe("/c");
    await tick();
    expect(browser.issued).toEqual([-1, 1]);
    browser.flushEvent();
    await browser.flushAll();
    await navigationCompleted("/b");
    expect(browser.issued).toEqual([-1, 1, -1]);
    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("reset before restoration finishes prevents replay and neutralizes old callbacks", async () => {
    initialize();
    registerTwo();
    let navigation = router.navigate(-1);
    browser.flushPop();
    await navigation;
    expect(blocker("A").state).toBe("blocked");
    let oldA = blocker("A");
    oldA.proceed?.();
    let oldB = blocker("B");
    expect(oldB.state).toBe("blocked");
    oldB.reset?.();
    await browser.flushAll();
    oldA.proceed?.();
    oldB.proceed?.();
    oldB.reset?.();
    await tick();
    expect(browser.issued).toEqual([-1, 1]);
    expect(browser.pending).toBe(0);
    expect(browser.history.location.pathname).toBe("/c");
    expect(router.state.location.pathname).toBe("/c");
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
    expect(blocker("B")).toEqual(IDLE_BLOCKER);
  });

  it("a new PUSH before replay dispatch replaces the pending POP without traversing again", async () => {
    initialize();
    registerTwo();
    let navigation = router.navigate(-1);
    browser.flushPop();
    await navigation;
    let oldA = blocker("A");
    expect(oldA.state).toBe("blocked");
    oldA.proceed?.();
    let oldB = blocker("B");
    expect(oldB.state).toBe("blocked");
    oldB.proceed?.();
    expect(browser.issued).toEqual([-1, 1]);

    let newNavigation = router.navigate("/d");
    await browser.flushAll();
    await newNavigation;
    expect(browser.issued).toEqual([-1, 1]);
    expect(blocker("A").location?.pathname).toBe("/d");
    oldA.proceed?.();
    oldB.proceed?.();
    oldB.reset?.();
    approveTwo();
    await navigationCompleted("/d");
    expect(browser.history.index).toBe(3);
    expect(browser.writes.every((write) => write.pending === 0)).toBe(true);
    router.deleteBlocker("A");
    router.deleteBlocker("B");
    await visit(-1, "/c");
  });

  it.each([false, true])(
    "a new navigation after replay dispatch drains it before writing history (replace=%s)",
    async (replace) => {
      initialize();
      router.getBlocker(
        "A",
        ({ nextLocation }) => nextLocation.pathname === "/b",
      );
      router.getBlocker(
        "B",
        ({ nextLocation }) => nextLocation.pathname === "/b",
      );
      let navigation = router.navigate(-1);
      browser.flushPop();
      await navigation;
      browser.flushPop();
      approveTwo();
      await tick();
      expect(browser.issued).toEqual([-1, 1, -1]);
      expect(browser.pending).toBe(1);

      // The accepted go has physically moved the browser, but the router has
      // not yet observed its popstate. A fresh request still originates at C.
      browser.flushTraversal();
      expect(browser.history.location.pathname).toBe("/b");
      expect(router.state.location.pathname).toBe("/c");
      let newNavigation = router.navigate("/d", { replace, state: "NEW" });
      await tick();
      expect(browser.writes).toEqual([]);
      expect(router.state.location.pathname).toBe("/c");
      browser.flushEvent();
      await browser.flushAll();
      await newNavigation;
      expect(router.state.location.pathname).toBe("/d");
      expect(browser.history.location.pathname).toBe("/d");
      expect(browser.history.location.state).toBe("NEW");
      expect(browser.history.index).toBe(replace ? 2 : 3);
      expect(browser.writes).toEqual([{ pathname: "/d", pending: 0 }]);

      router.deleteBlocker("A");
      router.deleteBlocker("B");
      await visit(-1, replace ? "/b" : "/c");
      await visit(1, "/d");
      expect(browser.history.index).toBe(replace ? 2 : 3);
    },
  );

  it("an older ready-to-commit loader waits for restoration and commits before the queued request", async () => {
    let data = createDeferred();
    let loader = jest.fn(() => data.promise);
    initialize({
      routes: [
        { path: "/a" },
        { path: "/b" },
        { path: "/c" },
        { path: "/d", loader },
        { path: "/e" },
      ],
    });
    let oldNavigation = router.navigate("/d");
    router.getBlocker(
      "A",
      ({ nextLocation }) => nextLocation.pathname === "/b",
    );
    router.getBlocker(
      "B",
      ({ nextLocation }) => nextLocation.pathname === "/b",
    );
    let pop = router.navigate(-1);
    browser.flushPop();
    await pop;
    expect(blocker("A").state).toBe("blocked");
    expect(browser.issued).toEqual([-1, 1]);
    await data.resolve("D");
    await tick();
    expect(browser.writes).toEqual([]);
    expect(router.state.location.pathname).toBe("/c");

    let newNavigation = router.navigate("/e");
    await browser.flushAll();
    await oldNavigation;
    await newNavigation;
    expect(loader).toHaveBeenCalledTimes(1);
    expect(browser.writes).toEqual([
      { pathname: "/d", pending: 0 },
      { pathname: "/e", pending: 0 },
    ]);
    expect(browser.history.index).toBe(4);
    router.deleteBlocker("A");
    router.deleteBlocker("B");
    await visit(-1, "/d");
    await visit(-1, "/c");
  });

  it("removing the last selected blocker cannot replay until restoration has been observed", async () => {
    initialize();
    registerTwo();
    let navigation = router.navigate(-1);
    browser.flushPop();
    await navigation;
    expect(blocker("A").state).toBe("blocked");
    let oldA = blocker("A");
    router.deleteBlocker("A");
    await tick();
    expect(blocker("B").state).toBe("blocked");
    let oldB = blocker("B");
    router.deleteBlocker("B");
    await tick();
    expect(browser.issued).toEqual([-1, 1]);
    expect(router.state.location.pathname).toBe("/c");
    browser.flushTraversal();
    await tick();
    expect(browser.issued).toEqual([-1, 1]);
    browser.flushEvent();
    await browser.flushAll();
    await navigationCompleted("/b");
    expect(browser.issued).toEqual([-1, 1, -1]);
    oldA.proceed?.();
    oldB.proceed?.();
    oldB.reset?.();
    expect(router.state.blockers.size).toBe(0);
    expect(browser.history.index).toBe(1);
  });

  it.each([
    {
      direction: "back",
      initialIndex: 2,
      delta: -2,
      target: "/a",
      source: "/c",
    },
    {
      direction: "forward",
      initialIndex: 0,
      delta: 2,
      target: "/c",
      source: "/a",
    },
  ])(
    "restores and replays a multi-entry $direction step without changing entries",
    async ({ initialIndex, delta, target, source }) => {
      initialize({}, initialIndex);
      registerTwo();
      let navigation = router.navigate(delta);
      browser.flushPop();
      await navigation;
      expect(blocker("A").location?.pathname).toBe(target);
      browser.flushPop();
      expect(browser.history.index).toBe(initialIndex);
      approveTwo();
      await browser.flushAll();
      await navigationCompleted(target);
      expect(browser.issued).toEqual([delta, -delta, delta]);
      expect(browser.history.index).toBe(initialIndex + delta);
      router.deleteBlocker("A");
      router.deleteBlocker("B");
      await visit(-delta, source);
      expect(browser.history.index).toBe(initialIndex);
    },
  );

  it("never issues go(0) as compensation for a zero-delta event", async () => {
    initialize();
    registerTwo();
    let warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    try {
      let navigation = router.navigate(0);
      browser.flushPop();
      expect(browser.issued).toEqual([0]);
      expect(browser.pending).toBe(0);
      await navigation;
      expect(router.state.location.pathname).toBe("/c");
      expect(browser.history.index).toBe(2);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("nonzero history delta"),
      );
    } finally {
      warn.mockRestore();
    }
  });

  it("disposal settles a canceled discovery POP and the navigation queued behind its restoration", async () => {
    initialize({
      future: {
        unstable_multipleBlockers: true,
        unstable_customRouteDiscovery: true,
      },
      routes: [{ path: "/a" }, { path: "/c" }, { path: "/d" }],
      patchRoutesOnNavigation() {
        throw new DiscoveryCancelledError();
      },
    });
    let popSettled = false;
    void router.navigate(-1).then(() => {
      popSettled = true;
    });
    browser.flushPop();
    await tick();
    expect(browser.issued).toEqual([-1, 1]);
    expect(browser.pending).toBe(1);
    expect(router.state.navigation.state).toBe("idle");

    let queuedSettled = false;
    void router.navigate("/d").then(() => {
      queuedSettled = true;
    });
    router.dispose();
    await tick();
    expect(popSettled).toBe(true);
    expect(queuedSettled).toBe(true);
    expect(browser.writes).toEqual([]);
    expect(router.state.location.pathname).toBe("/c");
    browser.flushTraversal();
    expect(browser.history.location.pathname).toBe("/c");
  });

  it("a fetcher redirect arriving during issued POP replay is not discarded by the replay event", async () => {
    let fetcherData = createDeferred();
    let redirectedLoader = jest.fn(() => "D");
    initialize({
      routes: [
        { path: "/a" },
        { path: "/b" },
        { id: "c", path: "/c" },
        { path: "/d", loader: redirectedLoader },
        { path: "/fetch", loader: () => fetcherData.promise },
      ],
    });
    let fetch = router.fetch("resource", "c", "/fetch");
    router.getBlocker(
      "A",
      ({ nextLocation }) => nextLocation.pathname === "/b",
    );
    router.getBlocker(
      "B",
      ({ nextLocation }) => nextLocation.pathname === "/b",
    );
    let pop = router.navigate(-1);
    browser.flushPop();
    await pop;
    browser.flushPop();
    approveTwo();
    await tick();
    expect(browser.issued).toEqual([-1, 1, -1]);

    browser.flushTraversal();
    expect(browser.history.location.pathname).toBe("/b");
    await fetcherData.resolve(redirect("/d"));
    await tick();
    expect(redirectedLoader).not.toHaveBeenCalled();
    expect(browser.writes).toEqual([]);
    await browser.flushAll();
    await fetch;
    expect(router.state.location.pathname).toBe("/d");
    expect(browser.history.location.pathname).toBe("/d");
    expect(redirectedLoader).toHaveBeenCalledTimes(1);
    expect(browser.writes).toEqual([{ pathname: "/d", pending: 0 }]);
    router.deleteBlocker("A");
    router.deleteBlocker("B");
    await visit(-1, "/c");
  });

  it("revalidation during issued POP replay preserves the approved destination and settles", async () => {
    let targetLoader = jest.fn(() => "B");
    initialize({
      routes: [
        { path: "/a" },
        { path: "/b", loader: targetLoader },
        { path: "/c" },
      ],
    });
    registerTwo();
    let pop = router.navigate(-1);
    browser.flushPop();
    await pop;
    browser.flushPop();
    approveTwo();
    await tick();
    expect(browser.issued).toEqual([-1, 1, -1]);
    expect(browser.pending).toBe(1);

    let revalidationSettled = false;
    let revalidation = router.revalidate().then(() => {
      revalidationSettled = true;
    });
    await tick();
    expect(revalidationSettled).toBe(false);
    expect(targetLoader).not.toHaveBeenCalled();
    await browser.flushAll();
    await revalidation;
    expect(router.state.location.pathname).toBe("/b");
    expect(browser.history.location.pathname).toBe("/b");
    expect(router.state.loaderData).toEqual({ "1": "B" });
    expect(revalidationSettled).toBe(true);
    expect(browser.issued).toEqual([-1, 1, -1]);
    expect(browser.writes).toEqual([]);
    router.deleteBlocker("A");
    router.deleteBlocker("B");
    await visit(1, "/c");
  });
});
