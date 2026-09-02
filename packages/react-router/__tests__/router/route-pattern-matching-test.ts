import { createBrowserRouter, createHashRouter } from "../../lib/dom/lib";
import { createStaticRouter } from "../../lib/dom/server";
import { createMemoryRouter } from "../../lib/components";
import { createMemoryHistory } from "../../lib/router/history";
import { createRouter, createStaticHandler } from "../../lib/router/router";
import { unstable_routePatternMatching } from "../../route-pattern";
import getWindow from "../utils/getWindow";

describe("unstable route-pattern matching", () => {
  let routePatternFuture = { unstable_routePatternMatching } as const;

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

  it("matches encoded URL-structural characters as path params", () => {
    let router = createMemoryRouter([{ path: "/view/:id", id: "view" }], {
      future: routePatternFuture,
      initialEntries: ["/"],
    });

    expect(router.match("/view/%23abc")?.[0].params).toEqual({ id: "#abc" });
  });

  it("matches routes case-insensitively by default", () => {
    let router = createMemoryRouter([{ path: "/Users", id: "users" }], {
      future: routePatternFuture,
      initialEntries: ["/"],
    });

    expect(router.match("/users")?.map((m) => m.route.id)).toEqual(["users"]);
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

  it("preserves route boundaries when an optional parent segment is omitted", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/:gate/foo?",
          id: "optional-parent",
          children: [
            {
              index: true,
              id: "index",
              unstable_validateParams: { gate: /^never$/ },
            },
            { path: "foo", id: "child" },
          ],
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/ok/foo"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "optional-parent",
      "child",
    ]);
    expect(router.state.matches.map((m) => m.pathname)).toEqual([
      "/ok",
      "/ok/foo",
    ]);
  });

  it("matches absolute children under omitted optional parent segments", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/:lang?",
          id: "language",
          children: [{ path: "/dashboard", id: "dashboard" }],
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/dashboard"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "language",
      "dashboard",
    ]);
  });

  it("prefers partial static matches over full splat matches during route discovery", async () => {
    let router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: "/", id: "root" },
        { path: "parent", id: "parent" },
        { path: "*", id: "splat" },
      ],
      future: routePatternFuture,
      patchRoutesOnNavigation({ matches, patch }) {
        if (matches.at(-1)?.route.id === "parent") {
          patch("parent", [{ path: "child", id: "child" }]);
        }
      },
    });

    try {
      await router.navigate("/parent/child");
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "parent",
        "child",
      ]);
    } finally {
      router.dispose();
    }
  });

  it("uses unstable_validateParams to continue to the next matching route", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/:drink",
          id: "drink",
          unstable_validateParams: {
            drink: /^(wines|whiskeys|sakes|beers)$/,
          },
        },
        {
          path: "/:food",
          id: "food",
          unstable_validateParams: {
            food: /^(meats|veggies|cheeses|sweets)$/,
          },
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
          unstable_validateParams: {
            drink: /^(wines|whiskeys|sakes|beers)$/,
          },
        },
        {
          path: "/:other",
          id: "other",
        },
        {
          path: "/:food",
          id: "food",
          unstable_validateParams: {
            food: /^(meats|veggies|cheeses|sweets)$/,
          },
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

  it("prefers static matches over validated dynamic matches", () => {
    let router = createMemoryRouter(
      [
        { path: "/users/new", id: "new-user" },
        {
          path: "/users/:id",
          id: "user",
          unstable_validateParams: { id: /^new$/ },
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/"],
      },
    );

    expect(router.match("/users/new")?.map((m) => m.route.id)).toEqual([
      "new-user",
    ]);
  });

  it("runs unstable_validateParams for all routes in the matched branch", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/:section",
          id: "section",
          unstable_validateParams: {
            section: /^drinks$/,
          },
          children: [
            {
              path: ":item",
              id: "section-item",
              unstable_validateParams: {
                item: /^beer$/,
              },
            },
          ],
        },
        {
          path: "/:food/:item",
          id: "food-item",
          unstable_validateParams: {
            food: /^meats$/,
            item: /^ribeye$/,
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

    let matches = router.match("/drinks/beer");
    expect(matches?.map((m) => m.route.id)).toEqual([
      "section",
      "section-item",
    ]);
    expect(matches?.[0].params).toEqual({ section: "drinks", item: "beer" });
    expect(router.match("/drinks/wine")).toBeNull();
  });

  it("only validates optional params when they exist", () => {
    let router = createMemoryRouter(
      [
        {
          id: "language",
          path: "/about/:language?",
          unstable_validateParams: {
            language: /^(en|fr)$/,
          },
        },
      ],
      {
        future: routePatternFuture,
        initialEntries: ["/about"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["language"]);
    expect(router.state.matches[0].params).toEqual({});
    expect(router.match("/about/en")?.map((m) => m.route.id)).toEqual([
      "language",
    ]);
    expect(router.match("/about/de")).toBeNull();
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
