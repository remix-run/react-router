import { createMemoryRouter } from "../../lib/components";
import type { StaticHandlerContext } from "../../lib/router/router";
import { createStaticHandler } from "../../lib/router/router";
import {
  ErrorResponseImpl,
  data,
  redirect,
  type ActionFunction,
  type LoaderFunction,
  type MiddlewareFunction,
  type MiddlewareNextFunction,
} from "../../lib/router/utils";
import { createRequestHandler } from "../../lib/server-runtime/server";
import { mockServerBuild } from "../server-runtime/utils";
import { cleanup, setup } from "./utils/data-router-setup";
import { createDeferred, createFormData, tick } from "./utils/utils";

// Detect any failures inside the router navigate code
afterEach(() => {
  cleanup();
});

describe("instrumentation", () => {
  describe("client-side router", () => {
    it("allows instrumentation of middleware", async () => {
      let spy = jest.fn();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            middleware: [
              async (_: unknown, next: MiddlewareNextFunction) => {
                spy("start middleware");
                await next();
                spy("end middleware");
              },
            ],
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async middleware(middleware) {
                  spy("start");
                  await middleware();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      expect(spy.mock.calls).toEqual([["start"], ["start middleware"]]);
      await A.loaders.page.resolve("PAGE");
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["start middleware"],
        ["end middleware"],
        ["end"],
      ]);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of loaders", async () => {
      let spy = jest.fn();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("start");
                  await loader();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      expect(spy).toHaveBeenNthCalledWith(1, "start");
      await A.loaders.page.resolve("PAGE");
      expect(spy).toHaveBeenNthCalledWith(2, "end");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of actions", async () => {
      let spy = jest.fn();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            action: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async action(action) {
                  spy("start");
                  await action();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy).toHaveBeenNthCalledWith(1, "start");
      await A.actions.page.resolve("PAGE");
      expect(spy).toHaveBeenNthCalledWith(2, "end");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of lazy function", async () => {
      let spy = jest.fn();
      let lazyDfd = createDeferred<{ loader: LoaderFunction }>();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            lazy: () => lazyDfd.promise,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async lazy(lazy) {
                  spy("start");
                  await lazy();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page");
      await tick();
      expect(spy.mock.calls).toEqual([["start"]]);

      await lazyDfd.resolve({ loader: () => "PAGE" });
      await tick();
      expect(spy.mock.calls).toEqual([["start"], ["end"]]);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of lazy function loaders", async () => {
      let spy = jest.fn();
      let lazyDfd = createDeferred<{ loader: LoaderFunction }>();
      let loaderDfd = createDeferred();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            lazy: () => lazyDfd.promise,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("start");
                  await loader();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page");
      expect(spy).not.toHaveBeenCalled();

      await lazyDfd.resolve({ loader: () => loaderDfd.promise });
      expect(spy.mock.calls).toEqual([["start"]]);

      await loaderDfd.resolve("PAGE");
      await tick();
      expect(spy.mock.calls).toEqual([["start"], ["end"]]);

      await tick();
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of lazy function actions", async () => {
      let spy = jest.fn();
      let lazyDfd = createDeferred<{ loader: LoaderFunction }>();
      let actionDfd = createDeferred();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            lazy: () => lazyDfd.promise,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async action(action) {
                  spy("start");
                  await action();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy).not.toHaveBeenCalled();

      await lazyDfd.resolve({ action: () => actionDfd.promise });
      expect(spy.mock.calls).toEqual([["start"]]);

      await actionDfd.resolve("PAGE");
      await tick();
      expect(spy.mock.calls).toEqual([["start"], ["end"]]);

      await tick();
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "PAGE" },
      });
    });

    it("does not double-instrument when a static `loader` is used alongside `lazy()`", async () => {
      let spy = jest.fn();
      let lazyDfd = createDeferred<{ loader: LoaderFunction }>();
      let warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
            lazy: () => lazyDfd.promise,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("start");
                  await loader();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      expect(spy.mock.calls).toEqual([["start"]]);
      await lazyDfd.resolve({ action: () => "ACTION", loader: () => "WRONG" });
      await A.loaders.page.resolve("PAGE");
      expect(spy.mock.calls).toEqual([["start"], ["end"]]);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
      spy.mockClear();

      await t.navigate("/");

      let C = await t.navigate("/page");
      expect(spy.mock.calls).toEqual([["start"]]);
      await C.loaders.page.resolve("PAGE");
      expect(spy.mock.calls).toEqual([["start"], ["end"]]);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
      spy.mockClear();

      warnSpy.mockRestore();
    });

    it("does not double-instrument when a static `action` is used alongside `lazy()`", async () => {
      let spy = jest.fn();
      let lazyDfd = createDeferred<{ loader: LoaderFunction }>();
      let warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            action: true,
            lazy: () => lazyDfd.promise,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async action(action) {
                  spy("start");
                  await action();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy.mock.calls).toEqual([["start"]]);
      await lazyDfd.resolve({ action: () => "WRONG" });
      await A.actions.page.resolve("PAGE");
      expect(spy.mock.calls).toEqual([["start"], ["end"]]);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "PAGE" },
      });
      spy.mockClear();

      let B = await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy.mock.calls).toEqual([["start"]]);
      await B.actions.page.resolve("PAGE");
      expect(spy.mock.calls).toEqual([["start"], ["end"]]);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "PAGE" },
      });
      spy.mockClear();

      warnSpy.mockRestore();
    });

    it("allows instrumentation of lazy object middleware", async () => {
      let spy = jest.fn();
      let middlewareDfd = createDeferred<MiddlewareFunction[]>();
      let loaderDfd = createDeferred<LoaderFunction>();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            lazy: {
              middleware: () => middlewareDfd.promise,
              loader: () => Promise.resolve(() => loaderDfd.promise),
            },
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                "lazy.middleware": async (middleware) => {
                  spy("start");
                  await middleware();
                  spy("end");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page");
      expect(spy.mock.calls).toEqual([["start"]]);

      await middlewareDfd.resolve([
        async (_: unknown, next: MiddlewareNextFunction) => {
          spy("middleware start");
          await next();
          spy("middleware end");
        },
      ]);
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["end"],
        ["middleware start"],
      ]);

      await loaderDfd.resolve("PAGE");
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["end"],
        ["middleware start"],
        ["middleware end"],
      ]);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of lazy object loaders", async () => {
      let spy = jest.fn();
      let loaderDfd = createDeferred<LoaderFunction>();
      let loaderValueDfd = createDeferred();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            lazy: {
              loader: () => loaderDfd.promise,
            },
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                "lazy.loader": async (load) => {
                  spy("start");
                  await load();
                  spy("end");
                },
                loader: async (loader) => {
                  spy("loader start");
                  await loader();
                  spy("loader end");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page");
      await tick();
      expect(spy.mock.calls).toEqual([["start"]]);

      await loaderDfd.resolve(() => loaderValueDfd.promise);
      await tick();
      expect(spy.mock.calls).toEqual([["start"], ["end"], ["loader start"]]);

      await loaderValueDfd.resolve("PAGE");
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["end"],
        ["loader start"],
        ["loader end"],
      ]);

      await tick();
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of lazy object actions", async () => {
      let spy = jest.fn();
      let actionDfd = createDeferred<LoaderFunction>();
      let actionValueDfd = createDeferred();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            lazy: {
              action: () => actionDfd.promise,
            },
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                "lazy.action": async (load) => {
                  spy("start");
                  await load();
                  spy("end");
                },
                action: async (action) => {
                  spy("action start");
                  await action();
                  spy("action end");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      await tick();
      expect(spy.mock.calls).toEqual([["start"]]);

      await actionDfd.resolve(() => actionValueDfd.promise);
      await tick();
      expect(spy.mock.calls).toEqual([["start"], ["end"], ["action start"]]);

      await actionValueDfd.resolve("PAGE");
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["end"],
        ["action start"],
        ["action end"],
      ]);

      await tick();
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of everything for a statically defined route", async () => {
      let spy = jest.fn();
      let middlewareDfd = createDeferred<MiddlewareFunction[]>();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            middleware: [
              async (_: unknown, next: MiddlewareNextFunction) => {
                await middlewareDfd.promise;
                return next();
              },
            ],
            loader: true,
            action: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                middleware: async (impl) => {
                  spy("start middleware");
                  await impl();
                  spy("end middleware");
                },
                action: async (impl) => {
                  spy("start action");
                  await impl();
                  spy("end action");
                },
                loader: async (impl) => {
                  spy("start loader");
                  await impl();
                  spy("end loader");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy.mock.calls).toEqual([["start middleware"]]);

      await middlewareDfd.resolve(undefined);
      await tick();
      expect(spy.mock.calls).toEqual([["start middleware"], ["start action"]]);

      await A.actions.page.resolve("ACTION");
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
        ["end middleware"],
        ["start middleware"],
        ["start loader"],
      ]);

      await A.loaders.page.resolve("PAGE");
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
        ["end middleware"],
        ["start middleware"],
        ["start loader"],
        ["end loader"],
        ["end middleware"],
      ]);

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "ACTION" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of everything for a lazy function route", async () => {
      let spy = jest.fn();
      let lazyDfd = createDeferred<any>();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            // Middleware can't be returned from lazy()
            middleware: [(_: unknown, next: MiddlewareNextFunction) => next()],
            lazy: () => lazyDfd.promise,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                middleware: async (impl) => {
                  spy("start middleware");
                  await impl();
                  spy("end middleware");
                },
                action: async (impl) => {
                  spy("start action");
                  await impl();
                  spy("end action");
                },
                loader: async (impl) => {
                  spy("start loader");
                  await impl();
                  spy("end loader");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy.mock.calls).toEqual([["start middleware"]]);

      await lazyDfd.resolve({
        loader: () => "PAGE",
        action: () => "ACTION",
      });
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
        ["end middleware"],
        ["start middleware"],
        ["start loader"],
        ["end loader"],
        ["end middleware"],
      ]);

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "ACTION" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of everything for a lazy object route", async () => {
      let spy = jest.fn();
      let middlewareDfd = createDeferred<MiddlewareFunction[]>();
      let actionDfd = createDeferred<ActionFunction>();
      let loaderDfd = createDeferred<LoaderFunction>();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            lazy: {
              middleware: () => middlewareDfd.promise,
              action: () => actionDfd.promise,
              loader: () => loaderDfd.promise,
            },
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                middleware: async (impl) => {
                  spy("start middleware");
                  await impl();
                  spy("end middleware");
                },
                action: async (impl) => {
                  spy("start action");
                  await impl();
                  spy("end action");
                },
                loader: async (impl) => {
                  spy("start loader");
                  await impl();
                  spy("end loader");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy.mock.calls).toEqual([]);

      await middlewareDfd.resolve([
        (_: unknown, next: MiddlewareNextFunction) => next(),
      ]);
      await tick();
      expect(spy.mock.calls).toEqual([["start middleware"]]);

      await actionDfd.resolve(() => "ACTION");
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
      ]);

      await loaderDfd.resolve(() => "PAGE");
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
        ["end middleware"],
        ["start middleware"],
        ["start loader"],
        ["end loader"],
        ["end middleware"],
      ]);

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "ACTION" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of everything for a statically defined route via patchRoutesOnNavigation", async () => {
      let spy = jest.fn();
      let middlewareDfd = createDeferred<MiddlewareFunction[]>();
      let t = setup({
        routes: [
          {
            index: true,
          },
        ],
        patchRoutesOnNavigation: ({ path, patch }) => {
          if (path === "/page") {
            patch(null, [
              {
                id: "page",
                path: "/page",
                middleware: [
                  async (_: unknown, next: MiddlewareNextFunction) => {
                    await middlewareDfd.promise;
                    return next();
                  },
                ],
                loader: () => "PAGE",
                action: () => "ACTION",
              },
            ]);
          }
        },
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                middleware: async (impl) => {
                  spy("start middleware");
                  await impl();
                  spy("end middleware");
                },
                action: async (impl) => {
                  spy("start action");
                  await impl();
                  spy("end action");
                },
                loader: async (impl) => {
                  spy("start loader");
                  await impl();
                  spy("end loader");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      await tick();
      await tick();
      expect(spy.mock.calls).toEqual([["start middleware"]]);

      await middlewareDfd.resolve(undefined);
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
        ["end middleware"],
        ["start middleware"],
        ["start loader"],
        ["end loader"],
        ["end middleware"],
      ]);

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "ACTION" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of everything for a lazy function route via patchRoutesOnNavigation", async () => {
      let spy = jest.fn();
      let lazyDfd = createDeferred<any>();
      let t = setup({
        routes: [
          {
            index: true,
          },
        ],
        patchRoutesOnNavigation: ({ path, patch }) => {
          if (path === "/page") {
            patch(null, [
              {
                id: "page",
                path: "/page",
                // Middleware can't be returned from lazy()
                middleware: [
                  (_: unknown, next: MiddlewareNextFunction) => next(),
                ],
                lazy: () => lazyDfd.promise,
              },
            ]);
          }
        },
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                middleware: async (impl) => {
                  spy("start middleware");
                  await impl();
                  spy("end middleware");
                },
                action: async (impl) => {
                  spy("start action");
                  await impl();
                  spy("end action");
                },
                loader: async (impl) => {
                  spy("start loader");
                  await impl();
                  spy("end loader");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy.mock.calls).toEqual([]);

      await lazyDfd.resolve({
        loader: () => "PAGE",
        action: () => "ACTION",
      });
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
        ["end middleware"],
        ["start middleware"],
        ["start loader"],
        ["end loader"],
        ["end middleware"],
      ]);

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "ACTION" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of everything for a lazy object route via patchRoutesOnNavigation", async () => {
      let spy = jest.fn();
      let middlewareDfd = createDeferred<MiddlewareFunction[]>();
      let actionDfd = createDeferred<ActionFunction>();
      let loaderDfd = createDeferred<LoaderFunction>();
      let t = setup({
        routes: [
          {
            index: true,
          },
        ],
        patchRoutesOnNavigation: ({ path, patch }) => {
          if (path === "/page") {
            patch(null, [
              {
                id: "page",
                path: "/page",
                lazy: {
                  middleware: () => middlewareDfd.promise,
                  action: () => actionDfd.promise,
                  loader: () => loaderDfd.promise,
                },
              },
            ]);
          }
        },
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                middleware: async (impl) => {
                  spy("start middleware");
                  await impl();
                  spy("end middleware");
                },
                action: async (impl) => {
                  spy("start action");
                  await impl();
                  spy("end action");
                },
                loader: async (impl) => {
                  spy("start loader");
                  await impl();
                  spy("end loader");
                },
              });
            },
          },
        ],
      });

      await t.navigate("/page", {
        formMethod: "POST",
        formData: createFormData({}),
      });
      expect(spy.mock.calls).toEqual([]);

      await middlewareDfd.resolve([
        (_: unknown, next: MiddlewareNextFunction) => next(),
      ]);
      await tick();
      expect(spy.mock.calls).toEqual([["start middleware"]]);

      await actionDfd.resolve(() => "ACTION");
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
      ]);

      await loaderDfd.resolve(() => "PAGE");
      await tick();
      expect(spy.mock.calls).toEqual([
        ["start middleware"],
        ["start action"],
        ["end action"],
        ["end middleware"],
        ["start middleware"],
        ["start loader"],
        ["end loader"],
        ["end middleware"],
      ]);

      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        actionData: { page: "ACTION" },
        loaderData: { page: "PAGE" },
      });
    });

    it("returns handler-thrown errors out to instrumentation implementations", async () => {
      let spy = jest.fn();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("inner-start");
                  let { status, error } = await loader();
                  spy(`inner-end:${status}:${(error as Error).message}`);
                },
              });
            },
          },
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("outer-start");
                  let { status, error } = await loader();
                  spy(`outer-end:${status}:${(error as Error).message}`);
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      expect(spy).toHaveBeenNthCalledWith(1, "outer-start");
      expect(spy).toHaveBeenNthCalledWith(2, "inner-start");
      await A.loaders.page.reject(new Error("broken!"));
      expect(spy).toHaveBeenNthCalledWith(3, "inner-end:error:broken!");
      expect(spy).toHaveBeenNthCalledWith(4, "outer-end:error:broken!");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: {},
        errors: {
          page: new Error("broken!"),
        },
      });
    });

    it("does not return handler-thrown Responses out to instrumentation implementations", async () => {
      let spy = jest.fn();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
          {
            id: "target",
            path: "/target",
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("inner-start");
                  let { error } = await loader();
                  // Go back to discriminated union
                  // thrown responses should not be exposed out here
                  if (error) {
                    spy("BROKEN");
                  } else {
                    spy("inner-end");
                  }
                },
              });
            },
          },
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("outer-start");
                  let { error } = await loader();
                  if (error) {
                    spy("BROKEN");
                  } else {
                    spy("outer-end");
                  }
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      expect(spy).toHaveBeenNthCalledWith(1, "outer-start");
      expect(spy).toHaveBeenNthCalledWith(2, "inner-start");
      await A.loaders.page.reject(redirect("/target"));
      expect(spy).toHaveBeenNthCalledWith(3, "inner-end");
      expect(spy).toHaveBeenNthCalledWith(4, "outer-end");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/target" },
        loaderData: {},
        errors: null,
      });
    });

    it("does not return handler-thrown data() out to instrumentation implementations", async () => {
      let spy = jest.fn();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
          {
            id: "target",
            path: "/target",
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("inner-start");
                  let { error } = await loader();
                  // Go back to discriminated union
                  // thrown responses should not be exposed out here
                  if (error) {
                    spy("BROKEN");
                  } else {
                    spy("inner-end");
                  }
                },
              });
            },
          },
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("outer-start");
                  let { error } = await loader();
                  if (error) {
                    spy("BROKEN");
                  } else {
                    spy("outer-end");
                  }
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      expect(spy).toHaveBeenNthCalledWith(1, "outer-start");
      expect(spy).toHaveBeenNthCalledWith(2, "inner-start");
      await A.loaders.page.reject(
        data({ message: "hello" }, { status: 418, statusText: "I'm a teapot" }),
      );
      expect(spy).toHaveBeenNthCalledWith(3, "inner-end");
      expect(spy).toHaveBeenNthCalledWith(4, "outer-end");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: {},
        errors: {
          page: new ErrorResponseImpl(418, "I'm a teapot", {
            message: "hello",
          }),
        },
      });
    });

    it("swallows and console.errors if an instrumentation function throws before calling the handler", async () => {
      let spy = jest.fn();
      let errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader() {
                  throw new Error("broken!");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      expect(spy).not.toHaveBeenCalled();
      await A.loaders.page.resolve("PAGE");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
        errors: null,
      });
      expect(errorSpy).toHaveBeenCalledWith(
        "An instrumentation function threw an error:",
        new Error("broken!"),
      );
      errorSpy.mockRestore();
    });

    it("swallows and warns if an instrumentation function throws after calling the handler", async () => {
      let spy = jest.fn();
      let errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("start");
                  await loader();
                  throw new Error("broken!");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      expect(spy).toHaveBeenNthCalledWith(1, "start");
      await A.loaders.page.resolve("PAGE");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
        errors: null,
      });
      expect(errorSpy).toHaveBeenCalledWith(
        "An instrumentation function threw an error:",
        new Error("broken!"),
      );
      errorSpy.mockRestore();
    });

    it("waits for handler to finish if you forget to await the handler", async () => {
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  loader();
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      await A.loaders.page.resolve("PAGE");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
        errors: null,
      });
      expect(A.loaders.page.stub).toHaveBeenCalledTimes(1);
    });

    it("does not let you call handlers more than once", async () => {
      let errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  await loader();
                  await loader();
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      await A.loaders.page.resolve("PAGE");
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
        errors: null,
      });
      expect(A.loaders.page.stub).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        "You cannot call instrumented handlers more than once",
      );
      errorSpy.mockRestore();
    });

    it("provides read-only information to instrumentation wrappers", async () => {
      let spy = jest.fn();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "slug",
            path: "/:slug",
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader, info) {
                  spy(info);
                  Object.assign(info.params, { extra: "extra" });
                  await loader();
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/a");
      await A.loaders.slug.resolve("A");
      let args = spy.mock.calls[0][0];
      expect(args.request.method).toBe("GET");
      expect(args.request.url).toBe("http://localhost/a");
      expect(args.request.url).toBe("http://localhost/a");
      expect(args.request.headers.get).toBeDefined();
      expect(args.request.headers.set).not.toBeDefined();
      expect(args.params).toEqual({ slug: "a", extra: "extra" });
      expect(args.unstable_pattern).toBe("/:slug");
      expect(args.context.get).toBeDefined();
      expect(args.context.set).not.toBeDefined();
      expect(t.router.state.matches[0].params).toEqual({ slug: "a" });
    });

    it("allows composition of multiple instrumentations", async () => {
      let spy = jest.fn();
      let t = setup({
        routes: [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: true,
          },
        ],
        unstable_instrumentations: [
          {
            route(route) {
              route.instrument({
                async loader(loader) {
                  spy("start inner");
                  await loader();
                  spy("end inner");
                },
              });
              route.instrument({
                async loader(loader) {
                  spy("start outer");
                  await loader();
                  spy("end outer");
                },
              });
            },
          },
        ],
      });

      let A = await t.navigate("/page");
      await A.loaders.page.resolve("PAGE");
      expect(spy.mock.calls).toEqual([
        ["start outer"],
        ["start inner"],
        ["end inner"],
        ["end outer"],
      ]);
      expect(t.router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of navigations", async () => {
      let spy = jest.fn();
      let router = createMemoryRouter(
        [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: () => "PAGE",
          },
        ],
        {
          unstable_instrumentations: [
            {
              router(router) {
                router.instrument({
                  async navigate(navigate, info) {
                    spy("start", info);
                    await navigate();
                    spy("end", info);
                  },
                });
              },
            },
          ],
        },
      );

      await router.navigate("/page");
      expect(spy.mock.calls).toEqual([
        ["start", { currentUrl: "/", to: "/page" }],
        ["end", { currentUrl: "/", to: "/page" }],
      ]);
      expect(router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/page" },
        loaderData: { page: "PAGE" },
      });
    });

    it("allows instrumentation of fetchers", async () => {
      let spy = jest.fn();
      let router = createMemoryRouter(
        [
          {
            index: true,
          },
          {
            id: "page",
            path: "/page",
            loader: () => "PAGE",
          },
        ],
        {
          unstable_instrumentations: [
            {
              router(router) {
                router.instrument({
                  async fetch(fetch, info) {
                    spy("start", info);
                    await fetch();
                    spy("end", info);
                  },
                });
              },
            },
          ],
        },
      );

      let data: unknown;
      router.subscribe((state) => {
        data = data ?? state.fetchers.get("key")?.data;
      });
      await router.fetch("key", "0", "/page");
      expect(spy.mock.calls).toEqual([
        ["start", { href: "/page", currentUrl: "/", fetcherKey: "key" }],
        ["end", { href: "/page", currentUrl: "/", fetcherKey: "key" }],
      ]);
      expect(router.state).toMatchObject({
        navigation: { state: "idle" },
        location: { pathname: "/" },
      });
      expect(data).toBe("PAGE");
    });
  });

  describe("static handler", () => {
    it("allows instrumentation of lazy", async () => {
      let spy = jest.fn();
      let { query } = createStaticHandler(
        [
          {
            id: "index",
            index: true,
            lazy: async () => {
              spy("lazy");
              return {
                loader: () => {
                  spy("loader");
                  return new Response("INDEX");
                },
              };
            },
          },
        ],
        {
          unstable_instrumentations: [
            {
              route(route) {
                route.instrument({
                  async lazy(loader) {
                    spy("start");
                    await loader();
                    spy("end");
                  },
                });
              },
            },
          ],
        },
      );

      let context = await query(new Request("http://localhost/"));
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["lazy"],
        ["end"],
        ["loader"],
      ]);
      expect(context).toMatchObject({
        location: { pathname: "/" },
        loaderData: { index: "INDEX" },
      });
      spy.mockClear();

      // Recreate to get a fresh execution of lazy
      let { queryRoute } = createStaticHandler(
        [
          {
            id: "index",
            index: true,
            lazy: async () => {
              spy("lazy");
              return {
                loader: () => {
                  spy("loader");
                  return new Response("INDEX");
                },
              };
            },
          },
        ],
        {
          unstable_instrumentations: [
            {
              route(route) {
                route.instrument({
                  async lazy(loader) {
                    spy("start");
                    await loader();
                    spy("end");
                  },
                });
              },
            },
          ],
        },
      );
      let response = await queryRoute(new Request("http://localhost/"));
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["lazy"],
        ["end"],
        ["loader"],
      ]);
      expect(await response.text()).toBe("INDEX");
    });

    it("allows instrumentation of middleware", async () => {
      let spy = jest.fn();
      let { query, queryRoute } = createStaticHandler(
        [
          {
            id: "index",
            index: true,
            middleware: [
              async (_: unknown, next: MiddlewareNextFunction) => {
                spy("middleware");
                return await next();
              },
            ],
            loader: () => {
              spy("loader");
              return new Response("INDEX");
            },
          },
        ],
        {
          unstable_instrumentations: [
            {
              route(route) {
                route.instrument({
                  async middleware(middleware) {
                    spy("start");
                    await middleware();
                    spy("end");
                  },
                });
              },
            },
          ],
        },
      );

      let request = new Request("http://localhost/");
      let response = (await query(request, {
        async generateMiddlewareResponse(query) {
          let ctx = (await query(request)) as StaticHandlerContext;
          return new Response(
            JSON.stringify({
              location: ctx.location,
              loaderData: ctx.loaderData,
            }),
          );
        },
      })) as Response;
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["middleware"],
        ["loader"],
        ["end"],
      ]);
      expect(JSON.parse(await response.text())).toMatchObject({
        location: { pathname: "/" },
        loaderData: { index: "INDEX" },
      });
      spy.mockClear();

      response = await queryRoute(request, {
        generateMiddlewareResponse: async (queryRoute) => {
          return await queryRoute(request);
        },
      });
      expect(spy.mock.calls).toEqual([
        ["start"],
        ["middleware"],
        ["loader"],
        ["end"],
      ]);
      expect(await response.text()).toBe("INDEX");
    });

    it("allows instrumentation of loaders", async () => {
      let spy = jest.fn();
      let { query, queryRoute } = createStaticHandler(
        [
          {
            id: "index",
            index: true,
            loader: () => {
              spy("loader");
              return new Response("INDEX");
            },
          },
        ],
        {
          unstable_instrumentations: [
            {
              route(route) {
                route.instrument({
                  async loader(loader) {
                    spy("start");
                    await loader();
                    spy("end");
                  },
                });
              },
            },
          ],
        },
      );

      let context = await query(new Request("http://localhost/"));
      expect(spy.mock.calls).toEqual([["start"], ["loader"], ["end"]]);
      expect(context).toMatchObject({
        location: { pathname: "/" },
        loaderData: { index: "INDEX" },
      });
      spy.mockClear();

      let response = await queryRoute(new Request("http://localhost/"));
      expect(spy.mock.calls).toEqual([["start"], ["loader"], ["end"]]);
      expect(await response.text()).toBe("INDEX");
    });

    it("allows instrumentation of actions", async () => {
      let spy = jest.fn();
      let { query, queryRoute } = createStaticHandler(
        [
          {
            id: "index",
            index: true,
            action: () => {
              spy("action");
              return new Response("INDEX");
            },
          },
        ],
        {
          unstable_instrumentations: [
            {
              route(route) {
                route.instrument({
                  async action(action) {
                    spy("start");
                    await action();
                    spy("end");
                  },
                });
              },
            },
          ],
        },
      );

      let context = await query(
        new Request("http://localhost/", { method: "post", body: "data" }),
      );
      expect(spy.mock.calls).toEqual([["start"], ["action"], ["end"]]);
      expect(context).toMatchObject({
        location: { pathname: "/" },
        actionData: { index: "INDEX" },
      });
      spy.mockClear();

      let response = await queryRoute(
        new Request("http://localhost/", { method: "post", body: "data" }),
      );
      expect(spy.mock.calls).toEqual([["start"], ["action"], ["end"]]);
      expect(await response.text()).toBe("INDEX");
    });
  });

  describe("request handler", () => {
    it("allows instrumentation of the request handler", async () => {
      let spy = jest.fn();
      let build = mockServerBuild(
        {
          root: {
            path: "",
            loader: () => {
              spy("loader");
              return "ROOT";
            },
            default: () => "COMPONENT",
          },
        },
        {
          handleDocumentRequest(request) {
            return new Response(`${request.method} ${request.url} COMPONENT`);
          },
          unstable_instrumentations: [
            {
              handler(handler) {
                handler.instrument({
                  async request(handler, info) {
                    spy("start", info);
                    await handler();
                    spy("end", info);
                  },
                });
              },
            },
          ],
        },
      );
      let handler = createRequestHandler(build);
      let response = await handler(new Request("http://localhost/"), {});

      expect(await response.text()).toBe("GET http://localhost/ COMPONENT");
      expect(spy.mock.calls).toEqual([
        [
          "start",
          {
            request: {
              method: "GET",
              url: "http://localhost/",
              headers: {
                get: expect.any(Function),
              },
            },
            context: {},
          },
        ],
        ["loader"],
        [
          "end",
          {
            request: {
              method: "GET",
              url: "http://localhost/",
              headers: {
                get: expect.any(Function),
              },
            },
            context: {},
          },
        ],
      ]);
    });

    it("allows instrumentation of middleware", async () => {
      let spy = jest.fn();
      let build = mockServerBuild(
        {
          root: {
            path: "/",
            middleware: [
              (_: unknown, next: MiddlewareNextFunction<Response>) => {
                spy("middleware");
                return next();
              },
            ],
            loader: () => {
              spy("loader");
              return "ROOT";
            },
            default: () => "COMPONENT",
          },
        },
        {
          future: {
            v8_middleware: true,
          },
          handleDocumentRequest(request) {
            return new Response(`${request.method} ${request.url} COMPONENT`);
          },
          unstable_instrumentations: [
            {
              route(route) {
                route.instrument({
                  async middleware(middleware, info) {
                    spy("start", info);
                    await middleware();
                    spy("end", info);
                  },
                });
              },
            },
          ],
        },
      );
      let handler = createRequestHandler(build);
      let response = await handler(new Request("http://localhost/"));

      expect(await response.text()).toBe("GET http://localhost/ COMPONENT");
      expect(spy.mock.calls).toEqual([
        [
          "start",
          {
            request: {
              method: "GET",
              url: "http://localhost/",
              headers: {
                get: expect.any(Function),
              },
            },
            params: {},
            unstable_pattern: "/",
            context: {
              get: expect.any(Function),
            },
          },
        ],
        ["middleware"],
        ["loader"],
        [
          "end",
          {
            request: {
              method: "GET",
              url: "http://localhost/",
              headers: {
                get: expect.any(Function),
              },
            },
            params: {},
            unstable_pattern: "/",
            context: {
              get: expect.any(Function),
            },
          },
        ],
      ]);
    });

    it("allows instrumentation of loaders", async () => {
      let spy = jest.fn();
      let build = mockServerBuild(
        {
          root: {
            path: "/",
            loader: () => {
              spy("loader");
              return "ROOT";
            },
            default: () => "COMPONENT",
          },
        },
        {
          handleDocumentRequest(request) {
            return new Response(`${request.method} ${request.url} COMPONENT`);
          },
          unstable_instrumentations: [
            {
              route(route) {
                route.instrument({
                  async loader(loader, info) {
                    spy("start", info);
                    await loader();
                    spy("end", info);
                  },
                });
              },
            },
          ],
        },
      );
      let handler = createRequestHandler(build);
      let response = await handler(new Request("http://localhost/"));

      expect(await response.text()).toBe("GET http://localhost/ COMPONENT");
      expect(spy.mock.calls).toEqual([
        [
          "start",
          {
            request: {
              method: "GET",
              url: "http://localhost/",
              headers: {
                get: expect.any(Function),
              },
            },
            params: {},
            unstable_pattern: "/",
            context: {},
          },
        ],
        ["loader"],
        [
          "end",
          {
            request: {
              method: "GET",
              url: "http://localhost/",
              headers: {
                get: expect.any(Function),
              },
            },
            params: {},
            unstable_pattern: "/",
            context: {},
          },
        ],
      ]);
    });

    it("allows instrumentation of actions", async () => {
      let spy = jest.fn();
      let build = mockServerBuild(
        {
          root: {
            path: "/",
            action: () => {
              spy("action");
              return "ROOT";
            },
            default: () => "COMPONENT",
          },
        },
        {
          handleDocumentRequest(request) {
            return new Response(`${request.method} ${request.url} COMPONENT`);
          },
          unstable_instrumentations: [
            {
              route(route) {
                route.instrument({
                  async action(action, info) {
                    spy("start", info);
                    await action();
                    spy("end", info);
                  },
                });
              },
            },
          ],
        },
      );
      let handler = createRequestHandler(build);
      let response = await handler(
        new Request("http://localhost/", { method: "post", body: "data" }),
      );

      expect(await response.text()).toBe("POST http://localhost/ COMPONENT");
      expect(spy.mock.calls).toEqual([
        [
          "start",
          {
            request: {
              method: "POST",
              url: "http://localhost/",
              headers: {
                get: expect.any(Function),
              },
            },
            params: {},
            unstable_pattern: "/",
            context: {},
          },
        ],
        ["action"],
        [
          "end",
          {
            request: {
              method: "POST",
              url: "http://localhost/",
              headers: {
                get: expect.any(Function),
              },
            },
            params: {},
            unstable_pattern: "/",
            context: {},
          },
        ],
      ]);
    });
  });
});
