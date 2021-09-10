import * as React from "react";
import { create as createTestRenderer } from "react-test-renderer";
import type { RouteObject } from "react-router";
import { MemoryRouter as Router, useRoutes } from "react-router";

describe("useRoutes", () => {
  it("returns the matching element from a route config", () => {
    let routes = [
      { path: "home", element: <h1>home</h1> },
      { path: "about", element: <h1>about</h1> }
    ];

    let renderer = createTestRenderer(
      <Router initialEntries={["/home"]}>
        <RoutesRenderer routes={routes} />
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        home
      </h1>
    `);
  });

  describe("when some routes are missing elements", () => {
    it("defaults to rendering their children", () => {
      let routes = [
        {
          path: "users",
          children: [{ path: ":id", element: <h1>user profile</h1> }]
        },
        { path: "about", element: <h1>about</h1> }
      ];

      let renderer = createTestRenderer(
        <Router initialEntries={["/users/mj"]}>
          <RoutesRenderer routes={routes} />
        </Router>
      );

      expect(renderer.toJSON()).toMatchInlineSnapshot(`
        <h1>
          user profile
        </h1>
      `);
    });
  });

  it("Uses the `location` prop instead of context location`", () => {
    let routes = [
      { path: "one", element: <h1>one</h1> },
      { path: "two", element: <h1>two</h1> }
    ];

    let renderer = createTestRenderer(
      <Router initialEntries={["/one"]}>
        <RoutesRenderer routes={routes} location={{ pathname: "/two" }} />
      </Router>
    );

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        two
      </h1>
    `);
  });
});

function RoutesRenderer({
  routes,
  basename,
  location
}: {
  routes: RouteObject[];
  basename?: string;
  location?: Partial<Location> & { pathname: string };
}) {
  return useRoutes(routes, { basename, location });
}
