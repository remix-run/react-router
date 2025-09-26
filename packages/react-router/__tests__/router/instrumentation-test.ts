import type { LoaderFunction } from "../../lib/router/utils";
import { cleanup, setup } from "./utils/data-router-setup";
import { createDeferred, createFormData, tick } from "./utils/utils";

// Detect any failures inside the router navigate code
afterEach(() => {
  cleanup();
});

describe("instrumentation", () => {
  it("allows instrumentation of lazy", async () => {
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

  it("allows instrumentation of loaders when lazy is used", async () => {
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

  it("allows instrumentation of actions when lazy is used", async () => {
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

  it("does not double-instrument when a static `loader` is used alongside `lazy`", async () => {
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

  it("does not double-instrument when a static `action` is used alongside `lazy`", async () => {
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
