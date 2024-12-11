import { createMemoryHistory } from "../../lib/router/history";
import type { Router } from "../../lib/router/router";
import { createRouter } from "../../lib/router/router";
import { redirect, type DataStrategyResult } from "../../lib/router/utils";
import { cleanup } from "./utils/data-router-setup";
import { createFormData, tick } from "./utils/utils";

let router: Router;

afterEach(() => cleanup(router));

describe("context/middleware", () => {
  describe("context", () => {
    it("provides context to loaders and actions", async () => {
      let context = { count: 1 };
      router = createRouter({
        history: createMemoryHistory(),
        context,
        routes: [
          {
            path: "/",
          },
          {
            id: "a",
            path: "/a",
            loader({ context }) {
              return ++context.count;
            },
          },
          {
            id: "b",
            path: "/b",
            action({ context }) {
              return ++context.count;
            },
            loader({ context }) {
              return ++context.count;
            },
          },
        ],
      });

      await router.navigate("/a");
      expect(router.state.loaderData.a).toBe(2);
      expect(context.count).toBe(2);

      await router.navigate("/b", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(router.state.actionData?.b).toBe(3);
      expect(router.state.loaderData.b).toBe(4);
      expect(context.count).toBe(4);
    });

    it("works with dataStrategy for a sequential implementation", async () => {
      let context = {};
      router = createRouter({
        history: createMemoryHistory(),
        context,
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
              return "PARENT";
            },
            children: [
              {
                id: "child",
                path: "child",
                loader({ context }) {
                  context.parent += " (amended from child)";
                  context.child = "CHILD MIDDLEWARE";
                  return "CHILD";
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

      expect(context).toEqual({
        child: "CHILD MIDDLEWARE",
        parent: "PARENT MIDDLEWARE (amended from child)",
      });
      expect(router.state.loaderData).toEqual({
        child: "CHILD",
        parent: "PARENT",
      });
    });

    it("works with dataStrategy for an easy middleware implementation", async () => {
      let context = {};
      router = createRouter({
        history: createMemoryHistory(),
        context,
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            loader: ({ context }) => ({ contextSnapshot: { ...context } }),
            handle: {
              middleware(context) {
                context.parent = "PARENT MIDDLEWARE";
              },
            },
            children: [
              {
                id: "child",
                path: "child",
                loader: ({ context }) => ({ contextSnapshot: { ...context } }),
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

      expect(context).toEqual({
        child: "CHILD MIDDLEWARE",
        parent: "PARENT MIDDLEWARE (amended from child)",
      });
      expect(router.state.loaderData).toEqual({
        child: {
          contextSnapshot: {
            child: "CHILD MIDDLEWARE",
            parent: "PARENT MIDDLEWARE (amended from child)",
          },
        },
        parent: {
          contextSnapshot: {
            child: "CHILD MIDDLEWARE",
            parent: "PARENT MIDDLEWARE (amended from child)",
          },
        },
      });
    });
  });

  describe("middleware", () => {
    it("runs middleware sequentially before and after loaders", async () => {
      let context = { order: [] };
      let getMiddleware =
        (name: string) =>
        async ({ context }, next) => {
          context.order.push(`${name} middleware - before next()`);
          await tick(); // Force asyncronisity to ensure ordering is correct
          await next();
          await tick(); // Force asyncronisity to ensure ordering is correct
          context.order.push(`${name} middleware - after next()`);
        };
      router = createRouter({
        history: createMemoryHistory(),
        context,
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [getMiddleware("a"), getMiddleware("b")],
            loader({ context }) {
              context.order.push("parent loader");
            },
            children: [
              {
                id: "child",
                path: "child",
                middleware: [getMiddleware("c"), getMiddleware("d")],
                loader({ context }) {
                  context.order.push("child loader");
                },
              },
            ],
          },
        ],
      });

      await router.navigate("/parent/child");

      expect(context).toEqual({
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

    it("does not return result of middleware in client side routers", async () => {
      let context = {};
      router = createRouter({
        history: createMemoryHistory(),
        context,
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [
              async ({ context }, next) => {
                context.parent1 = await next();
                return "NOPE";
              },
              async ({ context }, next) => {
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
                  async ({ context }, next) => {
                    context.child1 = await next();
                    return "NOPE";
                  },
                  async ({ context }, next) => {
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
        ],
      });

      await router.navigate("/parent/child");

      expect(context).toEqual({
        child1: undefined,
        child2: undefined,
        parent1: undefined,
        parent2: undefined,
      });
      expect(router.state.loaderData).toEqual({
        child: "CHILD",
        parent: "PARENT",
      });
    });

    it("throwing from a middleware short circuits immediately (going down)", async () => {
      let context = {};
      router = createRouter({
        history: createMemoryHistory(),
        context,
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [
              async ({ context }, next) => {
                context.parent1 = "PARENT 1";
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
        ],
      });

      await router.navigate("/parent/child");

      expect(context).toEqual({
        parent1: "PARENT 1",
      });
      expect(router.state.loaderData).toEqual({});
      expect(router.state.errors).toEqual({
        parent: new Error("PARENT 2"),
      });
    });

    it("throwing from a middleware short circuits immediately (going up)", async () => {
      let context = {};
      router = createRouter({
        history: createMemoryHistory(),
        context,
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [
              async ({ context }, next) => {
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
                  async ({ context }, next) => {
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
        ],
      });

      await router.navigate("/parent/child");

      expect(context).toEqual({
        child: "CHILD DOWN",
        parent: "PARENT DOWN",
      });
      expect(router.state.loaderData).toEqual({
        parent: "PARENT",
      });
      expect(router.state.errors).toEqual({
        parent: new Error("CHILD UP"),
      });
    });

    it("does not require that you call next()", async () => {
      let context = {};
      router = createRouter({
        history: createMemoryHistory(),
        context,
        routes: [
          {
            path: "/",
          },
          {
            id: "parent",
            path: "/parent",
            middleware: [
              ({ context }, next) => {
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
                  ({ context }, next) => {
                    context.child = "CHILD MIDDLEWARE";
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

      expect(context).toEqual({
        child: "CHILD MIDDLEWARE",
        parent: "PARENT MIDDLEWARE",
      });
      expect(router.state.loaderData).toEqual({
        child: "CHILD",
        parent: "PARENT",
      });
      expect(router.state.errors).toBeNull();
    });

    it("errors if you try to call next more thn once in a middleware", async () => {
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
  });
});
