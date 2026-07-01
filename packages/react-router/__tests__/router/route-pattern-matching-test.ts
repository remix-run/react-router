import { createBrowserRouter, createHashRouter } from "../../lib/dom/lib";
import { createStaticRouter } from "../../lib/dom/server";
import { createMemoryRouter } from "../../lib/components";
import { unstable_convertRoutePathsToPatterns } from "../../lib/router/route-pattern";
import { createStaticHandler } from "../../lib/router/router";
import getWindow from "../utils/getWindow";

describe("unstable route-pattern matching", () => {
  let compatFuture = { unstable_routePatternMatching: "compat" } as const;
  let nativeFuture = { unstable_routePatternMatching: "native" } as const;

  it("matches createMemoryRouter routes in compat mode", () => {
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
        future: compatFuture,
        initialEntries: ["/files/a/b"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "files",
    ]);
    expect(router.state.matches[1].params).toEqual({ "*": "a/b" });

    let matches = router.matchRoutes("/files/c/d");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "files"]);
    expect(matches?.[1].params).toEqual({ "*": "c/d" });
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
        future: compatFuture,
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
      future: compatFuture,
      window: getWindow("/users/mj"),
    });

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["user"]);
    expect(router.state.matches[0].params).toEqual({ id: "mj" });
  });

  it("matches createHashRouter routes", () => {
    let router = createHashRouter([{ path: "/users/:id", id: "user" }], {
      future: compatFuture,
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
      future: compatFuture,
    });
    let context = await query(new Request("http://localhost/files/a/b"));

    if (context instanceof Response) {
      throw context;
    }

    let router = createStaticRouter(dataRoutes, context, {
      future: compatFuture,
    });

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "files",
    ]);
    expect(router.state.matches[1].params).toEqual({ "*": "a/b" });

    let matches = router.matchRoutes("/files/c/d");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "files"]);
    expect(matches?.[1].params).toEqual({ "*": "c/d" });
  });

  it("converts optional segments to route-pattern optionals", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/archive/:year?/:month?",
          id: "archive",
        },
      ],
      {
        future: compatFuture,
        initialEntries: ["/archive/2024"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["archive"]);
    expect(router.state.matches[0].params).toEqual({ year: "2024" });
  });

  it("matches nested optional segments without exploding routes", () => {
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
        future: compatFuture,
        initialEntries: ["/one/three"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "one",
      "three",
    ]);
    expect(router.state.matches[0].params).toEqual({});
  });

  it("matches route-pattern syntax directly in native mode", () => {
    let router = createMemoryRouter(
      [
        {
          path: "/",
          id: "root",
          children: [
            { path: "archive(/:year(/:month))", id: "archive" },
            { path: "files/*splat", id: "files" },
          ],
        },
      ],
      {
        future: nativeFuture,
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

    let matches = router.matchRoutes("/files/a/b");
    expect(matches?.map((m) => m.route.id)).toEqual(["root", "files"]);
    expect(matches?.[1].params).toEqual({ splat: "a/b" });
  });

  it("converts route paths to route-pattern syntax for native mode", () => {
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
      future: nativeFuture,
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

  it("throws for caseSensitive routes", () => {
    expect(() =>
      createMemoryRouter([{ path: "/users", caseSensitive: true }], {
        future: compatFuture,
      }),
    ).toThrow(
      "`caseSensitive` routes are not supported with " +
        "`future.unstable_routePatternMatching`.",
    );
  });
});
