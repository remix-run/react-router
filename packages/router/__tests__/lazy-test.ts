import {
  createMemoryHistory,
  createRouter,
  createStaticHandler,
  json,
} from "../index";

import type { TestRouteObject } from "./utils/data-router-setup";
import { cleanup, createDeferred, setup } from "./utils/data-router-setup";
import {
  createFormData,
  createRequest,
  findRouteById,
  invariant,
  tick,
} from "./utils/utils";

describe("lazily loaded route modules", () => {
  beforeEach(() => {
    jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  // Detect any failures inside the router navigate code
  afterEach(() => {
    cleanup();

    // @ts-ignore
    console.warn.mockReset();
  });

  const LAZY_ROUTES: TestRouteObject[] = [
    {
      id: "root",
      path: "/",
      children: [
        {
          id: "lazy",
          path: "/lazy",
          lazy: true,
        },
      ],
    },
  ];

  describe("initialization", () => {
    it("fetches lazy route modules on router initialization", async () => {
      let dfd = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: () => dfd.promise,
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let route = { Component: () => null };
      await dfd.resolve(route);

      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.matches[0].route).toMatchObject(route);
    });

    it("fetches lazy route modules and executes loaders on router initialization", async () => {
      let dfd = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: () => dfd.promise,
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let loaderDfd = createDeferred();
      let route = {
        Component: () => null,
        loader: () => loaderDfd.promise,
      };
      await dfd.resolve(route);
      expect(router.state.initialized).toBe(false);

      await loaderDfd.resolve("LOADER");
      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.loaderData).toEqual({
        "0": "LOADER",
      });
      expect(router.state.matches[0].route).toMatchObject(route);
    });

    it("fetches lazy route modules and executes loaders with v7_partialHydration enabled", async () => {
      let dfd = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: () => dfd.promise,
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
        future: {
          v7_partialHydration: true,
        },
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let loaderDfd = createDeferred();
      let route = {
        Component: () => null,
        loader: () => loaderDfd.promise,
      };
      await dfd.resolve(route);
      expect(router.state.initialized).toBe(false);

      await loaderDfd.resolve("LOADER");
      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.loaderData).toEqual({
        "0": "LOADER",
      });
      expect(router.state.matches[0].route).toMatchObject(route);
    });
  });

  describe("happy path", () => {
    it("fetches lazy route modules on loading navigation", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      let dfd = createDeferred();
      A.lazy.lazy.resolve({
        loader: () => dfd.promise,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await dfd.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });
    });

    it("fetches lazy route modules on submission navigation", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      let actionDfd = createDeferred();
      let loaderDfd = createDeferred();
      A.lazy.lazy.resolve({
        action: () => actionDfd.promise,
        loader: () => loaderDfd.promise,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDfd.resolve("LAZY ACTION");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.actionData).toEqual({
        lazy: "LAZY ACTION",
      });
      expect(t.router.state.loaderData).toEqual({});

      await loaderDfd.resolve("LAZY LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual({
        lazy: "LAZY ACTION",
      });
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });
    });

    it("fetches lazy route modules on fetcher.load", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      let loaderDfd = createDeferred();
      await A.lazy.lazy.resolve({
        loader: () => loaderDfd.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDfd.resolve("LAZY LOADER");
      expect(t.router.state.fetchers.get(key)?.state).toBe("idle");
      expect(t.router.state.fetchers.get(key)?.data).toBe("LAZY LOADER");
    });

    it("fetches lazy route modules on fetcher.submit", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      let actionDfd = createDeferred();
      await A.lazy.lazy.resolve({
        action: () => actionDfd.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDfd.resolve("LAZY ACTION");
      expect(t.router.state.fetchers.get(key)?.state).toBe("idle");
      expect(t.router.state.fetchers.get(key)?.data).toBe("LAZY ACTION");
    });

    it("fetches lazy route modules on staticHandler.query()", async () => {
      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: async () => {
            await tick();
            return {
              async loader() {
                return json({ value: "LAZY LOADER" });
              },
            };
          },
        },
      ]);

      let context = await query(createRequest("/lazy"));
      invariant(
        !(context instanceof Response),
        "Expected a StaticContext instance"
      );
      expect(context.loaderData).toEqual({ lazy: { value: "LAZY LOADER" } });
    });

    it("fetches lazy route modules on staticHandler.queryRoute()", async () => {
      let { queryRoute } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: async () => {
            await tick();
            return {
              async loader() {
                return json({ value: "LAZY LOADER" });
              },
            };
          },
        },
      ]);

      let response = await queryRoute(createRequest("/lazy"));
      let data = await response.json();
      expect(data).toEqual({ value: "LAZY LOADER" });
    });
  });

  describe("statically defined fields", () => {
    it("prefers statically defined loader over lazily defined loader", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            loader: true,
            lazy: true,
          },
        ],
      });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      // Execute in parallel
      expect(A.loaders.lazy.stub).toHaveBeenCalled();
      expect(A.lazy.lazy.stub).toHaveBeenCalled();

      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      await A.lazy.lazy.resolve({
        loader: lazyLoaderStub,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await A.loaders.lazy.resolve("STATIC LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "STATIC LOADER",
      });

      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.loader).toEqual(expect.any(Function));
      expect(lazyRoute.loader).not.toBe(lazyLoaderStub);
      expect(lazyLoaderStub).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action over lazily loaded action", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            lazy: true,
          },
        ],
      });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      // Execute in parallel
      expect(A.actions.lazy.stub).toHaveBeenCalled();
      expect(A.lazy.lazy.stub).toHaveBeenCalled();

      let lazyActionStub = jest.fn(() => "LAZY ACTION");
      let loaderDfd = createDeferred();
      await A.lazy.lazy.resolve({
        action: lazyActionStub,
        loader: () => loaderDfd.promise,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await A.actions.lazy.resolve("STATIC ACTION");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.actionData).toEqual({
        lazy: "STATIC ACTION",
      });
      expect(t.router.state.loaderData).toEqual({});

      await loaderDfd.resolve("LAZY LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual({
        lazy: "STATIC ACTION",
      });
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });

      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.action).toEqual(expect.any(Function));
      expect(lazyRoute.action).not.toBe(lazyActionStub);
      expect(lazyActionStub).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "action" defined but its lazy function is also returning a value for this property. The lazy route property "action" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action/loader over lazily defined action/loader", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            loader: true,
            lazy: true,
          },
        ],
      });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      let lazyActionStub = jest.fn(() => "LAZY ACTION");
      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      await A.lazy.lazy.resolve({
        action: lazyActionStub,
        loader: lazyLoaderStub,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await A.actions.lazy.resolve("STATIC ACTION");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.actionData).toEqual({
        lazy: "STATIC ACTION",
      });
      expect(t.router.state.loaderData).toEqual({});

      await A.loaders.lazy.resolve("STATIC LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual({
        lazy: "STATIC ACTION",
      });
      expect(t.router.state.loaderData).toEqual({
        lazy: "STATIC LOADER",
      });

      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.action).toEqual(expect.any(Function));
      expect(lazyRoute.loader).toEqual(expect.any(Function));
      expect(lazyRoute.action).not.toBe(lazyActionStub);
      expect(lazyRoute.loader).not.toBe(lazyLoaderStub);
      expect(lazyActionStub).not.toHaveBeenCalled();
      expect(lazyLoaderStub).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(2);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "action" defined but its lazy function is also returning a value for this property. The lazy route property "action" will be ignored."`
      );
      expect(consoleWarn.mock.calls[1][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader (staticHandler.query)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let lazyLoaderStub = jest.fn(async () => {
        await tick();
        return json({ value: "LAZY LOADER" });
      });

      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          loader: async () => {
            await tick();
            return json({ value: "STATIC LOADER" });
          },
          lazy: async () => {
            await tick();
            return {
              loader: lazyLoaderStub,
            };
          },
        },
      ]);

      let context = await query(createRequest("/lazy"));
      invariant(
        !(context instanceof Response),
        "Expected a StaticContext instance"
      );
      expect(context.loaderData).toEqual({
        lazy: { value: "STATIC LOADER" },
      });
      expect(lazyLoaderStub).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader (staticHandler.queryRoute)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let lazyLoaderStub = jest.fn(async () => {
        await tick();
        return json({ value: "LAZY LOADER" });
      });

      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          loader: async () => {
            await tick();
            return json({ value: "STATIC LOADER" });
          },
          lazy: async () => {
            await tick();
            return {
              loader: lazyLoaderStub,
            };
          },
        },
      ]);

      let context = await query(createRequest("/lazy"));
      invariant(
        !(context instanceof Response),
        "Expected a StaticContext instance"
      );
      expect(context.loaderData).toEqual({
        lazy: { value: "STATIC LOADER" },
      });
      expect(lazyLoaderStub).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("handles errors thrown from static loaders before lazy has completed", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let t = setup({
        routes: [
          {
            id: "root",
            path: "/",
            children: [
              {
                id: "lazy",
                path: "lazy",
                loader: true,
                lazy: true,
              },
            ],
          },
        ],
      });

      let A = await t.navigate("/lazy");

      await A.loaders.lazy.reject("STATIC LOADER ERROR");
      expect(t.router.state.navigation.state).toBe("loading");

      // We shouldn't bubble the loader error until after this resolves
      // so we know if it has a boundary or not
      await A.lazy.lazy.resolve({
        hasErrorBoundary: true,
      });
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        lazy: "STATIC LOADER ERROR",
      });

      consoleWarn.mockReset();
    });
  });

  describe("interruptions", () => {
    it("runs lazily loaded route loader even if lazy() is interrupted", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      await A.lazy.lazy.resolve({
        loader: lazyLoaderStub,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);

      // Ensure the lazy route object update still happened
      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.loader).toBe(lazyLoaderStub);
    });

    it("runs lazily loaded route action even if lazy() is interrupted", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let lazyActionStub = jest.fn(() => "LAZY ACTION");
      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      await A.lazy.lazy.resolve({
        action: lazyActionStub,
        loader: lazyLoaderStub,
      });

      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyLoaderStub).not.toHaveBeenCalled();
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.action).toBe(lazyActionStub);
      expect(lazyRoute.loader).toBe(lazyLoaderStub);
    });

    it("runs lazily loaded route loader on fetcher.load() even if lazy() is interrupted", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      let B = await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      // Resolve B's lazy route first
      let loaderDfdB = createDeferred();
      let lazyloaderStubB = jest.fn(() => loaderDfdB.promise);
      await B.lazy.lazy.resolve({
        loader: lazyloaderStubB,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      // Resolve A's lazy route after B
      let loaderDfdA = createDeferred();
      let lazyLoaderStubA = jest.fn(() => loaderDfdA.promise);
      await A.lazy.lazy.resolve({
        loader: lazyLoaderStubA,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDfdA.resolve("LAZY LOADER A");
      await loaderDfdB.resolve("LAZY LOADER B");

      expect(t.router.state.fetchers.get(key)?.state).toBe("idle");
      expect(t.router.state.fetchers.get(key)?.data).toBe("LAZY LOADER B");
      expect(lazyLoaderStubA).not.toHaveBeenCalled();
      expect(lazyloaderStubB).toHaveBeenCalledTimes(2);
    });

    it("runs lazily loaded route action on fetcher.submit() even if lazy() is interrupted", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      let B = await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      // Resolve B's lazy route first
      let actionDfdB = createDeferred();
      let lazyActionStubB = jest.fn(() => actionDfdB.promise);
      await B.lazy.lazy.resolve({
        action: lazyActionStubB,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      // Resolve A's lazy route after B
      let actionDfdA = createDeferred();
      let lazyActionStubA = jest.fn(() => actionDfdA.promise);
      await A.lazy.lazy.resolve({
        action: lazyActionStubA,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDfdA.resolve("LAZY ACTION A");
      await actionDfdB.resolve("LAZY ACTION B");

      expect(t.router.state.fetchers.get(key)?.state).toBe("idle");
      expect(t.router.state.fetchers.get(key)?.data).toBe("LAZY ACTION B");
      expect(lazyActionStubA).not.toHaveBeenCalled();
      expect(lazyActionStubB).toHaveBeenCalledTimes(2);
    });

    it("uses the first-resolved lazy() execution on repeated loading navigations", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      let B = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      // Resolve B's lazy route first
      let loaderDfdB = createDeferred();
      let lazyLoaderStubB = jest.fn(() => loaderDfdB.promise);
      await B.lazy.lazy.resolve({
        loader: lazyLoaderStubB,
      });

      // Resolve A's lazy route after B
      let loaderDfdA = createDeferred();
      let lazyLoaderStubA = jest.fn(() => loaderDfdA.promise);
      await A.lazy.lazy.resolve({
        loader: lazyLoaderStubA,
      });

      await loaderDfdA.resolve("LAZY LOADER A");
      await loaderDfdB.resolve("LAZY LOADER B");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER B" });

      expect(lazyLoaderStubA).not.toHaveBeenCalled();
      expect(lazyLoaderStubB).toHaveBeenCalledTimes(2);
    });

    it("uses the first-resolved lazy() execution on repeated submission navigations", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      let B = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      // Resolve B's lazy route first
      let loaderDfdB = createDeferred();
      let actionDfdB = createDeferred();
      let lazyLoaderStubB = jest.fn(() => loaderDfdB.promise);
      let lazyActionStubB = jest.fn(() => actionDfdB.promise);
      await B.lazy.lazy.resolve({
        action: lazyActionStubB,
        loader: lazyLoaderStubB,
      });

      // Resolve A's lazy route after B
      let loaderDfdA = createDeferred();
      let actionDfdA = createDeferred();
      let lazyLoaderStubA = jest.fn(() => loaderDfdA.promise);
      let lazyActionStubA = jest.fn(() => actionDfdA.promise);
      await A.lazy.lazy.resolve({
        action: lazyActionStubA,
        loader: lazyLoaderStubA,
      });

      await actionDfdA.resolve("LAZY ACTION A");
      await loaderDfdA.resolve("LAZY LOADER A");
      await actionDfdB.resolve("LAZY ACTION B");
      await loaderDfdB.resolve("LAZY LOADER B");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.actionData).toEqual({ lazy: "LAZY ACTION B" });
      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER B" });

      expect(lazyActionStubA).not.toHaveBeenCalled();
      expect(lazyLoaderStubA).not.toHaveBeenCalled();
      expect(lazyActionStubB).toHaveBeenCalledTimes(2);
      expect(lazyLoaderStubB).toHaveBeenCalledTimes(1);
    });

    it("uses the first-resolved lazy() execution on repeated fetcher.load calls", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      let B = await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      // Resolve B's lazy route first
      let loaderDfdB = createDeferred();
      let lazyLoaderStubB = jest.fn(() => loaderDfdB.promise);
      await B.lazy.lazy.resolve({
        loader: lazyLoaderStubB,
      });

      // Resolve A's lazy route after B
      let loaderDfdA = createDeferred();
      let lazyLoaderStubA = jest.fn(() => loaderDfdA.promise);
      await A.lazy.lazy.resolve({
        loader: lazyLoaderStubA,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDfdA.resolve("LAZY LOADER A");
      await loaderDfdB.resolve("LAZY LOADER B");

      expect(t.router.state.fetchers.get(key)?.state).toBe("idle");
      expect(t.router.state.fetchers.get(key)?.data).toBe("LAZY LOADER B");
      expect(lazyLoaderStubA).not.toHaveBeenCalled();
      expect(lazyLoaderStubB).toHaveBeenCalledTimes(2);
    });
  });

  describe("errors", () => {
    it("handles errors when failing to load lazy route modules on initialization", async () => {
      let dfd = createDeferred();
      let router = createRouter({
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
        routes: [
          {
            id: "root",
            path: "/",
            hasErrorBoundary: true,
            children: [
              {
                id: "lazy",
                path: "lazy",
                // @ts-expect-error
                lazy: () => dfd.promise,
              },
            ],
          },
        ],
      }).initialize();

      expect(router.state.initialized).toBe(false);
      dfd.reject(new Error("LAZY FUNCTION ERROR"));
      await tick();
      expect(router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(router.state.initialized).toBe(true);
    });

    it("handles errors when failing to load lazy route modules on loading navigation", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await A.lazy.lazy.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
    });

    it("handles loader errors from lazy route modules when the route has an error boundary", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      let dfd = createDeferred();
      A.lazy.lazy.resolve({
        loader: () => dfd.promise,
        hasErrorBoundary: true,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await dfd.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        lazy: new Error("LAZY LOADER ERROR"),
      });
    });

    it("bubbles loader errors from in lazy route modules when the route does not specify an error boundary", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      let dfd = createDeferred();
      A.lazy.lazy.resolve({
        loader: () => dfd.promise,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await dfd.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
    });

    it("bubbles loader errors from lazy route modules when the route specifies hasErrorBoundary:false", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      let dfd = createDeferred();
      A.lazy.lazy.resolve({
        loader: () => dfd.promise,
        hasErrorBoundary: false,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await dfd.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
    });

    it("handles errors when failing to load lazy route modules on submission navigation", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await A.lazy.lazy.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.loaderData).toEqual({});
    });

    it("handles action errors from lazy route modules on submission navigation", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      let actionDfd = createDeferred();
      A.lazy.lazy.resolve({
        action: () => actionDfd.promise,
        hasErrorBoundary: true,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDfd.reject(new Error("LAZY ACTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.errors).toEqual({
        lazy: new Error("LAZY ACTION ERROR"),
      });
    });

    it("bubbles action errors from lazy route modules when the route specifies hasErrorBoundary:false", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      let actionDfd = createDeferred();
      A.lazy.lazy.resolve({
        action: () => actionDfd.promise,
        hasErrorBoundary: false,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDfd.reject(new Error("LAZY ACTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY ACTION ERROR"),
      });
    });

    it("handles errors when failing to load lazy route modules on fetcher.load", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await A.lazy.lazy.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
    });

    it("handles loader errors in lazy route modules on fetcher.load", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      let loaderDfd = createDeferred();
      await A.lazy.lazy.resolve({
        loader: () => loaderDfd.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDfd.reject(new Error("LAZY LOADER ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
    });

    it("handles errors when failing to load lazy route modules on fetcher.submit", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await A.lazy.lazy.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
    });

    it("handles action errors in lazy route modules on fetcher.submit", async () => {
      let t = setup({ routes: LAZY_ROUTES });

      let key = "key";
      let A = await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      let actionDfd = createDeferred();
      await A.lazy.lazy.resolve({
        action: () => actionDfd.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDfd.reject(new Error("LAZY ACTION ERROR"));
      await tick();
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY ACTION ERROR"),
      });
    });

    it("throws when failing to load lazy route modules on staticHandler.query()", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "lazy",
              path: "/lazy",
              lazy: async () => {
                throw new Error("LAZY FUNCTION ERROR");
              },
            },
          ],
        },
      ]);

      let context = await query(createRequest("/lazy"));
      invariant(
        !(context instanceof Response),
        "Expected a StaticContext instance"
      );
      expect(context.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
    });

    it("handles loader errors from lazy route modules on staticHandler.query()", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "lazy",
              path: "/lazy",
              lazy: async () => {
                await tick();
                return {
                  async loader() {
                    throw new Error("LAZY LOADER ERROR");
                  },
                  hasErrorBoundary: true,
                };
              },
            },
          ],
        },
      ]);

      let context = await query(createRequest("/lazy"));
      invariant(
        !(context instanceof Response),
        "Expected a StaticContext instance"
      );
      expect(context.loaderData).toEqual({
        root: null,
      });
      expect(context.errors).toEqual({
        lazy: new Error("LAZY LOADER ERROR"),
      });
    });

    it("bubbles loader errors from lazy route modules on staticHandler.query() when hasErrorBoundary is resolved as false", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "lazy",
              path: "/lazy",
              lazy: async () => {
                await tick();
                return {
                  async loader() {
                    throw new Error("LAZY LOADER ERROR");
                  },
                  hasErrorBoundary: false,
                };
              },
            },
          ],
        },
      ]);

      let context = await query(createRequest("/lazy"));
      invariant(
        !(context instanceof Response),
        "Expected a StaticContext instance"
      );
      expect(context.loaderData).toEqual({
        root: null,
      });
      expect(context.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
    });

    it("throws when failing to load lazy route modules on staticHandler.queryRoute()", async () => {
      let { queryRoute } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: async () => {
            throw new Error("LAZY FUNCTION ERROR");
          },
        },
      ]);

      let err;
      try {
        await queryRoute(createRequest("/lazy"));
      } catch (_err) {
        err = _err;
      }

      expect(err?.message).toBe("LAZY FUNCTION ERROR");
    });

    it("handles loader errors in lazy route modules on staticHandler.queryRoute()", async () => {
      let { queryRoute } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: async () => {
            await tick();
            return {
              async loader() {
                throw new Error("LAZY LOADER ERROR");
              },
            };
          },
        },
      ]);

      let err;
      try {
        await queryRoute(createRequest("/lazy"));
      } catch (_err) {
        err = _err;
      }

      expect(err?.message).toBe("LAZY LOADER ERROR");
    });
  });
});
