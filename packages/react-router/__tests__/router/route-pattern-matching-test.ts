import { createBrowserRouter, createHashRouter } from "../../lib/dom/lib";
import { createStaticRouter } from "../../lib/dom/server";
import { createMemoryRouter } from "../../lib/components";
import { createStaticHandler } from "../../lib/router/router";
import getWindow from "../utils/getWindow";

describe("unstable route-pattern matching", () => {
  let future = { unstable_routePatternMatching: true };

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
        future,
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
        future,
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
      future,
      window: getWindow("/users/mj"),
    });

    expect(router.state.matches.map((m) => m.route.id)).toEqual(["user"]);
    expect(router.state.matches[0].params).toEqual({ id: "mj" });
  });

  it("matches createHashRouter routes", () => {
    let router = createHashRouter([{ path: "/users/:id", id: "user" }], {
      future,
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
    let { query, dataRoutes } = createStaticHandler(routes, { future });
    let context = await query(new Request("http://localhost/files/a/b"));

    if (context instanceof Response) {
      throw context;
    }

    let router = createStaticRouter(dataRoutes, context, { future });

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
        future,
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
        future,
        initialEntries: ["/one/three"],
      },
    );

    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "one",
      "three",
    ]);
    expect(router.state.matches[0].params).toEqual({});
  });

  it("throws for caseSensitive routes", () => {
    expect(() =>
      createMemoryRouter([{ path: "/users", caseSensitive: true }], { future }),
    ).toThrow(
      "`caseSensitive` routes are not supported with " +
        "`future.unstable_routePatternMatching`.",
    );
  });
});
