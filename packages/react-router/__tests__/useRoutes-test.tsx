import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import type { RouteObject } from "react-router";
import { MemoryRouter, useRoutes } from "react-router";

describe("useRoutes", () => {
  it("returns the matching element from a route config", () => {
    let routes = [
      { path: "home", element: <h1>home</h1> },
      { path: "about", element: <h1>about</h1> },
    ];

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/home"]}>
          <RoutesRenderer routes={routes} />
        </MemoryRouter>
      );
    });

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
          children: [{ path: ":id", element: <h1>user profile</h1> }],
        },
        { path: "about", element: <h1>about</h1> },
      ];

      let renderer: TestRenderer.ReactTestRenderer;
      TestRenderer.act(() => {
        renderer = TestRenderer.create(
          <MemoryRouter initialEntries={["/users/mj"]}>
            <RoutesRenderer routes={routes} />
          </MemoryRouter>
        );
      });

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
      { path: "two", element: <h1>two</h1> },
    ];

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/one"]}>
          <RoutesRenderer routes={routes} location={{ pathname: "/two" }} />
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <h1>
        two
      </h1>
    `);
  });

  it("returns null when no route matches", () => {
    let spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    let routes = [{ path: "one", element: <h1>one</h1> }];

    const NullRenderer = (props: { routes: RouteObject[] }) => {
      const element = useRoutes(props.routes);
      return element === null ? <div>is null</div> : <div>is not null</div>;
    };

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/two"]}>
          <NullRenderer routes={routes} />
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        is null
      </div>
    `);

    spy.mockRestore();
  });

  it("returns null when no route matches and a `location` prop is passed", () => {
    let spy = jest.spyOn(console, "warn").mockImplementation(() => {});

    let routes = [{ path: "one", element: <h1>one</h1> }];

    const NullRenderer = (props: {
      routes: RouteObject[];
      location?: Partial<Location> & { pathname: string };
    }) => {
      const element = useRoutes(props.routes, props.location);
      return element === null ? <div>is null</div> : <div>is not null</div>;
    };

    let renderer: TestRenderer.ReactTestRenderer;
    TestRenderer.act(() => {
      renderer = TestRenderer.create(
        <MemoryRouter initialEntries={["/two"]}>
          <NullRenderer
            routes={routes}
            location={{ pathname: "/three", search: "", hash: "" }}
          />
        </MemoryRouter>
      );
    });

    expect(renderer.toJSON()).toMatchInlineSnapshot(`
      <div>
        is null
      </div>
    `);

    spy.mockRestore();
  });

  describe("warns", () => {
    let consoleWarn: jest.SpyInstance;
    beforeEach(() => {
      consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
      consoleWarn.mockRestore();
    });

    it("for no element on leaf route", () => {
      let routes = [
        {
          path: "layout",
          children: [{ path: "two", element: <h1>two</h1> }],
        },
      ];

      TestRenderer.act(() => {
        TestRenderer.create(
          <MemoryRouter initialEntries={["/layout"]}>
            <RoutesRenderer routes={routes} />
          </MemoryRouter>
        );
      });

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn).toHaveBeenCalledWith(
        expect.stringContaining(
          `Matched leaf route at location "/layout" does not have an element`
        )
      );
    });
  });
});

function RoutesRenderer({
  routes,
  location,
}: {
  routes: RouteObject[];
  location?: Partial<Location> & { pathname: string };
}) {
  return useRoutes(routes, location);
}
