import type { AgnosticDataRouteObject, Router } from "../index";
import { createMemoryHistory, createRouter } from "../index";
import { ErrorResponseImpl } from "../utils";
import { createDeferred, createFormData, tick } from "./utils/utils";

let router: Router;

function last(array: any[]) {
  return array[array.length - 1];
}

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
        },
      ],
      unstable_patchRoutesOnMiss: () => childrenDfd.promise,
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
        },
      ],
      async unstable_patchRoutesOnMiss(pathname, matches) {
        await tick();
        if (last(matches).route.id === "a") {
          return [
            {
              id: "b",
              path: "b",
            },
          ];
        }

        if (last(matches).route.id === "b") {
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
        }

        return null;
      },
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
        },
      ],
      unstable_patchRoutesOnMiss: () => childrenDfd.promise,
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
        },
      ],
      async unstable_patchRoutesOnMiss(pathname, matches) {
        await tick();
        if (last(matches).route.id === "a") {
          return [
            {
              id: "b",
              path: "b",
            },
          ];
        }

        if (last(matches).route.id === "b") {
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
        }

        return null;
      },
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

  it("reuses promises", async () => {
    let aDfd = createDeferred<AgnosticDataRouteObject[]>();
    let bDfd = createDeferred<AgnosticDataRouteObject[]>();
    let calls: string[][] = [];
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "a",
          path: "a",
        },
      ],
      unstable_patchRoutesOnMiss(pathname, matches) {
        let routeId = last(matches).route.id;
        calls.push([pathname, routeId]);
        return aDfd.promise;
      },
    });

    router.navigate("/a/b");
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "loading", location: { pathname: "/a/b" } },
    });
    expect(calls).toEqual([["/a/b", "a"]]);

    router.navigate("/a/b", {
      formMethod: "POST",
      formData: createFormData({}),
    });
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "submitting", location: { pathname: "/a/b" } },
    });
    // Didn't call again for the same path
    expect(calls).toEqual([["/a/b", "a"]]);

    aDfd.resolve([
      {
        id: "b",
        path: "b",
        action: () => "A ACTION",
        loader: () => "A",
      },
    ]);
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "idle" },
      location: { pathname: "/a/b" },
    });
    expect(calls).toEqual([["/a/b", "a"]]);
  });

  it("handles interruptions", async () => {
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
        },
      ],
      unstable_patchRoutesOnMiss(pathname, matches) {
        let routeId = last(matches).route.id;
        if (routeId === "a") {
          return aDfd.promise;
        }
        if (routeId === "b" && pathname) {
          return bDfd.promise;
        }
        return null;
      },
    });

    router.navigate("/a/b/c");
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "loading", location: { pathname: "/a/b/c" } },
    });

    aDfd.resolve([
      {
        id: "b",
        path: "b",
      },
    ]);
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "loading", location: { pathname: "/a/b/c" } },
    });

    router.navigate("/a/b/d");
    await tick();
    expect(router.state).toMatchObject({
      navigation: { state: "loading", location: { pathname: "/a/b/d" } },
    });

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
  });

  it("allows folks to implement at the route level via handle.children()", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "a",
          path: "a",
          handle: {
            async loadChildren() {
              await tick();
              return [
                {
                  id: "b",
                  path: "b",
                  handle: {
                    async loadChildren() {
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
                },
              ];
            },
          },
        },
      ],
      unstable_patchRoutesOnMiss(path, matches) {
        if (last(matches).route.handle?.loadChildren) {
          return last(matches).route.handle.loadChildren?.();
        }
        return null;
      },
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

  it("discovers child routes through pathless routes", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "a",
          path: "a",
        },
      ],
      async unstable_patchRoutesOnMiss(pathname, matches) {
        await tick();
        if (last(matches).route.id === "a") {
          return [
            {
              id: "pathless",
              path: "",
            },
          ];
        } else if (last(matches).route.id === "pathless") {
          return [
            {
              id: "b",
              path: "b",
              async loader() {
                await tick();
                return "B";
              },
            },
          ];
        }
        return null;
      },
    });

    debugger;
    await router.navigate("/a/b");
    expect(router.state.location.pathname).toBe("/a/b");
    expect(router.state.loaderData).toEqual({
      b: "B",
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "a",
      "pathless",
      "b",
    ]);
  });

  it("de-prioritizes splat routes in favor of looking for better async matches", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "splat",
          path: "*",
        },
        {
          id: "a",
          path: "a",
        },
      ],
      async unstable_patchRoutesOnMiss(path, matches) {
        await tick();
        if (last(matches).route.id === "a") {
          return [
            {
              id: "b",
              path: "b",
            },
          ];
        }
        return null;
      },
    });

    await router.navigate("/a/b");
    expect(router.state.location.pathname).toBe("/a/b");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["a", "b"]);
  });

  it("matches splats when other paths don't pan out", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "splat",
          path: "*",
        },
        {
          id: "a",
          path: "a",
        },
      ],
      async unstable_patchRoutesOnMiss(path, matches) {
        await tick();
        if (last(matches).route.id === "a") {
          return [
            {
              id: "b",
              path: "b",
            },
          ];
        }
        return null;
      },
    });

    await router.navigate("/a/nope");
    expect(router.state.location.pathname).toBe("/a/nope");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["splat"]);
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
          },
        ],
        unstable_patchRoutesOnMiss: () => childrenDfd.promise,
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
          },
        ],
        unstable_patchRoutesOnMiss: () => childrenDfd.promise,
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
          },
        ],
        async unstable_patchRoutesOnMiss(path, matches) {
          await tick();
          if (last(matches).route.id === "a") {
            return [
              {
                id: "b",
                path: "b",
              },
            ];
          } else if (last(matches).route.id === "b") {
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
          }
          return null;
        },
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
          },
        ],
        async unstable_patchRoutesOnMiss(path, matches) {
          await tick();
          if (last(matches).route.id === "a") {
            return [
              {
                id: "b",
                path: "b",
                hasErrorBoundary: true,
              },
            ];
          } else if (last(matches).route.id === "b") {
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
          }
          return null;
        },
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
          },
        ],
        async unstable_patchRoutesOnMiss(path, matches) {
          await tick();
          if (last(matches).route.id === "a") {
            return [
              {
                id: "b",
                path: "b",
              },
            ];
          } else if (last(matches).route.id === "b") {
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
          }
          return null;
        },
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
          },
        ],
        async unstable_patchRoutesOnMiss(path, matches) {
          await tick();
          if (last(matches).route.id === "a") {
            return [
              {
                id: "b",
                path: "b",
              },
            ];
          } else if (last(matches).route.id === "b") {
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
          }
          return null;
        },
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
          },
        ],
        async unstable_patchRoutesOnMiss(path, matches) {
          await tick();
          if (last(matches).route.id === "a") {
            return [
              {
                id: "b",
                path: "b",
                hasErrorBoundary: true,
              },
            ];
          } else if (last(matches).route.id === "b") {
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
          }
          return null;
        },
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
          },
        ],
        async unstable_patchRoutesOnMiss(path, matches) {
          await tick();
          if (last(matches).route.id === "a") {
            return [
              {
                id: "b",
                path: "b",
              },
            ];
          } else if (last(matches).route.id === "b") {
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
          }
          return null;
        },
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
          },
        ],
        async unstable_patchRoutesOnMiss() {
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
      });

      await router.navigate("/a/b");
      expect(router.state).toMatchObject({
        location: { pathname: "/a/b" },
        actionData: null,
        loaderData: {},
        errors: {
          a: new ErrorResponseImpl(
            400,
            "Bad Request",
            new Error(
              'Unable to match URL "/a/b" - the `children()` function for route `a` threw the following error:\nError: broke!'
            ),
            true
          ),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual(["a"]);

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
          },
        ],
        async unstable_patchRoutesOnMiss() {
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
          a: new ErrorResponseImpl(
            400,
            "Bad Request",
            new Error(
              'Unable to match URL "/a/b" - the `children()` function for route `a` threw the following error:\nError: broke!'
            ),
            true
          ),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual(["a"]);

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

  describe("fetchers", () => {
    it("discovers child route at a depth of 1 (fetcher.load)", async () => {
      let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
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
          },
        ],
        unstable_patchRoutesOnMiss: () => childrenDfd.promise,
      });

      let key = "key";
      router.fetch(key, "0", "/parent/child");
      expect(router.getFetcher(key).state).toBe("loading");

      childrenDfd.resolve([
        {
          id: "child",
          path: "child",
          loader: () => childLoaderDfd.promise,
        },
      ]);
      expect(router.getFetcher(key).state).toBe("loading");

      childLoaderDfd.resolve("CHILD");
      await tick();

      expect(router.getFetcher(key).state).toBe("idle");
      expect(router.getFetcher(key).data).toBe("CHILD");
    });

    it("discovers child routes at a depth >1 (fetcher.load)", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "a",
          },
        ],
        async unstable_patchRoutesOnMiss(pathname, matches) {
          await tick();
          if (last(matches).route.id === "a") {
            return [
              {
                id: "b",
                path: "b",
              },
            ];
          } else if (last(matches).route.id === "b") {
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
          }
          return null;
        },
      });

      let key = "key";
      await router.fetch(key, "0", "/a/b/c");
      // Needed for now since router.fetch is not async until v7
      await new Promise((r) => setTimeout(r, 10));
      expect(router.getFetcher(key).state).toBe("idle");
      expect(router.getFetcher(key).data).toBe("C");
    });

    it("discovers child route at a depth of 1 (fetcher.submit)", async () => {
      let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
      let childActionDfd = createDeferred();

      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "parent",
          },
        ],
        unstable_patchRoutesOnMiss: () => childrenDfd.promise,
      });

      let key = "key";
      router.fetch(key, "0", "/parent/child", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(router.getFetcher(key).state).toBe("submitting");

      childrenDfd.resolve([
        {
          id: "child",
          path: "child",
          action: () => childActionDfd.promise,
        },
      ]);
      expect(router.getFetcher(key).state).toBe("submitting");

      childActionDfd.resolve("CHILD");
      await tick();

      expect(router.getFetcher(key).state).toBe("idle");
      expect(router.getFetcher(key).data).toBe("CHILD");
    });

    it("discovers child routes at a depth >1 (fetcher.submit)", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "a",
          },
        ],
        async unstable_patchRoutesOnMiss(pathname, matches) {
          await tick();
          if (last(matches).route.id === "a") {
            return [
              {
                id: "b",
                path: "b",
              },
            ];
          } else if (last(matches).route.id === "b") {
            return [
              {
                id: "c",
                path: "c",
                async action() {
                  await tick();
                  return "C ACTION";
                },
              },
            ];
          }
          return null;
        },
      });

      let key = "key";
      await router.fetch(key, "0", "/a/b/c", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      // Needed for now since router.fetch is not async until v7
      await new Promise((r) => setTimeout(r, 10));
      expect(router.getFetcher(key).state).toBe("idle");
      expect(router.getFetcher(key).data).toBe("C ACTION");
    });
  });
});
