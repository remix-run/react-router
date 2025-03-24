import { createMemoryHistory } from "../../lib/router/history";
import { createRouter, createStaticHandler } from "../../lib/router/router";

import type {
  TestNonIndexRouteObject,
  TestRouteObject,
} from "./utils/data-router-setup";
import {
  cleanup,
  createDeferred,
  createLazyStub,
  setup,
} from "./utils/data-router-setup";
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

  const createBasicLazyRoutes = (
    lazy: TestNonIndexRouteObject["lazy"]
  ): TestRouteObject[] => {
    return [
      {
        id: "root",
        path: "/",
        children: [
          {
            id: "lazy",
            path: "/lazy",
            lazy,
          },
        ],
      },
    ];
  };

  const createBasicLazyFunctionRoutes = (): {
    routes: TestRouteObject[];
    lazyStub: jest.Mock;
    lazyDeferred: ReturnType<typeof createDeferred>;
  } => {
    let { lazyStub, lazyDeferred } = createLazyStub();
    return {
      routes: createBasicLazyRoutes(lazyStub),
      lazyStub,
      lazyDeferred,
    };
  };

  describe("initialization", () => {
    it("fetches lazy route functions on router initialization", async () => {
      let lazyDeferred = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: () => lazyDeferred.promise,
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let route = { Component: () => null };
      await lazyDeferred.resolve(route);

      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.matches[0].route).toMatchObject(route);
    });

    it("resolves lazy route properties on router initialization", async () => {
      let lazyLoaderDeferred = createDeferred();
      let lazyActionDeferred = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: {
              loader: () => lazyLoaderDeferred.promise,
              action: () => lazyActionDeferred.promise,
            },
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let loader = () => null;
      await lazyLoaderDeferred.resolve(loader);

      let action = () => null;
      await lazyActionDeferred.resolve(action);

      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.matches[0].route).toMatchObject({
        loader,
        action,
      });
    });

    it("ignores falsy lazy route properties on router initialization", async () => {
      let lazyLoaderDeferred = createDeferred();
      let lazyActionDeferred = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: {
              loader: () => lazyLoaderDeferred.promise,
              action: () => lazyActionDeferred.promise,
            },
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      await lazyLoaderDeferred.resolve(null);
      await lazyActionDeferred.resolve(undefined);

      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.loaderData).toEqual({});
      expect(router.state.matches[0].route.loader).toBeUndefined();
      expect(router.state.matches[0].route.action).toBeUndefined();
    });

    it("fetches lazy route functions and executes loaders on router initialization", async () => {
      let lazyDeferred = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: () => lazyDeferred.promise,
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let loaderDeferred = createDeferred();
      let route = {
        Component: () => null,
        loader: () => loaderDeferred.promise,
      };
      await lazyDeferred.resolve(route);
      expect(router.state.initialized).toBe(false);

      await loaderDeferred.resolve("LOADER");
      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.loaderData).toEqual({
        "0": "LOADER",
      });
      expect(router.state.matches[0].route).toMatchObject(route);
    });

    it("resolves lazy route properties and executes loaders on router initialization", async () => {
      let lazyLoaderDeferred = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: {
              loader: () => lazyLoaderDeferred.promise,
            },
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let loaderDeferred = createDeferred();
      let loader = () => loaderDeferred.promise;
      await lazyLoaderDeferred.resolve(loader);
      expect(router.state.initialized).toBe(false);

      await loaderDeferred.resolve("LOADER");
      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.loaderData).toEqual({
        "0": "LOADER",
      });
      expect(router.state.matches[0].route).toMatchObject({ loader });
    });
  });

  describe("happy path", () => {
    it("fetches lazy route functions on loading navigation", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("resolves lazy route properties on loading navigation", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      lazyDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("ignores falsy lazy route properties on loading navigation", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.resolve(null);
      expect(t.router.state.matches[0].route.loader).toBeUndefined();
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({});
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("fetches lazy route functions on submission navigation", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      let loaderDeferred = createDeferred();
      lazyDeferred.resolve({
        action: () => actionDeferred.promise,
        loader: () => loaderDeferred.promise,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.actionData).toEqual({
        lazy: "LAZY ACTION",
      });
      expect(t.router.state.loaderData).toEqual({});

      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual({
        lazy: "LAZY ACTION",
      });
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });

      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("resolves lazy route properties on submission navigation", async () => {
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoaderStub,
        action: lazyActionStub,
      });
      let t = setup({ routes });
      expect(lazyLoaderStub).not.toHaveBeenCalled();
      expect(lazyActionStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyActionStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      let loaderDeferred = createDeferred();
      lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      lazyActionDeferred.resolve(() => actionDeferred.promise);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.actionData).toEqual({
        lazy: "LAZY ACTION",
      });
      expect(t.router.state.loaderData).toEqual({});

      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual({
        lazy: "LAZY ACTION",
      });
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });

      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
    });

    it("ignores falsy lazy route properties on submission navigation", async () => {
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoaderStub,
        action: lazyActionStub,
      });
      let t = setup({ routes });
      expect(lazyLoaderStub).not.toHaveBeenCalled();
      expect(lazyActionStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyActionStub).toHaveBeenCalledTimes(1);

      await lazyLoaderDeferred.resolve(undefined);
      await lazyActionDeferred.resolve(null);
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.loaderData).toEqual({});
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(t.router.state.matches[0].route.loader).toBeUndefined();
      expect(t.router.state.matches[0].route.action).toBeUndefined();
    });

    it("fetches lazy route functions on fetcher.load", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");

      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("resolves lazy route properties on fetcher.load", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      lazyDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");

      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("fetches lazy route functions on fetcher.submit", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      lazyDeferred.resolve({
        action: () => actionDeferred.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");
      expect(t.fetchers[key]?.state).toBe("idle");
      expect(t.fetchers[key]?.data).toBe("LAZY ACTION");

      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("resolves lazy route properties on fetcher.submit", async () => {
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoaderStub,
        action: lazyActionStub,
      });
      let t = setup({ routes });
      expect(lazyLoaderStub).not.toHaveBeenCalled();
      expect(lazyActionStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyActionStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      let loaderDeferred = createDeferred();
      lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      lazyActionDeferred.resolve(() => actionDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");
      expect(t.fetchers[key]?.state).toBe("idle");
      expect(t.fetchers[key]?.data).toBe("LAZY ACTION");

      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
    });

    it("fetches lazy route functions on staticHandler.query()", async () => {
      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: async () => {
            await tick();
            return {
              async loader() {
                return Response.json({ value: "LAZY LOADER" });
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

    it("resolves lazy route properties on staticHandler.query()", async () => {
      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: {
            loader: async () => {
              await tick();
              return () => Response.json({ value: "LAZY LOADER" });
            },
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

    it("fetches lazy route functions on staticHandler.queryRoute()", async () => {
      let { queryRoute } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: async () => {
            await tick();
            return {
              async loader() {
                return Response.json({ value: "LAZY LOADER" });
              },
            };
          },
        },
      ]);

      let response = await queryRoute(createRequest("/lazy"));
      let data = await response.json();
      expect(data).toEqual({ value: "LAZY LOADER" });
    });

    it("resolves lazy route properties on staticHandler.queryRoute()", async () => {
      let { queryRoute } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: {
            loader: async () => {
              await tick();
              return () => Response.json({ value: "LAZY LOADER" });
            },
          },
        },
      ]);

      let response = await queryRoute(createRequest("/lazy"));
      let data = await response.json();
      expect(data).toEqual({ value: "LAZY LOADER" });
    });
  });

  describe("statically defined fields", () => {
    it("prefers statically defined loader over lazily defined loader via lazy function", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub, lazyDeferred } = createLazyStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            loader: true,
            lazy: lazyStub,
          },
        ],
      });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      // Execute in parallel
      expect(A.loaders.lazy.stub).toHaveBeenCalled();
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      lazyDeferred.resolve({
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
      expect(lazyStub).toHaveBeenCalledTimes(1);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader via lazy property", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub, lazyDeferred } = createLazyStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            loader: true,
            lazy: {
              loader: lazyStub,
            },
          },
        ],
      });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      // Execute in parallel
      expect(A.loaders.lazy.stub).toHaveBeenCalled();
      expect(lazyStub).toHaveBeenCalledTimes(0);

      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      lazyDeferred.resolve(lazyLoaderStub);
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
      expect(lazyStub).toHaveBeenCalledTimes(0);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined falsy loader via lazy property", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub, lazyDeferred } = createLazyStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            loader: true,
            lazy: {
              loader: lazyStub,
            },
          },
        ],
      });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      // Execute in parallel
      expect(A.loaders.lazy.stub).toHaveBeenCalled();
      expect(lazyStub).toHaveBeenCalledTimes(0);

      lazyDeferred.resolve(null);
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
      expect(lazyRoute.loader).toBeInstanceOf(Function);
      expect(lazyStub).toHaveBeenCalledTimes(0);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action over lazily loaded action via lazy function", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub, lazyDeferred } = createLazyStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            lazy: lazyStub,
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
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let lazyActionStub = jest.fn(() => "LAZY ACTION");
      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve({
        action: lazyActionStub,
        loader: () => loaderDeferred.promise,
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

      await loaderDeferred.resolve("LAZY LOADER");
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
      expect(lazyStub).toHaveBeenCalledTimes(1);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "action" defined but its lazy function is also returning a value for this property. The lazy route property "action" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action over lazily loaded action via lazy property", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            lazy: {
              action: lazyActionStub,
              loader: lazyLoaderStub,
            },
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
      expect(lazyActionStub).toHaveBeenCalledTimes(0);
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);

      let actionStub = jest.fn(() => "LAZY ACTION");
      let loaderDeferred = createDeferred();
      lazyActionDeferred.resolve(actionStub);
      lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await A.actions.lazy.resolve("STATIC ACTION");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(t.router.state.actionData).toEqual({
        lazy: "STATIC ACTION",
      });
      expect(t.router.state.loaderData).toEqual({});

      await loaderDeferred.resolve("LAZY LOADER");
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
      expect(lazyRoute.action).not.toBe(actionStub);
      expect(actionStub).not.toHaveBeenCalled();
      expect(lazyActionStub).toHaveBeenCalledTimes(0);
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "action" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action/loader over lazily defined action/loader via lazy function", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub, lazyDeferred } = createLazyStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            loader: true,
            lazy: lazyStub,
          },
        ],
      });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let lazyActionStub = jest.fn(() => "LAZY ACTION");
      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      await lazyDeferred.resolve({
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
      expect(lazyStub).toHaveBeenCalledTimes(1);

      expect(consoleWarn).toHaveBeenCalledTimes(2);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "action" defined but its lazy function is also returning a value for this property. The lazy route property "action" will be ignored."`
      );
      expect(consoleWarn.mock.calls[1][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action/loader over lazily defined action/loader via lazy property", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            loader: true,
            lazy: {
              action: lazyActionStub,
              loader: lazyLoaderStub,
            },
          },
        ],
      });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(0);

      expect(lazyActionStub).toHaveBeenCalledTimes(0);
      let actionStub = jest.fn(() => "LAZY ACTION");
      let loaderStub = jest.fn(() => "LAZY LOADER");
      lazyActionDeferred.resolve(actionStub);
      lazyLoaderDeferred.resolve(loaderStub);
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
      expect(lazyRoute.action).not.toBe(actionStub);
      expect(lazyRoute.loader).not.toBe(loaderStub);
      expect(actionStub).not.toHaveBeenCalled();
      expect(loaderStub).not.toHaveBeenCalled();
      expect(lazyActionStub).toHaveBeenCalledTimes(0);
      expect(lazyLoaderStub).toHaveBeenCalledTimes(0);

      expect(consoleWarn).toHaveBeenCalledTimes(2);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "action" defined. The lazy property will be ignored."`
      );
      expect(consoleWarn.mock.calls[1][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader via lazy function (staticHandler.query)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let lazyLoaderStub = jest.fn(async () => {
        await tick();
        return Response.json({ value: "LAZY LOADER" });
      });
      let lazyStub = jest.fn(async () => {
        await tick();
        return {
          loader: lazyLoaderStub,
        };
      });

      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          loader: async () => {
            await tick();
            return Response.json({ value: "STATIC LOADER" });
          },
          lazy: lazyStub,
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
      expect(lazyStub).toHaveBeenCalledTimes(1);
      expect(lazyLoaderStub).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader via lazy property (staticHandler.query)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let loaderStub = jest.fn(async () => {
        await tick();
        return Response.json({ value: "LAZY LOADER" });
      });
      let lazyStub = jest.fn(async () => {
        await tick();
        return loaderStub;
      });

      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          loader: async () => {
            await tick();
            return Response.json({ value: "STATIC LOADER" });
          },
          lazy: {
            loader: lazyStub,
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
      expect(lazyStub).not.toHaveBeenCalled();
      expect(loaderStub).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader via lazy function (staticHandler.queryRoute)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let lazyLoaderStub = jest.fn(async () => {
        await tick();
        return Response.json({ value: "LAZY LOADER" });
      });

      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          loader: async () => {
            await tick();
            return Response.json({ value: "STATIC LOADER" });
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

    it("prefers statically defined loader over lazily defined loader via lazy property (staticHandler.queryRoute)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let loaderStub = jest.fn(async () => {
        await tick();
        return Response.json({ value: "LAZY LOADER" });
      });
      let lazyLoaderStub = jest.fn(async () => {
        await tick();
        return loaderStub;
      });

      let { query } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          loader: async () => {
            await tick();
            return Response.json({ value: "STATIC LOADER" });
          },
          lazy: {
            loader: lazyLoaderStub,
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
      expect(loaderStub).not.toHaveBeenCalled();
      expect(lazyLoaderStub).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("handles errors thrown from static loaders before lazy function has completed", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub, lazyDeferred } = createLazyStub();
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
                lazy: lazyStub,
              },
            ],
          },
        ],
      });
      expect(lazyStub).not.toHaveBeenCalled();

      let A = await t.navigate("/lazy");

      await A.loaders.lazy.reject("STATIC LOADER ERROR");
      expect(t.router.state.navigation.state).toBe("loading");

      // We shouldn't bubble the loader error until after this resolves
      // so we know if it has a boundary or not
      await lazyDeferred.resolve({
        hasErrorBoundary: true,
      });
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        lazy: "STATIC LOADER ERROR",
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
      consoleWarn.mockReset();
    });

    it("handles errors thrown from static loaders before lazy property has resolved", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let { lazyStub, lazyDeferred } = createLazyStub();
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
                lazy: {
                  hasErrorBoundary: lazyStub,
                },
              },
            ],
          },
        ],
      });
      expect(lazyStub).not.toHaveBeenCalled();

      let A = await t.navigate("/lazy");

      await A.loaders.lazy.reject("STATIC LOADER ERROR");
      expect(t.router.state.navigation.state).toBe("loading");

      // We shouldn't bubble the loader error until after this resolves
      // so we know if it has a boundary or not
      await lazyDeferred.resolve(true);
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        lazy: "STATIC LOADER ERROR",
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
      consoleWarn.mockReset();
    });
  });

  it("bubbles errors thrown from static loaders before lazy property has resolved if lazy 'hasErrorBoundary' is falsy", async () => {
    let consoleWarn = jest.spyOn(console, "warn");
    let { lazyStub, lazyDeferred } = createLazyStub();
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
              lazy: {
                hasErrorBoundary: lazyStub,
              },
            },
          ],
        },
      ],
    });
    expect(lazyStub).not.toHaveBeenCalled();

    let A = await t.navigate("/lazy");

    await A.loaders.lazy.reject("STATIC LOADER ERROR");
    expect(t.router.state.navigation.state).toBe("loading");

    // We shouldn't bubble the loader error until after this resolves
    // so we know if it has a boundary or not
    await lazyDeferred.resolve(null);
    expect(t.router.state.location.pathname).toBe("/lazy");
    expect(t.router.state.navigation.state).toBe("idle");
    expect(t.router.state.loaderData).toEqual({});
    expect(t.router.state.errors).toEqual({
      root: "STATIC LOADER ERROR",
    });
    expect(lazyStub).toHaveBeenCalledTimes(1);
    consoleWarn.mockReset();
  });

  describe("interruptions", () => {
    it("runs lazily loaded route loader even if lazy function is interrupted", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      await lazyDeferred.resolve({
        loader: lazyLoaderStub,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);

      // Ensure the lazy route object update still happened
      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.loader).toBe(lazyLoaderStub);

      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route loader even if lazy property is interrupted", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let lazyLoaderStub = jest.fn(() => "LAZY LOADER");
      await lazyDeferred.resolve(lazyLoaderStub);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);

      // Ensure the lazy route object update still happened
      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.loader).toBe(lazyLoaderStub);

      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route action even if lazy function is interrupted", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
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
      await lazyDeferred.resolve({
        action: lazyActionStub,
        loader: lazyLoaderStub,
      });

      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyLoaderStub).not.toHaveBeenCalled();
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.action).toBe(lazyActionStub);
      expect(lazyRoute.loader).toBe(lazyLoaderStub);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route action even if lazy property is interrupted", async () => {
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let routes = createBasicLazyRoutes({
        action: lazyActionStub,
        loader: lazyLoaderStub,
      });
      let t = setup({ routes });
      expect(lazyActionStub).not.toHaveBeenCalled();
      expect(lazyLoaderStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let actionStub = jest.fn(() => "LAZY ACTION");
      let loaderStub = jest.fn(() => "LAZY LOADER");
      await lazyActionDeferred.resolve(actionStub);
      await lazyLoaderDeferred.resolve(loaderStub);

      let lazyRoute = findRouteById(t.router.routes, "lazy");
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(loaderStub).not.toHaveBeenCalled();
      expect(lazyRoute.lazy).toBeUndefined();
      expect(lazyRoute.action).toBe(actionStub);
      expect(lazyRoute.loader).toBe(loaderStub);
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route loader on fetcher.load() even if lazy function is interrupted", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      let lazyLoaderStub = jest.fn(() => loaderDeferred.promise);
      await lazyDeferred.resolve({
        loader: lazyLoaderStub,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(2);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route loader on fetcher.load() even if lazy property is interrupted", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      let loaderStub = jest.fn(() => loaderDeferred.promise);
      await lazyDeferred.resolve(loaderStub);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");
      expect(loaderStub).toHaveBeenCalledTimes(2);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route action on fetcher.submit() even if lazy function is interrupted", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      let lazyActionStub = jest.fn(() => actionDeferred.promise);
      await lazyDeferred.resolve({
        action: lazyActionStub,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY ACTION");
      expect(lazyActionStub).toHaveBeenCalledTimes(2);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route action on fetcher.submit() even if lazy property is interrupted", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        action: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      let lazyActionStub = jest.fn(() => actionDeferred.promise);
      await lazyDeferred.resolve(lazyActionStub);
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY ACTION");
      expect(lazyActionStub).toHaveBeenCalledTimes(2);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy function execution on repeated loading navigations", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      let lazyLoaderStub = jest.fn(() => loaderDeferred.promise);
      await lazyDeferred.resolve({
        loader: lazyLoaderStub,
      });

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER" });

      expect(lazyLoaderStub).toHaveBeenCalledTimes(2);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy property execution on repeated loading navigations", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      let lazyLoaderStub = jest.fn(() => loaderDeferred.promise);
      await lazyDeferred.resolve(lazyLoaderStub);

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER" });

      expect(lazyLoaderStub).toHaveBeenCalledTimes(2);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy function execution on repeated submission navigations", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      let actionDeferred = createDeferred();
      let lazyLoaderStub = jest.fn(() => loaderDeferred.promise);
      let lazyActionStub = jest.fn(() => actionDeferred.promise);
      await lazyDeferred.resolve({
        action: lazyActionStub,
        loader: lazyLoaderStub,
      });

      await actionDeferred.resolve("LAZY ACTION");
      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.actionData).toEqual({ lazy: "LAZY ACTION" });
      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER" });

      expect(lazyActionStub).toHaveBeenCalledTimes(2);
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy function property on repeated submission navigations", async () => {
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let routes = createBasicLazyRoutes({
        action: lazyActionStub,
        loader: lazyLoaderStub,
      });
      let t = setup({ routes });
      expect(lazyActionStub).not.toHaveBeenCalled();
      expect(lazyLoaderStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      let actionDeferred = createDeferred();
      let loaderStub = jest.fn(() => loaderDeferred.promise);
      let actionStub = jest.fn(() => actionDeferred.promise);
      await lazyActionDeferred.resolve(actionStub);
      await lazyLoaderDeferred.resolve(loaderStub);

      await actionDeferred.resolve("LAZY ACTION");
      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.actionData).toEqual({ lazy: "LAZY ACTION" });
      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER" });

      expect(actionStub).toHaveBeenCalledTimes(2);
      expect(loaderStub).toHaveBeenCalledTimes(1);
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy function execution on repeated fetcher.load calls", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      let lazyLoaderStub = jest.fn(() => loaderDeferred.promise);
      await lazyDeferred.resolve({
        loader: lazyLoaderStub,
      });

      expect(t.fetchers[key].state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(2);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy property execution on repeated fetcher.load calls", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      let lazyLoaderStub = jest.fn(() => loaderDeferred.promise);
      await lazyDeferred.resolve(lazyLoaderStub);

      expect(t.fetchers[key].state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(2);
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });
  });

  describe("errors", () => {
    it("handles errors when failing to resolve lazy route function on initialization", async () => {
      let lazyDeferred = createDeferred();
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
                lazy: () => lazyDeferred.promise,
              },
            ],
          },
        ],
      }).initialize();

      expect(router.state.initialized).toBe(false);
      lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      await tick();
      expect(router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(router.state.initialized).toBe(true);
    });

    it("handles errors when failing to resolve lazy route property on initialization", async () => {
      let lazyDeferred = createDeferred();
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
                lazy: {
                  loader: () => lazyDeferred.promise,
                },
              },
            ],
          },
        ],
      }).initialize();

      expect(router.state.initialized).toBe(false);
      lazyDeferred.reject(new Error("LAZY PROPERTY ERROR"));
      await tick();
      expect(router.state.errors).toEqual({
        root: new Error("LAZY PROPERTY ERROR"),
      });
      expect(router.state.initialized).toBe(true);
    });

    it("handles errors when failing to resolve lazy route function on loading navigation", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to resolve lazy route property on loading navigation", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY PROPERTY ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY PROPERTY ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles loader errors from lazy route functions when the route has an error boundary", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
        hasErrorBoundary: true,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);
      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        lazy: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles loader errors from lazy route properties when the route has an error boundary", async () => {
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let {
        lazyStub: lazyHasErrorBoundaryStub,
        lazyDeferred: lazyHasErrorBoundaryDeferred,
      } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoaderStub,
        hasErrorBoundary: lazyHasErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyLoaderStub).not.toHaveBeenCalled();
      expect(lazyHasErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundaryStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      await lazyHasErrorBoundaryDeferred.resolve(() => true);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        lazy: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from in lazy route functions when the route does not specify an error boundary", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from in lazy route properties when the route does not specify an error boundary", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from lazy route functions when the route specifies hasErrorBoundary:false", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
        hasErrorBoundary: false,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from lazy route properties when the route specifies hasErrorBoundary:false", async () => {
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let {
        lazyStub: lazyHasErrorBoundaryStub,
        lazyDeferred: lazyHasErrorBoundaryDeferred,
      } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoaderStub,
        hasErrorBoundary: lazyHasErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyLoaderStub).not.toHaveBeenCalled();
      expect(lazyHasErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundaryStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      await lazyHasErrorBoundaryDeferred.resolve(false);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from lazy route properties when the route specifies hasErrorBoundary:null", async () => {
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let {
        lazyStub: lazyHasErrorBoundaryStub,
        lazyDeferred: lazyHasErrorBoundaryDeferred,
      } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoaderStub,
        hasErrorBoundary: lazyHasErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyLoaderStub).not.toHaveBeenCalled();
      expect(lazyHasErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundaryStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      await lazyHasErrorBoundaryDeferred.resolve(null);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyLoaderStub).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to resolve lazy route functions on submission navigation", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.loaderData).toEqual({});
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to resolve lazy route properties on submission navigation", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.loaderData).toEqual({});
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles action errors from lazy route functions on submission navigation", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      await lazyDeferred.resolve({
        action: () => actionDeferred.promise,
        hasErrorBoundary: true,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDeferred.reject(new Error("LAZY ACTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.errors).toEqual({
        lazy: new Error("LAZY ACTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles action errors from lazy route properties on submission navigation", async () => {
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let {
        lazyStub: lazyErrorBoundaryStub,
        lazyDeferred: lazyErrorBoundaryDeferred,
      } = createLazyStub();
      let routes = createBasicLazyRoutes({
        action: lazyActionStub,
        hasErrorBoundary: lazyErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyActionStub).not.toHaveBeenCalled();
      expect(lazyErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      await lazyActionDeferred.resolve(() => actionDeferred.promise);
      await lazyErrorBoundaryDeferred.resolve(true);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDeferred.reject(new Error("LAZY ACTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.errors).toEqual({
        lazy: new Error("LAZY ACTION ERROR"),
      });
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles action errors from lazy route functions when the route specifies hasErrorBoundary:false", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      await lazyDeferred.resolve({
        action: () => actionDeferred.promise,
        hasErrorBoundary: false,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDeferred.reject(new Error("LAZY ACTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY ACTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles action errors from lazy route properties when the route specifies hasErrorBoundary:false", async () => {
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let {
        lazyStub: lazyErrorBoundaryStub,
        lazyDeferred: lazyErrorBoundaryDeferred,
      } = createLazyStub();
      let routes = createBasicLazyRoutes({
        action: lazyActionStub,
        hasErrorBoundary: lazyErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyActionStub).not.toHaveBeenCalled();
      expect(lazyErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      await lazyActionDeferred.resolve(() => actionDeferred.promise);
      await lazyErrorBoundaryDeferred.resolve(false);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDeferred.reject(new Error("LAZY ACTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY ACTION ERROR"),
      });
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles action errors from lazy route properties when the route specifies hasErrorBoundary:null", async () => {
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let {
        lazyStub: lazyErrorBoundaryStub,
        lazyDeferred: lazyErrorBoundaryDeferred,
      } = createLazyStub();
      let routes = createBasicLazyRoutes({
        action: lazyActionStub,
        hasErrorBoundary: lazyErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyActionStub).not.toHaveBeenCalled();
      expect(lazyErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      await lazyActionDeferred.resolve(() => actionDeferred.promise);
      await lazyErrorBoundaryDeferred.resolve(null);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await actionDeferred.reject(new Error("LAZY ACTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY ACTION ERROR"),
      });
      expect(lazyActionStub).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to load lazy route functions on fetcher.load", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to load lazy route properties on fetcher.load", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles loader errors in lazy route functions on fetcher.load", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles loader errors in lazy route properties on fetcher.load", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to load lazy route functions on fetcher.submit", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to load lazy route properties on fetcher.submit", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        loader: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles action errors in lazy route functions on fetcher.submit", async () => {
      let { routes, lazyStub, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      await lazyDeferred.resolve({
        action: () => actionDeferred.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.reject(new Error("LAZY ACTION ERROR"));
      await tick();
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY ACTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("handles action errors in lazy route properties on fetcher.submit", async () => {
      let { lazyStub, lazyDeferred } = createLazyStub();
      let routes = createBasicLazyRoutes({
        action: lazyStub,
      });
      let t = setup({ routes });
      expect(lazyStub).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyStub).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      await lazyDeferred.resolve(() => actionDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.reject(new Error("LAZY ACTION ERROR"));
      await tick();
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY ACTION ERROR"),
      });
      expect(lazyStub).toHaveBeenCalledTimes(1);
    });

    it("throws when failing to resolve lazy route functions on staticHandler.query()", async () => {
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

    it("throws when failing to resolve lazy route properties on staticHandler.query()", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "lazy",
              path: "/lazy",
              lazy: {
                loader: async () => {
                  throw new Error("LAZY PROPERTY ERROR");
                },
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
        root: new Error("LAZY PROPERTY ERROR"),
      });
    });

    it("handles loader errors from lazy route functions on staticHandler.query()", async () => {
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

    it("handles loader errors from lazy route properties on staticHandler.query()", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "lazy",
              path: "/lazy",
              lazy: {
                loader: async () => {
                  await tick();
                  return async () => {
                    throw new Error("LAZY LOADER ERROR");
                  };
                },
                hasErrorBoundary: async () => {
                  await tick();
                  return true;
                },
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

    it("bubbles loader errors from lazy route functions on staticHandler.query() when hasErrorBoundary is resolved as false", async () => {
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
                    await tick();
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

    it("bubbles loader errors from lazy route properties on staticHandler.query() when hasErrorBoundary is resolved as false", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "lazy",
              path: "/lazy",
              lazy: {
                loader: async () => {
                  await tick();
                  return async () => {
                    throw new Error("LAZY LOADER ERROR");
                  };
                },
                hasErrorBoundary: async () => {
                  await tick();
                  return false;
                },
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

    it("bubbles loader errors from lazy route properties on staticHandler.query() when hasErrorBoundary is resolved as null", async () => {
      let { query } = createStaticHandler([
        {
          id: "root",
          path: "/",
          children: [
            {
              id: "lazy",
              path: "/lazy",
              lazy: {
                loader: async () => {
                  await tick();
                  return async () => {
                    throw new Error("LAZY LOADER ERROR");
                  };
                },
                hasErrorBoundary: async () => {
                  await tick();
                  return null;
                },
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

    it("throws when failing to resolve lazy route functions on staticHandler.queryRoute()", async () => {
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

    it("throws when failing to resolve lazy route properties on staticHandler.queryRoute()", async () => {
      let { queryRoute } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: {
            loader: async () => {
              throw new Error("LAZY PROPERTY ERROR");
            },
          },
        },
      ]);

      let err;
      try {
        await queryRoute(createRequest("/lazy"));
      } catch (_err) {
        err = _err;
      }

      expect(err?.message).toBe("LAZY PROPERTY ERROR");
    });

    it("handles loader errors in lazy route functions on staticHandler.queryRoute()", async () => {
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

    it("handles loader errors in lazy route properties on staticHandler.queryRoute()", async () => {
      let { queryRoute } = createStaticHandler([
        {
          id: "lazy",
          path: "/lazy",
          lazy: {
            loader: async () => {
              await tick();
              return async () => {
                throw new Error("LAZY LOADER ERROR");
              };
            },
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
