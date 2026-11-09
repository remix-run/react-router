import { createMemoryHistory } from "../../lib/router/history";
import type { Router, RouterInit } from "../../lib/router/router";
import { createRouter, IDLE_BLOCKER } from "../../lib/router/router";
import { redirect } from "../../lib/router/utils";
import { createDeferred, createFormData, tick } from "./utils/utils";

describe("multiple navigation blockers", () => {
  let router: Router;
  let history: ReturnType<typeof createMemoryHistory>;

  function initialize(options: Partial<RouterInit> = {}) {
    history = createMemoryHistory({ initialEntries: ["/"] });
    router = createRouter({
      history,
      routes: [{ path: "/" }, { path: "/one" }, { path: "/two" }],
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

  afterEach(() => router?.dispose());

  it("a later clean registration cannot suppress an earlier dirty form", async () => {
    initialize();
    let clean = jest.fn(() => false);
    router.getBlocker("dirty", () => true);
    router.getBlocker("clean", clean);
    await router.navigate("/one");
    expect(router.state.location.pathname).toBe("/");
    expect(blocker("dirty").state).toBe("blocked");
    expect(clean).not.toHaveBeenCalled();
    blocker("dirty").proceed?.();
    await navigationCompleted("/one");
    expect(clean).toHaveBeenCalledTimes(1);
    expect(blocker("clean")).toEqual(IDLE_BLOCKER);
  });

  it("asks in registration order and starts transport only after all approvals", async () => {
    let data = createDeferred();
    let loader = jest.fn(() => data.promise);
    initialize({ routes: [{ path: "/" }, { path: "/one", loader }] });
    let first = jest.fn(() => true);
    let second = jest.fn(() => true);
    router.getBlocker("A", first);
    router.getBlocker("B", second);

    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    expect(blocker("B").state).toBe("unblocked");
    expect(second).not.toHaveBeenCalled();
    expect(loader).not.toHaveBeenCalled();
    expect(router.state.navigation.state).toBe("idle");

    let firstApproval = blocker("A").proceed;
    firstApproval?.();
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
    expect(blocker("B").state).toBe("blocked");
    expect(loader).not.toHaveBeenCalled();
    expect(router.state.location.pathname).toBe("/");

    let secondApproval = blocker("B").proceed;
    secondApproval?.();
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
    expect(blocker("B").state).toBe("proceeding");
    let completed = navigationCompleted("/one");
    await data.resolve("ONE");
    await completed;
    firstApproval?.();
    secondApproval?.();
    expect(loader).toHaveBeenCalledTimes(1);
    expect(blocker("B")).toEqual(IDLE_BLOCKER);
    expect(history.index).toBe(1);
  });

  it("canceling B discards A's approval and neutralizes callbacks from earlier selections", async () => {
    initialize();
    router.getBlocker("A", () => true);
    router.getBlocker("B", () => true);
    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    let oldA = blocker("A");
    oldA.proceed?.();
    expect(blocker("B").state).toBe("blocked");
    let oldB = blocker("B");
    oldA.reset?.();
    oldA.proceed?.();
    expect(blocker("B")).toBe(oldB);
    oldB.reset?.();
    expect(router.state.location.pathname).toBe("/");
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
    expect(blocker("B")).toEqual(IDLE_BLOCKER);

    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    let freshA = blocker("A");
    oldA.proceed?.();
    oldB.proceed?.();
    oldB.reset?.();
    expect(blocker("A")).toBe(freshA);
    freshA.proceed?.();
    expect(blocker("B").state).toBe("blocked");
    blocker("B").reset?.();
  });

  it("a new same-URL request replaces the target state and starts approvals over", async () => {
    initialize();
    router.getBlocker("A", () => true);
    router.getBlocker("B", () => true);
    await router.navigate("/one", { state: { version: 1 } });
    expect(blocker("A").state).toBe("blocked");
    blocker("A").proceed?.();
    let oldB = blocker("B");
    expect(oldB.location?.state).toEqual({ version: 1 });

    await router.navigate("/one", { state: { version: 2 } });
    expect(blocker("A").state).toBe("blocked");
    expect(blocker("A").location?.state).toEqual({ version: 2 });
    oldB.proceed?.();
    oldB.reset?.();
    expect(blocker("A").state).toBe("blocked");
    expect(router.state.location.pathname).toBe("/");
    blocker("A").proceed?.();
    blocker("B").proceed?.();
    await navigationCompleted("/one");
    expect(history.location.state).toEqual({ version: 2 });
    expect(history.index).toBe(1);
  });

  it("checks newly registered and previously clean forms at handoff", async () => {
    initialize();
    let aDirty = false;
    router.getBlocker("A", () => aDirty);
    router.getBlocker("B", () => true);
    await router.navigate("/one");
    expect(blocker("B").state).toBe("blocked");
    let b = blocker("B");
    aDirty = true;
    router.getBlocker("C", () => true);
    expect(blocker("B")).toBe(b);
    expect(blocker("C").state).toBe("unblocked");

    b.proceed?.();
    expect(blocker("A").state).toBe("blocked");
    expect(blocker("B")).toEqual(IDLE_BLOCKER);
    blocker("A").proceed?.();
    expect(blocker("C").state).toBe("blocked");
    blocker("C").proceed?.();
    await navigationCompleted("/one");
    expect(history.index).toBe(1);
  });

  it("keeps explicit approvals after edits but requires a selected clean form to respond", async () => {
    initialize();
    let aRevision = 1;
    let bDirty = true;
    let first = jest.fn(() => aRevision > 0);
    router.getBlocker("A", first);
    router.getBlocker("B", () => bDirty);
    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    blocker("A").proceed?.();
    expect(blocker("B").state).toBe("blocked");
    let b = blocker("B");
    aRevision++;
    bDirty = false;
    router.getBlocker("A", first);
    router.getBlocker("B", () => bDirty);
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
    expect(blocker("B")).toBe(b);
    expect(router.state.location.pathname).toBe("/");
    b.proceed?.();
    await navigationCompleted("/one");
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("removing the selected form hands off to another mounted form", async () => {
    initialize();
    router.getBlocker("A", () => true);
    router.getBlocker("B", () => true);
    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    let removedA = blocker("A");
    router.deleteBlocker("A");
    await tick();
    expect(router.state.blockers.has("A")).toBe(false);
    expect(blocker("B").state).toBe("blocked");
    removedA.proceed?.();
    removedA.reset?.();
    expect(blocker("B").state).toBe("blocked");
    expect(router.state.location.pathname).toBe("/");
    blocker("B").reset?.();
  });

  it("removing an approved form preserves B's confirmation, and removing B releases the attempt", async () => {
    initialize();
    router.getBlocker("A", () => true);
    router.getBlocker("B", () => true);
    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    blocker("A").proceed?.();
    let b = blocker("B");
    expect(b.state).toBe("blocked");
    router.deleteBlocker("A");
    await tick();
    expect(blocker("B")).toBe(b);
    expect(router.state.location.pathname).toBe("/");

    let completed = navigationCompleted("/one");
    router.deleteBlocker("B");
    await completed;
    b.proceed?.();
    b.reset?.();
    expect(router.state.blockers.size).toBe(0);
    expect(history.index).toBe(1);
  });

  it("a replacement registration participates before a removal can release navigation", async () => {
    initialize();
    router.getBlocker("A", () => true);
    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    let oldA = blocker("A");
    router.deleteBlocker("A");
    router.getBlocker("A-new", () => true);
    await tick();
    expect(router.state.location.pathname).toBe("/");
    expect(blocker("A-new").state).toBe("blocked");
    oldA.proceed?.();
    oldA.reset?.();
    expect(blocker("A-new").state).toBe("blocked");
    blocker("A-new").reset?.();
  });

  it("preserves the current confirmation and earlier approvals through revalidation", async () => {
    let loader = jest.fn(() => "ROOT");
    initialize({
      routes: [
        {
          id: "root",
          path: "/",
          loader,
          children: [{ path: "one" }],
        },
      ],
      hydrationData: { loaderData: { root: "INITIAL" } },
    });
    let first = jest.fn(() => true);
    router.getBlocker("A", first);
    router.getBlocker("B", () => true);
    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    blocker("A").proceed?.();
    let b = blocker("B");
    expect(b.state).toBe("blocked");
    await router.revalidate();
    expect(router.state.loaderData).toEqual({ root: "ROOT" });
    expect(blocker("B")).toBe(b);
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
    b.proceed?.();
    await navigationCompleted("/one");
    expect(first).toHaveBeenCalledTimes(1);
  });

  it("an independent fetcher redirect invalidates paused consent before its loader completes", async () => {
    let fetcherData = createDeferred();
    let redirectData = createDeferred();
    let redirectSignal: AbortSignal | undefined;
    initialize({
      routes: [
        { id: "root", path: "/" },
        { path: "/one" },
        {
          path: "/two",
          loader({ request }) {
            redirectSignal = request.signal;
            return redirectData.promise;
          },
        },
        { path: "/fetch", loader: () => fetcherData.promise },
      ],
    });
    let fetch = router.fetch("resource", "root", "/fetch");
    router.getBlocker("A", () => true);
    router.getBlocker("B", () => true);
    await router.navigate("/one");
    blocker("A").proceed?.();
    let pausedB = blocker("B");
    expect(pausedB.state).toBe("blocked");

    await fetcherData.resolve(redirect("/two"));
    await tick();
    expect(router.state.navigation.location?.pathname).toBe("/two");
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
    expect(blocker("B")).toEqual(IDLE_BLOCKER);
    pausedB.proceed?.();
    pausedB.reset?.();
    expect(redirectSignal?.aborted).toBe(false);
    expect(router.state.navigation.location?.pathname).toBe("/two");
    await redirectData.resolve("TWO");
    await fetch;
    expect(router.state.location.pathname).toBe("/two");
    expect(history.index).toBe(1);
  });

  it("does not abort accepted transport for a blocked request, but its commit invalidates that consent", async () => {
    let data = createDeferred();
    let requestSignal: AbortSignal | undefined;
    initialize({
      routes: [
        { path: "/" },
        {
          path: "/one",
          loader({ request }) {
            requestSignal = request.signal;
            return data.promise;
          },
        },
        { path: "/two" },
      ],
    });
    let firstNavigation = router.navigate("/one");
    router.getBlocker("A", () => true);
    await router.navigate("/two");
    expect(blocker("A").state).toBe("blocked");
    let oldA = blocker("A");
    expect(requestSignal?.aborted).toBe(false);
    expect(router.state.navigation.location?.pathname).toBe("/one");
    await data.resolve("ONE");
    await firstNavigation;
    expect(router.state.location.pathname).toBe("/one");
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
    oldA.proceed?.();
    oldA.reset?.();
    expect(router.state.location.pathname).toBe("/one");
    expect(router.state.navigation.state).toBe("idle");
  });

  it("a new request during proceeding needs fresh approval and aborts older transport only after acceptance", async () => {
    let data = createDeferred();
    let requestSignal: AbortSignal | undefined;
    initialize({
      routes: [
        { path: "/" },
        {
          path: "/one",
          loader({ request }) {
            requestSignal = request.signal;
            return data.promise;
          },
        },
        { path: "/two" },
      ],
    });
    router.getBlocker("A", () => true);
    await router.navigate("/one");
    expect(blocker("A").state).toBe("blocked");
    let oldA = blocker("A");
    oldA.proceed?.();
    expect(blocker("A").state).toBe("proceeding");
    await router.navigate("/two");
    expect(blocker("A").state).toBe("blocked");
    expect(blocker("A").location?.pathname).toBe("/two");
    expect(requestSignal?.aborted).toBe(false);
    let freshA = blocker("A");
    oldA.proceed?.();
    oldA.reset?.();
    expect(blocker("A")).toBe(freshA);
    freshA.proceed?.();
    await navigationCompleted("/two");
    expect(requestSignal?.aborted).toBe(true);
    await data.resolve("ONE");
    oldA.proceed?.();
    oldA.reset?.();
    freshA.proceed?.();
    freshA.reset?.();
    expect(router.state.location.pathname).toBe("/two");
    expect(blocker("A")).toEqual(IDLE_BLOCKER);
  });

  it("resumes a normalized submission once with its REPLACE, state, and scroll options", async () => {
    let actionStarted = createDeferred<Request>();
    let actionResult = createDeferred();
    let action = jest.fn(({ request }: { request: Request }) => {
      void actionStarted.resolve(request);
      return actionResult.promise;
    });
    initialize({ routes: [{ path: "/" }, { path: "/one", action }] });
    router.getBlocker("A", () => true);
    router.getBlocker("B", () => true);
    let payload = createFormData({ title: "two forms" });
    await router.navigate("/one", {
      formMethod: "post",
      formData: payload,
      replace: true,
      state: { source: "editor" },
      preventScrollReset: true,
    });
    expect(blocker("A").state).toBe("blocked");
    let a = blocker("A");
    a.proceed?.();
    expect(action).not.toHaveBeenCalled();
    let b = blocker("B");
    expect(b.state).toBe("blocked");
    b.proceed?.();
    let request = await actionStarted.promise;
    expect(request.method).toBe("POST");
    expect((await request.formData()).get("title")).toBe("two forms");
    a.proceed?.();
    b.proceed?.();
    a.reset?.();
    let completed = navigationCompleted("/one");
    await actionResult.resolve("SAVED");
    await completed;
    expect(action).toHaveBeenCalledTimes(1);
    expect(router.state.historyAction).toBe("REPLACE");
    expect(router.state.preventScrollReset).toBe(true);
    expect(router.state.actionData).toEqual({ "1": "SAVED" });
    expect(history.index).toBe(0);
    expect(history.location.state).toEqual({ source: "editor" });
  });
});
