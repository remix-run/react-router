import { jest } from "@jest/globals";

describe("route-pattern preloading", () => {
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
        'call unstable_preloadRoutePattern() from "react-router/route-pattern"',
      );
    });
  });

  it("supports unflagged routers without initializing the matcher", async () => {
    await jest.isolateModulesAsync(async () => {
      let { createMemoryRouter } = await import("../../index");

      for (let enabled of [undefined, false]) {
        let router = createMemoryRouter([{ path: "/", id: "home" }], {
          future: { unstable_routePatternMatching: enabled },
        });
        expect(router.state.matches[0].route.id).toBe("home");
        router.dispose();
      }
    });
  });

  it("initializes synchronously and supports repeated calls", async () => {
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

      expect(() => createMemoryRouter(routes, opts)).toThrow(
        "call unstable_preloadRoutePattern()",
      );
      expect(unstable_preloadRoutePattern()).toBeUndefined();

      let router = createMemoryRouter(routes, opts);
      expect(router.state.matches[0].route.id).toBe("products");
      unstable_preloadRoutePattern();
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
      unstable_preloadRoutePattern();

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
