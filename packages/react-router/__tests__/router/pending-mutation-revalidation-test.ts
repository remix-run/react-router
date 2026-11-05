import type { DataStrategyMatch } from "../../lib/router/utils";
import { getSingleFetchDataStrategyImpl } from "../../lib/dom/ssr/single-fetch";
import { createMemoryHistory } from "../../lib/router/history";
import { createRouter } from "../../lib/router/router";
import { cleanup, createDeferred, setup } from "./utils/data-router-setup";
import { createFormData, tick } from "./utils/utils";

describe("pending mutation revalidation", () => {
  afterEach(() => cleanup());

  it.each([
    ["navigation", true],
    ["navigation", false],
    ["fetcher", true],
    ["fetcher", false],
  ])(
    "reloads shared data when an older %s completes while the mutation action is pending: %s",
    async (staleLoad, actionPending) => {
      let t = setup({
        routes: [
          {
            id: "root",
            path: "/",
            loader: true,
            action: true,
            children: [
              { id: "b", path: "b" },
              { id: "c", path: "c", loader: true },
              { id: "d", path: "d", loader: true },
            ],
          },
        ],
        hydrationData: { loaderData: { root: "ROOT BEFORE MUTATION" } },
      });

      // A's mutation stays pending while B starts reading the old root data.
      let A = await t.fetch("/", "mutation", {
        formMethod: "post",
        formData: createFormData({}),
      });
      let B =
        staleLoad === "navigation"
          ? await t.navigate("/b")
          : await t.fetch("/", "older-revalidation", {
              formMethod: "post",
              formData: createFormData({}),
            });
      if (staleLoad === "fetcher") {
        await B.actions.root.resolve("ACTION B");
      }
      expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(A.fetcher.state).toBe("submitting");

      // B's older response may land before or after A succeeds. Either way,
      // its completion must not lose A's outstanding mutation invalidation.
      if (actionPending) {
        await B.loaders.root.resolve("ROOT BEFORE MUTATION");
      }
      await A.actions.root.resolve("ACTION A");
      expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(A.fetcher.state).toBe("loading");
      if (!actionPending) {
        await B.loaders.root.resolve("ROOT BEFORE MUTATION");
      }
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData.root).toBe("ROOT BEFORE MUTATION");
      expect(A.loaders.root.signal.aborted).toBe(false);

      // C must reload the shared root before it supersedes A's fresh reload.
      let C = await t.navigate("/c");
      await C.loaders.root.resolve("ROOT AFTER MUTATION");
      await C.loaders.c.resolve("C");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/c" },
        loaderData: { root: "ROOT AFTER MUTATION", c: "C" },
      });
      expect(C.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(A.loaders.root.signal.aborted).toBe(true);
      expect(A.fetcher).toMatchObject({ state: "idle", data: "ACTION A" });

      // A's aborted reload must not overwrite C, and the invalidation can now
      // clear: another sibling navigation should reuse C's fresh root data.
      await A.loaders.root.resolve("ROOT FROM ABORTED REVALIDATION");
      let D = await t.navigate("/d");
      expect(D.loaders.root.stub).not.toHaveBeenCalled();
      await D.loaders.d.resolve("D");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/d" },
        loaderData: { root: "ROOT AFTER MUTATION", d: "D" },
      });
      expect(A.fetcher).toMatchObject({ state: "idle", data: "ACTION A" });
    },
  );

  it.each(["action", "navigation"])(
    "does not abort a newer fetcher load when an older %s reload is aborted",
    async (reloadType) => {
      let t = setup({
        routes: [
          {
            id: "root",
            path: "/",
            loader: true,
            action: true,
            children: [
              { id: "b", path: "b", loader: true },
              { id: "resource", path: "resource", loader: true },
            ],
          },
        ],
        hydrationData: { loaderData: { root: "ROOT" } },
      });
      let initial = await t.fetch("/resource", "resource");
      await initial.loaders.resource.resolve("RESOURCE 0");

      let submission = {
        formMethod: "post" as const,
        formData: createFormData({}),
      };
      let A =
        reloadType === "action"
          ? await t.fetch("/", "mutation-a", submission)
          : await t.navigate("/", submission, ["resource"]);
      if (reloadType === "action") {
        t.shimHelper(A.loaders, "fetch", "loader", "resource");
      }
      await A.actions.root.resolve("ACTION A");

      // B supersedes A's resource request, but A's route loader stays pending.
      let B =
        reloadType === "action"
          ? await t.navigate("/b", undefined, ["resource"])
          : await t.fetch("/", "mutation-b", submission);
      if (reloadType === "navigation") {
        t.shimHelper(B.loaders, "fetch", "loader", "resource");
        await B.actions.root.resolve("ACTION B");
      }
      expect(A.loaders.resource.signal.aborted).toBe(true);
      expect(A.loaders.root.signal.aborted).toBe(false);

      // C replaces B's resource request and must survive B aborting A.
      let C = await t.fetch("/resource", "resource");
      expect(B.loaders.resource.signal.aborted).toBe(true);
      await B.loaders.root.resolve("ROOT FROM B");
      if (reloadType === "action") {
        await B.loaders.b.resolve("B");
      }
      expect(A.loaders.root.signal.aborted).toBe(true);
      expect(C.loaders.resource.signal.aborted).toBe(false);

      await C.loaders.resource.resolve("RESOURCE FROM C");
      // Late results from the aborted reloads must not overwrite C's data.
      await A.loaders.root.resolve("ROOT FROM A");
      await A.loaders.resource.resolve("RESOURCE FROM A");
      await B.loaders.resource.resolve("RESOURCE FROM B");
      expect(t.fetchers.resource).toMatchObject({
        state: "idle",
        data: "RESOURCE FROM C",
      });
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: reloadType === "action" ? "/b" : "/" },
        loaderData: { root: "ROOT FROM B" },
        errors: null,
      });
      expect(t.router._internalFetchControllers.size).toBe(0);
    },
  );

  it.each(["action", "navigation"])(
    "preserves newer fetcher data when an older %s reload cleans up",
    async (cleanupType) => {
      let t = setup({
        routes: [
          {
            id: "root",
            path: "/",
            loader: true,
            action: true,
            children: [
              { id: "b", path: "b", loader: true },
              { id: "c", path: "c", loader: true },
              { id: "resource", path: "resource", loader: true },
            ],
          },
        ],
        hydrationData: { loaderData: { root: "ROOT" } },
      });
      let initial = await t.fetch("/resource", "resource");
      await initial.loaders.resource.resolve("RESOURCE 0");

      let A = await t.fetch("/", "mutation", {
        formMethod: "post",
        formData: createFormData({}),
      });
      t.shimHelper(A.loaders, "fetch", "loader", "b");
      t.shimHelper(A.loaders, "fetch", "loader", "resource");
      let B = await t.navigate("/b", { defaultShouldRevalidate: false });
      await A.actions.root.resolve("ACTION");
      expect(A.loaders.resource.stub).toHaveBeenCalledTimes(1);
      await B.loaders.b.resolve("B");

      // Retained mutation invalidation makes C revalidate the resource while
      // A's older reload is still pending.
      let C = await t.navigate("/c", undefined, ["resource"]);
      expect(C.loaders.resource.stub).toHaveBeenCalledTimes(1);
      await A.loaders.root.resolve("ROOT AFTER MUTATION");
      await A.loaders.b.resolve("B AFTER MUTATION");
      await A.loaders.resource.resolve("RESOURCE FROM A");
      expect(t.fetchers.mutation).toMatchObject({
        state: "idle",
        data: "ACTION",
      });
      expect(t.router.state.navigation.state).toBe("loading");

      // A's cleanup must leave C's controller available so this explicit load
      // can abort C's older resource request.
      let D = await t.fetch("/resource", "resource");
      let superseded = C.loaders.resource;
      if (cleanupType === "action") {
        await D.loaders.resource.resolve("RESOURCE 2");
      }
      await C.loaders.root.resolve("ROOT AFTER MUTATION");
      await C.loaders.c.resolve("C");
      await C.loaders.resource.resolve("RESOURCE 1");

      if (cleanupType === "navigation") {
        // If D is still pending when C completes, C's cleanup must preserve
        // D's controller so a subsequent explicit load can abort it in turn.
        let E = await t.fetch("/resource", "resource");
        await E.loaders.resource.resolve("RESOURCE 3");
        await D.loaders.resource.resolve("RESOURCE 2");
        superseded = D.loaders.resource;
      }

      expect(t.fetchers.resource).toMatchObject({
        state: "idle",
        data: cleanupType === "action" ? "RESOURCE 2" : "RESOURCE 3",
      });
      expect(superseded.signal.aborted).toBe(true);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/c" },
        loaderData: { root: "ROOT AFTER MUTATION", c: "C" },
        errors: null,
      });
      expect(t.router._internalFetchControllers.size).toBe(0);
    },
  );
});

