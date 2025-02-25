import { createMemoryHistory } from "../../lib/router/history";
import type { Router, StaticHandlerContext } from "../../lib/router/router";
import { createRouter, createStaticHandler } from "../../lib/router/router";
import type {
  DataStrategyResult,
  unstable_MiddlewareFunction,
  unstable_MiddlewareFunctionArgs,
} from "../../lib/router/utils";
import { redirect } from "../../lib/router/utils";
import { cleanup } from "./utils/data-router-setup";
import { createFormData, tick } from "./utils/utils";

let router: Router;

afterEach(() => cleanup(router));

declare module "../../lib/router/utils" {
  interface unstable_RouterContext {
    count?: { value: number };
    order?: string[];
  }
}

function respondWithJson(staticContext: StaticHandlerContext) {
  return new Response(
    JSON.stringify(staticContext, (key, value) =>
      value instanceof Error ? `ERROR: ${value.message}` : value
    ),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}

describe("context/middleware", () => {
  describe("context", () => {
    it("provides context to loaders and actions", async () => {
      let globalContext = { count: { value: 0 } };
      router = createRouter({
        history: createMemoryHistory(),
        unstable_context: globalContext,
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "/a",
            loader({ context }) {
              if (context.count) context.count.value++;
              return context.count?.value;
            },
          },
          {
            id: "b",
            path: "/b",
            action({ context }) {
              if (context.count) context.count.value++;
              return context.count?.value;
            },
            loader({ context }) {
              if (context.count) context.count.value++;
              return context.count?.value;
            },
          },
        ],
      });

      await router.navigate("/a");
      expect(router.state.loaderData.a).toBe(1);
      expect(globalContext.count.value).toBe(1);

      await router.navigate("/b", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(router.state.actionData?.b).toBe(2);
      expect(router.state.loaderData.b).toBe(3);
      expect(globalContext.count.value).toBe(3);
    });

    it("works with dataStrategy for a sequential implementation", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            async loader({ context }) {
              // Ensure these actually run sequentially :)
              await tick();
              context.parent = "PARENT MIDDLEWARE";
              return context;
            },
            children: [
              {
                id: "child",
                path: "child",
                loader({ context }) {
                  context.parent += " (amended from child)";
                  context.child = "CHILD MIDDLEWARE";
                  return context;
                },
              },
            ],
          },
        ],
        async dataStrategy({ matches }) {
          let keyedResults: Record<string, DataStrategyResult> = {};
          for (let m of matches) {
            keyedResults[m.route.id] = await m.resolve();
          }
          return keyedResults;
        },
      });

      await router.navigate("/parent/child");

      expect(router.state.loaderData).toEqual({
        parent: expect.objectContaining({
          child: "CHILD MIDDLEWARE",
          parent: "PARENT MIDDLEWARE (amended from child)",
        }),
        child: expect.objectContaining({
          child: "CHILD MIDDLEWARE",
          parent: "PARENT MIDDLEWARE (amended from child)",
        }),
      });
    });

    it("works with dataStrategy for an easy middleware implementation", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            loader: ({ context }) => context,
            handle: {
              middleware(context) {
                context.parent = "PARENT MIDDLEWARE";
              },
            },
            children: [
              {
                id: "child",
                path: "child",
                loader: ({ context }) => context,
                handle: {
                  middleware(context) {
                    context.parent += " (amended from child)";
                    context.child = "CHILD MIDDLEWARE";
                  },
                },
              },
            ],
          },
        ],
        async dataStrategy({ context, matches }) {
          // Run middleware sequentially
          for (let m of matches) {
            await m.route.handle.middleware(context);
          }

          // Run loaders in parallel
          let keyedResults: Record<string, DataStrategyResult> = {};
          await Promise.all(
            matches.map(async (m) => {
              keyedResults[m.route.id] = await m.resolve();
            })
          );
          return keyedResults;
        },
      });

      await router.navigate("/parent/child");

      expect(router.state.loaderData).toEqual({
        child: expect.objectContaining({
          child: "CHILD MIDDLEWARE",
          parent: "PARENT MIDDLEWARE (amended from child)",
        }),
        parent: expect.objectContaining({
          child: "CHILD MIDDLEWARE",
          parent: "PARENT MIDDLEWARE (amended from child)",
        }),
      });
    });
  });

  describe("middleware - client side", () => {
    function getOrderMiddleware(name: string): unstable_MiddlewareFunction {
      return async ({ context, next }) => {
        context.order?.push(`${name} middleware - before next()`);
        await tick(); // Force async to ensure ordering is correct
        await next();
        await tick(); // Force async to ensure ordering is correct
        context.order?.push(`${name} middleware - after next()`);
      };
    }

    describe("ordering", () => {
      it("runs middleware sequentially before and after loaders", async () => {
        let globalContext = { order: [] };
        router = createRouter({
          history: createMemoryHistory(),
          unstable_context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                getOrderMiddleware("a"),
                getOrderMiddleware("b"),
              ],
              loader({ context }) {
                context.order?.push("parent loader");
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    getOrderMiddleware("c"),
                    getOrderMiddleware("d"),
                  ],
                  loader({ context }) {
                    context.order?.push("child loader");
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(globalContext).toEqual({
          order: [
            "a middleware - before next()",
            "b middleware - before next()",
            "c middleware - before next()",
            "d middleware - before next()",
            "parent loader",
            "child loader",
            "d middleware - after next()",
            "c middleware - after next()",
            "b middleware - after next()",
            "a middleware - after next()",
          ],
        });
      });

      it("runs middleware sequentially before and after actions", async () => {
        let globalContext = { order: [] };
        router = createRouter({
          history: createMemoryHistory(),
          unstable_context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                getOrderMiddleware("a"),
                getOrderMiddleware("b"),
              ],
              loader({ context }) {
                context.order?.push("parent loader");
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    getOrderMiddleware("c"),
                    getOrderMiddleware("d"),
                  ],
                  action({ context }) {
                    context.order?.push("child action");
                  },
                  loader({ context }) {
                    context.order?.push("child loader");
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child", {
          formMethod: "post",
          formData: createFormData({}),
        });

        expect(globalContext).toEqual({
          order: [
            // Action
            "a middleware - before next()",
            "b middleware - before next()",
            "c middleware - before next()",
            "d middleware - before next()",
            "child action",
            "d middleware - after next()",
            "c middleware - after next()",
            "b middleware - after next()",
            "a middleware - after next()",
            // Revalidation
            "a middleware - before next()",
            "b middleware - before next()",
            "c middleware - before next()",
            "d middleware - before next()",
            "parent loader",
            "child loader",
            "d middleware - after next()",
            "c middleware - after next()",
            "b middleware - after next()",
            "a middleware - after next()",
          ],
        });
      });

      it("does not return result of middleware in client side routers", async () => {
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                async ({ context, next }) => {
                  context.parent1 = await next();
                  return "NOPE";
                },
                async ({ context, next }) => {
                  context.parent2 = await next();
                  return "NOPE";
                },
              ],
              loader() {
                return "PARENT";
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    async ({ context, next }) => {
                      context.child1 = await next();
                      return "NOPE";
                    },
                    async ({ context, next }) => {
                      context.child2 = await next();
                      return "NOPE";
                    },
                  ],
                  loader({ context }) {
                    return context;
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toMatchObject({
          parent: "PARENT",
          child: {
            child1: undefined,
            child2: undefined,
            parent1: undefined,
            parent2: undefined,
          },
        });
      });

      it("does not require that you call next()", async () => {
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                ({ context, next }) => {
                  context.parent = "PARENT MIDDLEWARE";
                },
              ],
              loader({ context }) {
                return context;
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    ({ context, next }) => {
                      context.child = "CHILD MIDDLEWARE";
                    },
                  ],
                  loader({ context }) {
                    return context;
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toEqual({
          parent: {
            child: "CHILD MIDDLEWARE",
            parent: "PARENT MIDDLEWARE",
          },
          child: {
            child: "CHILD MIDDLEWARE",
            parent: "PARENT MIDDLEWARE",
          },
        });
        expect(router.state.errors).toBeNull();
      });

      it("errors if you try to call next more than once in a middleware", async () => {
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                async ({ next }) => {
                  await next();
                  await next();
                },
              ],
              loader() {
                return "PARENT";
              },
            },
          ],
        });

        await router.navigate("/parent");

        expect(router.state.loaderData).toEqual({});
        expect(router.state.errors).toEqual({
          parent: new Error("You may only call `next()` once per middleware"),
        });
      });

      it("creates a new context per navigation/fetcher call", async () => {
        let globalContext = { count: { value: 0 } };
        router = createRouter({
          history: createMemoryHistory(),
          unstable_context: globalContext,
          routes: [
            {
              id: "index",
              path: "/",
            },
            {
              id: "page",
              path: "/page",
              unstable_middleware: [
                ({ context }: unstable_MiddlewareFunctionArgs) => {
                  if (context.count) context.count.value++;
                  context.localCount =
                    ((context.localCount as number) || 0) + 1;
                },
              ],
              action({ context }) {
                // point in time snapshot
                return JSON.parse(JSON.stringify(context));
              },
              loader({ context }) {
                return context;
              },
            },
          ],
        });

        await router.navigate("/page");
        expect(router.state.loaderData.page).toEqual({
          count: { value: 1 },
          localCount: 1,
        });

        await router.navigate("/");
        await router.navigate("/page");
        expect(router.state.loaderData.page).toEqual({
          count: { value: 2 },
          localCount: 1,
        });

        await router.navigate("/");
        await router.navigate("/page", {
          formMethod: "post",
          formData: createFormData({}),
        });
        expect(router.state.actionData?.page).toEqual({
          count: { value: 3 },
          localCount: 1,
        });
        expect(router.state.loaderData.page).toEqual({
          count: { value: 4 },
          localCount: 2, // context persists from action -> loader
        });

        let fetcherData;
        let unsub = router.subscribe((state) => {
          if (state.fetchers.get("a")?.data) {
            fetcherData = state.fetchers.get("a")?.data;
          }
        });
        await router.fetch("a", "page", "/page");
        expect(fetcherData).toEqual({
          count: { value: 5 },
          localCount: 1,
        });

        await router.fetch("a", "page", "/page", {
          formMethod: "post",
          formData: createFormData({}),
        });
        expect(fetcherData).toEqual({
          count: { value: 6 },
          localCount: 1,
        });
        expect(router.state.loaderData.page).toEqual({
          count: { value: 7 },
          localCount: 2, // context persists from action -> loader
        });

        unsub();
      });
    });

    describe("throwing", () => {
      it("throwing from a middleware short circuits immediately (going down - loader)", async () => {
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                async ({ context, next }) => {
                  context.parent1 = "PARENT 1";
                },
                async ({ context, next }) => {
                  throw new Error("PARENT 2");
                },
              ],
              loader({ context }) {
                return context;
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    async ({ context, next }) => {
                      context.child = "CHILD";
                      await next();
                    },
                  ],
                  loader({ context }) {
                    return context;
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toEqual({});
        expect(router.state.errors).toEqual({
          parent: new Error("PARENT 2"),
        });
      });

      it("throwing from a middleware short circuits immediately (going up - loader)", async () => {
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                async ({ context, next }) => {
                  context.parent = "PARENT DOWN";
                  await next();
                  context.parent = "PARENT UP";
                },
              ],
              loader({ context }) {
                return context;
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    async ({ context, next }) => {
                      context.child = "CHILD DOWN";
                      await next();
                      throw new Error("CHILD UP");
                    },
                  ],
                  loader({ context }) {
                    return context;
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toEqual({
          parent: {
            child: "CHILD DOWN",
            parent: "PARENT DOWN",
          },
        });
        expect(router.state.errors).toEqual({
          parent: new Error("CHILD UP"),
        });
      });

      it("throwing from a middleware short circuits immediately (going down - action w/boundary)", async () => {
        let globalContext = { order: [] };
        router = createRouter({
          history: createMemoryHistory(),
          unstable_context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                async ({ request, context, next }) => {
                  if (request.method !== "GET") {
                    context.order?.push("parent action start");
                    await next();
                    context.order?.push("parent action end");
                  } else {
                    context.order?.push("parent loader start");
                    await next();
                    context.order?.push("parent loader end");
                  }
                },
              ],
              loader() {
                return "PARENT";
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  hasErrorBoundary: true,
                  unstable_middleware: [
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 1 start - throwing");
                        throw new Error("child 1 action error");
                      } else {
                        context.order?.push("child 1 loader start");
                        await next();
                        context.order?.push("child 1 loader end");
                      }
                    },
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 2 start");
                        await next();
                        context.order?.push("child 2 end");
                      } else {
                        context.order?.push("child 2 loader start");
                        await next();
                        context.order?.push("child 2 loader end");
                      }
                    },
                  ],
                  action() {
                    return "ACTION";
                  },
                  loader() {
                    return "CHILD";
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child", {
          formMethod: "post",
          formData: createFormData({}),
        });

        expect(globalContext).toMatchInlineSnapshot(`
          {
            "order": [
              "parent action start",
              "child 1 start - throwing",
              "parent loader start",
              "parent loader end",
            ],
          }
        `);
        expect(router.state.loaderData).toMatchInlineSnapshot(`
          {
            "child": undefined,
            "parent": "PARENT",
          }
        `);
        expect(router.state.errors).toMatchInlineSnapshot(`
          {
            "child": [Error: child 1 action error],
          }
        `);
      });

      it("throwing from a middleware short circuits immediately (going up - action w/boundary)", async () => {
        let globalContext = { order: [] };
        router = createRouter({
          history: createMemoryHistory(),
          unstable_context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              unstable_middleware: [
                async ({ request, context, next }) => {
                  if (request.method !== "GET") {
                    context.order?.push("parent action start");
                    await next();
                    context.order?.push("parent action end");
                  } else {
                    context.order?.push("parent loader start");
                    await next();
                    context.order?.push("parent loader end");
                  }
                },
              ],
              loader() {
                return "PARENT";
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  hasErrorBoundary: true,
                  unstable_middleware: [
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 1 start");
                        await next();
                        context.order?.push("child 1 end");
                      } else {
                        context.order?.push("child 1 loader start");
                        await next();
                        context.order?.push("child 1 loader end");
                      }
                    },
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 2 start");
                        await next();
                        context.order?.push("child 2 end - throwing");
                        throw new Error("child 2 action error");
                      } else {
                        context.order?.push("child 2 loader start");
                        await next();
                        context.order?.push("child 2 loader end");
                      }
                    },
                  ],
                  action() {
                    return "ACTION";
                  },
                  loader() {
                    return "CHILD";
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child", {
          formMethod: "post",
          formData: createFormData({}),
        });

        expect(globalContext).toEqual({
          order: [
            "parent action start",
            "child 1 start",
            "child 2 start",
            "child 2 end - throwing",
            "parent loader start",
            "parent loader end",
          ],
        });
        expect(router.state.loaderData).toEqual({
          child: undefined,
          parent: "PARENT",
        });
        expect(router.state.errors).toEqual({
          child: new Error("child 2 action error"),
        });
      });

      it("throwing from a middleware short circuits immediately (going down - action w/o boundary)", async () => {
        let globalContext = { order: [] };
        router = createRouter({
          history: createMemoryHistory(),
          unstable_context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              hasErrorBoundary: true,
              unstable_middleware: [
                async ({ request, context, next }) => {
                  if (request.method !== "GET") {
                    context.order?.push("parent action start");
                    await next();
                    context.order?.push("parent action end");
                  } else {
                    context.order?.push("parent loader start");
                    await next();
                    context.order?.push("parent loader end");
                  }
                },
              ],
              loader() {
                return "PARENT";
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 1 start - throwing");
                        throw new Error("child 1 action error");
                      } else {
                        context.order?.push("child 1 loader start");
                        await next();
                        context.order?.push("child 1 loader end");
                      }
                    },
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 2 start");
                        await next();
                        context.order?.push("child 2 end");
                      } else {
                        context.order?.push("child 2 loader start");
                        await next();
                        context.order?.push("child 2 loader end");
                      }
                    },
                  ],
                  action() {
                    return "ACTION";
                  },
                  loader() {
                    return "CHILD";
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child", {
          formMethod: "post",
          formData: createFormData({}),
        });

        expect(globalContext).toEqual({
          order: ["parent action start", "child 1 start - throwing"],
        });
        expect(router.state.loaderData).toEqual({});
        expect(router.state.errors).toEqual({
          parent: new Error("child 1 action error"),
        });
      });

      it("throwing from a middleware short circuits immediately (going up - action w/o boundary)", async () => {
        let globalContext = { order: [] };
        router = createRouter({
          history: createMemoryHistory(),
          unstable_context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              hasErrorBoundary: true,
              unstable_middleware: [
                async ({ request, context, next }) => {
                  if (request.method !== "GET") {
                    context.order?.push("parent action start");
                    await next();
                    context.order?.push("parent action end");
                  } else {
                    context.order?.push("parent loader start");
                    await next();
                    context.order?.push("parent loader end");
                  }
                },
              ],
              loader() {
                return "PARENT";
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 1 start");
                        await next();
                        context.order?.push("child 1 end");
                      } else {
                        context.order?.push("child 1 loader start");
                        await next();
                        context.order?.push("child 1 loader end");
                      }
                    },
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 2 start");
                        await next();
                        context.order?.push("child 2 end - throwing");
                        throw new Error("child 2 action error");
                      } else {
                        context.order?.push("child 2 loader start");
                        await next();
                        context.order?.push("child 2 loader end");
                      }
                    },
                  ],
                  action() {
                    return "ACTION";
                  },
                  loader() {
                    return "CHILD";
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child", {
          formMethod: "post",
          formData: createFormData({}),
        });

        expect(globalContext).toEqual({
          order: [
            "parent action start",
            "child 1 start",
            "child 2 start",
            "child 2 end - throwing",
          ],
        });
        expect(router.state.loaderData).toEqual({});
        expect(router.state.errors).toEqual({
          parent: new Error("child 2 action error"),
        });
      });

      it("allows thrown redirects before next()", async () => {
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              path: "/parent",
              unstable_middleware: [
                async ({ next }) => {
                  throw redirect("/target");
                },
              ],
              loader() {
                return "PARENT";
              },
            },
            {
              path: "/target",
            },
          ],
        });

        await router.navigate("/parent");

        expect(router.state).toMatchObject({
          location: {
            pathname: "/target",
          },
          loaderData: {},
          errors: null,
        });
      });

      it("allows thrown redirects after next()", async () => {
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              path: "/parent",
              unstable_middleware: [
                async ({ next }) => {
                  await next();
                  throw redirect("/target");
                },
              ],
              loader() {
                return "PARENT";
              },
            },
            {
              path: "/target",
            },
          ],
        });

        await router.navigate("/parent");

        expect(router.state).toMatchObject({
          location: {
            pathname: "/target",
          },
          loaderData: {},
          errors: null,
        });
      });
    });
  });

  describe("middleware - handler.query", () => {
    function getOrderMiddleware(name: string): unstable_MiddlewareFunction {
      return async ({ context, next }) => {
        context.order?.push(`${name} middleware - before next()`);
        await tick(); // Force async to ensure ordering is correct
        let res = await next();
        await tick(); // Force async to ensure ordering is correct
        context.order?.push(`${name} middleware - after next()`);
        return res;
      };
    }

    it("propagates a Response through middleware when a `respond` API is passed", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          unstable_middleware: [
            async ({ next }) => {
              let res = (await next()) as Response;
              res.headers.set("parent1", "yes");
              return res;
            },
            async ({ next }) => {
              let res = (await next()) as Response;
              res.headers.set("parent2", "yes");
              return res;
            },
          ],
          loader() {
            return "PARENT";
          },
          children: [
            {
              id: "child",
              path: "child",
              unstable_middleware: [
                async ({ next }) => {
                  let res = (await next()) as Response;
                  res.headers.set("child1", "yes");
                  return res;
                },
                async ({ next }) => {
                  let res = (await next()) as Response;
                  res.headers.set("child2", "yes");
                  return res;
                },
              ],
              loader() {
                return "CHILD";
              },
            },
          ],
        },
      ]);

      let res = (await handler.query(
        new Request("http://localhost/parent/child"),
        { unstable_respond: respondWithJson }
      )) as Response;
      let staticContext = (await res.json()) as StaticHandlerContext;

      expect(staticContext).toMatchObject({
        location: {
          pathname: "/parent/child",
        },
        statusCode: 200,
        loaderData: {
          child: "CHILD",
          parent: "PARENT",
        },
        actionData: null,
        errors: null,
      });
      expect(res.headers.get("parent1")).toEqual("yes");
      expect(res.headers.get("parent2")).toEqual("yes");
      expect(res.headers.get("child1")).toEqual("yes");
      expect(res.headers.get("child2")).toEqual("yes");
    });

    describe("ordering", () => {
      it("runs middleware sequentially before and after loaders", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              getOrderMiddleware("a"),
              getOrderMiddleware("b"),
            ],
            loader({ context }) {
              context.order?.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  getOrderMiddleware("c"),
                  getOrderMiddleware("d"),
                ],
                loader({ context }) {
                  context.order?.push("child loader");
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        await handler.query(new Request("http://localhost/parent/child"), {
          requestContext,
          unstable_respond: respondWithJson,
        });

        expect(requestContext).toEqual({
          order: [
            "a middleware - before next()",
            "b middleware - before next()",
            "c middleware - before next()",
            "d middleware - before next()",
            "parent loader",
            "child loader",
            "d middleware - after next()",
            "c middleware - after next()",
            "b middleware - after next()",
            "a middleware - after next()",
          ],
        });
      });

      it("runs middleware sequentially before and after actions", async () => {
        let requestContext = { order: [] };
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              getOrderMiddleware("a"),
              getOrderMiddleware("b"),
            ],
            loader({ context }) {
              context.order?.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  getOrderMiddleware("c"),
                  getOrderMiddleware("d"),
                ],
                action({ context }) {
                  context.order?.push("child action");
                },
                loader({ context }) {
                  context.order?.push("child loader");
                },
              },
            ],
          },
        ]);

        await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        );

        expect(requestContext).toEqual({
          order: [
            // Action
            "a middleware - before next()",
            "b middleware - before next()",
            "c middleware - before next()",
            "d middleware - before next()",
            "child action",
            "parent loader",
            "child loader",
            "d middleware - after next()",
            "c middleware - after next()",
            "b middleware - after next()",
            "a middleware - after next()",
          ],
        });
      });

      it("does not require that you call next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              ({ context, next }) => {
                context.parent = "PARENT MIDDLEWARE";
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  ({ context, next }) => {
                    context.child = "CHILD MIDDLEWARE";
                  },
                ],
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = {};
        let res = (await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext).toEqual({
          child: "CHILD MIDDLEWARE",
          parent: "PARENT MIDDLEWARE",
        });
        expect(staticContext).toMatchObject({
          loaderData: {
            child: "CHILD",
            parent: "PARENT",
          },
          errors: null,
        });
      });

      it("errors if you try to call next more than once in a middleware", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ next }) => {
                await next();
                await next();
              },
            ],
            loader() {
              return "PARENT";
            },
          },
        ]);

        let res = (await handler.query(new Request("http://localhost/parent"), {
          unstable_respond: respondWithJson,
        })) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;
        expect(staticContext).toMatchObject({
          errors: {
            parent: "ERROR: You may only call `next()` once per middleware",
          },
          loaderData: {},
          statusCode: 500,
        });
      });
    });

    describe("throwing", () => {
      it("throwing from a middleware short circuits immediately (going down - loader)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ context, next }) => {
                context.parent1 = "PARENT 1";
              },
              async ({ context, next }) => {
                throw new Error("PARENT 2");
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  async ({ context, next }) => {
                    context.child = "CHILD";
                    await next();
                  },
                ],
                loader({ context }) {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = {};
        let res = (await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext).toEqual({
          parent1: "PARENT 1",
        });
        expect(staticContext.loaderData).toEqual({});
        expect(staticContext.errors).toEqual({
          parent: "ERROR: PARENT 2",
        });
      });

      it("throwing from a middleware short circuits immediately (going up - loader)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ context, next }) => {
                context.parent = "PARENT DOWN";
                await next();
                context.parent = "PARENT UP";
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  async ({ context, next }) => {
                    context.child = "CHILD DOWN";
                    await next();
                    throw new Error("CHILD UP");
                  },
                ],
                loader({ context }) {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = {};
        let res = (await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext).toEqual({
          child: "CHILD DOWN",
          parent: "PARENT DOWN",
        });
        expect(staticContext.loaderData).toEqual({
          parent: "PARENT",
        });
        expect(staticContext.errors).toEqual({
          parent: "ERROR: CHILD UP",
        });
      });

      it("throwing from a middleware short circuits immediately (going down - action w/boundary)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ request, context, next }) => {
                context.order?.push("parent start");
                let res = await next();
                context.order?.push("parent end");
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                hasErrorBoundary: true,
                unstable_middleware: [
                  async ({ request, context, next }) => {
                    context.order?.push("child 1 start - throwing");
                    throw new Error("child 1 error");
                  },
                  async ({ request, context, next }) => {
                    context.order?.push("child 2 start");
                    let res = await next();
                    context.order?.push("child 2 end");
                    return res;
                  },
                ],
                action() {
                  return "ACTION";
                },
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        let res = (await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext).toMatchInlineSnapshot(`
          {
            "order": [
              "parent start",
              "child 1 start - throwing",
            ],
          }
        `);
        expect(staticContext.loaderData).toEqual({});
        expect(staticContext.errors).toEqual({
          // bubbles to parent boundary because we never got to run loaders
          parent: "ERROR: child 1 error",
        });
      });

      it("throwing from a middleware short circuits immediately (going up - action w/boundary)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ request, context, next }) => {
                context.order?.push("parent start");
                let res = await next();
                context.order?.push("parent end");
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                hasErrorBoundary: true,
                unstable_middleware: [
                  async ({ request, context, next }) => {
                    context.order?.push("child 1 start");
                    await next();
                    context.order?.push("child 1 end");
                  },
                  async ({ request, context, next }) => {
                    context.order?.push("child 2 start");
                    let res = await next();
                    context.order?.push("child 2 end - throwing");
                    throw new Error("child 2 error");
                  },
                ],
                action() {
                  return "ACTION";
                },
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        let res = (await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext).toEqual({
          order: [
            "parent start",
            "child 1 start",
            "child 2 start",
            "child 2 end - throwing",
          ],
        });
        expect(staticContext.loaderData).toEqual({
          parent: "PARENT",
        });
        expect(staticContext.errors).toEqual({
          child: "ERROR: child 2 error",
        });
      });

      it("throwing from a middleware short circuits immediately (going down - action w/o boundary)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            hasErrorBoundary: true,
            unstable_middleware: [
              async ({ request, context, next }) => {
                context.order?.push("parent start");
                let res = await next();
                context.order?.push("parent end");
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  async ({ request, context, next }) => {
                    context.order?.push("child 1 start - throwing");
                    throw new Error("child 1 error");
                  },
                  async ({ request, context, next }) => {
                    context.order?.push("child 2 start");
                    let res = await next();
                    context.order?.push("child 2 end");
                    return res;
                  },
                ],
                action() {
                  return "ACTION";
                },
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        let res = (await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext).toEqual({
          order: ["parent start", "child 1 start - throwing"],
        });
        expect(staticContext.loaderData).toEqual({});
        expect(staticContext.errors).toEqual({
          parent: "ERROR: child 1 error",
        });
      });

      it("throwing from a middleware short circuits immediately (going up - action w/o boundary)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            hasErrorBoundary: true,
            unstable_middleware: [
              async ({ request, context, next }) => {
                context.order?.push("parent start");
                let res = await next();
                context.order?.push("parent end");
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  async ({ request, context, next }) => {
                    context.order?.push("child 1 start");
                    let res = await next();
                    context.order?.push("child 1 end");
                    return res;
                  },
                  async ({ request, context, next }) => {
                    context.order?.push("child 2 start");
                    let res = await next();
                    context.order?.push("child 2 end - throwing");
                    throw new Error("child 2 error");
                  },
                ],
                action() {
                  return "ACTION";
                },
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        let res = (await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext).toEqual({
          order: [
            "parent start",
            "child 1 start",
            "child 2 start",
            "child 2 end - throwing",
          ],
        });
        expect(staticContext.loaderData).toEqual({
          parent: "PARENT",
        });
        expect(staticContext.errors).toEqual({
          parent: "ERROR: child 2 error",
        });
      });

      it("allows thrown redirects before next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            path: "/parent",
            unstable_middleware: [
              async ({ next }) => {
                throw redirect("/target");
              },
            ],
            loader() {
              return "PARENT";
            },
          },
          {
            path: "/target",
          },
        ]);

        let response = (await handler.query(
          new Request("http://localhost/parent"),
          { unstable_respond: respondWithJson }
        )) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/target");
      });

      it("allows thrown redirects after next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            path: "/parent",
            unstable_middleware: [
              async ({ next }) => {
                await next();
                throw redirect("/target");
              },
            ],
            loader() {
              return "PARENT";
            },
          },
          {
            path: "/target",
          },
        ]);

        let response = (await handler.query(
          new Request("http://localhost/parent"),
          { unstable_respond: respondWithJson }
        )) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/target");
      });
    });
  });

  describe("middleware - handler.queryRoute", () => {
    function getOrderMiddleware(name: string): unstable_MiddlewareFunction {
      return async ({ context, next }) => {
        context.order?.push(`${name} middleware - before next()`);
        await tick(); // Force async to ensure ordering is correct
        let res = await next();
        await tick(); // Force async to ensure ordering is correct
        context.order?.push(`${name} middleware - after next()`);
        return res;
      };
    }

    it("propagates a Response through middleware when a `respond` API is passed", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          unstable_middleware: [
            async ({ context, next }) => {
              let res = (await next()) as Response;
              res.headers.set("parent1", "yes");
              return res;
            },
            async ({ context, next }) => {
              let res = (await next()) as Response;
              res.headers.set("parent2", "yes");
              return res;
            },
          ],
          loader() {
            return new Response("PARENT");
          },
          children: [
            {
              id: "child",
              path: "child",
              unstable_middleware: [
                async ({ context, next }) => {
                  let res = (await next()) as Response;
                  res.headers.set("child1", "yes");
                  return res;
                },
                async ({ context, next }) => {
                  let res = (await next()) as Response;
                  res.headers.set("child2", "yes");
                  return res;
                },
              ],
              loader({ context }) {
                return new Response("CHILD");
              },
            },
          ],
        },
      ]);

      let res = (await handler.queryRoute(
        new Request("http://localhost/parent/child"),
        {
          unstable_respond: (v) => v,
        }
      )) as Response;

      expect(await res.text()).toBe("CHILD");
      expect(res.headers.get("parent1")).toEqual("yes");
      expect(res.headers.get("parent2")).toEqual("yes");
      expect(res.headers.get("child1")).toEqual("yes");
      expect(res.headers.get("child2")).toEqual("yes");
    });

    describe("ordering", () => {
      it("runs middleware sequentially before and after loaders", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              getOrderMiddleware("a"),
              getOrderMiddleware("b"),
            ],
            loader({ context }) {
              context.order?.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  getOrderMiddleware("c"),
                  getOrderMiddleware("d"),
                ],
                loader({ context }) {
                  context.order?.push("child loader");
                  return new Response("CHILD");
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        await handler.queryRoute(new Request("http://localhost/parent/child"), {
          requestContext,
          unstable_respond: (v) => v,
        });

        expect(requestContext).toEqual({
          order: [
            "a middleware - before next()",
            "b middleware - before next()",
            "c middleware - before next()",
            "d middleware - before next()",
            "child loader",
            "d middleware - after next()",
            "c middleware - after next()",
            "b middleware - after next()",
            "a middleware - after next()",
          ],
        });
      });

      it("runs middleware sequentially before and after actions", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              getOrderMiddleware("a"),
              getOrderMiddleware("b"),
            ],
            loader({ context }) {
              context.order?.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  getOrderMiddleware("c"),
                  getOrderMiddleware("d"),
                ],
                action({ context }) {
                  context.order?.push("child action");
                  return new Response("CHILD");
                },
                loader({ context }) {
                  context.order?.push("child loader");
                  return new Response("CHILD");
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          {
            requestContext,
            unstable_respond: (v) => v,
          }
        );

        expect(requestContext).toEqual({
          order: [
            "a middleware - before next()",
            "b middleware - before next()",
            "c middleware - before next()",
            "d middleware - before next()",
            "child action",
            "d middleware - after next()",
            "c middleware - after next()",
            "b middleware - after next()",
            "a middleware - after next()",
          ],
        });
      });

      it("does not require that you call next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              ({ context, next }) => {
                context.parent = "PARENT MIDDLEWARE";
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  ({ context, next }) => {
                    context.child = "CHILD MIDDLEWARE";
                  },
                ],
                loader() {
                  return new Response("CHILD");
                },
              },
            ],
          },
        ]);

        let requestContext = {};
        let response = (await handler.queryRoute(
          new Request("http://localhost/parent/child"),
          { requestContext, unstable_respond: (v) => v }
        )) as Response;

        expect(requestContext).toEqual({
          child: "CHILD MIDDLEWARE",
          parent: "PARENT MIDDLEWARE",
        });
        expect(await response.text()).toEqual("CHILD");
      });

      it("errors if you try to call next more than once in a middleware", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ next }) => {
                await next();
                await next();
              },
            ],
            loader() {
              return "PARENT";
            },
          },
        ]);

        let res = await handler.queryRoute(
          new Request("http://localhost/parent/"),
          {
            unstable_respond: (v) => v,
          }
        );

        expect(await res.text()).toBe(
          "Error: You may only call `next()` once per middleware"
        );
      });
    });

    describe("throwing", () => {
      it("throwing from a middleware short circuits immediately (going down - loader)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ context, next }) => {
                context.parent1 = "PARENT 1";
              },
              async ({ context, next }) => {
                throw new Error("PARENT 2");
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  async ({ context, next }) => {
                    context.child = "CHILD";
                    return next();
                  },
                ],
                loader({ context }) {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = {};
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child"),
          {
            requestContext,
            unstable_respond: (v) => v,
          }
        );
        expect(await res.text()).toBe("Error: PARENT 2");

        expect(requestContext).toEqual({
          parent1: "PARENT 1",
        });
      });

      it("throwing from a middleware short circuits immediately (going up - loader)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ context, next }) => {
                context.parent = "PARENT DOWN";
                let res = await next();
                context.parent = "PARENT UP";
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  async ({ context, next }) => {
                    context.child = "CHILD DOWN";
                    let res = await next();
                    throw new Error("CHILD UP");
                  },
                ],
                loader({ context }) {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = {};
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child"),
          {
            requestContext,
            unstable_respond: (v) => v,
          }
        );
        expect(await res.text()).toBe("Error: CHILD UP");

        expect(requestContext).toEqual({
          child: "CHILD DOWN",
          parent: "PARENT DOWN",
        });
      });

      it("throwing from a middleware short circuits immediately (going down - action w/boundary)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ request, context, next }) => {
                context.order?.push("parent start");
                let res = await next();
                context.order?.push("parent end");
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                hasErrorBoundary: true,
                unstable_middleware: [
                  async ({ request, context, next }) => {
                    context.order?.push("child 1 start - throwing");
                    throw new Error("child 1 error");
                  },
                  async ({ request, context, next }) => {
                    context.order?.push("child 2 start");
                    await next();
                    context.order?.push("child 2 end");
                  },
                ],
                action() {
                  return "ACTION";
                },
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: (v) => v }
        );
        expect(await res.text()).toEqual("Error: child 1 error");

        expect(requestContext).toMatchInlineSnapshot(`
          {
            "order": [
              "parent start",
              "child 1 start - throwing",
            ],
          }
        `);
      });

      it("throwing from a middleware short circuits immediately (going up - action w/boundary)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            unstable_middleware: [
              async ({ request, context, next }) => {
                context.order?.push("parent start");
                let res = await next();
                context.order?.push("parent end");
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                hasErrorBoundary: true,
                unstable_middleware: [
                  async ({ request, context, next }) => {
                    context.order?.push("child 1 start");
                    let res = await next();
                    context.order?.push("child 1 end");
                    return res;
                  },
                  async ({ request, context, next }) => {
                    context.order?.push("child 2 start");
                    let res = await next();
                    context.order?.push("child 2 end - throwing");
                    throw new Error("child 2 error");
                  },
                ],
                action() {
                  return "ACTION";
                },
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: (v) => v }
        );
        expect(await res.text()).toEqual("Error: child 2 error");

        expect(requestContext).toEqual({
          order: [
            "parent start",
            "child 1 start",
            "child 2 start",
            "child 2 end - throwing",
          ],
        });
      });

      it("throwing from a middleware short circuits immediately (going down - action w/o boundary)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            hasErrorBoundary: true,
            unstable_middleware: [
              async ({ request, context, next }) => {
                context.order?.push("parent action start");
                let res = await next();
                context.order?.push("parent action end");
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  async ({ request, context, next }) => {
                    context.order?.push("child 1 start - throwing");
                    throw new Error("child 1 action error");
                  },
                  async ({ request, context, next }) => {
                    context.order?.push("child 2 start");
                    let res = await next();
                    context.order?.push("child 2 end");
                    return res;
                  },
                ],
                action() {
                  return "ACTION";
                },
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: (v) => v }
        );
        expect(await res.text()).toEqual("Error: child 1 action error");

        expect(requestContext).toEqual({
          order: ["parent action start", "child 1 start - throwing"],
        });
      });

      it("throwing from a middleware short circuits immediately (going up - action w/o boundary)", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            hasErrorBoundary: true,
            unstable_middleware: [
              async ({ request, context, next }) => {
                context.order?.push("parent start");
                let res = await next();
                context.order?.push("parent end");
                return res;
              },
            ],
            loader() {
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                unstable_middleware: [
                  async ({ request, context, next }) => {
                    context.order?.push("child 1 start");
                    let res = await next();
                    context.order?.push("child 1 end");
                    return res;
                  },
                  async ({ request, context, next }) => {
                    context.order?.push("child 2 start");
                    let res = await next();
                    context.order?.push("child 2 end - throwing");
                    throw new Error("child 2 error");
                  },
                ],
                action() {
                  return "ACTION";
                },
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: (v) => v }
        );
        expect(await res.text()).toEqual("Error: child 2 error");

        expect(requestContext).toEqual({
          order: [
            "parent start",
            "child 1 start",
            "child 2 start",
            "child 2 end - throwing",
          ],
        });
      });

      it("allows thrown redirects before next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            path: "/parent",
            unstable_middleware: [
              async ({ next }) => {
                throw redirect("/target");
              },
            ],
            loader() {
              return "PARENT";
            },
          },
          {
            path: "/target",
          },
        ]);

        let response = (await handler.queryRoute(
          new Request("http://localhost/parent"),
          { unstable_respond: (v) => v }
        )) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/target");
      });

      it("allows thrown redirects after next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            path: "/parent",
            unstable_middleware: [
              async ({ next }) => {
                await next();
                throw redirect("/target");
              },
            ],
            loader() {
              return "PARENT";
            },
          },
          {
            path: "/target",
          },
        ]);

        let response = (await handler.queryRoute(
          new Request("http://localhost/parent"),
          { unstable_respond: (v) => v }
        )) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/target");
      });
    });
  });
});
