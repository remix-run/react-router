import { createMemoryHistory } from "../../lib/router/history";
import type { Router, StaticHandlerContext } from "../../lib/router/router";
import {
  createRouter,
  createStaticHandler,
  isDataWithResponseInit,
  isResponse,
} from "../../lib/router/router";
import type {
  DataStrategyResult,
  MiddlewareFunction,
  unstable_RouterContext,
} from "../../lib/router/utils";
import {
  unstable_createContext,
  redirect,
  unstable_RouterContextProvider,
  data,
  ErrorResponseImpl,
} from "../../lib/router/utils";
import { cleanup } from "./utils/data-router-setup";
import { createFormData, invariant, tick } from "./utils/utils";

let router: Router;

afterEach(() => cleanup(router));

declare module "../../lib/router/utils" {
  interface unstable_RouterContext {
    count?: { value: number };
    order?: string[];
  }
}

function respondWithJson(staticContext: StaticHandlerContext | Response) {
  invariant(!isResponse(staticContext), "Expected a StaticHandlerContext");
  return new Response(
    JSON.stringify(staticContext, (key, value) =>
      value instanceof Error ? `ERROR: ${value.message}` : value,
    ),
    {
      status: staticContext.statusCode ?? 200,
      headers: {
        "Content-Type": "application/json",
      },
    },
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

  let pushOrderContext = (
    context: Readonly<unstable_RouterContextProvider>,
    value: string,
  ) => context.set(orderContext, [...(context.get(orderContext) || []), value]);

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
                      context.get(parentContext) + " (amended from child)",
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
            }),
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
      name: string,
    ): MiddlewareFunction {
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
              middleware: [
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
                  middleware: [
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

      it("runs middleware even if no loaders exist", async () => {
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
              middleware: [
                async ({ context }, next) => {
                  await next();
                  // Grab a snapshot at the end of the upwards middleware chain
                  snapshot = context.get(orderContext);
                },
                getOrderMiddleware(orderContext, "a"),
                getOrderMiddleware(orderContext, "b"),
              ],
              children: [
                {
                  id: "child",
                  path: "child",
                  middleware: [
                    getOrderMiddleware(orderContext, "c"),
                    getOrderMiddleware(orderContext, "d"),
                  ],
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
              middleware: [
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
                  middleware: [
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

      it("returns result of middleware in client side routers", async () => {
        let values: unknown[] = [];
        let consoleSpy = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});
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
                async ({ context }, next) => {
                  let results = await next();
                  values.push({ ...results });
                  return results;
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
                    async ({ context }, next) => {
                      let results = await next();
                      values.push({ ...results });
                      return results;
                    },
                  ],
                  loader() {
                    return "CHILD";
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toMatchObject({
          parent: "PARENT",
          child: "CHILD",
        });
        expect(values).toEqual([
          {
            parent: { type: "data", result: "PARENT" },
            child: { type: "data", result: "CHILD" },
          },
          {
            parent: { type: "data", result: "PARENT" },
            child: { type: "data", result: "CHILD" },
          },
        ]);

        consoleSpy.mockRestore();
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
              middleware: [
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
                  middleware: [
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
              middleware: [
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
              middleware: [
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

    describe("lazy", () => {
      it("runs lazy loaded middleware", async () => {
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
              lazy: {
                middleware: async () => [
                  async ({ context }, next) => {
                    await next();
                    // Grab a snapshot at the end of the upwards middleware chain
                    snapshot = context.get(orderContext);
                  },
                  getOrderMiddleware(orderContext, "a"),
                  getOrderMiddleware(orderContext, "b"),
                ],
              },
              loader({ context }) {
                context.get(orderContext).push("parent loader");
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  lazy: {
                    middleware: async () => [
                      getOrderMiddleware(orderContext, "c"),
                      getOrderMiddleware(orderContext, "d"),
                    ],
                  },
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

      it("runs lazy loaded middleware when static middleware is defined", async () => {
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
              middleware: [
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
                  lazy: {
                    middleware: async () => [
                      getOrderMiddleware(orderContext, "c"),
                      getOrderMiddleware(orderContext, "d"),
                    ],
                  },
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

      it("ignores middleware returned from route.lazy function", async () => {
        let snapshot;

        let consoleWarn = jest
          .spyOn(console, "warn")
          .mockImplementation(() => {});

        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              lazy: {
                middleware: async () => [
                  async ({ context }, next) => {
                    await next();
                    // Grab a snapshot at the end of the upwards middleware chain
                    snapshot = context.get(orderContext);
                  },
                  getOrderMiddleware(orderContext, "a"),
                  getOrderMiddleware(orderContext, "b"),
                ],
              },
              loader({ context }) {
                context.get(orderContext).push("parent loader");
              },
              children: [
                {
                  id: "child",
                  path: "child",
                  // @ts-expect-error
                  lazy: async () => ({
                    middleware: [
                      getOrderMiddleware(orderContext, "c"),
                      getOrderMiddleware(orderContext, "d"),
                    ],
                  }),
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
          "parent loader",
          "child loader",
          "b middleware - after next()",
          "a middleware - after next()",
        ]);

        expect(consoleWarn).toHaveBeenCalledWith(
          "Route property middleware is not a supported property to be returned from a lazy route function. This property will be ignored.",
        );
      });
    });

    describe("throwing", () => {
      it("throwing from a middleware bubbles up (going down - loader)", async () => {
        let context = new unstable_RouterContextProvider();
        router = createRouter({
          history: createMemoryHistory(),
          unstable_getContext: () => context,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
                async ({ context }, next) => {
                  pushOrderContext(context, "PARENT DOWN");
                  await next();
                  pushOrderContext(context, "PARENT UP");
                },
                () => {
                  throw new Error("PARENT ERROR");
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
                    async ({ context }, next) => {
                      context.set(orderContext, [
                        ...(context.get(orderContext) || []),
                        "CHILD DOWN",
                      ]);
                      await next();
                      context.set(orderContext, [
                        ...(context.get(orderContext) || []),
                        "CHILD UP",
                      ]);
                    },
                  ],
                  loader() {
                    return "CHILD";
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toEqual({});
        expect(router.state.errors).toEqual({
          parent: new Error("PARENT ERROR"),
        });
        expect(context.get(orderContext)).toEqual(["PARENT DOWN", "PARENT UP"]);
      });

      it("throwing from a middleware bubbles up (going up - loader)", async () => {
        let context = new unstable_RouterContextProvider();
        router = createRouter({
          history: createMemoryHistory(),
          unstable_getContext: () => context,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
                async (_, next) => {
                  pushOrderContext(context, "PARENT DOWN");
                  await next();
                  pushOrderContext(context, "PARENT UP");
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
                    async (_, next) => {
                      pushOrderContext(context, "CHILD DOWN");
                      await next();
                      throw new Error("CHILD UP");
                    },
                  ],
                  loader() {
                    return "CHILD";
                  },
                },
              ],
            },
          ],
        });

        await router.navigate("/parent/child");

        expect(router.state.loaderData).toEqual({
          parent: "PARENT",
        });
        expect(router.state.errors).toEqual({
          parent: new Error("CHILD UP"),
        });
        expect(context.get(orderContext)).toEqual([
          "PARENT DOWN",
          "CHILD DOWN",
          "PARENT UP",
        ]);
      });

      it("throwing from a middleware short circuits immediately (going down - action w/boundary)", async () => {
        let context = new unstable_RouterContextProvider();
        router = createRouter({
          history: createMemoryHistory(),
          unstable_getContext: () => context,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
                async ({ request, context }, next) => {
                  if (request.method !== "GET") {
                    pushOrderContext(context, "parent action start");
                    await next();
                    pushOrderContext(context, "parent action end");
                  } else {
                    pushOrderContext(context, "parent loader start");
                    await next();
                    pushOrderContext(context, "parent loader end");
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
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        pushOrderContext(context, "child 1 start - throwing");
                        throw new Error("child 1 action error");
                      } else {
                        pushOrderContext(context, "child 1 loader start");
                        await next();
                        pushOrderContext(context, "child 1 loader end");
                      }
                    },
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        pushOrderContext(context, "child 2 start");
                        await next();
                        pushOrderContext(context, "child 2 end");
                      } else {
                        pushOrderContext(context, "child 2 loader start");
                        await next();
                        pushOrderContext(context, "child 2 loader end");
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

        expect(context.get(orderContext)).toEqual([
          "parent action start",
          "child 1 start - throwing",
          "parent action end",
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
        let context = new unstable_RouterContextProvider();
        router = createRouter({
          history: createMemoryHistory(),
          unstable_getContext: () => context,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              middleware: [
                async ({ context }, next) => {
                  await next();
                },
                async ({ request, context }, next) => {
                  if (request.method !== "GET") {
                    pushOrderContext(context, "parent action start");
                    await next();
                    pushOrderContext(context, "parent action end");
                  } else {
                    pushOrderContext(context, "parent loader start");
                    await next();
                    pushOrderContext(context, "parent loader end");
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
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        pushOrderContext(context, "child 1 start");
                        await next();
                        pushOrderContext(context, "child 1 end");
                      } else {
                        pushOrderContext(context, "child 1 loader start");
                        await next();
                        pushOrderContext(context, "child 1 loader end");
                      }
                    },
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        pushOrderContext(context, "child 2 start");
                        await next();
                        pushOrderContext(context, "child 2 end - throwing");
                        throw new Error("child 2 action error");
                      } else {
                        pushOrderContext(context, "child 2 loader start");
                        await next();
                        pushOrderContext(context, "child 2 loader end");
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

        expect(context.get(orderContext)).toEqual([
          "parent action start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
          "child 1 end",
          "parent action end",
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
        let context = new unstable_RouterContextProvider();
        router = createRouter({
          history: createMemoryHistory(),
          unstable_getContext: () => context,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              hasErrorBoundary: true,
              middleware: [
                async ({ request, context }, next) => {
                  if (request.method !== "GET") {
                    pushOrderContext(context, "parent action start");
                    await next();
                    pushOrderContext(context, "parent action end");
                  } else {
                    pushOrderContext(context, "parent loader start");
                    await next();
                    pushOrderContext(context, "parent loader end");
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
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        pushOrderContext(context, "child 1 start - throwing");
                        throw new Error("child 1 action error");
                      } else {
                        pushOrderContext(context, "child 1 loader start");
                        await next();
                        pushOrderContext(context, "child 1 loader end");
                      }
                    },
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        pushOrderContext(context, "child 2 start");
                        await next();
                        pushOrderContext(context, "child 2 end");
                      } else {
                        pushOrderContext(context, "child 2 loader start");
                        await next();
                        pushOrderContext(context, "child 2 loader end");
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

        expect(context.get(orderContext)).toEqual([
          "parent action start",
          "child 1 start - throwing",
          "parent action end",
          "parent loader start",
          "child 1 loader start",
          "child 2 loader start",
          "child 2 loader end",
          "child 1 loader end",
          "parent loader end",
        ]);
        expect(router.state.loaderData).toEqual({});
        expect(router.state.errors).toEqual({
          parent: new Error("child 1 action error"),
        });
      });

      it("throwing from a middleware short circuits immediately (going up - action w/o boundary)", async () => {
        let context = new unstable_RouterContextProvider();
        router = createRouter({
          history: createMemoryHistory(),
          unstable_getContext: () => context,
          routes: [
            {
              path: "/",
            },
            {
              id: "parent",
              path: "/parent",
              hasErrorBoundary: true,
              middleware: [
                async ({ request, context }, next) => {
                  if (request.method !== "GET") {
                    pushOrderContext(context, "parent action start");
                    await next();
                    pushOrderContext(context, "parent action end");
                  } else {
                    pushOrderContext(context, "parent loader start");
                    await next();
                    pushOrderContext(context, "parent loader end");
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
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        pushOrderContext(context, "child 1 start");
                        await next();
                        pushOrderContext(context, "child 1 end");
                      } else {
                        pushOrderContext(context, "child 1 loader start");
                        await next();
                        pushOrderContext(context, "child 1 loader end");
                      }
                    },
                    async ({ request, context }, next) => {
                      if (request.method !== "GET") {
                        pushOrderContext(context, "child 2 start");
                        await next();
                        pushOrderContext(context, "child 2 end - throwing");
                        throw new Error("child 2 action error");
                      } else {
                        pushOrderContext(context, "child 2 loader start");
                        await next();
                        pushOrderContext(context, "child 2 loader end");
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

        expect(context.get(orderContext)).toEqual([
          "parent action start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
          "child 1 end",
          "parent action end",
          "parent loader start",
          "child 1 loader start",
          "child 2 loader start",
          "child 2 loader end",
          "child 1 loader end",
          "parent loader end",
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
              middleware: [
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
              middleware: [
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

      it("throwing from a middleware before next bubbles up to the highest route with a loader", async () => {
        router = createRouter({
          history: createMemoryHistory(),
          routes: [
            {
              path: "/",
            },
            {
              id: "a",
              path: "/a",
              hasErrorBoundary: true,
              children: [
                {
                  id: "b",
                  path: "b",
                  hasErrorBoundary: true,
                  loader: () => "B",
                  children: [
                    {
                      id: "c",
                      path: "c",
                      hasErrorBoundary: true,
                      children: [
                        {
                          id: "d",
                          path: "d",
                          hasErrorBoundary: true,
                          middleware: [
                            () => {
                              throw new Error("D ERROR");
                            },
                          ],
                          loader: () => "D",
                        },
                        {
                          id: "e",
                          path: "e",
                          hasErrorBoundary: true,
                          middleware: [
                            () => {
                              throw new Error("E ERROR");
                            },
                          ],
                          loader: () => "E",
                        },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        });

        // Bubbles to B because it's the initial load and it's loader hasn't run
        await router.navigate("/a/b/c/d");
        expect(router.state.loaderData).toEqual({});
        expect(router.state.errors).toEqual({
          b: new Error("D ERROR"),
        });

        // Load data into B
        await router.navigate("/a/b");
        expect(router.state.loaderData).toEqual({ b: "B" });
        expect(router.state.errors).toEqual(null);

        // B doesn't have to revalidate so we can surface this error at E
        await router.navigate("/a/b/c/e");
        expect(router.state.loaderData).toEqual({ b: "B" });
        expect(router.state.errors).toEqual({
          e: new Error("E ERROR"),
        });
      });
    });
  });

  describe("middleware - handler.query", () => {
    function getOrderMiddleware(name: string): MiddlewareFunction {
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
          middleware: [
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
              middleware: [
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

      let request = new Request("http://localhost/parent/child");
      let res = (await handler.query(request, {
        unstable_generateMiddlewareResponse: async (q) =>
          respondWithJson(await q(request)),
      })) as Response;
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

    it("propagates a Response through lazy middleware when a `respond` API is passed", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          lazy: {
            middleware: async () => [
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
          },
          loader() {
            return "PARENT";
          },
          children: [
            {
              id: "child",
              path: "child",
              lazy: {
                middleware: async () => [
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
              },
              loader() {
                return "CHILD";
              },
            },
          ],
        },
      ]);

      let request = new Request("http://localhost/parent/child");
      let res = (await handler.query(request, {
        unstable_generateMiddlewareResponse: async (q) =>
          respondWithJson(await q(request)),
      })) as Response;
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
          middleware: [
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

      let request = new Request("http://localhost/parent");
      let res = (await handler.query(request, {
        unstable_generateMiddlewareResponse: async (q) =>
          respondWithJson(await q(request)),
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

    it("propagates a returned response if next isn't called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              return new Response("test");
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.query(request, {
        unstable_generateMiddlewareResponse: async (q) =>
          respondWithJson(await q(request)),
      })) as Response;
      await expect(res.text()).resolves.toEqual("test");
    });

    it("propagates a returned data() response if next isn't called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              let result = await next();
              expect(isDataWithResponseInit(result)).toBe(false);
              expect(isResponse(result)).toBe(true);
              return result;
            },
            async (_, next) => {
              return data("not found", { status: 404 });
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.query(request, {
        unstable_generateMiddlewareResponse: async (q) =>
          respondWithJson(await q(request)),
      })) as Response;
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual("not found");
    });

    it("propagates a thrown data() response if next isn't called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              let result = await next();
              expect(isDataWithResponseInit(result)).toBe(false);
              expect(isResponse(result)).toBe(true);
              return result;
            },
            async (_, next) => {
              throw data("not found", { status: 404, statusText: "Not Found" });
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.query(request, {
        unstable_generateMiddlewareResponse: async (q) =>
          respondWithJson(await q(request)),
      })) as Response;
      expect(res.status).toBe(404);
      let staticContext = (await res.json()) as StaticHandlerContext;
      expect(staticContext).toMatchObject({
        location: {
          pathname: "/parent",
        },
        statusCode: 404,
        loaderData: {},
        actionData: null,
        errors: {
          parent: {
            status: 404,
            statusText: "Not Found",
            data: "not found",
          },
        },
      });
    });

    it("propagates a returned data() response if next is called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              let result = await next();
              expect(isDataWithResponseInit(result)).toBe(false);
              expect(isResponse(result)).toBe(true);
              return result;
            },
            async (_, next) => {
              await next();
              return data("not found", { status: 404 });
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.query(request, {
        unstable_generateMiddlewareResponse: async (q) =>
          respondWithJson(await q(request)),
      })) as Response;
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual("not found");
    });

    it("propagates a thrown data() response if next is called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              let result = await next();
              expect(isDataWithResponseInit(result)).toBe(false);
              expect(isResponse(result)).toBe(true);
              return result;
            },
            async (_, next) => {
              await next();
              throw data("not found", { status: 404, statusText: "Not Found" });
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.query(request, {
        unstable_generateMiddlewareResponse: async (q) =>
          respondWithJson(await q(request)),
      })) as Response;
      expect(res.status).toBe(404);
      let staticContext = (await res.json()) as StaticHandlerContext;
      expect(staticContext).toMatchObject({
        location: {
          pathname: "/parent",
        },
        statusCode: 404,
        loaderData: {},
        actionData: null,
        errors: {
          parent: {
            status: 404,
            statusText: "Not Found",
            data: "not found",
          },
        },
      });
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
              context.set(orderContext, [
                ...context.get(orderContext),
                "parent loader",
              ]);
            },
            children: [
              {
                id: "child",
                path: "child",
                middleware: [getOrderMiddleware("c"), getOrderMiddleware("d")],
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
        let request = new Request("http://localhost/parent/child");
        await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
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
            middleware: [getOrderMiddleware("a"), getOrderMiddleware("b")],
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
                middleware: [getOrderMiddleware("c"), getOrderMiddleware("d")],
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        });

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
            middleware: [
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
                middleware: [
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
        let request = new Request("http://localhost/parent/child");
        let res = (await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;
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
            middleware: [
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

        let request = new Request("http://localhost/parent");
        let res = (await handler.query(request, {
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
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
            middleware: [
              async ({ context }, next) => {
                pushOrderContext(context, "PARENT 1 DOWN");
                await next();
                pushOrderContext(context, "PARENT 1 UP");
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
                middleware: [
                  async ({ context }, next) => {
                    pushOrderContext(context, "CHILD DOWN");
                    await next();
                    pushOrderContext(context, "CHILD UP");
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
        let request = new Request("http://localhost/parent/child");
        let res = (await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "PARENT 1 DOWN",
          "PARENT 1 UP",
        ]);
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
            middleware: [
              async ({ context }, next) => {
                pushOrderContext(context, "PARENT DOWN");
                await next();
                pushOrderContext(context, "PARENT UP");
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
                  async ({ context }, next) => {
                    pushOrderContext(context, "CHILD DOWN");
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
        let request = new Request("http://localhost/parent/child");
        let res = (await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "PARENT DOWN",
          "CHILD DOWN",
          "PARENT UP",
        ]);
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
            middleware: [
              async ({ request, context }, next) => {
                pushOrderContext(context, "parent start");
                let res = await next();
                pushOrderContext(context, "parent end");
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
                middleware: [
                  async ({ request, context }, next) => {
                    pushOrderContext(context, "child 1 start - throwing");
                    throw new Error("child 1 error");
                  },
                  async ({ request, context }, next) => {
                    pushOrderContext(context, "child 2 start");
                    let res = await next();
                    pushOrderContext(context, "child 2 end");
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        let res = (await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start - throwing",
          "parent end",
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
            middleware: [
              async ({ request, context }, next) => {
                pushOrderContext(context, "parent start");
                let res = await next();
                pushOrderContext(context, "parent end");
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
                middleware: [
                  async ({ request, context }, next) => {
                    pushOrderContext(context, "child 1 start");
                    await next();
                    pushOrderContext(context, "child 1 end");
                  },
                  async ({ request, context }, next) => {
                    pushOrderContext(context, "child 2 start");
                    await next();
                    pushOrderContext(context, "child 2 end - throwing");
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        let res = (await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
          "child 1 end",
          "parent end",
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
            middleware: [
              async ({ request, context }, next) => {
                pushOrderContext(context, "parent start");
                let res = await next();
                pushOrderContext(context, "parent end");
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
                  async ({ request, context }, next) => {
                    pushOrderContext(context, "child 1 start - throwing");
                    throw new Error("child 1 error");
                  },
                  async ({ request, context }, next) => {
                    pushOrderContext(context, "child 2 start");
                    let res = await next();
                    pushOrderContext(context, "child 2 end");
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        let res = (await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start - throwing",
          "parent end",
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
            middleware: [
              async ({ request, context }, next) => {
                pushOrderContext(context, "parent start");
                let res = await next();
                pushOrderContext(context, "parent end");
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
                  async ({ request, context }, next) => {
                    pushOrderContext(context, "child 1 start");
                    let res = await next();
                    pushOrderContext(context, "child 1 end");
                    return res;
                  },
                  async ({ request, context }, next) => {
                    pushOrderContext(context, "child 2 start");
                    await next();
                    pushOrderContext(context, "child 2 end - throwing");
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        let res = (await handler.query(request, {
          requestContext,
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;
        let staticContext = (await res.json()) as StaticHandlerContext;

        expect(requestContext.get(orderContext)).toEqual([
          "parent start",
          "child 1 start",
          "child 2 start",
          "child 2 end - throwing",
          "child 1 end",
          "parent end",
        ]);
        expect(staticContext.loaderData).toEqual({
          parent: "PARENT",
        });
        expect(staticContext.errors).toEqual({
          parent: "ERROR: child 2 error",
        });
      });

      it("handles thrown Responses at the ErrorBoundary", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
            middleware: [
              async (_, next) => {
                throw new Response("Error", { status: 401 });
              },
            ],
            loader() {
              return "INDEX";
            },
          },
        ]);

        let request = new Request("http://localhost/");
        let res = (await handler.query(request, {
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;

        let staticContext = (await res.json()) as StaticHandlerContext;
        expect(staticContext.errors).toEqual({
          "0": new ErrorResponseImpl(401, undefined, "Error"),
        });
        expect(staticContext.statusCode).toBe(401);
      });

      it("allows thrown redirects before next()", async () => {
        let handler = createStaticHandler([
          {
            path: "/",
          },
          {
            path: "/parent",
            middleware: [
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

        let request = new Request("http://localhost/parent");
        let response = (await handler.query(request, {
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;

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

        let request = new Request("http://localhost/parent");
        let response = (await handler.query(request, {
          unstable_generateMiddlewareResponse: async (q) =>
            respondWithJson(await q(request)),
        })) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/target");
      });
    });
  });

  describe("middleware - handler.queryRoute", () => {
    function getOrderMiddleware(name: string): MiddlewareFunction {
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
          middleware: [
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
              middleware: [
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

      let request = new Request("http://localhost/parent/child");
      let res = (await handler.queryRoute(request, {
        unstable_generateMiddlewareResponse: (q) => q(request),
      })) as Response;

      expect(await res.text()).toBe("CHILD");
      expect(res.headers.get("parent1")).toEqual("yes");
      expect(res.headers.get("parent2")).toEqual("yes");
      expect(res.headers.get("child1")).toEqual("yes");
      expect(res.headers.get("child2")).toEqual("yes");
    });

    it("propagates a Response through lazy middleware when a `respond` API is passed", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          lazy: {
            middleware: async () => [
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
          },
          loader() {
            return new Response("PARENT");
          },
          children: [
            {
              id: "child",
              path: "child",
              lazy: {
                middleware: async () => [
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
              },
              loader({ context }) {
                return new Response("CHILD");
              },
            },
          ],
        },
      ]);

      let request = new Request("http://localhost/parent/child");
      let res = (await handler.queryRoute(request, {
        unstable_generateMiddlewareResponse: (q) => q(request),
      })) as Response;

      expect(await res.text()).toBe("CHILD");
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
          middleware: [
            async (_, next) => {
              let res = (await next()) as Response;
              res.headers.set("parent", "yes");
            },
          ],
          loader() {
            return new Response("PARENT");
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.queryRoute(request, {
        unstable_generateMiddlewareResponse: (q) => q(request),
      })) as Response;

      expect(await res.text()).toBe("PARENT");
      expect(res.headers.get("parent")).toEqual("yes");
    });

    it("propagates a returned response if next isn't called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              return new Response("test");
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.queryRoute(request, {
        unstable_generateMiddlewareResponse: (q) => q(request),
      })) as Response;
      await expect(res.text()).resolves.toEqual("test");
    });

    it("propagates a returned data() response if next isn't called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              let result = await next();
              expect(isDataWithResponseInit(result)).toBe(false);
              expect(isResponse(result)).toBe(true);
              return result;
            },
            async (_, next) => {
              return data("not found", { status: 404 });
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.queryRoute(request, {
        unstable_generateMiddlewareResponse: (q) => q(request),
      })) as Response;
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual("not found");
    });

    it("propagates a thrown data() response if next isn't called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              let result = await next();
              expect(isDataWithResponseInit(result)).toBe(false);
              expect(isResponse(result)).toBe(true);
              return result;
            },
            async (_, next) => {
              throw data("not found", { status: 404 });
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.queryRoute(request, {
        unstable_generateMiddlewareResponse: async (q) => q(request),
      })) as Response;
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual("not found");
    });

    it("propagates a returned data() response if next is called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              let result = await next();
              expect(isDataWithResponseInit(result)).toBe(false);
              expect(isResponse(result)).toBe(true);
              return result;
            },
            async (_, next) => {
              await next();
              return data("not found", { status: 404 });
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.queryRoute(request, {
        unstable_generateMiddlewareResponse: (q) => q(request),
      })) as Response;
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual("not found");
    });

    it("propagates a thrown data() response if next is called", async () => {
      let handler = createStaticHandler([
        {
          path: "/",
        },
        {
          id: "parent",
          path: "/parent",
          middleware: [
            async (_, next) => {
              let result = await next();
              expect(isDataWithResponseInit(result)).toBe(false);
              expect(isResponse(result)).toBe(true);
              return result;
            },
            async (_, next) => {
              await next();
              throw data("not found", { status: 404 });
            },
          ],
          loader() {
            return "PARENT";
          },
        },
      ]);

      let request = new Request("http://localhost/parent");
      let res = (await handler.queryRoute(request, {
        unstable_generateMiddlewareResponse: async (q) => q(request),
      })) as Response;
      expect(res.status).toBe(404);
      await expect(res.json()).resolves.toEqual("not found");
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
              context.set(orderContext, [
                ...context.get(orderContext),
                "parent loader",
              ]);
            },
            children: [
              {
                id: "child",
                path: "child",
                middleware: [getOrderMiddleware("c"), getOrderMiddleware("d")],
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
        let request = new Request("http://localhost/parent/child");
        await handler.queryRoute(request, {
          requestContext,
          unstable_generateMiddlewareResponse: (q) => q(request),
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
            middleware: [getOrderMiddleware("a"), getOrderMiddleware("b")],
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
                middleware: [getOrderMiddleware("c"), getOrderMiddleware("d")],
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        await handler.queryRoute(request, {
          requestContext,
          unstable_generateMiddlewareResponse: (q) => q(request),
        });

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
            middleware: [
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
                middleware: [
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
        let request = new Request("http://localhost/parent/child");
        let response = (await handler.queryRoute(request, {
          requestContext,
          unstable_generateMiddlewareResponse: (q) => q(request),
        })) as Response;

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
            middleware: [
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

        let request = new Request("http://localhost/parent/");
        await expect(
          handler.queryRoute(request, {
            unstable_generateMiddlewareResponse: (q) => q(request),
          }),
        ).rejects.toThrow("You may only call `next()` once per middleware");
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
                middleware: [
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
        let request = new Request("http://localhost/parent/child");
        await expect(
          handler.queryRoute(request, {
            requestContext,
            unstable_generateMiddlewareResponse: (q) => q(request),
          }),
        ).rejects.toThrow("PARENT 2");

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
            middleware: [
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
                middleware: [
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
        let request = new Request("http://localhost/parent/child");
        await expect(
          handler.queryRoute(request, {
            requestContext,
            unstable_generateMiddlewareResponse: (q) => q(request),
          }),
        ).rejects.toThrow("CHILD UP");

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
            middleware: [
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
                middleware: [
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        await expect(
          handler.queryRoute(request, {
            requestContext,
            unstable_generateMiddlewareResponse: (q) => q(request),
          }),
        ).rejects.toThrow("child 1 error");

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
            middleware: [
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
                middleware: [
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        await expect(
          handler.queryRoute(request, {
            requestContext,
            unstable_generateMiddlewareResponse: (q) => q(request),
          }),
        ).rejects.toThrow("child 2 error");

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
            middleware: [
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
                middleware: [
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        await expect(
          handler.queryRoute(request, {
            requestContext,
            unstable_generateMiddlewareResponse: (q) => q(request),
          }),
        ).rejects.toThrow("child 1 action error");

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
            middleware: [
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
                middleware: [
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
        let request = new Request("http://localhost/parent/child", {
          method: "post",
          body: createFormData({}),
        });
        await expect(
          handler.queryRoute(request, {
            requestContext,
            unstable_generateMiddlewareResponse: (q) => q(request),
          }),
        ).rejects.toThrow("child 2 error");

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
            middleware: [
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

        let request = new Request("http://localhost/parent");
        let response = (await handler.queryRoute(request, {
          unstable_generateMiddlewareResponse: (q) => q(request),
        })) as Response;

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

        let request = new Request("http://localhost/parent");
        let response = (await handler.queryRoute(request, {
          unstable_generateMiddlewareResponse: (q) => q(request),
        })) as Response;

        expect(response.status).toBe(302);
        expect(response.headers.get("Location")).toBe("/target");
      });
    });
  });
});
