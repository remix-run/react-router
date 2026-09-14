import { jest } from "@jest/globals";

describe("route-pattern preloading", () => {
  afterEach(() => {
    jest.unstable_unmockModule("../../lib/router/matcher-route-pattern");
  });

  it.each([
    "createBrowserRouter",
    "createHashRouter",
    "createMemoryRouter",
    "createStaticHandler",
  ] as const)("requires preloading before %s with the flag", async (name) => {
    await jest.isolateModulesAsync(async () => {
      let api = await import("../../index");
      expect(() => {
        let router = api[name]([{ path: "/" }], {
          future: { unstable_routePatternMatching: true },
        });
        if ("dispose" in router) router.dispose();
      }).toThrow(
        'await unstable_preloadRoutePattern() from "react-router/route-pattern"',
      );
    });
  });

  it("keeps imports and unflagged routers independent of matcher loading", async () => {
    let failure = new Error("Unable to download the matcher");
    let loadMatcher = jest.fn(() => {
      throw failure;
    });
    jest.unstable_mockModule(
      "../../lib/router/matcher-route-pattern",
      loadMatcher,
    );

    await jest.isolateModulesAsync(async () => {
      let { createMemoryRouter } = await import("../../index");
      let { unstable_preloadRoutePattern } =
        await import("../../route-pattern");

      for (let enabled of [undefined, false]) {
        let router = createMemoryRouter([{ path: "/", id: "home" }], {
          future: { unstable_routePatternMatching: enabled },
        });
        expect(router.state.matches[0].route.id).toBe("home");
        router.dispose();
      }
      expect(loadMatcher).not.toHaveBeenCalled();

      let first = unstable_preloadRoutePattern();
      let second = unstable_preloadRoutePattern();
      await Promise.all([
        expect(first).rejects.toBe(failure),
        expect(second).rejects.toBe(failure),
      ]);
      expect(loadMatcher).toHaveBeenCalledTimes(1);

      expect(() =>
        createMemoryRouter([{ path: "/" }], {
          future: { unstable_routePatternMatching: true },
        }),
      ).toThrow("await unstable_preloadRoutePattern()");

      let retry = unstable_preloadRoutePattern();
      await expect(retry).rejects.toBe(failure);
      expect(loadMatcher).toHaveBeenCalledTimes(2);
    });
  });

  it("shares preloading and only enables synchronous routers after it resolves", async () => {
    await jest.isolateModulesAsync(async () => {
      let { createMemoryRouter } = await import("../../index");
      let { unstable_preloadRoutePattern } =
        await import("../../route-pattern");
      let routes = [
        { path: "/products/*", id: "products" },
        { path: "/:first/:second/:third/:fourth", id: "segments" },
      ];
      let opts = {
        future: { unstable_routePatternMatching: true },
        initialEntries: ["/products/one/two/three"],
      };

      let first = unstable_preloadRoutePattern();
      let second = unstable_preloadRoutePattern();
      expect(() => createMemoryRouter(routes, opts)).toThrow(
        "await unstable_preloadRoutePattern()",
      );
      await Promise.all([first, second]);
      await unstable_preloadRoutePattern();

      let router = createMemoryRouter(routes, opts);
      expect(router.state.matches[0].route.id).toBe("products");
      await router.navigate("/products/four/five/six");
      expect(router.state.matches[0].params).toEqual({ "*": "four/five/six" });
      router.dispose();

      let legacyRouter = createMemoryRouter(routes, {
        ...opts,
        future: { unstable_routePatternMatching: false },
      });
      expect(legacyRouter.state.matches[0].route.id).toBe("segments");
      legacyRouter.dispose();
    });
  });

  it("preloads the matcher for static handler queries", async () => {
    await jest.isolateModulesAsync(async () => {
      let { createStaticHandler } = await import("../../index");
      let { unstable_preloadRoutePattern } =
        await import("../../route-pattern");
      await unstable_preloadRoutePattern();

      let handler = createStaticHandler(
        [{ path: "/users/:id", id: "user", loader: () => "user data" }],
        { future: { unstable_routePatternMatching: true } },
      );
      let context = await handler.query(
        new Request("http://localhost/users/matt"),
      );
      expect(context).toMatchObject({
        loaderData: { user: "user data" },
        matches: [{ params: { id: "matt" }, route: { id: "user" } }],
      });
    });
  });
});
