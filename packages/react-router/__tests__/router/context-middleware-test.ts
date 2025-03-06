import { createMemoryHistory } from "../../lib/router/history";
import type { Router, StaticHandlerContext } from "../../lib/router/router";
import { createRouter, createStaticHandler } from "../../lib/router/router";
import type {
  DataStrategyResult,
  unstable_MiddlewareFunction,
  unstable_RouterContext,
} from "../../lib/router/utils";
import {
  unstable_createContext,
  redirect,
  unstable_RouterContextProvider,
} from "../../lib/router/utils";
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
  // Simple context for just asserting that middlewares execute
  let countContext = unstable_createContext(0);

  // String contexts to ensure children middlewares have access to parent context values
  let parentContext = unstable_createContext("empty");
  let childContext = unstable_createContext("empty");

  // Context for tracking the order in which middlewares/handlers run
  let orderContext = unstable_createContext<string[]>([]);

  describe("context", () => {
    it("provides context to loaders and actions", async () => {
      router = createRouter({
        history: createMemoryHistory(),
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "/a",
            loader({ context }) {
              context.set(countContext, context.get(countContext) + 1);
              return context.get(countContext);
            },
          },
          {
            id: "b",
            path: "/b",
            action({ context }) {
              context.set(countContext, context.get(countContext) + 1);
              return context.get(countContext);
            },
            loader({ context }) {
              context.set(countContext, context.get(countContext) + 1);
              return context.get(countContext);
            },
          },
        ],
      });

      await router.navigate("/a");
      expect(router.state.loaderData.a).toBe(1);

      await router.navigate("/b", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(router.state.actionData?.b).toBe(1);
      expect(router.state.loaderData.b).toBe(2);
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
              context.set(parentContext, "PARENT MIDDLEWARE");
              return context.get(parentContext);
            },
            children: [
              {
                id: "child",
                path: "child",
                loader({ context }) {
                  context.set(childContext, "CHILD MIDDLEWARE");
                  return context.get(childContext);
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
        parent: "PARENT MIDDLEWARE",
        child: "CHILD MIDDLEWARE",
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
            loader: ({ context }) => ({
              parent: context.get(parentContext),
              child: context.get(childContext),
            }),
            handle: {
              middleware(context) {
                context.set(parentContext, "PARENT MIDDLEWARE");
              },
            },
            children: [
              {
                id: "child",
                path: "child",
                loader: ({ context }) => ({
                  parent: context.get(parentContext),
                  child: context.get(childContext),
                }),
                handle: {
                  middleware(context) {
                    context.set(
                      parentContext,
                      context.get(parentContext) + " (amended from child)"
                    );
                    context.set(childContext, "CHILD MIDDLEWARE");
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
    function getOrderMiddleware(
      orderContext: unstable_RouterContext<string[]>,
      name: string
    ): unstable_MiddlewareFunction {
      return async ({ context }, next) => {
        context.set(orderContext, [
          ...context.get(orderContext),
          `${name} middleware - before next()`,
        ]);
        await tick(); // Force async to ensure ordering is correct
        await next();
        await tick(); // Force async to ensure ordering is correct
        context.set(orderContext, [
          ...context.get(orderContext),
          `${name} middleware - after next()`,
        ]);
      };
    }

    describe("ordering", () => {
      it("runs middleware sequentially before and after loaders", async () => {
        let snapshot;
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
                async ({ context }, next) => {
                  await next();
                  // Grab a snapshot at the end of the upwards middleware chain
                  snapshot = context.get(orderContext);
                },
                getOrderMiddleware(orderContext, "a"),
                getOrderMiddleware(orderContext, "b"),
              ],
              loader({ context }) {
                context.get(orderContext).push("parent loader");
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    getOrderMiddleware(orderContext, "c"),
                    getOrderMiddleware(orderContext, "d"),
                  ],
                  loader({ context }) {
                    context.get(orderContext).push("child loader");
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(snapshot).toEqual([
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
        ]);
      });

      it("runs middleware sequentially before and after actions", async () => {
        let snapshot;
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
                async ({ context }, next) => {
                  await next();
                  // Grab a snapshot at the end of the upwards middleware chain
                  snapshot = context.get(orderContext);
                },
                getOrderMiddleware(orderContext, "a"),
                getOrderMiddleware(orderContext, "b"),
              ],
              loader({ context }) {
                context.get(orderContext).push("parent loader");
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    getOrderMiddleware(orderContext, "c"),
                    getOrderMiddleware(orderContext, "d"),
                  ],
                  action({ context }) {
                    context.get(orderContext).push("child action");
                  },
                  loader({ context }) {
                    context.get(orderContext).push("child loader");
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

        expect(snapshot).toEqual([
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
        ]);
      });

      it("does not return result of middleware in client side routers", async () => {
        let values: unknown[] = [];
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
                async ({ context }, next) => {
                  values.push(await next());
                  return "NOPE";
                },
                async ({ context }, next) => {
                  values.push(await next());
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
                    async ({ context }, next) => {
                      values.push(await next());
                      return "NOPE";
                    },
                    async ({ context }, next) => {
                      values.push(await next());
                      return "NOPE";
                    },
                  ],
                  loader() {
                    return values;
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toMatchObject({
          parent: "PARENT",
          child: [undefined, undefined, undefined, undefined],
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
                ({ context }, next) => {
                  context.set(parentContext, "PARENT MIDDLEWARE");
                },
              ],
              loader({ context }) {
                return context.get(parentContext);
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    ({ context }, next) => {
                      context.set(childContext, "CHILD MIDDLEWARE");
                    },
                  ],
                  loader({ context }) {
                    return context.get(childContext);
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toEqual({
          parent: "PARENT MIDDLEWARE",
          child: "CHILD MIDDLEWARE",
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
                async (_, next) => {
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
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              id: "index",
              path: "/",
            },
            {
              id: "page",
              path: "/page",
              unstable_middleware: [
                ({ context }) => {
                  context.set(countContext, context.get(countContext) + 1);
                },
              ],
              action({ context }) {
                return context.get(countContext);
              },
              loader({ context }) {
                return context.get(countContext);
              },
            },
          ],
        });

        await router.navigate("/page");
        expect(router.state.loaderData.page).toBe(1);

        await router.navigate("/");
        await router.navigate("/page");
        expect(router.state.loaderData.page).toBe(1);

        await router.navigate("/");
        await router.navigate("/page", {
          formMethod: "post",
          formData: createFormData({}),
        });
        expect(router.state.actionData?.page).toBe(1);
        // context persists from action -> loader
        expect(router.state.loaderData.page).toBe(2);

        let fetcherData;
        let unsub = router.subscribe((state) => {
          if (state.fetchers.get("a")?.data) {
            fetcherData = state.fetchers.get("a")?.data;
          }
        });
        await router.fetch("a", "page", "/page");
        expect(fetcherData).toEqual(1);

        await router.fetch("a", "page", "/page", {
          formMethod: "post",
          formData: createFormData({}),
        });
        expect(fetcherData).toEqual(1);
        // context persists from action -> loader
        expect(router.state.loaderData.page).toEqual(2);

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
                async ({ context }, next) => {
                  context.set(parentContext, "PARENT");
                },
                async ({ context }, next) => {
                  throw new Error("PARENT 2");
                },
              ],
              loader({ context }) {
                return context.get(parentContext);
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    async ({ context }, next) => {
                      context.set(childContext, "CHILD");
                      await next();
                    },
                  ],
                  loader({ context }) {
                    return context.get(childContext);
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
                async ({ context }, next) => {
                  context.set(parentContext, "PARENT DOWN");
                  await next();
                  context.set(parentContext, "PARENT UP");
                },
              ],
              loader({ context }) {
                return context.get(parentContext);
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  unstable_middleware: [
                    async ({ context }, next) => {
                      context.set(childContext, "CHILD DOWN");
                      await next();
                      throw new Error("CHILD UP");
                    },
                  ],
                  loader({ context }) {
                    return context.get(childContext);
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toEqual({
          parent: "PARENT DOWN",
        });
        expect(router.state.errors).toEqual({
          parent: new Error("CHILD UP"),
        });
      });

      it("throwing from a middleware short circuits immediately (going down - action w/boundary)", async () => {
        let snapshot;
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
                async ({ context }, next) => {
                  await next();
                  snapshot = context.get(orderContext);
                },
                async ({ request, context }, next) => {
                  if (request.method !== "GET") {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent action start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent action end",
                    ]);
                  } else {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent loader start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent loader end",
                    ]);
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
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 start - throwing",
                        ]);
                        throw new Error("child 1 action error");
                      } else {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 loader start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 loader end",
                        ]);
                      }
                    },
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 end",
                        ]);
                      } else {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 loader start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 loader end",
                        ]);
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

        expect(snapshot).toEqual([
          "parent action start",
          "child 1 start - throwing",
          "parent loader start",
          "child 1 loader start",
          "child 2 loader start",
          "child 2 loader end",
          "child 1 loader end",
          "parent loader end",
        ]);
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
        let snapshot;
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
                async ({ context }, next) => {
                  await next();
                  snapshot = context.get(orderContext);
                },
                async ({ request, context }, next) => {
                  if (request.method !== "GET") {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent action start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent action end",
                    ]);
                  } else {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent loader start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent loader end",
                    ]);
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
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 end",
                        ]);
                      } else {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 loader start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 loader end",
                        ]);
                      }
                    },
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 end - throwing",
                        ]);
                        throw new Error("child 2 action error");
                      } else {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 loader start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 loader end",
                        ]);
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

        expect(snapshot).toEqual([
          "parent action start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
          "parent loader start",
          "child 1 loader start",
          "child 2 loader start",
          "child 2 loader end",
          "child 1 loader end",
          "parent loader end",
        ]);
        expect(router.state.loaderData).toEqual({
          child: undefined,
          parent: "PARENT",
        });
        expect(router.state.errors).toEqual({
          child: new Error("child 2 action error"),
        });
      });

      it("throwing from a middleware short circuits immediately (going down - action w/o boundary)", async () => {
        let snapshot;
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              hasErrorBoundary: true,
              unstable_middleware: [
                async ({ context }, next) => {
                  try {
                    await next();
                  } catch (e) {
                    snapshot = context.get(orderContext);
                    throw e;
                  }
                },
                async ({ request, context }, next) => {
                  if (request.method !== "GET") {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent action start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent action end",
                    ]);
                  } else {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent loader start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent loader end",
                    ]);
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
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 start - throwing",
                        ]);
                        throw new Error("child 1 action error");
                      } else {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 loader start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 loader end",
                        ]);
                      }
                    },
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 end",
                        ]);
                      } else {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 loader start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 loader end",
                        ]);
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

        expect(snapshot).toEqual([
          "parent action start",
          "child 1 start - throwing",
        ]);
        expect(router.state.loaderData).toEqual({});
        expect(router.state.errors).toEqual({
          parent: new Error("child 1 action error"),
        });
      });

      it("throwing from a middleware short circuits immediately (going up - action w/o boundary)", async () => {
        let snapshot;
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              hasErrorBoundary: true,
              unstable_middleware: [
                async ({ context }, next) => {
                  try {
                    await next();
                  } catch (e) {
                    snapshot = context.get(orderContext);
                    throw e;
                  }
                },
                async ({ request, context }, next) => {
                  if (request.method !== "GET") {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent action start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent action end",
                    ]);
                  } else {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent loader start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "parent loader end",
                    ]);
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
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 end",
                        ]);
                      } else {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 loader start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 1 loader end",
                        ]);
                      }
                    },
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 end - throwing",
                        ]);
                        throw new Error("child 2 action error");
                      } else {
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 loader start",
                        ]);
                        await next();
                        context.set(orderContext, [
                          ...context.get(orderContext),
                          "child 2 loader end",
                        ]);
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

        expect(snapshot).toEqual([
          "parent action start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
        ]);
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
                async (_, next) => {
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
                async (_, next) => {
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
      return async ({ context }, next) => {
        context.set(orderContext, [
          ...context.get(orderContext),
          `${name} middleware - before next()`,
        ]);
        await tick(); // Force async to ensure ordering is correct
        let res = await next();
        await tick(); // Force async to ensure ordering is correct
        context.set(orderContext, [
          ...context.get(orderContext),
          `${name} middleware - after next()`,
        ]);
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
            async (_, next) => {
              let res = (await next()) as Response;
              res.headers.set("parent1", "yes");
              return res;
            },
            async (_, next) => {
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
                async (_, next) => {
                  let res = (await next()) as Response;
                  res.headers.set("child1", "yes");
                  return res;
                },
                async (_, next) => {
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

    it("propagates the response even if you call next and forget to return it", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          unstable_middleware: [
            async (_, next) => {
              let res = (await next()) as Response;
              res.headers.set("parent", "yes");
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
        location: {
          pathname: "/parent",
        },
        statusCode: 200,
        loaderData: {
          parent: "PARENT",
        },
        actionData: null,
        errors: null,
      });
      expect(res.headers.get("parent")).toEqual("yes");
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
              context.set(orderContext, [
                ...context.get(orderContext),
                "parent loader",
              ]);
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
                  context.set(orderContext, [
                    ...context.get(orderContext),
                    "child loader",
                  ]);
                },
              },
            ],
          },
        ]);

        let requestContext = new unstable_RouterContextProvider();
        await handler.query(new Request("http://localhost/parent/child"), {
          requestContext,
          unstable_respond: respondWithJson,
        });

        expect(requestContext.get(orderContext)).toEqual([
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
        ]);
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
              context.set(orderContext, [
                ...context.get(orderContext),
                "parent loader",
              ]);
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
                  context.set(orderContext, [
                    ...context.get(orderContext),
                    "child action",
                  ]);
                },
                loader({ context }) {
                  context.set(orderContext, [
                    ...context.get(orderContext),
                    "child loader",
                  ]);
                },
              },
            ],
          },
        ]);

        let requestContext = new unstable_RouterContextProvider();
        await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        );

        expect(requestContext.get(orderContext)).toEqual([
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
        ]);
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
              ({ context }, next) => {
                context.set(parentContext, "PARENT MIDDLEWARE");
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
                  ({ context }, next) => {
                    context.set(childContext, "CHILD MIDDLEWARE");
                  },
                ],
                loader() {
                  return "CHILD";
                },
              },
            ],
          },
        ]);

        let requestContext = new unstable_RouterContextProvider();
        let res = (await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(parentContext)).toEqual("PARENT MIDDLEWARE");
        expect(requestContext.get(childContext)).toEqual("CHILD MIDDLEWARE");
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
              async (_, next) => {
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
              async ({ context }, next) => {
                context.set(parentContext, "PARENT 1");
              },
              async ({ context }, next) => {
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
                  async ({ context }, next) => {
                    context.set(childContext, "CHILD");
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

        let requestContext = new unstable_RouterContextProvider();
        let res = (await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(parentContext)).toEqual("PARENT 1");
        expect(requestContext.get(childContext)).toBe("empty");
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
              async ({ context }, next) => {
                context.set(parentContext, "PARENT DOWN");
                await next();
                context.set(parentContext, "PARENT UP");
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
                  async ({ context }, next) => {
                    context.set(childContext, "CHILD DOWN");
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

        let requestContext = new unstable_RouterContextProvider();
        let res = (await handler.query(
          new Request("http://localhost/parent/child"),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(parentContext)).toEqual("PARENT DOWN");
        expect(requestContext.get(childContext)).toBe("CHILD DOWN");
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
              async ({ request, context }, next) => {
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent start",
                ]);
                let res = await next();
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent end",
                ]);
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
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 start - throwing",
                    ]);
                    throw new Error("child 1 error");
                  },
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 start",
                    ]);
                    let res = await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 end",
                    ]);
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

        let requestContext = new unstable_RouterContextProvider();
        let res = (await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start - throwing",
        ]);
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
              async ({ request, context }, next) => {
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent start",
                ]);
                let res = await next();
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent end",
                ]);
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
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 end",
                    ]);
                  },
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 end - throwing",
                    ]);
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

        let requestContext = new unstable_RouterContextProvider();
        let res = (await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
        ]);
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
              async ({ request, context }, next) => {
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent start",
                ]);
                let res = await next();
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent end",
                ]);
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
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 start - throwing",
                    ]);
                    throw new Error("child 1 error");
                  },
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 start",
                    ]);
                    let res = await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 end",
                    ]);
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

        let requestContext = new unstable_RouterContextProvider();
        let res = (await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start - throwing",
        ]);
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
              async ({ request, context }, next) => {
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent start",
                ]);
                let res = await next();
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent end",
                ]);
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
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 start",
                    ]);
                    let res = await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 end",
                    ]);
                    return res;
                  },
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 end - throwing",
                    ]);
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

        let requestContext = new unstable_RouterContextProvider();
        let res = (await handler.query(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: respondWithJson }
        )) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
        ]);
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
              async (_, next) => {
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
              async (_, next) => {
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
      return async ({ context }, next) => {
        context.set(orderContext, [
          ...context.get(orderContext),
          `${name} middleware - before next()`,
        ]);
        await tick(); // Force async to ensure ordering is correct
        let res = await next();
        await tick(); // Force async to ensure ordering is correct
        context.set(orderContext, [
          ...context.get(orderContext),
          `${name} middleware - after next()`,
        ]);
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
            async ({ context }, next) => {
              let res = (await next()) as Response;
              res.headers.set("parent1", "yes");
              return res;
            },
            async ({ context }, next) => {
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
                async ({ context }, next) => {
                  let res = (await next()) as Response;
                  res.headers.set("child1", "yes");
                  return res;
                },
                async ({ context }, next) => {
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
              context.set(orderContext, [
                ...context.get(orderContext),
                "parent loader",
              ]);
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
                  context.set(orderContext, [
                    ...context.get(orderContext),
                    "child loader",
                  ]);
                  return new Response("CHILD");
                },
              },
            ],
          },
        ]);

        let requestContext = new unstable_RouterContextProvider();
        await handler.queryRoute(new Request("http://localhost/parent/child"), {
          requestContext,
          unstable_respond: (v) => v,
        });

        expect(requestContext.get(orderContext)).toEqual([
          "a middleware - before next()",
          "b middleware - before next()",
          "c middleware - before next()",
          "d middleware - before next()",
          "child loader",
          "d middleware - after next()",
          "c middleware - after next()",
          "b middleware - after next()",
          "a middleware - after next()",
        ]);
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
              context.set(orderContext, [
                ...context.get(orderContext),
                "parent loader",
              ]);
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
                  context.set(orderContext, [
                    ...context.get(orderContext),
                    "child action",
                  ]);
                  return new Response("CHILD");
                },
                loader({ context }) {
                  context.set(orderContext, [
                    ...context.get(orderContext),
                    "child loader",
                  ]);
                  return new Response("CHILD");
                },
              },
            ],
          },
        ]);

        let requestContext = new unstable_RouterContextProvider();
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

        expect(requestContext.get(orderContext)).toEqual([
          "a middleware - before next()",
          "b middleware - before next()",
          "c middleware - before next()",
          "d middleware - before next()",
          "child action",
          "d middleware - after next()",
          "c middleware - after next()",
          "b middleware - after next()",
          "a middleware - after next()",
        ]);
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
              ({ context }, next) => {
                context.set(parentContext, "PARENT MIDDLEWARE");
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
                  ({ context }, next) => {
                    context.set(childContext, "CHILD MIDDLEWARE");
                  },
                ],
                loader() {
                  return new Response("CHILD");
                },
              },
            ],
          },
        ]);

        let requestContext = new unstable_RouterContextProvider();
        let response = (await handler.queryRoute(
          new Request("http://localhost/parent/child"),
          { requestContext, unstable_respond: (v) => v }
        )) as Response;

        expect(requestContext.get(parentContext)).toEqual("PARENT MIDDLEWARE");
        expect(requestContext.get(childContext)).toBe("CHILD MIDDLEWARE");
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
              async (_, next) => {
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
              async ({ context }, next) => {
                context.set(parentContext, "PARENT 1");
              },
              async ({ context }, next) => {
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
                  async ({ context }, next) => {
                    context.set(childContext, "CHILD 1");
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

        let requestContext = new unstable_RouterContextProvider();
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child"),
          {
            requestContext,
            unstable_respond: (v) => v,
          }
        );
        expect(await res.text()).toBe("Error: PARENT 2");

        expect(requestContext.get(parentContext)).toEqual("PARENT 1");
        expect(requestContext.get(childContext)).toEqual("empty");
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
              async ({ context }, next) => {
                context.set(parentContext, "PARENT DOWN");
                let res = await next();
                context.set(parentContext, "PARENT UP");
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
                  async ({ context }, next) => {
                    context.set(childContext, "CHILD DOWN");
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

        let requestContext = new unstable_RouterContextProvider();
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child"),
          {
            requestContext,
            unstable_respond: (v) => v,
          }
        );
        expect(await res.text()).toBe("Error: CHILD UP");

        expect(requestContext.get(parentContext)).toEqual("PARENT DOWN");
        expect(requestContext.get(childContext)).toEqual("CHILD DOWN");
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
              async ({ request, context }, next) => {
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent start",
                ]);
                let res = await next();
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent end",
                ]);
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
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 start - throwing",
                    ]);
                    throw new Error("child 1 error");
                  },
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 end",
                    ]);
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

        let requestContext = new unstable_RouterContextProvider();
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: (v) => v }
        );
        expect(await res.text()).toEqual("Error: child 1 error");

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start - throwing",
        ]);
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
              async ({ request, context }, next) => {
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent start",
                ]);
                let res = await next();
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent end",
                ]);
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
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 start",
                    ]);
                    let res = await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 end",
                    ]);
                    return res;
                  },
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 end - throwing",
                    ]);
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

        let requestContext = new unstable_RouterContextProvider();
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: (v) => v }
        );
        expect(await res.text()).toEqual("Error: child 2 error");

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
        ]);
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
              async ({ request, context }, next) => {
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent action start",
                ]);
                let res = await next();
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent action end",
                ]);
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
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 start - throwing",
                    ]);
                    throw new Error("child 1 action error");
                  },
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 start",
                    ]);
                    let res = await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 end",
                    ]);
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

        let requestContext = new unstable_RouterContextProvider();
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: (v) => v }
        );
        expect(await res.text()).toEqual("Error: child 1 action error");

        expect(requestContext.get(orderContext)).toEqual([
          "parent action start",
          "child 1 start - throwing",
        ]);
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
              async ({ request, context }, next) => {
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent start",
                ]);
                let res = await next();
                context.set(orderContext, [
                  ...context.get(orderContext),
                  "parent end",
                ]);
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
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 start",
                    ]);
                    let res = await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 1 end",
                    ]);
                    return res;
                  },
                  async ({ request, context }, next) => {
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 start",
                    ]);
                    await next();
                    context.set(orderContext, [
                      ...context.get(orderContext),
                      "child 2 end - throwing",
                    ]);
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

        let requestContext = new unstable_RouterContextProvider();
        let res = await handler.queryRoute(
          new Request("http://localhost/parent/child", {
            method: "post",
            body: createFormData({}),
          }),
          { requestContext, unstable_respond: (v) => v }
        );
        expect(await res.text()).toEqual("Error: child 2 error");

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
        ]);
      });

      it("allows thrown redirects before next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            path: "/parent",
            unstable_middleware: [
              async (_, next) => {
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
              async (_, next) => {
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
