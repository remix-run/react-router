import { createMemoryHistory, createPath } from "../history";
import { createRouter } from "../router";
import { cleanup } from "./utils/data-router-setup";
import { createFormData } from "./utils/utils";

describe("path resolution", () => {
  // Detect any failures inside the router navigate code
  afterEach(() => cleanup());

  describe("routing to self", () => {
    // Utility that accepts children of /foo routes and executes the same
    // routing tests starting at /foo/bar/?a=b#hash
    function assertRoutingToSelf(fooChildren, expectedPath, expectIndex) {
      const getRouter = () =>
        createRouter({
          routes: [
            {
              path: "/",
              children: [
                {
                  path: "foo",
                  children: fooChildren,
                },
              ],
            },
          ],
          history: createMemoryHistory({
            initialEntries: ["/foo/bar?a=1#hash"],
          }),
        }).initialize();

      // Null should preserve the search/hash
      let router = getRouter();
      router.navigate(null, { fromRouteId: "activeRoute" });
      expect(createPath(router.state.location)).toBe(
        expectedPath + (expectIndex ? "?index&a=1#hash" : "?a=1#hash")
      );
      router.dispose();

      // "." and "" should not preserve the search and hash
      router = getRouter();
      router.navigate(".", { fromRouteId: "activeRoute" });
      expect(createPath(router.state.location)).toBe(
        expectedPath + (expectIndex ? "?index" : "")
      );
      router.dispose();

      router = getRouter();
      router.navigate("", { fromRouteId: "activeRoute" });
      expect(createPath(router.state.location)).toBe(
        expectedPath + (expectIndex ? "?index" : "")
      );
      router.dispose();
    }

    /* eslint-disable jest/expect-expect */
    it("from a static route", () => {
      assertRoutingToSelf(
        [
          {
            id: "activeRoute",
            path: "bar",
          },
        ],
        "/foo/bar",
        false
      );
    });

    it("from a layout route", () => {
      assertRoutingToSelf(
        [
          {
            id: "activeRoute",
            path: "bar",
            children: [
              {
                index: true,
              },
            ],
          },
        ],
        "/foo/bar",
        false
      );
    });

    it("from an index route", () => {
      assertRoutingToSelf(
        [
          {
            path: "bar",
            children: [
              {
                id: "activeRoute",
                index: true,
              },
            ],
          },
        ],
        "/foo/bar",
        true
      );
    });

    it("from an index route with a path", () => {
      assertRoutingToSelf(
        [
          {
            id: "activeRoute",
            path: "bar",
            index: true,
          },
        ],
        "/foo/bar",
        true
      );
    });

    it("from a dynamic param route", () => {
      assertRoutingToSelf(
        [
          {
            id: "activeRoute",
            path: ":param",
          },
        ],
        "/foo/bar",
        false
      );
    });

    it("from a splat route", () => {
      assertRoutingToSelf(
        [
          {
            id: "activeRoute",
            path: "*",
          },
        ],
        "/foo",
        false
      );
    });
    /* eslint-enable jest/expect-expect */
  });

  describe("routing to parent", () => {
    function assertRoutingToParent(fooChildren) {
      let router = createRouter({
        routes: [
          {
            path: "/",
            children: [
              {
                path: "foo",
                children: fooChildren,
              },
            ],
          },
        ],
        history: createMemoryHistory({
          initialEntries: ["/foo/bar?a=1#hash"],
        }),
      }).initialize();

      // Null should preserve the search/hash
      router.navigate("..", { fromRouteId: "activeRoute" });
      expect(createPath(router.state.location)).toBe("/foo");
    }

    /* eslint-disable jest/expect-expect */
    it("from a static route", () => {
      assertRoutingToParent([
        {
          id: "activeRoute",
          path: "bar",
        },
      ]);
    });

    it("from a layout route", () => {
      assertRoutingToParent([
        {
          id: "activeRoute",
          path: "bar",
          children: [
            {
              index: true,
            },
          ],
        },
      ]);
    });

    it("from an index route", () => {
      assertRoutingToParent([
        {
          path: "bar",
          children: [
            {
              id: "activeRoute",
              index: true,
            },
          ],
        },
      ]);
    });

    it("from an index route with a path", () => {
      assertRoutingToParent([
        {
          id: "activeRoute",
          path: "bar",
          index: true,
        },
      ]);
    });

    it("from a dynamic param route", () => {
      assertRoutingToParent([
        {
          id: "activeRoute",
          path: ":param",
        },
      ]);
    });

    it("from a splat route", () => {
      assertRoutingToParent([
        {
          id: "activeRoute",
          path: "*",
        },
      ]);
    });
    /* eslint-enable jest/expect-expect */
  });

  describe("routing to sibling", () => {
    function assertRoutingToSibling(fooChildren) {
      let router = createRouter({
        routes: [
          {
            path: "/",
            children: [
              {
                path: "foo",
                children: [
                  ...fooChildren,
                  {
                    path: "bar-sibling",
                  },
                ],
              },
            ],
          },
        ],
        history: createMemoryHistory({
          initialEntries: ["/foo/bar?a=1#hash"],
        }),
      }).initialize();

      // Null should preserve the search/hash
      router.navigate("../bar-sibling", { fromRouteId: "activeRoute" });
      expect(createPath(router.state.location)).toBe("/foo/bar-sibling");
    }

    /* eslint-disable jest/expect-expect */
    it("from a static route", () => {
      assertRoutingToSibling([
        {
          id: "activeRoute",
          path: "bar",
        },
      ]);
    });

    it("from a layout route", () => {
      assertRoutingToSibling([
        {
          id: "activeRoute",
          path: "bar",
          children: [
            {
              index: true,
            },
          ],
        },
      ]);
    });

    it("from an index route", () => {
      assertRoutingToSibling([
        {
          path: "bar",
          children: [
            {
              id: "activeRoute",
              index: true,
            },
          ],
        },
      ]);
    });

    it("from an index route with a path", () => {
      assertRoutingToSibling([
        {
          id: "activeRoute",
          path: "bar",
          index: true,
        },
      ]);
    });

    it("from a dynamic param route", () => {
      assertRoutingToSibling([
        {
          id: "activeRoute",
          path: ":param",
        },
      ]);
    });

    it("from a splat route", () => {
      assertRoutingToSibling([
        {
          id: "activeRoute",
          path: "*",
        },
      ]);
    });
    /* eslint-enable jest/expect-expect */
  });

  describe("routing to child", () => {
    function assertRoutingToChild(fooChildren) {
      const getRouter = () =>
        createRouter({
          routes: [
            {
              path: "/",
              children: [
                {
                  path: "foo",
                  children: [...fooChildren],
                },
              ],
            },
          ],
          history: createMemoryHistory({
            initialEntries: ["/foo/bar?a=1#hash"],
          }),
        }).initialize();

      let router = getRouter();
      router.navigate("baz", { fromRouteId: "activeRoute" });
      expect(createPath(router.state.location)).toBe("/foo/bar/baz");
      router.dispose();

      router = getRouter();
      router.navigate("./baz", { fromRouteId: "activeRoute" });
      expect(createPath(router.state.location)).toBe("/foo/bar/baz");
      router.dispose();
    }

    /* eslint-disable jest/expect-expect */
    it("from a static route", () => {
      assertRoutingToChild([
        {
          id: "activeRoute",
          path: "bar",
          children: [{ path: "baz" }],
        },
      ]);
    });

    it("from a layout route", () => {
      assertRoutingToChild([
        {
          id: "activeRoute",
          path: "bar",
          children: [
            {
              index: true,
            },
            { path: "baz" },
          ],
        },
      ]);
    });

    it("from a dynamic param route", () => {
      assertRoutingToChild([
        {
          id: "activeRoute",
          path: ":param",
          children: [{ path: "baz" }],
        },
      ]);
    });
    /* eslint-enable jest/expect-expect */
  });

  it("resolves relative routes when using relative:path", () => {
    let history = createMemoryHistory({
      initialEntries: ["/a/b/c/d/e/f"],
    });
    let routes = [
      {
        id: "a",
        path: "/a",
        children: [
          {
            id: "bc",
            path: "b/c",
            children: [
              {
                id: "de",
                path: "d/e",
                children: [
                  {
                    id: "f",
                    path: "f",
                  },
                ],
              },
            ],
          },
        ],
      },
    ];

    // Navigating without relative:path
    let router = createRouter({ routes, history }).initialize();
    router.navigate("..");
    expect(router.state.location.pathname).toBe("/a/b/c/d/e");
    router.navigate("/a/b/c/d/e/f");

    router.navigate("../..");
    expect(router.state.location.pathname).toBe("/a/b/c");
    router.navigate("/a/b/c/d/e/f");

    // Navigating with relative:path
    router.navigate("..", { relative: "path" });
    expect(router.state.location.pathname).toBe("/a/b/c/d/e");
    router.navigate("/a/b/c/d/e/f");

    router.navigate("../..", { relative: "path" });
    expect(router.state.location.pathname).toBe("/a/b/c/d");
    router.navigate("/a/b/c/d/e/f");

    // Navigating with relative:path from mid-route-hierarchy
    router.navigate("..", { relative: "path", fromRouteId: "f" });
    expect(router.state.location.pathname).toBe("/a/b/c/d/e");
    router.navigate("/a/b/c/d/e/f");

    router.navigate("../..", { relative: "path", fromRouteId: "de" });
    expect(router.state.location.pathname).toBe("/a/b/c");
    router.navigate("/a/b/c/d/e/f");

    router.navigate("../..", { relative: "path", fromRouteId: "bc" });
    expect(router.state.location.pathname).toBe("/a");
    router.navigate("/a/b/c/d/e/f");

    // Go up farther than # of URL segments
    router.navigate("../../../../../../../../..", {
      relative: "path",
      fromRouteId: "f",
    });
    expect(router.state.location.pathname).toBe("/");
    router.navigate("/a/b/c/d/e/f");

    router.dispose();
  });

  it("should not append ?index to get submission navigations to self from index route", () => {
    let router = createRouter({
      routes: [
        {
          path: "/",
          children: [
            {
              path: "path",
              children: [
                {
                  id: "activeRouteId",
                  index: true,
                },
              ],
            },
          ],
        },
      ],
      history: createMemoryHistory({ initialEntries: ["/path"] }),
    }).initialize();

    router.navigate(null, {
      fromRouteId: "activeRouteId",
      formData: createFormData({}),
    });
    expect(createPath(router.state.location)).toBe("/path");
    expect(router.state.matches[2].route.index).toBe(true);

    router.navigate(".", {
      fromRouteId: "activeRouteId",
      formData: createFormData({}),
    });
    expect(createPath(router.state.location)).toBe("/path");
    expect(router.state.matches[2].route.index).toBe(true);

    router.navigate("", {
      fromRouteId: "activeRouteId",
      formData: createFormData({}),
    });
    expect(createPath(router.state.location)).toBe("/path");
    expect(router.state.matches[2].route.index).toBe(true);
  });

  it("handles pathless relative routing when a basename is present", () => {
    let router = createRouter({
      routes: [{ path: "/path" }],
      future: { v7_prependBasename: true },
      history: createMemoryHistory({ initialEntries: ["/base/path"] }),
      basename: "/base",
    }).initialize();

    expect(createPath(router.state.location)).toBe("/base/path");
    expect(router.state.matches[0].route.path).toBe("/path");

    router.navigate(".?a=1");
    expect(createPath(router.state.location)).toBe("/base/path?a=1");
    expect(router.state.matches[0].route.path).toBe("/path");

    router.navigate("?b=2");
    expect(createPath(router.state.location)).toBe("/base/path?b=2");
    expect(router.state.matches[0].route.path).toBe("/path");

    router.navigate("/path?c=3");
    expect(createPath(router.state.location)).toBe("/base/path?c=3");
    expect(router.state.matches[0].route.path).toBe("/path");
  });
});