describe("failed actions after a successful mutation", () => {
  afterEach(() => cleanup());

  const SUBMIT = {
    formMethod: "post" as const,
    formData: createFormData({ key: "value" }),
  };
  const FRESH = { root: "ROOT 1", page: "PAGE 1" };
  const STALE = { root: "ROOT 0", page: "PAGE 0" };

  function refused() {
    return new Response("REFUSED", { status: 400 });
  }

  type SetupOpts = Parameters<typeof setup>[0];
  type Harness = ReturnType<typeof setup>;

  function setupPage(pageProps?: object, routerInit?: Partial<SetupOpts>) {
    return setup({
      routes: [
        {
          id: "root",
          path: "/",
          loader: true,
          children: [
            {
              id: "page",
              path: "page",
              loader: true,
              action: true,
              ...pageProps,
            },
            { id: "other", path: "other", loader: true },
          ],
        },
      ],
      initialEntries: ["/page"],
      hydrationData: { loaderData: STALE },
      ...routerInit,
    });
  }

  function submit(t: Harness, type: string, key: string, opts?: object) {
    return type === "navigation"
      ? t.navigate("/page", { ...SUBMIT, ...opts })
      : t.fetch("/page", key, { ...SUBMIT, ...opts });
  }

  // Submit and refuse, asserting no loader runs for it
  async function expectLoneRefusalSkipsLoaders(t: Harness, type: string) {
    let refusal = await submit(t, type, "refusal");
    await refusal.actions.page.resolve(refused());
    expect(refusal.loaders.root.stub).not.toHaveBeenCalled();
    expect(refusal.loaders.page.stub).not.toHaveBeenCalled();
  }

  describe.each(["navigation", "fetcher"])("%s submissions", (type) => {
    it("reloads when a 4xx action interrupts the mutation's reload", async () => {
      let t = setupPage();

      let A = await submit(t, type, "a");
      await A.actions.page.resolve("ACTION A");
      expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(A.loaders.page.stub).toHaveBeenCalledTimes(1);

      let B = await submit(t, type, "b");
      await B.actions.page.resolve(refused());
      expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);
      expect(B.loaders.page.stub).toHaveBeenCalledTimes(1);

      await B.loaders.root.resolve("ROOT 1");
      await B.loaders.page.resolve("PAGE 1");
      expect(A.loaders.root.signal.aborted).toBe(true);
      expect(A.loaders.page.signal.aborted).toBe(true);
      expect(t.router.state.loaderData).toEqual(FRESH);
      expect(t.router.state.navigation.state).toBe("idle");
      expect({
        actionData: t.router.state.actionData,
        a: t.fetchers.a?.data,
        b: t.fetchers.b?.data,
      }).toEqual(
        type === "navigation"
          ? { actionData: { page: "REFUSED" } }
          : { actionData: null, a: "ACTION A", b: "REFUSED" },
      );

      // A's aborted reload must not overwrite the data that replaced it
      await A.loaders.root.resolve("ROOT FROM ABORTED RELOAD");
      await A.loaders.page.resolve("PAGE FROM ABORTED RELOAD");
      expect(t.router.state.loaderData).toEqual(FRESH);
    });

    it("skips loaders for a lone 4xx action", async () => {
      let t = setupPage();
      await expectLoneRefusalSkipsLoaders(t, type);
      expect(t.router.state.loaderData).toEqual(STALE);
    });

    it("skips loaders for a 4xx action once the reload has landed", async () => {
      let t = setupPage();

      let A = await submit(t, type, "a");
      await A.actions.page.resolve("ACTION A");
      await A.loaders.root.resolve("ROOT 1");
      await A.loaders.page.resolve("PAGE 1");
      expect(t.router.state.loaderData).toEqual(FRESH);

      await expectLoneRefusalSkipsLoaders(t, type);
      expect(t.router.state.loaderData).toEqual(FRESH);
    });

    it("reloads when a 4xx action interrupts the loaders of a redirecting action", async () => {
      let t = setupPage();

      let A = await submit(t, type, "a");
      let redirect = await A.actions.page.redirectReturn("/other");
      expect(t.router.state.navigation.location?.pathname).toBe("/other");
      expect(redirect.loaders.root.stub).toHaveBeenCalledTimes(1);

      let B = await submit(t, type, "b");
      await B.actions.page.resolve(refused());
      expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);

      // A fetcher's reload targets the location of the pending redirect
      await B.loaders.root.resolve("ROOT 1");
      await (type === "navigation" ? B.loaders.page : B.loaders.other).resolve(
        "LEAF",
      );
      expect(t.router.state.loaderData).toEqual(
        type === "navigation"
          ? { root: "ROOT 1", page: "LEAF" }
          : { root: "ROOT 1", other: "LEAF" },
      );
      expect(t.router.state.navigation.state).toBe("idle");
    });

    it("reloads again when that reload is interrupted by another 4xx action", async () => {
      let t = setupPage();

      let A = await submit(t, type, "a");
      await A.actions.page.resolve("ACTION A");
      let B = await submit(t, type, "b");
      await B.actions.page.resolve(refused());
      expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);

      let C = await submit(t, type, "c");
      await C.actions.page.resolve(refused());
      expect(C.loaders.root.stub).toHaveBeenCalledTimes(1);
      await C.loaders.root.resolve("ROOT 1");
      await C.loaders.page.resolve("PAGE 1");
      expect(t.router.state.loaderData).toEqual(FRESH);

      // Everything owed has landed, so the skip rule applies again
      await expectLoneRefusalSkipsLoaders(t, type);
    });

    it("does not retry when the reload fails", async () => {
      let t = setupPage({ ErrorBoundary: () => null });

      let A = await submit(t, type, "a");
      await A.actions.page.resolve("ACTION A");
      let B = await submit(t, type, "b");
      await B.actions.page.resolve(refused());
      await B.loaders.root.resolve("ROOT 1");
      await B.loaders.page.reject(new Error("PAGE FAILED"));
      expect(t.router.state.loaderData.root).toBe("ROOT 1");
      expect(t.router.state.errors).toEqual({
        page: new Error("PAGE FAILED"),
      });

      // The errored page always loads again, but the reload itself is not owed
      let C = await submit(t, type, "c");
      await C.actions.page.resolve(refused());
      expect(C.loaders.root.stub).not.toHaveBeenCalled();
      await C.loaders.page.resolve("PAGE 1");
    });

    it("lets a route's shouldRevalidate opt out of the reload", async () => {
      let shouldRevalidate = jest.fn(() => false);
      let t = setupPage({ shouldRevalidate });

      let A = await submit(t, type, "a");
      await A.actions.page.resolve("ACTION A");
      expect(A.loaders.root.stub).toHaveBeenCalledTimes(1);
      shouldRevalidate.mockClear();

      let B = await submit(t, type, "b");
      await B.actions.page.resolve(refused());
      expect(shouldRevalidate).toHaveBeenCalledWith(
        expect.objectContaining({
          actionStatus: 400,
          defaultShouldRevalidate: true,
        }),
      );
      expect(B.loaders.page.stub).not.toHaveBeenCalled();
      expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);
      await B.loaders.root.resolve("ROOT 1");
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT 1",
        page: "PAGE 0",
      });
    });

    it("lets a call-site defaultShouldRevalidate opt out of the reload", async () => {
      let t = setupPage();

      let A = await submit(t, type, "a");
      await A.actions.page.resolve("ACTION A");
      let B = await submit(t, type, "b", { defaultShouldRevalidate: false });
      await B.actions.page.resolve(refused());
      expect(B.loaders.root.stub).not.toHaveBeenCalled();
      expect(B.loaders.page.stub).not.toHaveBeenCalled();
      await tick();

      // B explicitly settled it, so nothing is owed afterwards
      await expectLoneRefusalSkipsLoaders(t, type);
    });
  });

  it("reloads above the boundary when a navigation action throws a 4xx", async () => {
    let t = setupPage({ ErrorBoundary: () => null });

    let A = await t.navigate("/page", SUBMIT);
    await A.actions.page.resolve("ACTION A");
    let B = await t.navigate("/page", SUBMIT);
    await B.actions.page.reject(refused());
    expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);
    expect(B.loaders.page.stub).not.toHaveBeenCalled();

    await B.loaders.root.resolve("ROOT 1");
    expect(t.router.state.loaderData.root).toBe("ROOT 1");
    expect(t.router.state.errors?.page).toMatchObject({ status: 400 });
  });

  it("leaves a mutation's reload running when a fetcher action throws a 4xx", async () => {
    let t = setupPage({ ErrorBoundary: () => null });

    let A = await t.fetch("/page", "a", SUBMIT);
    await A.actions.page.resolve("ACTION A");
    let B = await t.fetch("/page", "b", SUBMIT);
    await B.actions.page.reject(refused());
    expect(B.loaders.root.stub).not.toHaveBeenCalled();
    expect(A.loaders.root.signal.aborted).toBe(false);

    await A.loaders.root.resolve("ROOT 1");
    await A.loaders.page.resolve("PAGE 1");
    expect(t.router.state.loaderData).toEqual(FRESH);
  });

  it("keeps the newest data when the mutation's own reload lands before a fetcher's", async () => {
    let t = setupPage();

    let A = await t.fetch("/page", "a", SUBMIT);
    await A.actions.page.resolve("ACTION A");
    let B = await t.fetch("/page", "b", SUBMIT);
    await B.actions.page.resolve(refused());
    expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);
    expect(A.loaders.root.signal.aborted).toBe(false);

    await A.loaders.root.resolve("ROOT FROM A");
    await A.loaders.page.resolve("PAGE FROM A");
    expect(t.router.state.loaderData.root).toBe("ROOT FROM A");
    await B.loaders.root.resolve("ROOT 1");
    await B.loaders.page.resolve("PAGE 1");
    expect(t.router.state.loaderData).toEqual(FRESH);
    expect(t.fetchers.a).toMatchObject({ state: "idle", data: "ACTION A" });
    expect(t.fetchers.b).toMatchObject({ state: "idle", data: "REFUSED" });
  });

  it("reloads when the same fetcher key is refused after it succeeded", async () => {
    let t = setupPage();

    let A = await t.fetch("/page", "same", SUBMIT);
    await A.actions.page.resolve("ACTION A");
    let B = await t.fetch("/page", "same", SUBMIT);
    expect(A.loaders.root.signal.aborted).toBe(true);
    await B.actions.page.resolve(refused());
    expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);

    await B.loaders.root.resolve("ROOT 1");
    await B.loaders.page.resolve("PAGE 1");
    expect(t.router.state.loaderData).toEqual(FRESH);
    expect(t.fetchers.same).toMatchObject({ state: "idle", data: "REFUSED" });
  });

  it("reloads when an earlier action fails after a later one succeeded", async () => {
    let t = setupPage();

    let earlier = await t.fetch("/page", "earlier", SUBMIT);
    let later = await t.fetch("/page", "later", SUBMIT);
    await later.actions.page.resolve("ACTION LATER");
    expect(later.loaders.root.stub).toHaveBeenCalledTimes(1);

    await earlier.actions.page.resolve(refused());
    expect(earlier.loaders.root.stub).toHaveBeenCalledTimes(1);
    await earlier.loaders.root.resolve("ROOT 1");
    await earlier.loaders.page.resolve("PAGE 1");
    expect(later.loaders.root.signal.aborted).toBe(true);
    expect(t.router.state.loaderData).toEqual(FRESH);
  });

  it("skips loaders when an earlier action fails after the later reload landed", async () => {
    let t = setupPage();

    let earlier = await t.fetch("/page", "earlier", SUBMIT);
    let later = await t.fetch("/page", "later", SUBMIT);
    await later.actions.page.resolve("ACTION LATER");
    await later.loaders.root.resolve("ROOT 1");
    await later.loaders.page.resolve("PAGE 1");

    await earlier.actions.page.resolve(refused());
    expect(earlier.loaders.root.stub).not.toHaveBeenCalled();
    expect(t.router.state.loaderData).toEqual(FRESH);
  });

  it("does not count a reload that started before the mutation completed", async () => {
    let t = setupPage();

    let A = await t.fetch("/page", "a", SUBMIT);
    await A.actions.page.resolve("ACTION A");
    let C = await t.fetch("/page", "c", SUBMIT);
    await C.actions.page.resolve("ACTION C");

    // A's reload lands, but it started before C's mutation completed
    await A.loaders.root.resolve("ROOT BEFORE C");
    await A.loaders.page.resolve("PAGE BEFORE C");
    expect(t.router.state.loaderData.root).toBe("ROOT BEFORE C");

    let B = await t.fetch("/page", "b", SUBMIT);
    await B.actions.page.resolve(refused());
    expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);
    await B.loaders.root.resolve("ROOT 1");
    await B.loaders.page.resolve("PAGE 1");
    expect(C.loaders.root.signal.aborted).toBe(true);
    expect(t.router.state.loaderData).toEqual(FRESH);
  });

  it("clears once a fetcher's reload takes over a pending navigation", async () => {
    let t = setupPage();

    let A = await t.fetch("/page", "a", SUBMIT);
    t.shimHelper(A.loaders, "fetch", "loader", "other");
    let nav = await t.navigate("/other");
    await A.actions.page.resolve("ACTION A");
    await A.loaders.root.resolve("ROOT 1");
    await A.loaders.other.resolve("OTHER FROM A");
    expect(t.router.state).toMatchObject({
      navigation: { state: "idle" },
      location: { pathname: "/other" },
      loaderData: { root: "ROOT 1", other: "OTHER FROM A" },
    });
    expect(nav.loaders.other.signal.aborted).toBe(true);

    // Back on /page, reusing the fetcher's key
    let back = await t.navigate("/page");
    await back.loaders.page.resolve("PAGE 1");
    let B = await t.fetch("/page", "a", SUBMIT);
    await B.actions.page.resolve(refused());
    expect(B.loaders.root.stub).not.toHaveBeenCalled();
    expect(B.loaders.page.stub).not.toHaveBeenCalled();
  });

  it("reloads when the mutating fetcher unmounted during its reload", async () => {
    let t = setupPage();

    let A = await t.fetch("/page", "a", SUBMIT);
    await A.actions.page.resolve("ACTION A");
    t.router.deleteFetcher("a");

    let B = await t.fetch("/page", "b", SUBMIT);
    await B.actions.page.resolve(refused());
    expect(B.loaders.root.stub).toHaveBeenCalledTimes(1);
    await B.loaders.root.resolve("ROOT 1");
    await B.loaders.page.resolve("PAGE 1");
    expect(t.router.state.loaderData).toEqual(FRESH);
    expect(t.router.state.fetchers.has("a")).toBe(false);
  });

  it("does not override a dataStrategy's default after a successful action", async () => {
    let loaderCalls: boolean[] = [];
    let t = setupPage(undefined, {
      async dataStrategy({ request, matches }) {
        let call = (m: DataStrategyMatch) =>
          request.method === "GET"
            ? m.shouldCallHandler(false)
            : m.shouldCallHandler();
        let results = await Promise.all(
          matches.map((m) => {
            let shouldCall = call(m);
            if (request.method === "GET") loaderCalls.push(shouldCall);
            return m.resolve(async (handler) =>
              shouldCall ? handler() : undefined,
            );
          }),
        );
        return Object.fromEntries(
          matches.flatMap((m, i) =>
            call(m) ? [[m.route.id, results[i]]] : [],
          ),
        );
      },
    });

    let A = await t.navigate("/page", SUBMIT);
    await A.actions.page.resolve("ACTION A");
    await tick();
    expect(loaderCalls).toEqual([false, false]);
  });

  describe("single fetch", () => {
    function setupSingleFetch() {
      let requests: {
        method: string;
        respond: (status: number, routes: object) => Promise<void>;
      }[] = [];
      let serverLoad = (_: unknown, singleFetch?: unknown) =>
        (singleFetch as () => unknown)();
      let router = createRouter({
        history: createMemoryHistory({ initialEntries: ["/page"] }),
        routes: [
          {
            id: "root",
            path: "/",
            loader: serverLoad,
            children: [
              {
                id: "page",
                path: "page",
                loader: serverLoad,
                action: serverLoad,
              },
            ],
          },
        ],
        hydrationData: { loaderData: STALE },
        dataStrategy: getSingleFetchDataStrategyImpl(
          () => router,
          () => ({ hasLoader: true, hasClientLoader: false }),
          (args) => {
            let dfd = createDeferred();
            requests.push({
              method: args.request.method,
              respond: async (status, routes) => {
                await dfd.resolve({ status, data: { routes } });
              },
            });
            return dfd.promise as ReturnType<
              Parameters<typeof getSingleFetchDataStrategyImpl>[2]
            >;
          },
          true,
        ),
      }).initialize();
      return { router, requests };
    }

    it.each(["navigation", "fetcher"])(
      "reloads when a 4xx %s action interrupts the mutation's reload",
      async (type) => {
        let { router, requests } = setupSingleFetch();
        let submitAction = (key: string) =>
          type === "navigation"
            ? router.navigate("/page", SUBMIT)
            : router.fetch(key, "root", "/page", SUBMIT);

        submitAction("a");
        await tick();
        await requests[0].respond(200, { page: { data: "ACTION A" } });
        await tick();
        expect(requests.map((r) => r.method)).toEqual(["POST", "GET"]);

        submitAction("b");
        await tick();
        await requests[2].respond(400, { page: { data: "REFUSED" } });
        await tick();
        expect(requests.map((r) => r.method)).toEqual([
          "POST",
          "GET",
          "POST",
          "GET",
        ]);

        await requests[3].respond(200, {
          root: { data: "ROOT 1" },
          page: { data: "PAGE 1" },
        });
        await tick();
        expect(router.state.loaderData).toEqual(FRESH);
        expect(router.state.navigation.state).toBe("idle");
        router.dispose();
      },
    );

    it("skips the reload for a lone 4xx action", async () => {
      let { router, requests } = setupSingleFetch();

      router.navigate("/page", SUBMIT);
      await tick();
      await requests[0].respond(400, { page: { data: "REFUSED" } });
      await tick();
      expect(requests.map((r) => r.method)).toEqual(["POST"]);
      expect(router.state.loaderData).toEqual(STALE);
      expect(router.state.navigation.state).toBe("idle");
      router.dispose();
    });
  });
});
