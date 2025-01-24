import { createMemoryHistory } from "../../lib/router/history";
import type { Router, StaticHandlerContext } from "../../lib/router/router";
import { createRouter, createStaticHandler } from "../../lib/router/router";
import type {
  DataStrategyResult,
  MiddlewareFunction,
  MiddlewareFunctionArgs,
} from "../../lib/router/utils";
import { redirect } from "../../lib/router/utils";
import { cleanup } from "./utils/data-router-setup";
import { createFormData, tick } from "./utils/utils";

let router: Router;

afterEach(() => cleanup(router));

declare module "../../lib/router/utils" {
  interface RouterContext {
    count?: { value: number };
    order?: string[];
  }
}

function getOrderMiddleware(name: string): MiddlewareFunction {
  return async ({ context, next }) => {
    context.order?.push(`${name} middleware - before next()`);
    await tick(); // Force async to ensure ordering is correct
    await next();
    await tick(); // Force async to ensure ordering is correct
    context.order?.push(`${name} middleware - after next()`);
  };
}

describe("context/middleware", () => {
  describe("context", () => {
    it("provides context to loaders and actions", async () => {
      let globalContext = { count: { value: 0 } };
      router = createRouter({
        history: createMemoryHistory(),
        context: globalContext,
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
        context: {},
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
        context: {},
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
    describe("ordering", () => {
      it("runs middleware sequentially before and after loaders", async () => {
        let globalContext = { order: [] };
        router = createRouter({
          history: createMemoryHistory(),
          context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [getOrderMiddleware("a"), getOrderMiddleware("b")],
              loader({ context }) {
                context.order?.push("parent loader");
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  middleware: [
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
          context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [getOrderMiddleware("a"), getOrderMiddleware("b")],
              loader({ context }) {
                context.order?.push("parent loader");
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  middleware: [
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
          context: {},
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
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
                  middleware: [
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
          context: {},
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
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
                  middleware: [
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
              middleware: [
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
          context: globalContext,
          routes: [
            {
              id: "index",
              path: "/",
            },
            {
              id: "page",
              path: "/page",
              middleware: [
                ({ context }: MiddlewareFunctionArgs) => {
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
          context: {},
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
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
                  middleware: [
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
          context: {},
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
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
                  middleware: [
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
          context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
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
                  middleware: [
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 1 action start - throwing");
                        throw new Error("child 1 action error");
                      } else {
                        context.order?.push("child 1 loader start");
                        await next();
                        context.order?.push("child 1 loader end");
                      }
                    },
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 2 action start");
                        await next();
                        context.order?.push("child 2 action end");
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
              "child 1 action start - throwing",
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
          context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
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
                  middleware: [
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 1 action start");
                        await next();
                        context.order?.push("child 1 action end");
                      } else {
                        context.order?.push("child 1 loader start");
                        await next();
                        context.order?.push("child 1 loader end");
                      }
                    },
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 2 action start");
                        await next();
                        context.order?.push("child 2 action end - throwing");
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
            "child 1 action start",
            "child 2 action start",
            "child 2 action end - throwing",
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
          context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              hasErrorBoundary: true,
              middleware: [
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
                  middleware: [
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 1 action start - throwing");
                        throw new Error("child 1 action error");
                      } else {
                        context.order?.push("child 1 loader start");
                        await next();
                        context.order?.push("child 1 loader end");
                      }
                    },
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 2 action start");
                        await next();
                        context.order?.push("child 2 action end");
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
          order: ["parent action start", "child 1 action start - throwing"],
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
          context: globalContext,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              hasErrorBoundary: true,
              middleware: [
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
                  middleware: [
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 1 action start");
                        await next();
                        context.order?.push("child 1 action end");
                      } else {
                        context.order?.push("child 1 loader start");
                        await next();
                        context.order?.push("child 1 loader end");
                      }
                    },
                    async ({ request, context, next }) => {
                      if (request.method !== "GET") {
                        context.order?.push("child 2 action start");
                        await next();
                        context.order?.push("child 2 action end - throwing");
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
            "child 1 action start",
            "child 2 action start",
            "child 2 action end - throwing",
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
              middleware: [
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
              middleware: [
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
    it("propagates a Response through middleware when a `respond` API is passed", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
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
              middleware: [
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

      let response = (await handler.query(
        new Request("http://localhost/parent/child"),
        {
          respond: async (staticContext) => {
            return new Response(JSON.stringify(staticContext), {
              headers: {
                "Content-Type": "application/json",
              },
            });
          },
        }
      )) as Response;

      expect(await response.json()).toMatchInlineSnapshot(`
        {
          "actionData": null,
          "actionHeaders": {},
          "basename": "/",
          "errors": null,
          "loaderData": {
            "child": "CHILD",
            "parent": "PARENT",
          },
          "loaderHeaders": {},
          "location": {
            "hash": "",
            "key": "default",
            "pathname": "/parent/child",
            "search": "",
            "state": null,
          },
          "matches": [
            {
              "params": {},
              "pathname": "/parent",
              "pathnameBase": "/parent",
              "route": {
                "children": [
                  {
                    "hasErrorBoundary": false,
                    "id": "child",
                    "middleware": [
                      null,
                      null,
                    ],
                    "path": "child",
                  },
                ],
                "hasErrorBoundary": false,
                "id": "parent",
                "middleware": [
                  null,
                  null,
                ],
                "path": "/parent",
              },
            },
            {
              "params": {},
              "pathname": "/parent/child",
              "pathnameBase": "/parent/child",
              "route": {
                "hasErrorBoundary": false,
                "id": "child",
                "middleware": [
                  null,
                  null,
                ],
                "path": "child",
              },
            },
          ],
          "statusCode": 200,
        }
      `);
      expect(response.headers.get("parent1")).toEqual("yes");
      expect(response.headers.get("parent2")).toEqual("yes");
      expect(response.headers.get("child1")).toEqual("yes");
      expect(response.headers.get("child2")).toEqual("yes");
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
            middleware: [getOrderMiddleware("a"), getOrderMiddleware("b")],
            loader({ context }) {
              context.order?.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                middleware: [getOrderMiddleware("c"), getOrderMiddleware("d")],
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
            middleware: [getOrderMiddleware("a"), getOrderMiddleware("b")],
            loader({ context }) {
              context.order?.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                middleware: [getOrderMiddleware("c"), getOrderMiddleware("d")],
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
          { requestContext }
        );

        expect(requestContext).toEqual({
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

      it("does not return result of middleware in static handler by default", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [
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
                middleware: [
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
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = {};
        let staticContext = await handler.query(
          new Request("http://localhost/parent/child"),
          {
            requestContext,
          }
        );

        expect(requestContext).toEqual({
          child1: undefined,
          child2: undefined,
          parent1: undefined,
          parent2: undefined,
        });
        expect((staticContext as StaticHandlerContext).loaderData).toEqual({
          child: "CHILD",
          parent: "PARENT",
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
            middleware: [
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
                middleware: [
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
        let staticContext = await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext }
        );

        expect(requestContext).toEqual({
          child: "CHILD MIDDLEWARE",
          parent: "PARENT MIDDLEWARE",
        });
        expect((staticContext as StaticHandlerContext).loaderData).toEqual({
          child: "CHILD",
          parent: "PARENT",
        });
        expect((staticContext as StaticHandlerContext).errors).toBeNull();
      });

      it("errors if you try to call next more than once in a middleware", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [
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

        await expect(
          handler.query(new Request("http://localhost/parent"))
        ).resolves.toMatchObject({
          errors: {
            parent: new Error("You may only call `next()` once per middleware"),
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
            middleware: [
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
                middleware: [
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
        let staticContext = await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext }
        );

        expect(requestContext).toEqual({
          parent1: "PARENT 1",
        });
        expect((staticContext as StaticHandlerContext).loaderData).toEqual({});
        expect((staticContext as StaticHandlerContext).errors).toEqual({
          parent: new Error("PARENT 2"),
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
            middleware: [
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
                middleware: [
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
        let staticContext = await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext }
        );

        expect(requestContext).toEqual({
          child: "CHILD DOWN",
          parent: "PARENT DOWN",
        });
        expect((staticContext as StaticHandlerContext).loaderData).toEqual({
          parent: "PARENT",
        });
        expect((staticContext as StaticHandlerContext).errors).toEqual({
          parent: new Error("CHILD UP"),
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
            middleware: [
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
                middleware: [
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 1 action start - throwing");
                      throw new Error("child 1 action error");
                    } else {
                      context.order?.push("child 1 loader start");
                      await next();
                      context.order?.push("child 1 loader end");
                    }
                  },
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 2 action start");
                      await next();
                      context.order?.push("child 2 action end");
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
        ]);

        let requestContext = { order: [] };
        let staticContext = await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext }
        );

        expect(requestContext).toMatchInlineSnapshot(`
          {
            "order": [
              "parent action start",
              "child 1 action start - throwing",
              "parent loader start",
              "parent loader end",
            ],
          }
        `);
        expect((staticContext as StaticHandlerContext).loaderData)
          .toMatchInlineSnapshot(`
          {
            "child": null,
            "parent": "PARENT",
          }
        `);
        expect((staticContext as StaticHandlerContext).errors)
          .toMatchInlineSnapshot(`
          {
            "child": [Error: child 1 action error],
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
            middleware: [
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
                middleware: [
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 1 action start");
                      await next();
                      context.order?.push("child 1 action end");
                    } else {
                      context.order?.push("child 1 loader start");
                      await next();
                      context.order?.push("child 1 loader end");
                    }
                  },
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 2 action start");
                      await next();
                      context.order?.push("child 2 action end - throwing");
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
        ]);

        let requestContext = { order: [] };
        let staticContext = await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext }
        );

        expect(requestContext).toEqual({
          order: [
            "parent action start",
            "child 1 action start",
            "child 2 action start",
            "child 2 action end - throwing",
            "parent loader start",
            "parent loader end",
          ],
        });
        expect((staticContext as StaticHandlerContext).loaderData).toEqual({
          // TODO: Do we need to coerce these to null still?  Or does undefined work now?
          child: null,
          parent: "PARENT",
        });
        expect((staticContext as StaticHandlerContext).errors).toEqual({
          child: new Error("child 2 action error"),
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
            middleware: [
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
                middleware: [
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 1 action start - throwing");
                      throw new Error("child 1 action error");
                    } else {
                      context.order?.push("child 1 loader start");
                      await next();
                      context.order?.push("child 1 loader end");
                    }
                  },
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 2 action start");
                      await next();
                      context.order?.push("child 2 action end");
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
        ]);

        let requestContext = { order: [] };
        let staticContext = await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext }
        );

        expect(requestContext).toEqual({
          order: ["parent action start", "child 1 action start - throwing"],
        });
        expect((staticContext as StaticHandlerContext).loaderData).toEqual({
          parent: null,
          child: null,
        });
        expect((staticContext as StaticHandlerContext).errors).toEqual({
          parent: new Error("child 1 action error"),
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
            middleware: [
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
                middleware: [
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 1 action start");
                      await next();
                      context.order?.push("child 1 action end");
                    } else {
                      context.order?.push("child 1 loader start");
                      await next();
                      context.order?.push("child 1 loader end");
                    }
                  },
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 2 action start");
                      await next();
                      context.order?.push("child 2 action end - throwing");
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
        ]);

        let requestContext = { order: [] };
        let staticContext = await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext }
        );

        expect(requestContext).toEqual({
          order: [
            "parent action start",
            "child 1 action start",
            "child 2 action start",
            "child 2 action end - throwing",
          ],
        });
        expect((staticContext as StaticHandlerContext).loaderData).toEqual({
          parent: null,
          child: null,
        });
        expect((staticContext as StaticHandlerContext).errors).toEqual({
          parent: new Error("child 2 action error"),
        });
      });

      it("allows thrown redirects before next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            path: "/parent",
            middleware: [
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
          new Request("http://localhost/parent")
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
            middleware: [
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
          new Request("http://localhost/parent")
        )) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/target");
      });
    });
  });

  describe("middleware - handler.queryRoute", () => {
    it("propagates a Response through middleware when a `respond` API is passed", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
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
              middleware: [
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

      let response = (await handler.queryRoute(
        new Request("http://localhost/parent/child"),
        {
          async respond(val) {
            return val;
          },
        }
      )) as Response;

      expect(await response.text()).toBe("CHILD");
      expect(response.headers.get("parent1")).toEqual("yes");
      expect(response.headers.get("parent2")).toEqual("yes");
      expect(response.headers.get("child1")).toEqual("yes");
      expect(response.headers.get("child2")).toEqual("yes");
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
            middleware: [getOrderMiddleware("a"), getOrderMiddleware("b")],
            loader({ context }) {
              context.order?.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                middleware: [getOrderMiddleware("c"), getOrderMiddleware("d")],
                loader({ context }) {
                  context.order?.push("child loader");
                },
              },
            ],
          },
        ]);

        let requestContext = { order: [] };
        await handler.queryRoute(new Request("http://localhost/parent/child"), {
          requestContext,
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
            middleware: [getOrderMiddleware("a"), getOrderMiddleware("b")],
            loader({ context }) {
              context.order?.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                middleware: [getOrderMiddleware("c"), getOrderMiddleware("d")],
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

        let requestContext = { order: [] };
        await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext }
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

      it("returns result of middleware in static handler", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [
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
                middleware: [
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
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = {};
        let staticContext = await handler.queryRoute(
          new Request("http://localhost/parent/child"),
          {
            requestContext,
          }
        );

        expect(requestContext).toEqual({
          child1: undefined,
          child2: undefined,
          parent1: undefined,
          parent2: undefined,
        });
        expect(staticContext).toBe("CHILD");
      });

      it("does not require that you call next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [
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
                middleware: [
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
          { requestContext }
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
            middleware: [
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

        await expect(
          handler.queryRoute(new Request("http://localhost/parent/"))
        ).rejects.toEqual(
          new Error("You may only call `next()` once per middleware")
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
            middleware: [
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
                middleware: [
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
        await expect(
          handler.queryRoute(new Request("http://localhost/parent/child"), {
            requestContext,
          })
        ).rejects.toEqual(new Error("PARENT 2"));

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
            middleware: [
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
                middleware: [
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
        await expect(
          handler.queryRoute(new Request("http://localhost/parent/child"), {
            requestContext,
          })
        ).rejects.toEqual(new Error("CHILD UP"));

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
            middleware: [
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
                middleware: [
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 1 action start - throwing");
                      throw new Error("child 1 action error");
                    } else {
                      context.order?.push("child 1 loader start");
                      await next();
                      context.order?.push("child 1 loader end");
                    }
                  },
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 2 action start");
                      await next();
                      context.order?.push("child 2 action end");
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
        ]);

        let requestContext = { order: [] };
        await expect(
          handler.queryRoute(
            new Request("http://localhost/parent/child", {
              method: "post",
              body: createFormData({}),
            }),
            { requestContext }
          )
        ).rejects.toEqual(new Error("child 1 action error"));

        expect(requestContext).toMatchInlineSnapshot(`
          {
            "order": [
              "parent action start",
              "child 1 action start - throwing",
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
            middleware: [
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
                middleware: [
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 1 action start");
                      await next();
                      context.order?.push("child 1 action end");
                    } else {
                      context.order?.push("child 1 loader start");
                      await next();
                      context.order?.push("child 1 loader end");
                    }
                  },
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 2 action start");
                      await next();
                      context.order?.push("child 2 action end - throwing");
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
        ]);

        let requestContext = { order: [] };
        await expect(
          handler.queryRoute(
            new Request("http://localhost/parent/child", {
              method: "post",
              body: createFormData({}),
            }),
            { requestContext }
          )
        ).rejects.toEqual(new Error("child 2 action error"));

        expect(requestContext).toEqual({
          order: [
            "parent action start",
            "child 1 action start",
            "child 2 action start",
            "child 2 action end - throwing",
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
            middleware: [
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
                middleware: [
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 1 action start - throwing");
                      throw new Error("child 1 action error");
                    } else {
                      context.order?.push("child 1 loader start");
                      await next();
                      context.order?.push("child 1 loader end");
                    }
                  },
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 2 action start");
                      await next();
                      context.order?.push("child 2 action end");
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
        ]);

        let requestContext = { order: [] };
        await expect(
          handler.queryRoute(
            new Request("http://localhost/parent/child", {
              method: "post",
              body: createFormData({}),
            }),
            { requestContext }
          )
        ).rejects.toEqual(new Error("child 1 action error"));

        expect(requestContext).toEqual({
          order: ["parent action start", "child 1 action start - throwing"],
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
            middleware: [
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
                middleware: [
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 1 action start");
                      await next();
                      context.order?.push("child 1 action end");
                    } else {
                      context.order?.push("child 1 loader start");
                      await next();
                      context.order?.push("child 1 loader end");
                    }
                  },
                  async ({ request, context, next }) => {
                    if (request.method !== "GET") {
                      context.order?.push("child 2 action start");
                      await next();
                      context.order?.push("child 2 action end - throwing");
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
        ]);

        let requestContext = { order: [] };
        await expect(
          handler.queryRoute(
            new Request("http://localhost/parent/child", {
              method: "post",
              body: createFormData({}),
            }),
            { requestContext }
          )
        ).rejects.toEqual(new Error("child 2 action error"));

        expect(requestContext).toEqual({
          order: [
            "parent action start",
            "child 1 action start",
            "child 2 action start",
            "child 2 action end - throwing",
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
            middleware: [
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
          new Request("http://localhost/parent")
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
            middleware: [
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
          new Request("http://localhost/parent")
        )) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/target");
      });
    });
  });
});
