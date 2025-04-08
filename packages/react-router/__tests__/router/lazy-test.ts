import { createMemoryHistory } from "../../lib/router/history";
import { createRouter, createStaticHandler } from "../../lib/router/router";
import {
  createMemoryRouter,
  hydrationRouteProperties,
} from "../../lib/components";

import type {
  TestNonIndexRouteObject,
  TestRouteObject,
} from "./utils/data-router-setup";
import {
  cleanup,
  createDeferred,
  createAsyncStub,
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
    lazy: jest.Mock;
    lazyDeferred: ReturnType<typeof createDeferred>;
  } => {
    let [lazy, lazyDeferred] = createAsyncStub();
    return {
      routes: createBasicLazyRoutes(lazy),
      lazy,
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

      let loader = jest.fn(() => null);
      await lazyLoaderDeferred.resolve(loader);

      // Ensure loader is called as soon as it's loaded
      expect(loader).toHaveBeenCalledTimes(1);

      // Finish loading all lazy properties
      let action = jest.fn(() => null);
      await lazyActionDeferred.resolve(action);
      expect(action).toHaveBeenCalledTimes(0);

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

    it("ignores and warns on unsupported lazy route function properties on router initialization", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let loaderDeferred = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            // @ts-expect-error
            lazy: async () => {
              return {
                loader: () => loaderDeferred.promise,
                lazy: async () => {
                  throw new Error("SHOULD NOT BE CALLED");
                },
                caseSensitive: async () => true,
                path: async () => "/lazy/path",
                id: async () => "lazy",
                index: async () => true,
                children: async () => [],
              };
            },
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let LOADER_DATA = 123;
      await loaderDeferred.resolve(LOADER_DATA);

      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.loaderData).toEqual({
        "0": LOADER_DATA,
      });

      expect(consoleWarn.mock.calls.map((call) => call[0]).sort())
        .toMatchInlineSnapshot(`
        [
          "Route property caseSensitive is not a supported property to be returned from a lazy route function. This property will be ignored.",
          "Route property children is not a supported property to be returned from a lazy route function. This property will be ignored.",
          "Route property id is not a supported property to be returned from a lazy route function. This property will be ignored.",
          "Route property index is not a supported property to be returned from a lazy route function. This property will be ignored.",
          "Route property lazy is not a supported property to be returned from a lazy route function. This property will be ignored.",
          "Route property path is not a supported property to be returned from a lazy route function. This property will be ignored.",
        ]
      `);
      consoleWarn.mockReset();
    });

    it("ignores and warns on unsupported lazy route properties on router initialization", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let loaderDeferred = createDeferred();
      let router = createRouter({
        routes: [
          {
            path: "/lazy",
            lazy: {
              loader: () => loaderDeferred.promise,
              // @ts-expect-error
              lazy: async () => {
                throw new Error("SHOULD NOT BE CALLED");
              },
              caseSensitive: async () => true,
              path: async () => "/lazy/path",
              id: async () => "lazy",
              index: async () => true,
              children: async () => [],
            },
          },
        ],
        history: createMemoryHistory({ initialEntries: ["/lazy"] }),
      });

      expect(router.state.initialized).toBe(false);

      router.initialize();

      let LOADER_DATA = 123;
      let loader = () => LOADER_DATA;
      await loaderDeferred.resolve(loader);

      expect(router.state.location.pathname).toBe("/lazy");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);
      expect(router.state.loaderData).toEqual({
        "0": LOADER_DATA,
      });
      expect(router.state.matches[0].route.loader).toBe(loader);

      expect(consoleWarn.mock.calls.map((call) => call[0]).sort())
        .toMatchInlineSnapshot(`
        [
          "Route property caseSensitive is not a supported lazy route property. This property will be ignored.",
          "Route property children is not a supported lazy route property. This property will be ignored.",
          "Route property id is not a supported lazy route property. This property will be ignored.",
          "Route property index is not a supported lazy route property. This property will be ignored.",
          "Route property lazy is not a supported lazy route property. This property will be ignored.",
          "Route property path is not a supported lazy route property. This property will be ignored.",
        ]
      `);
      consoleWarn.mockReset();
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

      // Ensure loader is called as soon as it's loaded
      let [loader, loaderDeferred] = createAsyncStub();
      await lazyLoaderDeferred.resolve(loader);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(router.state.initialized).toBe(false);

      // Finish loading all lazy properties
      let action = jest.fn(() => null);
      await lazyActionDeferred.resolve(action);
      expect(action).toHaveBeenCalledTimes(0);

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
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("resolves lazy route properties on loading navigation", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        action: lazyAction,
      });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      // Ensure loader is called as soon as it's loaded
      let [loader, loaderDeferred] = createAsyncStub();
      await lazyLoaderDeferred.resolve(loader);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      // Ensure we're still loading if other lazy properties are not loaded yet
      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      // Finish loading all lazy properties
      let action = jest.fn(() => null);
      await lazyActionDeferred.resolve(action);
      expect(action).toHaveBeenCalledTimes(0);

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);
    });

    it("ignores falsy lazy route properties on loading navigation", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      await lazyLoaderDeferred.resolve(null);
      expect(t.router.state.matches[0].route.loader).toBeUndefined();
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({});
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("fetches lazy route functions on submission navigation", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

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

      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("resolves lazy route properties on submission navigation", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        action: lazyAction,
      });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();
      expect(lazyAction).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);

      let [action, actionDeferred] = createAsyncStub();
      let [loader, loaderDeferred] = createAsyncStub();

      // Ensure action is called as soon as it's loaded
      await lazyActionDeferred.resolve(action);
      await actionDeferred.resolve("LAZY ACTION");
      expect(action).toHaveBeenCalledTimes(1);
      expect(loader).toHaveBeenCalledTimes(0);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.loaderData).toEqual({});

      // Finish loading all lazy properties
      await lazyLoaderDeferred.resolve(loader);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(action).toHaveBeenCalledTimes(1);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual({
        lazy: "LAZY ACTION",
      });
      expect(t.router.state.loaderData).toEqual({
        lazy: "LAZY LOADER",
      });

      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);
    });

    it("ignores falsy lazy route properties on submission navigation", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        action: lazyAction,
      });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();
      expect(lazyAction).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);

      await lazyLoaderDeferred.resolve(undefined);
      await lazyActionDeferred.resolve(null);
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.loaderData).toEqual({});
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);
      expect(t.router.state.matches[0].route.loader).toBeUndefined();
      expect(t.router.state.matches[0].route.action).toBeUndefined();
    });

    it("only resolves lazy hydration route properties on hydration", async () => {
      let {
        lazyStub: lazyLoaderForHydration,
        lazyDeferred: lazyLoaderDeferredForHydration,
      } = createLazyStub();
      let {
        lazyStub: lazyLoaderForNavigation,
        lazyDeferred: lazyLoaderDeferredForNavigation,
      } = createLazyStub();
      let {
        lazyStub: lazyHydrateFallbackForHydration,
        lazyDeferred: lazyHydrateFallbackDeferredForHydration,
      } = createLazyStub();
      let {
        lazyStub: lazyHydrateFallbackElementForHydration,
        lazyDeferred: lazyHydrateFallbackElementDeferredForHydration,
      } = createLazyStub();
      let lazyHydrateFallbackForNavigation = jest.fn(async () => null);
      let lazyHydrateFallbackElementForNavigation = jest.fn(async () => null);
      let router = createMemoryRouter(
        [
          {
            path: "/hydration",
            lazy: {
              HydrateFallback: lazyHydrateFallbackForHydration,
              hydrateFallbackElement: lazyHydrateFallbackElementForHydration,
              loader: lazyLoaderForHydration,
            },
          },
          {
            path: "/navigation",
            lazy: {
              HydrateFallback: lazyHydrateFallbackForNavigation,
              hydrateFallbackElement: lazyHydrateFallbackElementForNavigation,
              loader: lazyLoaderForNavigation,
            },
          },
        ],
        {
          initialEntries: ["/hydration"],
        }
      );
      expect(router.state.initialized).toBe(false);

      expect(lazyHydrateFallbackForHydration).toHaveBeenCalledTimes(1);
      expect(lazyHydrateFallbackElementForHydration).toHaveBeenCalledTimes(1);
      expect(lazyLoaderForHydration).toHaveBeenCalledTimes(1);
      await lazyHydrateFallbackDeferredForHydration.resolve(null);
      await lazyHydrateFallbackElementDeferredForHydration.resolve(null);
      await lazyLoaderDeferredForHydration.resolve(null);

      expect(router.state.location.pathname).toBe("/hydration");
      expect(router.state.navigation.state).toBe("idle");
      expect(router.state.initialized).toBe(true);

      let navigationPromise = router.navigate("/navigation");
      expect(router.state.location.pathname).toBe("/hydration");
      expect(router.state.navigation.state).toBe("loading");
      expect(lazyHydrateFallbackForNavigation).not.toHaveBeenCalled();
      expect(lazyHydrateFallbackElementForNavigation).not.toHaveBeenCalled();
      expect(lazyLoaderForNavigation).toHaveBeenCalledTimes(1);
      await lazyLoaderDeferredForNavigation.resolve(null);
      await navigationPromise;
      expect(router.state.location.pathname).toBe("/navigation");
      expect(router.state.navigation.state).toBe("idle");
    });

    it("fetches lazy route functions on fetcher.load", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");

      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("resolves lazy route properties on fetcher.load", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");

      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("skips lazy hydration route properties on fetcher.load", async () => {
      let { lazyStub: lazyLoader, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let lazyHydrateFallback = jest.fn(async () => null);
      let lazyHydrateFallbackElement = jest.fn(async () => null);
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        // @ts-expect-error
        HydrateFallback: lazyHydrateFallback,
        hydrateFallbackElement: lazyHydrateFallbackElement,
      });
      let t = setup({ routes, hydrationRouteProperties });
      expect(lazyHydrateFallback).not.toHaveBeenCalled();
      expect(lazyHydrateFallbackElement).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyHydrateFallback).not.toHaveBeenCalled();
      expect(lazyHydrateFallbackElement).not.toHaveBeenCalled();

      let loaderDeferred = createDeferred();
      lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");
      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");

      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyHydrateFallback).not.toHaveBeenCalled();
      expect(lazyHydrateFallbackElement).not.toHaveBeenCalled();
    });

    it("fetches lazy route functions on fetcher.submit", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      lazyDeferred.resolve({
        action: () => actionDeferred.promise,
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");
      expect(t.fetchers[key]?.state).toBe("idle");
      expect(t.fetchers[key]?.data).toBe("LAZY ACTION");

      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("resolves lazy route properties on fetcher.submit", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        action: lazyAction,
      });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();
      expect(lazyAction).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      let loaderDeferred = createDeferred();
      lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      lazyActionDeferred.resolve(() => actionDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");
      expect(t.fetchers[key]?.state).toBe("idle");
      expect(t.fetchers[key]?.data).toBe("LAZY ACTION");

      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);
    });

    it("skips lazy hydration route properties on fetcher.submit", async () => {
      let { lazyStub: lazyLoaderStub, lazyDeferred: lazyLoaderDeferred } =
        createLazyStub();
      let { lazyStub: lazyActionStub, lazyDeferred: lazyActionDeferred } =
        createLazyStub();
      let lazyHydrateFallback = jest.fn(async () => null);
      let lazyHydrateFallbackElement = jest.fn(async () => null);
      let routes = createBasicLazyRoutes({
        loader: lazyLoaderStub,
        action: lazyActionStub,
        // @ts-expect-error
        HydrateFallback: lazyHydrateFallback,
        hydrateFallbackElement: lazyHydrateFallbackElement,
      });
      let t = setup({ routes, hydrationRouteProperties });
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
      expect(lazyHydrateFallback).not.toHaveBeenCalled();
      expect(lazyHydrateFallbackElement).not.toHaveBeenCalled();

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
      expect(lazyHydrateFallback).not.toHaveBeenCalled();
      expect(lazyHydrateFallbackElement).not.toHaveBeenCalled();
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

    it("resolves lazy hydration route properties on staticHandler.queryRoute()", async () => {
      let lazyHydrateFallback = jest.fn(async () => null);
      let lazyHydrateFallbackElement = jest.fn(async () => null);
      let { queryRoute } = createStaticHandler(
        [
          {
            id: "lazy",
            path: "/lazy",
            lazy: {
              loader: async () => {
                await tick();
                return () => Response.json({ value: "LAZY LOADER" });
              },
              // @ts-expect-error
              HydrateFallback: lazyHydrateFallback,
              hydrateFallbackElement: lazyHydrateFallbackElement,
            },
          },
        ],
        { hydrationRouteProperties }
      );

      let response = await queryRoute(createRequest("/lazy"));
      let data = await response.json();
      expect(data).toEqual({ value: "LAZY LOADER" });
      expect(lazyHydrateFallback).toHaveBeenCalled();
      expect(lazyHydrateFallbackElement).toHaveBeenCalled();
    });
  });

  describe("statically defined fields", () => {
    it("prefers statically defined loader over lazily defined loader via lazy function", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let [lazy, lazyDeferred] = createAsyncStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            loader: true,
            lazy,
          },
        ],
      });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      // Execute in parallel
      expect(A.loaders.lazy.stub).toHaveBeenCalled();
      expect(lazy).toHaveBeenCalledTimes(1);

      let loader = jest.fn(() => "LAZY LOADER");
      lazyDeferred.resolve({ loader });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await A.loaders.lazy.resolve("STATIC LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "STATIC LOADER",
      });

      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.loader).toEqual(expect.any(Function));
      expect(route.loader).not.toBe(loader);
      expect(loader).not.toHaveBeenCalled();
      expect(lazy).toHaveBeenCalledTimes(1);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader via lazy property", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            loader: true,
            lazy: {
              loader: lazyLoader,
            },
          },
        ],
      });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      // Execute in parallel
      expect(A.loaders.lazy.stub).toHaveBeenCalled();
      expect(lazyLoader).toHaveBeenCalledTimes(0);

      let loader = jest.fn(() => "LAZY LOADER");
      lazyLoaderDeferred.resolve(loader);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await A.loaders.lazy.resolve("STATIC LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "STATIC LOADER",
      });

      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.loader).toEqual(expect.any(Function));
      expect(route.loader).not.toBe(loader);
      expect(loader).not.toHaveBeenCalled();
      expect(lazyLoader).toHaveBeenCalledTimes(0);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined falsy loader via lazy property", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            loader: true,
            lazy: {
              loader: lazyLoader,
            },
          },
        ],
      });

      let A = await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      // Execute in parallel
      expect(A.loaders.lazy.stub).toHaveBeenCalled();
      expect(lazyLoader).toHaveBeenCalledTimes(0);

      lazyLoaderDeferred.resolve(null);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await A.loaders.lazy.resolve("STATIC LOADER");
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({
        lazy: "STATIC LOADER",
      });

      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.loader).toEqual(expect.any(Function));
      expect(route.loader).toBeInstanceOf(Function);
      expect(lazyLoader).toHaveBeenCalledTimes(0);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action over lazily loaded action via lazy function", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let [lazy, lazyDeferred] = createAsyncStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            lazy,
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
      expect(lazy).toHaveBeenCalledTimes(1);

      let lazyAction = jest.fn(() => "LAZY ACTION");
      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve({
        action: lazyAction,
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

      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.action).toEqual(expect.any(Function));
      expect(route.action).not.toBe(lazyAction);
      expect(lazyAction).not.toHaveBeenCalled();
      expect(lazy).toHaveBeenCalledTimes(1);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "action" defined but its lazy function is also returning a value for this property. The lazy route property "action" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action over lazily loaded action via lazy property", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            lazy: {
              action: lazyAction,
              loader: lazyLoader,
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
      expect(lazyAction).toHaveBeenCalledTimes(0);
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      let action = jest.fn(() => "LAZY ACTION");
      let loaderDeferred = createDeferred();
      lazyActionDeferred.resolve(action);
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

      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.action).toEqual(expect.any(Function));
      expect(route.action).not.toBe(action);
      expect(action).not.toHaveBeenCalled();
      expect(lazyAction).toHaveBeenCalledTimes(0);
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "action" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined action/loader over lazily defined action/loader via lazy function", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let [lazy, lazyDeferred] = createAsyncStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            loader: true,
            lazy,
          },
        ],
      });

      let A = await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

      let action = jest.fn(() => "LAZY ACTION");
      let loader = jest.fn(() => "LAZY LOADER");
      await lazyDeferred.resolve({ action, loader });
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

      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.action).toEqual(expect.any(Function));
      expect(route.loader).toEqual(expect.any(Function));
      expect(route.action).not.toBe(action);
      expect(route.loader).not.toBe(loader);
      expect(action).not.toHaveBeenCalled();
      expect(loader).not.toHaveBeenCalled();
      expect(lazy).toHaveBeenCalledTimes(1);

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
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let t = setup({
        routes: [
          {
            id: "lazy",
            path: "/lazy",
            action: true,
            loader: true,
            lazy: {
              action: lazyAction,
              loader: lazyLoader,
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
      expect(lazyLoader).toHaveBeenCalledTimes(0);

      expect(lazyAction).toHaveBeenCalledTimes(0);
      let action = jest.fn(() => "LAZY ACTION");
      let loader = jest.fn(() => "LAZY LOADER");
      lazyActionDeferred.resolve(action);
      lazyLoaderDeferred.resolve(loader);
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

      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.action).toEqual(expect.any(Function));
      expect(route.loader).toEqual(expect.any(Function));
      expect(route.action).not.toBe(action);
      expect(route.loader).not.toBe(loader);
      expect(action).not.toHaveBeenCalled();
      expect(loader).not.toHaveBeenCalled();
      expect(lazyAction).toHaveBeenCalledTimes(0);
      expect(lazyLoader).toHaveBeenCalledTimes(0);

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
      let loader = jest.fn(async () => {
        await tick();
        return Response.json({ value: "LAZY LOADER" });
      });
      let lazy = jest.fn(async () => {
        await tick();
        return {
          loader,
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
          lazy,
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
      expect(lazy).toHaveBeenCalledTimes(1);
      expect(loader).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader via lazy property (staticHandler.query)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let loader = jest.fn(async () => {
        await tick();
        return Response.json({ value: "LAZY LOADER" });
      });
      let lazyLoader = jest.fn(async () => {
        await tick();
        return loader;
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
            loader: lazyLoader,
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
      expect(lazyLoader).not.toHaveBeenCalled();
      expect(loader).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader via lazy function (staticHandler.queryRoute)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let loader = jest.fn(async () => {
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
              loader,
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
      expect(loader).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined but its lazy function is also returning a value for this property. The lazy route property "loader" will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("prefers statically defined loader over lazily defined loader via lazy property (staticHandler.queryRoute)", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let loader = jest.fn(async () => {
        await tick();
        return Response.json({ value: "LAZY LOADER" });
      });
      let lazyLoader = jest.fn(async () => {
        await tick();
        return loader;
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
            loader: lazyLoader,
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
      expect(loader).not.toHaveBeenCalled();
      expect(lazyLoader).not.toHaveBeenCalled();

      expect(consoleWarn).toHaveBeenCalledTimes(1);
      expect(consoleWarn.mock.calls[0][0]).toMatchInlineSnapshot(
        `"Route "lazy" has a static property "loader" defined. The lazy property will be ignored."`
      );
      consoleWarn.mockReset();
    });

    it("handles errors thrown from static loaders before lazy function has completed", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let [lazy, lazyDeferred] = createAsyncStub();
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
                lazy,
              },
            ],
          },
        ],
      });
      expect(lazy).not.toHaveBeenCalled();

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
      expect(lazy).toHaveBeenCalledTimes(1);
      consoleWarn.mockReset();
    });

    it("handles errors thrown from static loaders before lazy property has resolved", async () => {
      let consoleWarn = jest.spyOn(console, "warn");
      let [lazyHasErrorBoundary, lazyHasErrorBoundaryDeferred] =
        createAsyncStub();
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
                  hasErrorBoundary: lazyHasErrorBoundary,
                },
              },
            ],
          },
        ],
      });
      expect(lazyHasErrorBoundary).not.toHaveBeenCalled();

      let A = await t.navigate("/lazy");

      await A.loaders.lazy.reject("STATIC LOADER ERROR");
      expect(t.router.state.navigation.state).toBe("loading");

      // We shouldn't bubble the loader error until after this resolves
      // so we know if it has a boundary or not
      await lazyHasErrorBoundaryDeferred.resolve(true);
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        lazy: "STATIC LOADER ERROR",
      });
      expect(lazyHasErrorBoundary).toHaveBeenCalledTimes(1);
      consoleWarn.mockReset();
    });
  });

  it("bubbles errors thrown from static loaders before lazy property has resolved if lazy 'hasErrorBoundary' is falsy", async () => {
    let consoleWarn = jest.spyOn(console, "warn");
    let [lazyHasErrorBoundary, lazyHasErrorBoundaryDeferred] =
      createAsyncStub();
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
                hasErrorBoundary: lazyHasErrorBoundary,
              },
            },
          ],
        },
      ],
    });
    expect(lazyHasErrorBoundary).not.toHaveBeenCalled();

    let A = await t.navigate("/lazy");

    await A.loaders.lazy.reject("STATIC LOADER ERROR");
    expect(t.router.state.navigation.state).toBe("loading");

    // We shouldn't bubble the loader error until after this resolves
    // so we know if it has a boundary or not
    await lazyHasErrorBoundaryDeferred.resolve(null);
    expect(t.router.state.location.pathname).toBe("/lazy");
    expect(t.router.state.navigation.state).toBe("idle");
    expect(t.router.state.loaderData).toEqual({});
    expect(t.router.state.errors).toEqual({
      root: "STATIC LOADER ERROR",
    });
    expect(lazyHasErrorBoundary).toHaveBeenCalledTimes(1);
    consoleWarn.mockReset();
  });

  describe("interruptions", () => {
    it("runs lazily loaded route loader even if lazy function is interrupted", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let loader = jest.fn(() => "LAZY LOADER");
      await lazyDeferred.resolve({ loader });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(loader).toHaveBeenCalledTimes(1);

      // Ensure the lazy route object update still happened
      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.loader).toBe(loader);

      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route loader even if lazy property is interrupted", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let loader = jest.fn(() => "LAZY LOADER");
      await lazyLoaderDeferred.resolve(loader);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(loader).toHaveBeenCalledTimes(1);

      // Ensure the lazy route object update still happened
      let route = findRouteById(t.router.routes, "lazy");
      expect(route.lazy).toBeUndefined();
      expect(route.loader).toBe(loader);

      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route action even if lazy function is interrupted", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let action = jest.fn(() => "LAZY ACTION");
      let loader = jest.fn(() => "LAZY LOADER");
      await lazyDeferred.resolve({ action, loader });

      let route = findRouteById(t.router.routes, "lazy");
      expect(action).toHaveBeenCalledTimes(1);
      expect(loader).not.toHaveBeenCalled();
      expect(route.lazy).toBeUndefined();
      expect(route.action).toBe(action);
      expect(route.loader).toBe(loader);
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route action even if lazy property is interrupted", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({
        action: lazyAction,
        loader: lazyLoader,
      });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");

      await t.navigate("/");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("idle");

      let action = jest.fn(() => "LAZY ACTION");
      let loader = jest.fn(() => "LAZY LOADER");
      await lazyActionDeferred.resolve(action);
      await lazyLoaderDeferred.resolve(loader);

      let route = findRouteById(t.router.routes, "lazy");
      expect(action).toHaveBeenCalledTimes(1);
      expect(loader).not.toHaveBeenCalled();
      expect(route.lazy).toBeUndefined();
      expect(route.action).toBe(action);
      expect(route.loader).toBe(loader);
      expect(lazyAction).toHaveBeenCalledTimes(1);
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route loader on fetcher.load() even if lazy function is interrupted", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      let [loader, loaderDeferred] = createAsyncStub();
      await lazyDeferred.resolve({ loader });
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");
      expect(loader).toHaveBeenCalledTimes(2);
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route loader on fetcher.load() even if lazy property is interrupted", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      let [loader, loaderDeferred] = createAsyncStub();
      await lazyLoaderDeferred.resolve(loader);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");
      expect(loader).toHaveBeenCalledTimes(2);
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route action on fetcher.submit() even if lazy function is interrupted", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

      let [action, actionDeferred] = createAsyncStub();
      await lazyDeferred.resolve({ action });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY ACTION");
      expect(action).toHaveBeenCalledTimes(2);
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("runs lazily loaded route action on fetcher.submit() even if lazy property is interrupted", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ action: lazyAction });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);

      let [action, actionDeferred] = createAsyncStub();
      await lazyActionDeferred.resolve(action);
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.resolve("LAZY ACTION");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY ACTION");
      expect(action).toHaveBeenCalledTimes(2);
      expect(lazyAction).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy function execution on repeated loading navigations", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      let [loader, loaderDeferred] = createAsyncStub();
      await lazyDeferred.resolve({ loader });

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER" });

      expect(loader).toHaveBeenCalledTimes(2);
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy property execution on repeated loading navigations", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      let [loader, loaderDeferred] = createAsyncStub();
      await lazyLoaderDeferred.resolve(loader);

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER" });

      expect(loader).toHaveBeenCalledTimes(2);
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy function execution on repeated submission navigations", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

      let [action, actionDeferred] = createAsyncStub();
      let [loader, loaderDeferred] = createAsyncStub();
      await lazyDeferred.resolve({ action, loader });

      await actionDeferred.resolve("LAZY ACTION");
      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.actionData).toEqual({ lazy: "LAZY ACTION" });
      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER" });

      expect(action).toHaveBeenCalledTimes(2);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy function property on repeated submission navigations", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({
        action: lazyAction,
        loader: lazyLoader,
      });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      let [action, actionDeferred] = createAsyncStub();
      let [loader, loaderDeferred] = createAsyncStub();
      await lazyActionDeferred.resolve(action);
      await lazyLoaderDeferred.resolve(loader);

      await actionDeferred.resolve("LAZY ACTION");
      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.actionData).toEqual({ lazy: "LAZY ACTION" });
      expect(t.router.state.loaderData).toEqual({ lazy: "LAZY LOADER" });

      expect(action).toHaveBeenCalledTimes(2);
      expect(loader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy function execution on repeated fetcher.load calls", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      let [loader, loaderDeferred] = createAsyncStub();
      await lazyDeferred.resolve({ loader });

      expect(t.fetchers[key].state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");
      expect(loader).toHaveBeenCalledTimes(2);
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("uses the first-called lazy property execution on repeated fetcher.load calls", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      let [loader, loaderDeferred] = createAsyncStub();
      await lazyLoaderDeferred.resolve(loader);

      expect(t.fetchers[key].state).toBe("loading");

      await loaderDeferred.resolve("LAZY LOADER");

      expect(t.fetchers[key].state).toBe("idle");
      expect(t.fetchers[key].data).toBe("LAZY LOADER");
      expect(loader).toHaveBeenCalledTimes(2);
      expect(lazyLoader).toHaveBeenCalledTimes(1);
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
      let lazyLoaderDeferred = createDeferred();
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
                  loader: () => lazyLoaderDeferred.promise,
                },
              },
            ],
          },
        ],
      }).initialize();

      expect(router.state.initialized).toBe(false);
      lazyLoaderDeferred.reject(new Error("LAZY PROPERTY ERROR"));
      await tick();
      expect(router.state.errors).toEqual({
        root: new Error("LAZY PROPERTY ERROR"),
      });
      expect(router.state.initialized).toBe(true);
    });

    it("handles errors when failing to resolve lazy route function on loading navigation", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to resolve lazy route loader property on loading navigation", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      await lazyLoaderDeferred.reject(new Error("LAZY PROPERTY ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY PROPERTY ERROR"),
      });
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to resolve other lazy route properties on loading navigation", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        action: lazyAction,
      });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      // Ensure loader is called as soon as it's loaded
      let loader = jest.fn(() => null);
      await lazyLoaderDeferred.resolve(loader);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(loader).toHaveBeenCalledTimes(1);

      // Reject remaining lazy properties
      await lazyActionDeferred.reject(new Error("LAZY PROPERTY ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY PROPERTY ERROR"),
      });
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyAction).toHaveBeenCalledTimes(1);
    });

    it("handles loader errors from lazy route functions when the route has an error boundary", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyDeferred.resolve({
        loader: () => loaderDeferred.promise,
        hasErrorBoundary: true,
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);
      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        lazy: new Error("LAZY LOADER ERROR"),
      });
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("handles loader errors from lazy route properties when the route has an error boundary", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyHasErrorBoundary, lazyHasErrorBoundaryDeferred] =
        createAsyncStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        hasErrorBoundary: lazyHasErrorBoundary,
      });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();
      expect(lazyHasErrorBoundary).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundary).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      await lazyHasErrorBoundaryDeferred.resolve(() => true);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        lazy: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundary).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from in lazy route functions when the route does not specify an error boundary", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

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
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from in lazy route properties when the route does not specify an error boundary", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));

      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from lazy route functions when the route specifies hasErrorBoundary:false", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

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
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from lazy route properties when the route specifies hasErrorBoundary:false", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyHasErrorBoundary, lazyHasErrorBoundaryDeferred] =
        createAsyncStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        hasErrorBoundary: lazyHasErrorBoundary,
      });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();
      expect(lazyHasErrorBoundary).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundary).toHaveBeenCalledTimes(1);

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
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundary).toHaveBeenCalledTimes(1);
    });

    it("bubbles loader errors from lazy route properties when the route specifies hasErrorBoundary:null", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let [lazyHasErrorBoundary, lazyHasErrorBoundaryDeferred] =
        createAsyncStub();
      let routes = createBasicLazyRoutes({
        loader: lazyLoader,
        hasErrorBoundary: lazyHasErrorBoundary,
      });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();
      expect(lazyHasErrorBoundary).not.toHaveBeenCalled();

      await t.navigate("/lazy");
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundary).toHaveBeenCalledTimes(1);

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
      expect(lazyLoader).toHaveBeenCalledTimes(1);
      expect(lazyHasErrorBoundary).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to resolve lazy route functions on submission navigation", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.loaderData).toEqual({});
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to resolve lazy route properties on submission navigation", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ action: lazyAction });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);

      await lazyActionDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.location.pathname).toBe("/lazy");
      expect(t.router.state.navigation.state).toBe("idle");

      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(t.router.state.actionData).toEqual(null);
      expect(t.router.state.loaderData).toEqual({});
      expect(lazyAction).toHaveBeenCalledTimes(1);
    });

    it("handles action errors from lazy route functions on submission navigation", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

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
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("handles action errors from lazy route properties on submission navigation", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let [lazyErrorBoundaryStub, lazyErrorBoundaryDeferred] =
        createAsyncStub();
      let routes = createBasicLazyRoutes({
        action: lazyAction,
        hasErrorBoundary: lazyErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();
      expect(lazyErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);
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
      expect(lazyAction).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles action errors from lazy route functions when the route specifies hasErrorBoundary:false", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

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
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("bubbles action errors from lazy route properties when the route specifies hasErrorBoundary:false", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let [lazyErrorBoundaryStub, lazyErrorBoundaryDeferred] =
        createAsyncStub();
      let routes = createBasicLazyRoutes({
        action: lazyAction,
        hasErrorBoundary: lazyErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();
      expect(lazyErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);
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
      expect(lazyAction).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("bubbles action errors from lazy route properties when the route specifies hasErrorBoundary:null", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let [lazyErrorBoundaryStub, lazyErrorBoundaryDeferred] =
        createAsyncStub();
      let routes = createBasicLazyRoutes({
        action: lazyAction,
        hasErrorBoundary: lazyErrorBoundaryStub,
      });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();
      expect(lazyErrorBoundaryStub).not.toHaveBeenCalled();

      await t.navigate("/lazy", {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.location.pathname).toBe("/");
      expect(t.router.state.navigation.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);
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
      expect(lazyAction).toHaveBeenCalledTimes(1);
      expect(lazyErrorBoundaryStub).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to load lazy route functions on fetcher.load", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to load lazy route properties on fetcher.load", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      await lazyLoaderDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("handles loader errors in lazy route functions on fetcher.load", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazy).toHaveBeenCalledTimes(1);

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
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("handles loader errors in lazy route properties on fetcher.load", async () => {
      let [lazyLoader, lazyLoaderDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ loader: lazyLoader });
      let t = setup({ routes });
      expect(lazyLoader).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");
      expect(lazyLoader).toHaveBeenCalledTimes(1);

      let loaderDeferred = createDeferred();
      await lazyLoaderDeferred.resolve(() => loaderDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("loading");

      await loaderDeferred.reject(new Error("LAZY LOADER ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY LOADER ERROR"),
      });
      expect(lazyLoader).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to load lazy route functions on fetcher.submit", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

      await lazyDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("handles errors when failing to load lazy route properties on fetcher.submit", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ action: lazyAction });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);

      await lazyActionDeferred.reject(new Error("LAZY FUNCTION ERROR"));
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY FUNCTION ERROR"),
      });
      expect(lazyAction).toHaveBeenCalledTimes(1);
    });

    it("handles action errors in lazy route functions on fetcher.submit", async () => {
      let { routes, lazy, lazyDeferred } = createBasicLazyFunctionRoutes();
      let t = setup({ routes });
      expect(lazy).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazy).toHaveBeenCalledTimes(1);

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
      expect(lazy).toHaveBeenCalledTimes(1);
    });

    it("handles action errors in lazy route properties on fetcher.submit", async () => {
      let [lazyAction, lazyActionDeferred] = createAsyncStub();
      let routes = createBasicLazyRoutes({ action: lazyAction });
      let t = setup({ routes });
      expect(lazyAction).not.toHaveBeenCalled();

      let key = "key";
      await t.fetch("/lazy", key, {
        formMethod: "post",
        formData: createFormData({}),
      });
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");
      expect(lazyAction).toHaveBeenCalledTimes(1);

      let actionDeferred = createDeferred();
      await lazyActionDeferred.resolve(() => actionDeferred.promise);
      expect(t.router.state.fetchers.get(key)?.state).toBe("submitting");

      await actionDeferred.reject(new Error("LAZY ACTION ERROR"));
      await tick();
      expect(t.router.state.fetchers.get(key)).toBeUndefined();
      expect(t.router.state.errors).toEqual({
        root: new Error("LAZY ACTION ERROR"),
      });
      expect(lazyAction).toHaveBeenCalledTimes(1);
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
