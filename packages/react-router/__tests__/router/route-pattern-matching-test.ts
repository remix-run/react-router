import { createBrowserRouter, createHashRouter } from "../../lib/dom/lib";
import { createStaticRouter } from "../../lib/dom/server";
import { createMemoryRouter } from "../../lib/components";
import { createStaticHandler } from "../../lib/router/router";
import getWindow from "../utils/getWindow";

describe("unstable route-pattern matching", () => {
  let routePatternFuture = { unstable_routePatternMatching: true } as const;

  it("matches createMemoryRouter routes", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/",
          id: "root",
          children: [
            { index: true, id: "index" },
            { path: "users/:id", id: "user" },
            { path: "files/*", id: "files" },
          ],
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/files/a/b"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "files",
    ]);
    expect(router.state.matches[1].params).toEqual({ "*": "a/b" });
    expect(router.state.matches[1].route.path).toBe("files/*");

    let matches = router.match("/files/c/d");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "files"]);
    expect(matches?.[1].params).toEqual({ "*": "c/d" });
    expect(matches?.[1].route.path).toBe("files/*");
  });

  it("matches index routes for exact parent paths", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/",
          id: "root",
          children: [
            {
              path: "dashboard",
              id: "dashboard",
              children: [
                { index: true, id: "dashboard-index" },
                { path: "settings", id: "dashboard-settings" },
              ],
            },
          ],
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/dashboard"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "dashboard",
      "dashboard-index",
    ]);

    let matches = router.match("/dashboard");
    expect(matches?.map((m) => m.route.id)).toEqual([
      "root",
      "dashboard",
      "dashboard-index",
    ]);
  });

  it("matches createBrowserRouter routes", () => {
    let router = createBrowserRouter([{ path: "/users/:id", id: "user" }], {
      future: routePatternFuture,
      window: getWindow("/users/mj"),
    });

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["user"]);
    expect(router.state.matches[0].params).toEqual({ id: "mj" });
  });

  it("matches createHashRouter routes", () => {
    let router = createHashRouter([{ path: "/users/:id", id: "user" }], {
      future: routePatternFuture,
      window: getWindow("/users/mj", true),
    });

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["user"]);
    expect(router.state.matches[0].params).toEqual({ id: "mj" });
  });

  it("matches createStaticRouter routes", async () => {
    let routes = [
      {
        path: "/",
        id: "root",
        children: [
          { index: true, id: "index" },
          { path: "files/*", id: "files" },
        ],
      },
    ];
    let { query, dataRoutes } = createStaticHandler(routes, {
      future: routePatternFuture,
    });
    let context = await query(new Request("http://localhost/files/a/b"));

    if (context instanceof Response) {
      throw context;
    }

    let router = createStaticRouter(dataRoutes, context, {
      future: routePatternFuture,
    });

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "files",
    ]);
    expect(router.state.matches[1].params).toEqual({ "*": "a/b" });
    expect(router.state.matches[1].route.path).toBe("files/*");

    let matches = router.match("/files/c/d");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "files"]);
    expect(matches?.[1].params).toEqual({ "*": "c/d" });
    expect(matches?.[1].route.path).toBe("files/*");
  });

  it("matches optional segments without exploding routes", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/archive/:year?/:month?",
          id: "archive",
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/archive/2024"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["archive"]);
    expect(router.state.matches[0].params).toEqual({ year: "2024" });
    expect(router.state.matches[0].route.path).toBe("/archive/:year?/:month?");
  });

  it("matches multiple optional segments", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/",
          id: "root",
          children: [
            { path: "archive/:year?/:month?", id: "archive" },
            { path: "files/*", id: "files" },
          ],
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/archive/2024/06"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "archive",
    ]);
    expect(router.state.matches[1].params).toEqual({
      year: "2024",
      month: "06",
    });
    expect(router.state.matches[1].route.path).toBe("archive/:year?/:month?");

    let matches = router.match("/archive/2025");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "archive"]);
    expect(matches?.[1].params).toEqual({ year: "2025" });
    expect(matches?.[1].route.path).toBe("archive/:year?/:month?");
  });

  it("matches splat routes", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/",
          id: "root",
          children: [{ path: "files/*", id: "files" }],
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/files/a/b"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "files",
    ]);
    expect(router.state.matches[1].params).toEqual({ "*": "a/b" });
    expect(router.state.matches[1].route.path).toBe("files/*");
  });

  it("matches nested optional route paths", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/one/:two?",
          id: "one",
          children: [
            {
              path: "three",
              id: "three",
            },
          ],
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/one/three"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "one",
      "three",
    ]);
    expect(router.state.matches[0].params).toEqual({});
    expect(router.state.matches[0].route.path).toBe("/one/:two?");
  });

  it("uses unstable_validateParams to continue to the next matching route", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/:drink",
          id: "drink",
          unstable_validateParams: ({ drink }) =>
            /^(wines|whiskeys|sakes|beers)$/.test(drink!),
        },
        {
          path: "/:food",
          id: "food",
          unstable_validateParams: ({ food }) =>
            /^(meats|veggies|cheeses|sweets)$/.test(food!),
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/meats"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["food"]);
    expect(router.state.matches[0].params).toEqual({ food: "meats" });

    let matches = router.match("/wines");
    expect(matches?.map((m) => m.route.id)).toEqual(["drink"]);
    expect(matches?.[0].params).toEqual({ drink: "wines" });
  });

  it("prefers validated matches over unvalidated matches", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/:drink",
          id: "drink",
          unstable_validateParams: ({ drink }) =>
            /^(wines|whiskeys|sakes|beers)$/.test(drink!),
        },
        {
          path: "/:other",
          id: "other",
        },
        {
          path: "/:food",
          id: "food",
          unstable_validateParams: ({ food }) =>
            /^(meats|veggies|cheeses|sweets)$/.test(food!),
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/meats"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["food"]);
    expect(router.state.matches[0].params).toEqual({ food: "meats" });

    let matches = router.match("/other");
    expect(matches?.map((m) => m.route.id)).toEqual(["other"]);
    expect(matches?.[0].params).toEqual({ other: "other" });
  });

  it("runs unstable_validateParams for all routes in the matched branch", () => {
    let calls: string[] = [];
    let router = createMemoryRouter(
      [
        {
          path: "/:section",
          id: "section",
          unstable_validateParams: ({ section, item }) => {
            calls.push(`section:${section}/${item}`);
            return section === "drinks";
          },
          children: [
            {
              path: ":item",
              id: "section-item",
            },
          ],
        },
        {
          path: "/:food/:item",
          id: "food-item",
          unstable_validateParams: ({ food, item }) => {
            calls.push(`food:${food}/${item}`);
            return food === "meats";
          },
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/meats/ribeye"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["food-item"]);
    expect(router.state.matches[0].params).toEqual({
      food: "meats",
      item: "ribeye",
    });
    expect(calls).toEqual(["section:meats/ribeye", "food:meats/ribeye"]);
    calls = [];

    let matches = router.match("/drinks/beer");
    expect(matches?.map((m) => m.route.id)).toEqual([
      "section",
      "section-item",
    ]);
    expect(matches?.[0].params).toEqual({ section: "drinks", item: "beer" });
    expect(calls).toEqual(["section:drinks/beer"]);
  });

  it("warns and treats unstable_validateParams errors as not validated", () => {
    let consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    let router = createMemoryRouter(
      [
        {
          id: "root",
          path: "/",
        },
        {
          id: "param",
          path: "/:id",
          unstable_validateParams() {
            throw new Error("Invalid params");
          },
          ErrorBoundary: () => null,
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/123"],
      },
    );

    expect(router.state).toMatchObject({
      navigation: { state: "idle" },
      location: { pathname: "/123" },
      errors: { root: { status: 404 } },
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      'Route "param" failed param validation with the following error:\n' +
        "Invalid params",
    );
    consoleWarn.mockRestore();
  });

  it("continues matching after unstable_validateParams errors", async () => {
    let consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    let router = createMemoryRouter(
      [
        {
          id: "root",
          path: "/",
        },
        {
          id: "param",
          path: "/:id",
          unstable_validateParams() {
            throw new Error("Invalid params");
          },
        },
        {
          id: "food",
          path: "/:food",
          unstable_validateParams({ food }) {
            return food === "meats";
          },
        },
      ],
      {
        future: routePatternFuture,
      },
    );

    await router.navigate("/meats");
    expect(router.state).toMatchObject({
      navigation: { state: "idle" },
      location: { pathname: "/meats" },
      matches: [{ route: { id: "food" } }],
      errors: null,
    });
    expect(consoleWarn).toHaveBeenCalledWith(
      'Route "param" failed param validation with the following error:\n' +
        "Invalid params",
    );
    consoleWarn.mockRestore();
  });

  it("throws for caseSensitive routes", () => {
    expect(() =>
      createMemoryRouter([{ path: "/users", caseSensitive: true }], {
        future: routePatternFuture,
      }),
    ).toThrow(
      "`caseSensitive` routes are not supported with " +
        "`future.unstable_routePatternMatching`.",
    );
  });

  it("throws for multiple splats", () => {
    expect(() =>
      createMemoryRouter([{ path: "/files/*/assets/*" }], {
        future: routePatternFuture,
      }),
    ).toThrow(
      'Route path "/files/*/assets/*" is not supported with ' +
        "`future.unstable_routePatternMatching` because React Router only " +
        "supports a single splat at the end of a route path.",
    );
  });

  it("throws for non-terminal splats", () => {
    expect(() =>
      createMemoryRouter([{ path: "/files/*/assets" }], {
        future: routePatternFuture,
      }),
    ).toThrow(
      'Route path "/files/*/assets" is not supported with ' +
        "`future.unstable_routePatternMatching` because React Router only " +
        "supports a single splat at the end of a route path.",
    );
  });

  it("throws for splats with nested child routes", () => {
    expect(() =>
      createMemoryRouter(
        [
          {
            path: "/files/*",
            children: [{ path: "assets" }],
          },
        ],
        {
          future: routePatternFuture,
        },
      ),
    ).toThrow(
      'Route path "/files/*/assets" is not supported with ' +
        "`future.unstable_routePatternMatching` because React Router only " +
        "supports a single splat at the end of a route path.",
    );
  });
});
