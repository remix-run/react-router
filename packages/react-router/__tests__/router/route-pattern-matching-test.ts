import { createBrowserRouter, createHashRouter } from "../../lib/dom/lib";
import { createStaticRouter } from "../../lib/dom/server";
import { createMemoryRouter } from "../../lib/components";
import { unstable_convertRoutePathsToPatterns } from "../../lib/router/route-pattern";
import { createStaticHandler } from "../../lib/router/router";
import getWindow from "../utils/getWindow";

describe("unstable route-pattern matching", () => {
  let routePatternFuture = { unstable_routePatternMatching: true } as const;

  it("matches createMemoryRouter route-pattern routes", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/",
          id: "root",
          children: [
            { index: true, id: "index" },
            { path: "users/:id", id: "user" },
            { path: "files/*splat", id: "files" },
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
    expect(router.state.matches[1].params).toEqual({ splat: "a/b" });

    let matches = router.matchRoutes("/files/c/d");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "files"]);
    expect(matches?.[1].params).toEqual({ splat: "c/d" });
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

    let matches = router.matchRoutes("/dashboard");
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
          { path: "files/*splat", id: "files" },
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
    expect(router.state.matches[1].params).toEqual({ splat: "a/b" });

    let matches = router.matchRoutes("/files/c/d");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "files"]);
    expect(matches?.[1].params).toEqual({ splat: "c/d" });
  });

  it("matches optional route-pattern segments without exploding routes", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/archive(/:year(/:month))",
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
  });

  it("matches converted React Router route paths", () => {
    let routes = unstable_convertRoutePathsToPatterns([
      {
        path: "/",
        id: "root",
        children: [
          { path: "archive/:year?/:month?", id: "archive" },
          { path: "files/*", id: "files" },
        ],
      },
    ]);

    expect(routes[0].children?.[0].path).toBe("archive(/:year(/:month))");
    expect(routes[0].children?.[1].path).toBe("files/*__rr_splat");

    let router = createMemoryRouter(routes, {
      future: routePatternFuture,
      initialEntries: ["/archive/2024/06"],
    });

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "archive",
    ]);
    expect(router.state.matches[1].params).toEqual({
      year: "2024",
      month: "06",
    });

    let matches = router.matchRoutes("/files/a/b");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "files"]);
    expect(matches?.[1].params).toEqual({ "*": "a/b" });
  });

  it("matches nested converted React Router route paths", () => {
    let routes = unstable_convertRoutePathsToPatterns([
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
    ]);

    expect(routes[0].path).toBe("/one(/:two)");
    expect(routes[0].children?.[0].path).toBe("three");

    let router = createMemoryRouter(routes, {
      future: routePatternFuture,
      initialEntries: ["/one/three"],
    });

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "one",
      "three",
    ]);
    expect(router.state.matches[0].params).toEqual({});
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
});
