import type { AgnosticDataRouteObject, Router } from "../index";
import { createMemoryHistory, createRouter } from "../index";
import { ErrorResponseImpl } from "../utils";
import { createDeferred, createFormData, tick } from "./utils/utils";

let router: Router;

describe("Lazy Route Discovery (Fog of War)", () => {
  afterEach(() => {
    router.dispose();
    // @ts-expect-error
    router = null;
  });

  it("discovers child route at a depth of 1 (GET navigation)", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
    let loaderDfd = createDeferred();
    let childLoaderDfd = createDeferred();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "parent",
          path: "parent",
          loader: () => loaderDfd.promise,
          children: () => childrenDfd.promise,
        },
      ],
    });

    router.navigate("/parent/child");
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });

    loaderDfd.resolve("PARENT");
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });

    childrenDfd.resolve([
      {
        id: "child",
        path: "child",
        loader: () => childLoaderDfd.promise,
      },
    ]);
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });

    childLoaderDfd.resolve("CHILD");
    await tick();

    expect(router.state.location.pathname).toBe("/parent/child");
    expect(router.state.loaderData).toEqual({
      parent: "PARENT",
      child: "CHILD",
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "parent",
      "child",
    ]);
  });

  it("discovers child routes at a depth >1 (GET navigation)", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "a",
          path: "a",
          async children() {
            await tick();
            return [
              {
                id: "b",
                path: "b",
                async children() {
                  await tick();
                  return [
                    {
                      id: "c",
                      path: "c",
                      async loader() {
                        await tick();
                        return "C";
                      },
                    },
                  ];
                },
              },
            ];
          },
        },
      ],
    });

    await router.navigate("/a/b/c");
    expect(router.state.location.pathname).toBe("/a/b/c");
    expect(router.state.loaderData).toEqual({
      c: "C",
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("discovers child route at a depth of 1 (POST navigation)", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
    let loaderDfd = createDeferred();
    let childActionDfd = createDeferred();
    let childLoaderDfd = createDeferred();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "parent",
          path: "parent",
          loader: () => loaderDfd.promise,
          children: () => childrenDfd.promise,
        },
      ],
    });

    router.navigate("/parent/child", {
      formMethod: "POST",
      formData: createFormData({}),
    });
    expect(router.state.navigation).toMatchObject({
      state: "submitting",
      location: { pathname: "/parent/child" },
    });

    childrenDfd.resolve([
      {
        id: "child",
        path: "child",
        action: () => childActionDfd.promise,
        loader: () => childLoaderDfd.promise,
      },
    ]);
    expect(router.state.navigation).toMatchObject({
      state: "submitting",
      location: { pathname: "/parent/child" },
    });

    childActionDfd.resolve("CHILD ACTION");
    await tick();
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });
    expect(router.state.actionData?.child).toBe("CHILD ACTION");

    loaderDfd.resolve("PARENT");
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });

    childLoaderDfd.resolve("CHILD");
    await tick();

    expect(router.state).toMatchObject({
      location: { pathname: "/parent/child" },
      actionData: {
        child: "CHILD ACTION",
      },
      loaderData: {
        parent: "PARENT",
        child: "CHILD",
      },
      navigation: { state: "idle" },
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "parent",
      "child",
    ]);
  });

  it("discovers child routes at a depth >1 (POST navigation)", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "a",
          path: "a",
          async children() {
            await tick();
            return [
              {
                id: "b",
                path: "b",
                async children() {
                  await tick();
                  return [
                    {
                      id: "c",
                      path: "c",
                      async action() {
                        await tick();
                        return "C ACTION";
                      },
                      async loader() {
                        await tick();
                        return "C";
                      },
                    },
                  ];
                },
              },
            ];
          },
        },
      ],
    });

    await router.navigate("/a/b/c", {
      formMethod: "POST",
      formData: createFormData({}),
    });
    expect(router.state).toMatchObject({
      location: { pathname: "/a/b/c" },
      actionData: {
        c: "C ACTION",
      },
      loaderData: {
        c: "C",
      },
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("handles interruptions and reuses promises", async () => {
    let aDfd = createDeferred<AgnosticDataRouteObject[]>();
    let bDfd = createDeferred<AgnosticDataRouteObject[]>();
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "a",
          path: "a",
          children: () => aDfd.promise,
        },
      ],
    });

    router.navigate("/a/b/c");
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "loading", location: { pathname: "/a/b/c" } },
    });

    let count = 0;
    aDfd.resolve([
      {
        id: "b",
        path: "b",
        children: () => {
          count++;
          return bDfd.promise;
        },
      },
    ]);
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "loading", location: { pathname: "/a/b/c" } },
    });
    expect(count).toBe(1);

    router.navigate("/a/b/d");
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "loading", location: { pathname: "/a/b/d" } },
    });
    expect(count).toBe(1);

    bDfd.resolve([
      {
        id: "c",
        path: "c",
        loader() {
          return "C";
        },
      },
      {
        id: "d",
        path: "d",
        loader() {
          return "D";
        },
      },
    ]);
    await tick();

    expect(router.state.location.pathname).toBe("/a/b/d");
    expect(router.state.loaderData).toEqual({
      d: "D",
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "a",
      "b",
      "d",
    ]);

    // Reuses the same children() promise
    expect(count).toBe(1);
  });

  describe("errors", () => {
    it("lazy 404s (GET navigation)", async () => {
      let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "parent",
            children: () => childrenDfd.promise,
          },
        ],
      });

      router.navigate("/parent/junk");
      expect(router.state.navigation).toMatchObject({
        state: "loading",
      });

      childrenDfd.resolve([{ id: "child", path: "child" }]);
      await tick();

      expect(router.state).toMatchObject({
        location: { pathname: "/parent/junk" },
        loaderData: {},
        errors: {
          "0": new ErrorResponseImpl(
            404,
            "Not Found",
            new Error('No route matches URL "/parent/junk"'),
            true
          ),
        },
      });
      expect(router.state.matches).toEqual([
        {
          params: {},
          pathname: "",
          pathnameBase: "",
          route: {
            children: undefined,
            hasErrorBoundary: false,
            id: "0",
            path: "/",
          },
        },
      ]);
    });

    it("lazy 404s (POST navigation)", async () => {
      let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "parent",
            children: () => childrenDfd.promise,
          },
        ],
      });

      router.navigate("/parent/junk", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(router.state.navigation).toMatchObject({
        state: "submitting",
      });

      childrenDfd.resolve([{ id: "child", path: "child" }]);
      await tick();

      expect(router.state).toMatchObject({
        location: { pathname: "/parent/junk" },
        actionData: null,
        loaderData: {},
        errors: {
          "0": new ErrorResponseImpl(
            404,
            "Not Found",
            new Error('No route matches URL "/parent/junk"'),
            true
          ),
        },
      });
      expect(router.state.matches).toEqual([
        {
          params: {},
          pathname: "",
          pathnameBase: "",
          route: {
            children: undefined,
            hasErrorBoundary: false,
            id: "0",
            path: "/",
          },
        },
      ]);
    });

    it("errors thrown at lazy boundary route (GET navigation)", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "a",
            async children() {
              await tick();
              return [
                {
                  id: "b",
                  path: "b",
                  async children() {
                    await tick();
                    return [
                      {
                        id: "c",
                        path: "c",
                        hasErrorBoundary: true,
                        async loader() {
                          await tick();
                          throw new Error("C ERROR");
                        },
                      },
                    ];
                  },
                },
              ];
            },
          },
        ],
      });

      await router.navigate("/a/b/c");
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b/c" },
        loaderData: {},
        errors: {
          c: new Error("C ERROR"),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("errors bubbled to lazy parent route (GET navigation)", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "a",
            async children() {
              await tick();
              return [
                {
                  id: "b",
                  path: "b",
                  hasErrorBoundary: true,
                  async children() {
                    await tick();
                    return [
                      {
                        id: "c",
                        path: "c",
                        async loader() {
                          await tick();
                          throw new Error("C ERROR");
                        },
                      },
                    ];
                  },
                },
              ];
            },
          },
        ],
      });

      await router.navigate("/a/b/c");
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b/c" },
        loaderData: {},
        errors: {
          b: new Error("C ERROR"),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("errors bubbled when no boundary exists (GET navigation)", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "a",
            async children() {
              await tick();
              return [
                {
                  id: "b",
                  path: "b",
                  async children() {
                    await tick();
                    return [
                      {
                        id: "c",
                        path: "c",
                        async loader() {
                          await tick();
                          throw new Error("C ERROR");
                        },
                      },
                    ];
                  },
                },
              ];
            },
          },
        ],
      });

      await router.navigate("/a/b/c");
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b/c" },
        loaderData: {},
        errors: {
          a: new Error("C ERROR"),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("errors thrown at lazy boundary route (POST navigation)", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "a",
            async children() {
              await tick();
              return [
                {
                  id: "b",
                  path: "b",
                  async children() {
                    await tick();
                    return [
                      {
                        id: "c",
                        path: "c",
                        hasErrorBoundary: true,
                        async action() {
                          await tick();
                          throw new Error("C ERROR");
                        },
                      },
                    ];
                  },
                },
              ];
            },
          },
        ],
      });

      await router.navigate("/a/b/c", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b/c" },
        actionData: null,
        loaderData: {},
        errors: {
          c: new Error("C ERROR"),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("errors bubbled to lazy parent route (POST navigation)", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "a",
            async children() {
              await tick();
              return [
                {
                  id: "b",
                  path: "b",
                  hasErrorBoundary: true,
                  async children() {
                    await tick();
                    return [
                      {
                        id: "c",
                        path: "c",
                        async action() {
                          await tick();
                          throw new Error("C ERROR");
                        },
                      },
                    ];
                  },
                },
              ];
            },
          },
        ],
      });

      await router.navigate("/a/b/c", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b/c" },
        actionData: null,
        loaderData: {},
        errors: {
          b: new Error("C ERROR"),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("errors bubbled when no boundary exists (POST navigation)", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "a",
            async children() {
              await tick();
              return [
                {
                  id: "b",
                  path: "b",
                  async children() {
                    await tick();
                    return [
                      {
                        id: "c",
                        path: "c",
                        async action() {
                          await tick();
                          throw new Error("C ERROR");
                        },
                      },
                    ];
                  },
                },
              ];
            },
          },
        ],
      });

      await router.navigate("/a/b/c", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b/c" },
        actionData: null,
        loaderData: {},
        errors: {
          a: new Error("C ERROR"),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "a",
        "b",
        "c",
      ]);
    });

    it("handles errors thrown from children() (GET navigation)", async () => {
      let shouldThrow = true;
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            id: "index",
            path: "/",
          },
          {
            id: "a",
            path: "a",
            async children() {
              await tick();
              if (shouldThrow) {
                shouldThrow = false;
                throw new Error("broke!");
              }
              return [
                {
                  id: "b",
                  path: "b",
                  loader() {
                    return "B";
                  },
                },
              ];
            },
          },
        ],
      });

      await router.navigate("/a/b");
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b" },
        actionData: null,
        loaderData: {},
        errors: {
          index: new ErrorResponseImpl(
            404,
            "Not Found",
            new Error(
              'Unable to match URL "/a/b" - the `children()` function for route `a` threw the following error:\nError: broke!'
            ),
            true
          ),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual(["index"]);

      await router.navigate("/");
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        actionData: null,
        loaderData: {},
        errors: null,
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual(["index"]);

      await router.navigate("/a/b");
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b" },
        actionData: null,
        loaderData: {
          b: "B",
        },
        errors: null,
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual(["a", "b"]);
    });

    jest.setTimeout(120000);

    it("handles errors thrown from children() (POST navigation)", async () => {
      let shouldThrow = true;
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            id: "index",
            path: "/",
          },
          {
            id: "a",
            path: "a",
            async children() {
              await tick();
              if (shouldThrow) {
                shouldThrow = false;
                throw new Error("broke!");
              }
              return [
                {
                  id: "b",
                  path: "b",
                  action() {
                    return "B";
                  },
                },
              ];
            },
          },
        ],
      });

      await router.navigate("/a/b", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b" },
        actionData: null,
        loaderData: {},
        errors: {
          index: new ErrorResponseImpl(
            404,
            "Not Found",
            new Error(
              'Unable to match URL "/a/b" - the `children()` function for route `a` threw the following error:\nError: broke!'
            ),
            true
          ),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual(["index"]);

      await router.navigate("/");
      expect(router.state).toMatchObject({
        location: { pathname: "/" },
        actionData: null,
        loaderData: {},
        errors: null,
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual(["index"]);

      await router.navigate("/a/b", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b" },
        actionData: {
          b: "B",
        },
        loaderData: {},
        errors: null,
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual(["a", "b"]);
    });
  });
});
