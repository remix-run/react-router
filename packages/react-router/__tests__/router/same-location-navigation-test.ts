import type { DataStrategyFunction } from "../../lib/router/utils";
import { IDLE_NAVIGATION } from "../../lib/router/router";
import { cleanup, setup } from "./utils/data-router-setup";
import { createFormData, tick } from "./utils/utils";

describe("same-location navigations", () => {
  afterEach(() => cleanup());

  function collectNavigationStates(router: ReturnType<typeof setup>["router"]) {
    let states = [router.state.navigation.state];
    router.subscribe((state) => {
      states.push(state.navigation.state);
    });
    return states;
  }

  function passthroughDataStrategy(): DataStrategyFunction {
    return async ({ matches }) => {
      let results: Record<
        string,
        Awaited<ReturnType<(typeof matches)[0]["resolve"]>>
      > = {};
      await Promise.all(
        matches.map(async (match) => {
          if (match.shouldLoad) {
            results[match.route.id] = await match.resolve();
          }
        }),
      );
      return results;
    };
  }

  it("does not enter a loading state for a same-location GET with no loaders", async () => {
    let t = setup({
      routes: [{ id: "index", path: "/" }],
    });
    let states = collectNavigationStates(t.router);

    await t.navigate("/");
    await tick();

    expect(states).not.toContain("loading");
    expect(t.router.state.navigation).toBe(IDLE_NAVIGATION);
    expect(t.router.state.location.pathname).toBe("/");
  });

  it("does not enter a loading state for a same-location GET with a custom dataStrategy when nothing will revalidate", async () => {
    let dataStrategy = jest.fn(passthroughDataStrategy());
    let t = setup({
      routes: [{ id: "index", path: "/" }],
      dataStrategy,
    });
    let states = collectNavigationStates(t.router);

    await t.navigate("/");
    await tick();

    expect(states).not.toContain("loading");
    expect(t.router.state.navigation).toBe(IDLE_NAVIGATION);
    expect(dataStrategy).not.toHaveBeenCalled();
  });

  it("still revalidates and enters loading on a same-location GET with loaders", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          path: "/",
          loader: true,
        },
      ],
      hydrationData: {
        loaderData: { index: "INDEX" },
      },
    });
    let states = collectNavigationStates(t.router);

    let A = await t.navigate("/");
    expect(states).toContain("loading");
    expect(t.router.state.navigation.state).toBe("loading");

    await A.loaders.index.resolve("INDEX 2");
    expect(t.router.state.navigation).toBe(IDLE_NAVIGATION);
    expect(t.router.state.loaderData.index).toBe("INDEX 2");
  });

  it("still revalidates same-location GET loaders when a custom dataStrategy is present", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          path: "/",
          loader: true,
        },
      ],
      hydrationData: {
        loaderData: { index: "INDEX" },
      },
      dataStrategy: passthroughDataStrategy(),
    });
    let states = collectNavigationStates(t.router);

    let A = await t.navigate("/");
    expect(states).toContain("loading");
    expect(t.router.state.navigation.state).toBe("loading");

    await A.loaders.index.resolve("INDEX 2");
    expect(t.router.state.navigation).toBe(IDLE_NAVIGATION);
    expect(t.router.state.loaderData.index).toBe("INDEX 2");
  });

  it("does not enter a loading state for a same-location GET when shouldRevalidate returns false", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          path: "/",
          loader: true,
          shouldRevalidate: () => false,
        },
      ],
      hydrationData: {
        loaderData: { index: "INDEX" },
      },
    });
    let states = collectNavigationStates(t.router);

    let A = await t.navigate("/");
    A.loaders.index.resolve("SHOULD NOT BE CALLED");
    await tick();

    expect(states).not.toContain("loading");
    expect(t.router.state.navigation).toBe(IDLE_NAVIGATION);
    expect(t.router.state.loaderData.index).toBe("INDEX");
    expect(A.loaders.index.stub).not.toHaveBeenCalled();
  });

  it("does not enter a loading state for a same-location GET with dataStrategy when shouldRevalidate returns false", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          path: "/",
          loader: true,
          shouldRevalidate: () => false,
        },
      ],
      hydrationData: {
        loaderData: { index: "INDEX" },
      },
      dataStrategy: passthroughDataStrategy(),
    });
    let states = collectNavigationStates(t.router);

    let A = await t.navigate("/");
    A.loaders.index.resolve("SHOULD NOT BE CALLED");
    await tick();

    expect(states).not.toContain("loading");
    expect(t.router.state.navigation).toBe(IDLE_NAVIGATION);
    expect(t.router.state.loaderData.index).toBe("INDEX");
    expect(A.loaders.index.stub).not.toHaveBeenCalled();
  });

  it("does not enter a loading state for a same-location GET when defaultShouldRevalidate is false", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          path: "/",
          loader: true,
        },
      ],
      hydrationData: {
        loaderData: { index: "INDEX" },
      },
    });
    let states = collectNavigationStates(t.router);

    let A = await t.navigate("/", { defaultShouldRevalidate: false });
    A.loaders.index.resolve("SHOULD NOT BE CALLED");
    await tick();

    expect(states).not.toContain("loading");
    expect(t.router.state.navigation).toBe(IDLE_NAVIGATION);
    expect(t.router.state.loaderData.index).toBe("INDEX");
  });

  it("still enters loading for a same-location POST submission", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          path: "/",
          loader: true,
          action: true,
        },
      ],
      hydrationData: {
        loaderData: { index: "INDEX" },
      },
    });

    let A = await t.navigate("/", {
      formMethod: "post",
      formData: createFormData({ key: "value" }),
    });
    expect(t.router.state.navigation.state).toBe("submitting");

    await A.actions.index.resolve("ACTION");
    expect(t.router.state.navigation.state).toBe("loading");

    await A.loaders.index.resolve("INDEX 2");
    expect(t.router.state.navigation).toBe(IDLE_NAVIGATION);
    expect(t.router.state.loaderData.index).toBe("INDEX 2");
  });

  it("still enters loading when the search string changes", async () => {
    let t = setup({
      routes: [
        {
          id: "index",
          path: "/",
          loader: true,
        },
      ],
      hydrationData: {
        loaderData: { index: "INDEX" },
      },
    });

    let A = await t.navigate("/?foo=bar");
    expect(t.router.state.navigation.state).toBe("loading");
    await A.loaders.index.resolve("INDEX 2");
    expect(t.router.state.location.search).toBe("?foo=bar");
    expect(t.router.state.loaderData.index).toBe("INDEX 2");
  });

  it("still calls dataStrategy on a different-location navigation when shouldLoad is false", async () => {
    let dataStrategy = jest.fn(passthroughDataStrategy());
    let t = setup({
      routes: [
        {
          id: "root",
          path: "/",
          loader: true,
          children: [
            { id: "index", index: true },
            { id: "other", path: "other" },
          ],
        },
      ],
      hydrationData: {
        loaderData: { root: "ROOT" },
      },
      dataStrategy,
    });

    await t.navigate("/other");
    await tick();

    expect(dataStrategy).toHaveBeenCalled();
    expect(t.router.state.location.pathname).toBe("/other");
    expect(t.router.state.loaderData.root).toBe("ROOT");
  });
});
