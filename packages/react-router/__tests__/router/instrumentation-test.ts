import {
  AgnosticDataRouteObject,
  type ActionFunction,
  type LoaderFunction,
  type MiddlewareFunction,
} from "../../lib/router/utils";
import { cleanup, setup } from "./utils/data-router-setup";
import { createDeferred, createFormData, tick } from "./utils/utils";

// Detect any failures inside the router navigate code
afterEach(() => {
  cleanup();
});

describe("instrumentation", () => {
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
            async (_, next) => {
              spy("start middleware");
              await next();
              spy("end middleware");
            },
          ],
          loader: true,
        },
      ],
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async middleware(middleware) {
            spy("start");
            await middleware();
            spy("end");
          },
        });
      },
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async loader(loader) {
            spy("start");
            await loader();
            spy("end");
          },
        });
      },
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async action(action) {
            spy("start");
            await action();
            spy("end");
          },
        });
      },
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async lazy(lazy) {
            spy("start");
            await lazy();
            spy("end");
          },
        });
      },
    });

    await t.navigate("/page");
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async loader(loader) {
            spy("start");
            await loader();
            spy("end");
          },
        });
      },
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async action(action) {
            spy("start");
            await action();
            spy("end");
          },
        });
      },
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async loader(loader) {
            spy("start");
            await loader();
            spy("end");
          },
        });
      },
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async action(action) {
            spy("start");
            await action();
            spy("end");
          },
        });
      },
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          "lazy.middleware": async (middleware) => {
            spy("start");
            await middleware();
            spy("end");
          },
        });
      },
    });

    await t.navigate("/page");
    expect(spy.mock.calls).toEqual([["start"]]);

    await middlewareDfd.resolve([
      async (_, next) => {
        spy("middleware start");
        await next();
        spy("middleware end");
      },
    ]);
    await tick();
    expect(spy.mock.calls).toEqual([["start"], ["end"], ["middleware start"]]);

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
      unstable_instrumentRoute: (route) => {
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
      unstable_instrumentRoute: (route) => {
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
            async (_, next) => {
              await middlewareDfd.promise;
              return next();
            },
          ],
          loader: true,
          action: true,
        },
      ],
      unstable_instrumentRoute: (route) => {
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
          middleware: [(_, next) => next()],
          lazy: () => lazyDfd.promise,
        },
      ],
      unstable_instrumentRoute: (route) => {
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
      unstable_instrumentRoute: (route) => {
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
    });

    await t.navigate("/page", {
      formMethod: "POST",
      formData: createFormData({}),
    });
    expect(spy.mock.calls).toEqual([]);

    await middlewareDfd.resolve([(_, next) => next()]);
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
      unstable_instrumentRoute: (route) => {
        route.instrument({
          async loader(loader, info) {
            spy(info);
            Object.assign(info.params, { extra: "extra" });
            await loader();
          },
        });
      },
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
    expect(args.pattern).toBe("/:slug");
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
      unstable_instrumentRoute: (route) => {
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
});
