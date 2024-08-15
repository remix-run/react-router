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
      async unstable_patchRoutesOnNavigation({ patch }) {
        let children = await childrenDfd.promise;
        patch("parent", children);
      },
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
      async unstable_patchRoutesOnNavigation({ patch, matches }) {
        await tick();
        if (last(matches).route.id === "a") {
          patch("a", [
            {
              id: "b",
              path: "b",
            },
          ]);
        }

        if (last(matches).route.id === "b") {
          patch("b", [
            {
              id: "c",
              path: "c",
              async loader() {
                await tick();
                return "C";
              },
            },
          ]);
        }
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
      async unstable_patchRoutesOnNavigation({ patch }) {
        let children = await childrenDfd.promise;
        patch("parent", children);
      },
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
      async unstable_patchRoutesOnNavigation({ patch, matches }) {
        await tick();
        if (last(matches).route.id === "a") {
          patch("a", [
            {
              id: "b",
              path: "b",
            },
          ]);
        }

        if (last(matches).route.id === "b") {
          patch("b", [
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
          ]);
        }
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
      async unstable_patchRoutesOnNavigation({ path, matches, patch }) {
        let routeId = last(matches).route.id;
        calls.push([path, routeId]);
        patch("a", await aDfd.promise);
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
      async unstable_patchRoutesOnNavigation({ path, matches, patch }) {
        let routeId = last(matches).route.id;
        if (!path) {
          return;
        }
        if (routeId === "a") {
          patch("a", await aDfd.promise);
        } else if (routeId === "b") {
          patch("b", await bDfd.promise);
        }
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
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        let leafRoute = last(matches).route;
        patch(leafRoute.id, await leafRoute.handle.loadChildren?.());
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
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        await tick();
        if (last(matches).route.id === "a") {
          patch("a", [
            {
              id: "pathless",
              path: "",
            },
          ]);
        } else if (last(matches).route.id === "pathless") {
          patch("pathless", [
            {
              id: "b",
              path: "b",
              async loader() {
                await tick();
                return "B";
              },
            },
          ]);
        }
      },
    });

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

  it("de-prioritizes dynamic param routes in favor of looking for better async matches", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "slug",
          path: "/:slug",
        },
      ],
      async unstable_patchRoutesOnNavigation({ patch }) {
        await tick();
        patch(null, [
          {
            id: "static",
            path: "/static",
          },
        ]);
      },
    });

    await router.navigate("/static");
    expect(router.state.location.pathname).toBe("/static");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["static"]);
  });

  it("de-prioritizes dynamic param routes in favor of looking for better async matches (product/:slug)", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "slug",
          path: "/product/:slug",
        },
      ],
      async unstable_patchRoutesOnNavigation({ patch }) {
        await tick();
        patch(null, [
          {
            id: "static",
            path: "/product/static",
          },
        ]);
      },
    });

    await router.navigate("/product/static");
    expect(router.state.location.pathname).toBe("/product/static");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["static"]);
  });

  it("de-prioritizes dynamic param routes in favor of looking for better async matches (child route)", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "product",
          path: "/product",
          children: [
            {
              id: "slug",
              path: ":slug",
            },
          ],
        },
      ],
      async unstable_patchRoutesOnNavigation({ patch }) {
        await tick();
        patch("product", [
          {
            id: "static",
            path: "static",
          },
        ]);
      },
    });

    await router.navigate("/product/static");
    expect(router.state.location.pathname).toBe("/product/static");
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "product",
      "static",
    ]);
  });

  it("matches dynamic params when other paths don't pan out", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "slug",
          path: "/:slug",
        },
      ],
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        await tick();
      },
    });

    await router.navigate("/a");
    expect(router.state.location.pathname).toBe("/a");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["slug"]);
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
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        await tick();
        if (last(matches).route.id === "a") {
          patch("a", [
            {
              id: "b",
              path: "b",
            },
          ]);
        }
      },
    });

    await router.navigate("/a/b");
    expect(router.state.location.pathname).toBe("/a/b");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["a", "b"]);
  });

  it("de-prioritizes splat routes in favor of looking for better async matches (splat/*)", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "splat",
          path: "/splat/*",
        },
      ],
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        await tick();
        patch(null, [
          {
            id: "static",
            path: "/splat/static",
          },
        ]);
      },
    });

    await router.navigate("/splat/static");
    expect(router.state.location.pathname).toBe("/splat/static");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["static"]);
  });

  it("de-prioritizes splat routes in favor of looking for better async matches (child route)", async () => {
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "product",
          path: "/product",
          children: [
            {
              id: "splat",
              path: "*",
            },
          ],
        },
      ],
      async unstable_patchRoutesOnNavigation({ patch }) {
        await tick();
        patch("product", [
          {
            id: "static",
            path: "static",
          },
        ]);
      },
    });

    await router.navigate("/product/static");
    expect(router.state.location.pathname).toBe("/product/static");
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "product",
      "static",
    ]);
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
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        await tick();
        if (last(matches).route.id === "a") {
          patch("a", [
            {
              id: "b",
              path: "b",
            },
          ]);
        }
      },
    });

    await router.navigate("/a/nope");
    expect(router.state.location.pathname).toBe("/a/nope");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["splat"]);
  });

  it("recurses unstable_patchRoutesOnNavigation until a match is found", async () => {
    let count = 0;
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
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        await tick();
        count++;
        if (last(matches).route.id === "a") {
          patch("a", [
            {
              id: "b",
              path: "b",
            },
          ]);
        } else if (last(matches).route.id === "b") {
          patch("b", [
            {
              id: "c",
              path: "c",
            },
          ]);
        }
      },
    });

    await router.navigate("/a/b/c");
    expect(router.state.location.pathname).toBe("/a/b/c");
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(count).toBe(2);
  });

  it("discovers routes during initial hydration", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
    let loaderDfd = createDeferred();
    let childLoaderDfd = createDeferred();

    router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/parent/child"] }),
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
      async unstable_patchRoutesOnNavigation({ patch }) {
        let children = await childrenDfd.promise;
        patch("parent", children);
      },
    });
    router.initialize();

    expect(router.state.initialized).toBe(false);
    expect(router.state.matches.length).toBe(0);

    loaderDfd.resolve("PARENT");
    expect(router.state.initialized).toBe(false);
    expect(router.state.matches.length).toBe(0);

    childrenDfd.resolve([
      {
        id: "child",
        path: "child",
        loader: () => childLoaderDfd.promise,
      },
    ]);
    expect(router.state.initialized).toBe(false);
    expect(router.state.matches.length).toBe(0);

    childLoaderDfd.resolve("CHILD");
    await tick();

    expect(router.state.initialized).toBe(true);
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

  it("discovers routes during initial hydration (w/v7_partialHydration)", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
    let loaderDfd = createDeferred();
    let childLoaderDfd = createDeferred();

    router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/parent/child"] }),
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
      async unstable_patchRoutesOnNavigation({ patch }) {
        let children = await childrenDfd.promise;
        patch("parent", children);
      },
      future: {
        v7_partialHydration: true,
      },
    });
    router.initialize();

    expect(router.state.initialized).toBe(false);
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["parent"]);

    loaderDfd.resolve("PARENT");
    expect(router.state.initialized).toBe(false);
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["parent"]);

    childrenDfd.resolve([
      {
        id: "child",
        path: "child",
        loader: () => childLoaderDfd.promise,
      },
    ]);
    expect(router.state.initialized).toBe(false);
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["parent"]);

    childLoaderDfd.resolve("CHILD");
    await tick();

    expect(router.state.initialized).toBe(true);
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

  it("discovers routes during initial SPA renders when a splat route matches", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();

    router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/test"] }),
      routes: [
        {
          path: "/",
        },
        {
          path: "*",
        },
      ],
      async unstable_patchRoutesOnNavigation({ patch }) {
        let children = await childrenDfd.promise;
        patch(null, children);
      },
    });
    router.initialize();
    expect(router.state.initialized).toBe(false);

    childrenDfd.resolve([
      {
        id: "test",
        path: "/test",
      },
    ]);
    await tick();
    expect(router.state.initialized).toBe(true);
    expect(router.state.location.pathname).toBe("/test");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["test"]);
  });

  it("does not discover routes during initial SSR hydration when a splat route matches", async () => {
    router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/test"] }),
      routes: [
        {
          path: "/",
        },
        {
          id: "splat",
          loader: () => "SPLAT 2",
          path: "*",
        },
      ],
      hydrationData: {
        loaderData: {
          splat: "SPLAT 1",
        },
      },
      async unstable_patchRoutesOnNavigation() {
        throw new Error("Should not be called");
      },
    });
    router.initialize();

    await tick();
    expect(router.state.initialized).toBe(true);
    expect(router.state.location.pathname).toBe("/test");
    expect(router.state.loaderData.splat).toBe("SPLAT 1");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["splat"]);
  });

  it("discovers new root routes", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
    let childLoaderDfd = createDeferred();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          path: "/parent",
        },
      ],
      async unstable_patchRoutesOnNavigation({ patch }) {
        patch(null, await childrenDfd.promise);
      },
    });

    router.navigate("/parent/child");
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });

    childrenDfd.resolve([
      {
        id: "parent-child",
        path: "/parent/child",
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
      "parent-child": "CHILD",
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "parent-child",
    ]);
  });

  it("lets you patch elsewhere in the tree (dynamic param)", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
    let childLoaderDfd = createDeferred();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          id: "root",
          path: "/",
        },
        {
          id: "param",
          path: "/:param",
        },
      ],
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        // We matched for the param but we want to patch in under root
        expect(matches.length).toBe(1);
        expect(matches[0].route.id).toBe("param");
        patch("root", await childrenDfd.promise);
      },
    });

    router.navigate("/parent/child");
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });

    childrenDfd.resolve([
      {
        id: "parent-child",
        path: "/parent/child",
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
      "parent-child": "CHILD",
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "root",
      "parent-child",
    ]);
  });

  it("lets you patch elsewhere in the tree (splat)", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
    let childLoaderDfd = createDeferred();

    router = createRouter({
      history: createMemoryHistory({ initialEntries: ["/other"] }),
      routes: [
        {
          id: "other",
          path: "/other",
        },
        {
          id: "splat",
          path: "*",
        },
      ],
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        // We matched for the splat but we want to patch in at the top
        expect(matches.length).toBe(1);
        expect(matches[0].route.id).toBe("splat");
        let children = await childrenDfd.promise;
        patch(null, children);
      },
    });

    router.navigate("/parent/child");
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });

    childrenDfd.resolve([
      {
        id: "parent-child",
        path: "/parent/child",
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
      "parent-child": "CHILD",
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "parent-child",
    ]);
  });

  it("works when there are no partial matches", async () => {
    let childrenDfd = createDeferred<AgnosticDataRouteObject[]>();
    let childLoaderDfd = createDeferred();

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/nope",
        },
      ],
      async unstable_patchRoutesOnNavigation({ matches, patch }) {
        expect(matches.length).toBe(0);
        let children = await childrenDfd.promise;
        patch(null, children);
      },
    });

    router.navigate("/parent/child");
    expect(router.state.navigation).toMatchObject({
      state: "loading",
      location: { pathname: "/parent/child" },
    });

    childrenDfd.resolve([
      {
        id: "parent-child",
        path: "/parent/child",
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
      "parent-child": "CHILD",
    });
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "parent-child",
    ]);
  });

  it("creates a new router.routes identity when patching routes", async () => {
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
      async unstable_patchRoutesOnNavigation({ patch }) {
        let children = await childrenDfd.promise;
        patch("parent", children);
      },
    });
    let originalRoutes = router.routes;

    router.navigate("/parent/child");
    childrenDfd.resolve([
      {
        id: "child",
        path: "child",
      },
    ]);
    await tick();

    expect(router.state.location.pathname).toBe("/parent/child");
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "parent",
      "child",
    ]);

    expect(router.routes).not.toBe(originalRoutes);
  });

  it("allows patching externally/eagerly and triggers a reflow", async () => {
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
    });
    let spy = jest.fn();
    let unsubscribe = router.subscribe(spy);
    let originalRoutes = router.routes;
    router.patchRoutes("parent", [
      {
        id: "child",
        path: "child",
      },
    ]);
    expect(spy).toHaveBeenCalled();
    expect(router.routes).not.toBe(originalRoutes);

    await router.navigate("/parent/child");
    expect(router.state.location.pathname).toBe("/parent/child");
    expect(router.state.matches.map((m) => m.route.id)).toEqual([
      "parent",
      "child",
    ]);

    unsubscribe();
  });

  it('does not re-call for previously called "good" paths', async () => {
    let count = 0;
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "param",
          path: ":param",
        },
      ],
      async unstable_patchRoutesOnNavigation() {
        count++;
        await tick();
        // Nothing to patch - there is no better static route in this case
      },
    });

    await router.navigate("/whatever");
    expect(count).toBe(1);
    expect(router.state.location.pathname).toBe("/whatever");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["param"]);

    await router.navigate("/");
    expect(count).toBe(1);
    expect(router.state.location.pathname).toBe("/");

    await router.navigate("/whatever");
    expect(count).toBe(1); // Not called again
    expect(router.state.location.pathname).toBe("/whatever");
    expect(router.state.matches.map((m) => m.route.id)).toEqual(["param"]);
  });

  it("does not re-call for previously called 404 paths", async () => {
    let count = 0;
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          id: "index",
          path: "/",
        },
        {
          id: "static",
          path: "static",
        },
      ],
      async unstable_patchRoutesOnNavigation() {
        count++;
      },
    });

    await router.navigate("/junk");
    expect(count).toBe(1);
    expect(router.state.location.pathname).toBe("/junk");
    expect(router.state.errors?.index).toEqual(
      new ErrorResponseImpl(
        404,
        "Not Found",
        new Error('No route matches URL "/junk"'),
        true
      )
    );

    await router.navigate("/");
    expect(count).toBe(1);
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.errors).toBeNull();

    await router.navigate("/junk");
    expect(count).toBe(1);
    expect(router.state.location.pathname).toBe("/junk");
    expect(router.state.errors?.index).toEqual(
      new ErrorResponseImpl(
        404,
        "Not Found",
        new Error('No route matches URL "/junk"'),
        true
      )
    );
  });

  it("caps internal fifo queue at 1000 paths", async () => {
    let count = 0;
    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        {
          path: "/",
        },
        {
          id: "param",
          path: ":param",
        },
      ],
      async unstable_patchRoutesOnNavigation() {
        count++;
        // Nothing to patch - there is no better static route in this case
      },
    });

    // Fill it up with 1000 paths
    for (let i = 1; i <= 1000; i++) {
      await router.navigate(`/path-${i}`);
      expect(count).toBe(i);
      expect(router.state.location.pathname).toBe(`/path-${i}`);

      await router.navigate("/");
      expect(count).toBe(i);
      expect(router.state.location.pathname).toBe("/");
    }

    // Don't call patchRoutesOnNavigation since this is the first item in the queue
    await router.navigate(`/path-1`);
    expect(count).toBe(1000);
    expect(router.state.location.pathname).toBe(`/path-1`);

    // Call patchRoutesOnNavigation and evict the first item
    await router.navigate(`/path-1001`);
    expect(count).toBe(1001);
    expect(router.state.location.pathname).toBe(`/path-1001`);

    // Call patchRoutesOnNavigation since this item was evicted
    await router.navigate(`/path-1`);
    expect(count).toBe(1002);
    expect(router.state.location.pathname).toBe(`/path-1`);
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
        async unstable_patchRoutesOnNavigation({ patch }) {
          let children = await childrenDfd.promise;
          patch("parent", children);
        },
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
        async unstable_patchRoutesOnNavigation({ patch }) {
          let children = await childrenDfd.promise;
          patch("parent", children);
        },
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
        async unstable_patchRoutesOnNavigation({ matches, patch }) {
          await tick();
          if (last(matches).route.id === "a") {
            patch("a", [
              {
                id: "b",
                path: "b",
              },
            ]);
          } else if (last(matches).route.id === "b") {
            await tick();
            patch("b", [
              {
                id: "c",
                path: "c",
                hasErrorBoundary: true,
                async loader() {
                  await tick();
                  throw new Error("C ERROR");
                },
              },
            ]);
          }
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
        async unstable_patchRoutesOnNavigation({ matches, patch }) {
          await tick();
          if (last(matches).route.id === "a") {
            patch("a", [
              {
                id: "b",
                path: "b",
                hasErrorBoundary: true,
              },
            ]);
          } else if (last(matches).route.id === "b") {
            await tick();
            patch("b", [
              {
                id: "c",
                path: "c",
                async loader() {
                  await tick();
                  throw new Error("C ERROR");
                },
              },
            ]);
          }
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
        async unstable_patchRoutesOnNavigation({ matches, patch }) {
          await tick();
          if (last(matches).route.id === "a") {
            patch("a", [
              {
                id: "b",
                path: "b",
              },
            ]);
          } else if (last(matches).route.id === "b") {
            await tick();
            patch("b", [
              {
                id: "c",
                path: "c",
                async loader() {
                  await tick();
                  throw new Error("C ERROR");
                },
              },
            ]);
          }
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
        async unstable_patchRoutesOnNavigation({ matches, patch }) {
          await tick();
          if (last(matches).route.id === "a") {
            patch("a", [
              {
                id: "b",
                path: "b",
              },
            ]);
          } else if (last(matches).route.id === "b") {
            await tick();
            patch("b", [
              {
                id: "c",
                path: "c",
                hasErrorBoundary: true,
                async action() {
                  await tick();
                  throw new Error("C ERROR");
                },
              },
            ]);
          }
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
        async unstable_patchRoutesOnNavigation({ matches, patch }) {
          await tick();
          if (last(matches).route.id === "a") {
            patch("a", [
              {
                id: "b",
                path: "b",
                hasErrorBoundary: true,
              },
            ]);
          } else if (last(matches).route.id === "b") {
            await tick();
            patch("b", [
              {
                id: "c",
                path: "c",
                async action() {
                  await tick();
                  throw new Error("C ERROR");
                },
              },
            ]);
          }
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
        async unstable_patchRoutesOnNavigation({ matches, patch }) {
          await tick();
          if (last(matches).route.id === "a") {
            patch("a", [
              {
                id: "b",
                path: "b",
              },
            ]);
          } else if (last(matches).route.id === "b") {
            await tick();
            patch("b", [
              {
                id: "c",
                path: "c",
                async action() {
                  await tick();
                  throw new Error("C ERROR");
                },
              },
            ]);
          }
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

    it("handles errors thrown from patchRoutesOnNavigation() (GET navigation)", async () => {
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
        async unstable_patchRoutesOnNavigation({ patch }) {
          await tick();
          if (shouldThrow) {
            shouldThrow = false;
            throw new Error("broke!");
          }
          patch("a", [
            {
              id: "b",
              path: "b",
              loader() {
                return "B";
              },
            },
          ]);
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
              'Unable to match URL "/a/b" - the `unstable_patchRoutesOnNavigation()` ' +
                "function threw the following error:\nError: broke!"
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

    it("handles errors thrown from patchRoutesOnNavigation() (POST navigation)", async () => {
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
        async unstable_patchRoutesOnNavigation({ patch }) {
          await tick();
          if (shouldThrow) {
            shouldThrow = false;
            throw new Error("broke!");
          }
          patch("a", [
            {
              id: "b",
              path: "b",
              action() {
                return "B";
              },
            },
          ]);
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
              'Unable to match URL "/a/b" - the `unstable_patchRoutesOnNavigation()` ' +
                "function threw the following error:\nError: broke!"
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

    it("bubbles errors thrown from patchRoutesOnNavigation() during hydration", async () => {
      router = createRouter({
        history: createMemoryHistory({
          initialEntries: ["/parent/child/grandchild"],
        }),
        routes: [
          {
            id: "parent",
            path: "parent",
            hasErrorBoundary: true,
            children: [
              {
                id: "child",
                path: "child",
              },
            ],
          },
        ],
        async unstable_patchRoutesOnNavigation() {
          await tick();
          throw new Error("broke!");
        },
      }).initialize();

      expect(router.state).toMatchObject({
        location: { pathname: "/parent/child/grandchild" },
        initialized: false,
        errors: null,
      });
      expect(router.state.matches.length).toBe(0);

      await tick();
      expect(router.state).toMatchObject({
        location: { pathname: "/parent/child/grandchild" },
        actionData: null,
        loaderData: {},
        errors: {
          parent: new ErrorResponseImpl(
            400,
            "Bad Request",
            new Error(
              'Unable to match URL "/parent/child/grandchild" - the ' +
                "`unstable_patchRoutesOnNavigation()` function threw the following " +
                "error:\nError: broke!"
            ),
            true
          ),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "parent",
        "child",
      ]);
    });

    it("bubbles errors thrown from patchRoutesOnNavigation() during hydration (w/v7_partialHydration)", async () => {
      router = createRouter({
        history: createMemoryHistory({
          initialEntries: ["/parent/child/grandchild"],
        }),
        routes: [
          {
            id: "parent",
            path: "parent",
            hasErrorBoundary: true,
            children: [
              {
                id: "child",
                path: "child",
              },
            ],
          },
        ],
        async unstable_patchRoutesOnNavigation() {
          await tick();
          throw new Error("broke!");
        },
        future: {
          v7_partialHydration: true,
        },
      }).initialize();

      expect(router.state).toMatchObject({
        location: { pathname: "/parent/child/grandchild" },
        initialized: false,
        errors: null,
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "parent",
        "child",
      ]);

      await tick();
      expect(router.state).toMatchObject({
        location: { pathname: "/parent/child/grandchild" },
        actionData: null,
        loaderData: {},
        errors: {
          parent: new ErrorResponseImpl(
            400,
            "Bad Request",
            new Error(
              'Unable to match URL "/parent/child/grandchild" - the ' +
                "`unstable_patchRoutesOnNavigation()` function threw the following " +
                "error:\nError: broke!"
            ),
            true
          ),
        },
      });
      expect(router.state.matches.map((m) => m.route.id)).toEqual([
        "parent",
        "child",
      ]);
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
        async unstable_patchRoutesOnNavigation({ patch }) {
          let children = await childrenDfd.promise;
          patch("parent", children);
        },
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
        async unstable_patchRoutesOnNavigation({ matches, patch }) {
          await tick();
          if (last(matches).route.id === "a") {
            patch("a", [
              {
                id: "b",
                path: "b",
              },
            ]);
          } else if (last(matches).route.id === "b") {
            patch("b", [
              {
                id: "c",
                path: "c",
                async loader() {
                  await tick();
                  return "C";
                },
              },
            ]);
          }
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
        async unstable_patchRoutesOnNavigation({ patch }) {
          let children = await childrenDfd.promise;
          patch("parent", children);
        },
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
        async unstable_patchRoutesOnNavigation({ matches, patch }) {
          await tick();
          if (last(matches).route.id === "a") {
            patch("a", [
              {
                id: "b",
                path: "b",
              },
            ]);
          } else if (last(matches).route.id === "b") {
            patch("b", [
              {
                id: "c",
                path: "c",
                async action() {
                  await tick();
                  return "C ACTION";
                },
              },
            ]);
          }
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
