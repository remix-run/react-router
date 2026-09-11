import {
  createBrowserHistory,
  createMemoryHistory,
} from "../../lib/router/history";
import { IDLE_NAVIGATION, createRouter } from "../../lib/router/router";
import type { LoaderFunction } from "../../lib/router/utils";
import getWindow from "../utils/getWindow";
import { cleanup, setup } from "./utils/data-router-setup";
import { createDeferred, createFormData, tick } from "./utils/utils";

describe("view transitions", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => cleanup());

  it("only enables view transitions when specified for the navigation", () => {
    let t = setup({
      routes: [{ path: "/" }, { path: "/a" }, { path: "/b" }],
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    // PUSH / -> /a - w/o transition
    t.navigate("/a");
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/a" }),
      }),
      expect.objectContaining({ viewTransitionOpts: undefined }),
    );

    // PUSH /a -> /b - w/ transition
    t.navigate("/b", { viewTransition: true });
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/b" }),
      }),
      expect.objectContaining({
        viewTransitionOpts: {
          currentLocation: expect.objectContaining({ pathname: "/a" }),
          nextLocation: expect.objectContaining({ pathname: "/b" }),
        },
      }),
    );

    // POP /b -> /a - w/ transition (cached from above)
    t.navigate(-1);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/a" }),
      }),
      expect.objectContaining({
        viewTransitionOpts: {
          // Args reversed on POP so same hooks apply
          currentLocation: expect.objectContaining({ pathname: "/a" }),
          nextLocation: expect.objectContaining({ pathname: "/b" }),
        },
      }),
    );

    // POP /a -> / - No transition
    t.navigate(-1);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/" }),
      }),
      expect.objectContaining({ viewTransitionOpts: undefined }),
    );

    unsubscribe();
    t.router.dispose();
  });

  it("preserves pending view transitions through router.revalidate()", async () => {
    let t = setup({
      routes: [{ path: "/" }, { id: "a", path: "/a", loader: true }],
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    let A = await t.navigate("/a", { viewTransition: true });
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0]).toEqual([
      expect.objectContaining({
        navigation: expect.objectContaining({ state: "loading" }),
      }),
      expect.objectContaining({ viewTransitionOpts: undefined }),
    ]);
    expect(A.loaders.a.stub).toHaveBeenCalledTimes(1);

    // Interrupt the navigation loading state with a revalidation
    let B = await t.revalidate();
    expect(spy).toHaveBeenCalledTimes(3);
    expect(spy.mock.calls[1]).toEqual([
      expect.objectContaining({
        revalidation: "loading",
      }),
      expect.objectContaining({
        viewTransitionOpts: undefined,
      }),
    ]);
    expect(spy.mock.calls[2]).toEqual([
      expect.objectContaining({
        navigation: expect.objectContaining({ state: "loading" }),
      }),
      expect.objectContaining({
        viewTransitionOpts: undefined,
      }),
    ]);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: expect.objectContaining({ state: "loading" }),
      }),
      expect.objectContaining({
        viewTransitionOpts: undefined,
      }),
    );
    expect(B.loaders.a.stub).toHaveBeenCalledTimes(1);

    await A.loaders.a.resolve("A");
    await B.loaders.a.resolve("A*");

    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy.mock.calls[3]).toEqual([
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/a" }),
        loaderData: {
          a: "A*",
        },
      }),
      expect.objectContaining({
        viewTransitionOpts: {
          currentLocation: expect.objectContaining({ pathname: "/" }),
          nextLocation: expect.objectContaining({ pathname: "/a" }),
        },
      }),
    ]);

    unsubscribe();
    t.router.dispose();
  });

  it("preserves pending view transitions through redirects", async () => {
    let t = setup({
      routes: [
        { path: "/" },
        { id: "a", path: "/a", action: true },
        { path: "/b" },
      ],
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    let A = await t.navigate("/a", {
      formMethod: "post",
      formData: createFormData({}),
      viewTransition: true,
    });

    await A.actions.a.redirect("/b");
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/b" }),
      }),
      expect.objectContaining({
        viewTransitionOpts: {
          currentLocation: expect.objectContaining({ pathname: "/" }),
          nextLocation: expect.objectContaining({ pathname: "/b" }),
        },
      }),
    );

    unsubscribe();
    t.router.dispose();
  });

  it("does not enable view transitions for a revalidation after a POP navigation", async () => {
    let t = setup({
      routes: [
        { id: "root", path: "/", loader: true },
        { id: "a", path: "/a", loader: true },
      ],
      hydrationData: { loaderData: { root: "ROOT" } },
    });
    let spy = jest.fn();
    let unsubscribe = t.router.subscribe(spy);

    // PUSH / -> /a - w/ transition
    let A = await t.navigate("/a", { viewTransition: true });
    await A.loaders.a.resolve("A");
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/a" }),
      }),
      expect.objectContaining({
        viewTransitionOpts: {
          currentLocation: expect.objectContaining({ pathname: "/" }),
          nextLocation: expect.objectContaining({ pathname: "/a" }),
        },
      }),
    );

    // POP /a -> / - w/ transition (cached from above)
    let B = await t.navigate(-1);
    await B.loaders.root.resolve("ROOT*");
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/" }),
      }),
      expect.objectContaining({
        viewTransitionOpts: {
          currentLocation: expect.objectContaining({ pathname: "/" }),
          nextLocation: expect.objectContaining({ pathname: "/a" }),
        },
      }),
    );

    // Revalidate at / - the router is still in a POP historyAction but a
    // revalidation does not change location, so no transition
    let R = await t.revalidate();
    await R.loaders.root.resolve("ROOT**");
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        navigation: IDLE_NAVIGATION,
        revalidation: "idle",
        location: expect.objectContaining({ pathname: "/" }),
        loaderData: { root: "ROOT**" },
      }),
      expect.objectContaining({ viewTransitionOpts: undefined }),
    );

    unsubscribe();
    t.router.dispose();
  });

  it("does not enable view transitions for the initial hydration", async () => {
    // A prior session recorded a transition away from /a, so /a is a known
    // transition source when the page is reloaded
    let window = getWindow("/a");
    window.sessionStorage.setItem(
      "remix-router-transitions",
      JSON.stringify({ "/a": ["/b"] }),
    );
    let dfd = createDeferred();
    let router = createRouter({
      history: createBrowserHistory({ window }),
      routes: [
        { id: "a", path: "/a", loader: () => dfd.promise },
        { path: "/b" },
      ],
      window,
    });
    let spy = jest.fn();
    let unsubscribe = router.subscribe(spy);
    router.initialize();
    expect(router.state.initialized).toBe(false);

    await dfd.resolve("A");
    await tick();
    expect(router.state.initialized).toBe(true);
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({
        initialized: true,
        navigation: IDLE_NAVIGATION,
        location: expect.objectContaining({ pathname: "/a" }),
      }),
      expect.objectContaining({ viewTransitionOpts: undefined }),
    );

    unsubscribe();
    router.dispose();
  });

  it.each([
    { name: "back", from: "/b", to: "/a", delta: -1 },
    { name: "forward", from: "/a", to: "/b", delta: 1 },
    { name: "back to the same URL", from: "/b", to: "/b", delta: -1 },
  ])(
    "enables view transitions when $name interrupts hydration",
    async ({ from, to, delta }) => {
      let initialEntries = delta < 0 ? [to, from] : [from, to];
      let window = getWindow(from);
      window.sessionStorage.setItem(
        "remix-router-transitions",
        JSON.stringify({ [initialEntries[0]]: [initialEntries[1]] }),
      );
      let dfd = createDeferred();
      let loader: LoaderFunction = jest
        .fn()
        .mockReturnValueOnce(dfd.promise)
        .mockReturnValue("POP DATA");
      loader.hydrate = true;
      let router = createRouter({
        history: createMemoryHistory({
          initialEntries,
          initialIndex: delta < 0 ? 1 : 0,
        }),
        routes: [{ id: "page", path: "/:page", loader }],
        hydrationData: { loaderData: { page: "SSR DATA" } },
        window,
      });
      let spy = jest.fn();
      let unsubscribe = router.subscribe(spy);
      router.initialize();
      await tick();

      // SSR content is visible while the hydration loader is still pending.
      expect(loader).toHaveBeenCalledTimes(1);
      expect(router.state).toMatchObject({
        initialized: false,
        renderFallback: false,
        loaderData: { page: "SSR DATA" },
      });
      let initialLocation = router.state.location;

      await router.navigate(delta);
      expect(router.state.location.key).not.toBe(initialLocation.key);
      expect(spy).toHaveBeenLastCalledWith(
        expect.objectContaining({
          initialized: true,
          navigation: IDLE_NAVIGATION,
          location: expect.objectContaining({ pathname: to }),
          loaderData: { page: "POP DATA" },
        }),
        expect.objectContaining({
          viewTransitionOpts: {
            currentLocation: expect.objectContaining({
              pathname: initialEntries[0],
            }),
            nextLocation: expect.objectContaining({
              pathname: initialEntries[1],
            }),
          },
        }),
      );

      // The interrupted hydration must not commit or animate when it settles.
      let calls = spy.mock.calls.length;
      await dfd.resolve("HYDRATED DATA");
      await tick();
      expect(spy).toHaveBeenCalledTimes(calls);

      unsubscribe();
      router.dispose();
    },
  );
});
