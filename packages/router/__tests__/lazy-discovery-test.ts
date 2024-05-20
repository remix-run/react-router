import type { AgnosticDataRouteObject, Router } from "../index";
import { createMemoryHistory, createRouter } from "../index";
import { createDeferred, tick } from "./utils/utils";

let router: Router;

describe("Lazy Route Discovery (Fog of War)", () => {
  afterEach(() => {
    router.dispose();
    // @ts-expect-error
    router = null;
  });

  it("discovers child route at a depth of 1", async () => {
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

    let promise = router.navigate("/parent/child");
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
    await promise;

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

  it("discovers child routes at a depth >1", async () => {
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
});
