import { createMemoryHistory, InitialEntry, parsePath } from "history";
import type {
  HydrationState,
  LoaderFunctionArgs,
  NavigateOptions,
} from "../index";
import { createRemixRouter, IDLE_TRANSITION } from "../router";
import { invariant, matchRoutes, RouteObject } from "../utils";

// TODO find a better way to handle this
console.debug = () => {};

///////////////////////////////////////////////////////////////////////////////
//#region Types and Utils
///////////////////////////////////////////////////////////////////////////////

type Deferred = ReturnType<typeof defer>;

// Routes passed into setup() should just have a boolean for loader/action
// indicating they want a stub
type TestRouteObject = Pick<RouteObject, "id" | "index" | "path"> & {
  loader?: boolean;
  exceptionElement?: boolean;
  children?: TestRouteObject[];
};

// Enhanced route objects are what is passed to the router for testing, as they
// have been enhanced with stubbed loaders and actions
type EnhancedRouteObject = Omit<TestRouteObject, "loader" | "children"> & {
  loader?: (args: LoaderFunctionArgs) => Promise<unknown>;
  children?: EnhancedRouteObject[];
};

// A helper that includes the Deferred and stubs for any loaders/actions for the
// route allowing fine-grained test execution
type InternalLoaderHelpers = {
  dfd: Deferred;
  stub: jest.Mock;
  _signal?: AbortSignal;
};

type LoaderHelpers = InternalLoaderHelpers & {
  get signal(): AbortSignal;
  resolve: (d: any) => Promise<void>;
  reject: (d: any) => Promise<void>;
  redirect: (href: string, status?: number) => Promise<NavigationHelpers>;
};

// Helpers returned from a TestHarness.navigate call, allowing fine grained
// control and assertions over the loaders/actions
type NavigationHelpers = {
  loaders: Record<string, LoaderHelpers>;
};

// Global array to stick any errors thrown from router.navigate() and then we
// can assert against them and clear the array in afterEach
let uncaughtExceptions: string[] = [];
function handleUncaughtException(e: any): void {
  uncaughtExceptions.push(
    e instanceof Error ? `${e.message}\n${e.stack}` : String(e)
  );
}

function defer() {
  let resolve: (val?: any) => Promise<void>;
  let reject: (error?: Error) => Promise<void>;
  let promise = new Promise((res, rej) => {
    resolve = async (val: any) => {
      res(val);
      try {
        await promise;
      } catch (e) {}
    };
    reject = async (error?: Error) => {
      rej(error);
      try {
        await promise;
      } catch (e) {}
    };
  });
  return {
    promise,
    //@ts-ignore
    resolve,
    //@ts-ignore
    reject,
  };
}

type SetupOpts = {
  routes: TestRouteObject[];
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  hydrationData?: HydrationState;
};

function setup({
  routes,
  initialEntries,
  initialIndex,
  hydrationData,
}: SetupOpts) {
  let guid = 0;
  // Global "active" loader helpers, keyed by guid:routeId.  "Active" indicates that
  // this is the loader which will be waited on when the route loader is called.
  // If a navigation is interrupted, we put the the new (active) navigation in
  // here so the next execution of callLoaders will use the right hooks
  let activeLoaderHelpers = new Map<string, InternalLoaderHelpers>();
  // A set of to-be-garbage-collected Deferred's to clean up at the end of a test
  let gcDfds = new Set<Deferred>();
  let onChangeListener: (() => void) | undefined;

  // Enhance routes with loaders/actions as requested that will call the
  // active navigation loader/action
  function enhanceRoutes(_routes: TestRouteObject[]) {
    return _routes.map((r) => {
      let enhancedRoute: EnhancedRouteObject = {
        ...r,
        loader: undefined,
        children: undefined,
      };
      if (r.loader) {
        enhancedRoute.loader = (args) => {
          let helpers = activeLoaderHelpers.get(`${guid}:${r.id}`);
          invariant(helpers, `No loader helpers found for guid: ${guid}`);
          helpers.stub(args);
          helpers._signal = args.signal;
          return helpers.dfd.promise;
        };
      }
      if (r.children) {
        enhancedRoute.children = enhanceRoutes(r.children);
      }
      return enhancedRoute;
    });
  }

  let history = createMemoryHistory({ initialEntries, initialIndex });
  let enhancedRoutes = enhanceRoutes(routes);
  let router = createRemixRouter({
    history,
    routes: enhancedRoutes,
    hydrationData,
    onChange: () => onChangeListener?.(),
  });

  function getNavigationHelpers(
    href: string,
    navigationId: number
  ): NavigationHelpers {
    let matches = matchRoutes(enhancedRoutes, href);
    let matchesWithLoaders = (matches || []).filter((m) => m.route.loader);

    // Generate helpers for all route matches that container loaders
    let loaderHelpers = matchesWithLoaders.reduce((acc, m) => {
      let routeId = m.route.id;
      // Internal methods we need access to from the route loader execution
      let internalHelpers: InternalLoaderHelpers = {
        dfd: defer(),
        stub: jest.fn(),
      };
      // Set the active loader so the execution of the loader waits on the
      // correct promise
      activeLoaderHelpers.set(`${navigationId}:${routeId}`, internalHelpers);
      gcDfds.add(internalHelpers.dfd);
      return Object.assign(acc, {
        [routeId]: {
          ...internalHelpers,
          get signal() {
            return internalHelpers._signal;
          },
          // Public APIs only needed for test execution
          async resolve(value) {
            await internalHelpers.dfd.resolve(value);
          },
          async reject(value) {
            try {
              await internalHelpers.dfd.reject(value);
            } catch (e) {}
          },
          async redirect(href, status = 301) {
            try {
              //@ts-ignore
              await internalHelpers.dfd.reject(
                //@ts-ignore
                new Response(null, {
                  status,
                  headers: {
                    location: href,
                  },
                })
              );
            } catch (e) {}

            let redirectNavigationId = ++guid;
            return getNavigationHelpers(href, redirectNavigationId);
          },
        } as LoaderHelpers,
      });
    }, {});

    return {
      loaders: loaderHelpers,
    };
  }

  // Simulate a navigation, returning a series of helpers to manually
  // control/assert loader/actions
  function navigate(n: number): Promise<NavigationHelpers>;
  function navigate(
    href: string,
    opts?: NavigateOptions
  ): Promise<NavigationHelpers>;
  async function navigate(
    href: number | string,
    opts?: NavigateOptions
  ): Promise<NavigationHelpers> {
    let navigationId = ++guid;
    let helpers: NavigationHelpers;

    if (typeof href === "number") {
      let promise = new Promise<void>((r) => {
        onChangeListener = () => {
          helpers = getNavigationHelpers(
            history.createHref(history.location),
            navigationId
          );
          onChangeListener = undefined;
          r();
        };
      });
      router.navigate(href).catch(handleUncaughtException);
      await promise;
      //@ts-ignore
      return helpers;
    }

    helpers = getNavigationHelpers(href, navigationId);
    router.navigate(href, opts).catch(handleUncaughtException);
    return helpers;
  }

  return {
    history,
    router,
    navigate,
    cleanup() {
      gcDfds.forEach((dfd) => dfd.resolve());
    },
  };
}

function initializeTmTest() {
  return setup({
    routes: TM_ROUTES,
    hydrationData: { loaderData: { root: "ROOT" } },
  });
}
//#endregion

///////////////////////////////////////////////////////////////////////////////
//#region Tests
///////////////////////////////////////////////////////////////////////////////

// Reusable routes for a simple todo app, for test cases that don't want
// to create their own more complex routes
const TASK_ROUTES: TestRouteObject[] = [
  {
    id: "root",
    path: "/",
    loader: true,
    exceptionElement: true,
    children: [
      {
        id: "index",
        index: true,
        loader: true,
      },
      {
        id: "tasks",
        path: "tasks",
        loader: true,
        exceptionElement: true,
      },
      {
        id: "tasksId",
        path: "tasks/:id",
        loader: true,
        exceptionElement: true,
      },
      {
        id: "noLoader",
        path: "no-loader",
      },
    ],
  },
];

const TM_ROUTES = [
  {
    path: "",
    id: "root",
    element: {},
    module: "",
    exceptionElement: true,
    loader: true,
    children: [
      {
        path: "/",
        id: "index",
        hasLoader: true,
        loader: true,
        // action: true,
        element: {},
        module: "",
      },
      {
        path: "/foo",
        id: "foo",
        loader: true,
        // action: true,
        element: {},
        module: "",
      },
      {
        path: "/foo/bar",
        id: "foobar",
        loader: true,
        // action: true,
        element: {},
        module: "",
      },
      {
        path: "/bar",
        id: "bar",
        loader: true,
        // action: true,
        element: {},
        module: "",
      },
      {
        path: "/baz",
        id: "baz",
        loader: true,
        // action: true,
        element: {},
        module: "",
      },
      {
        path: "/p/:param",
        id: "param",
        loader: true,
        // action: true,
        element: {},
        module: "",
      },
    ],
  },
];

// Detect any failures inside the router navigate code
afterEach(() => {
  if (uncaughtExceptions.length) {
    let NO_UNCAUGHT_EXCEPTIONS = "No Uncaught Exceptions";
    let strExceptions = uncaughtExceptions.join(",") || NO_UNCAUGHT_EXCEPTIONS;
    uncaughtExceptions = [];
    expect(strExceptions).toEqual(NO_UNCAUGHT_EXCEPTIONS);
  }
});

describe("a remix router", () => {
  describe("init", () => {
    it("with initial values", async () => {
      let history = createMemoryHistory({ initialEntries: ["/"] });
      let router = createRemixRouter({
        routes: [
          {
            element: {},
            id: "root",
            path: "/",
            exceptionElement: {},
            loader: () => Promise.resolve(),
          },
        ],
        history,
        hydrationData: {
          loaderData: { root: "LOADER DATA" },
          // TODO
          // actionData: { root: "ACTION DATA" },
          exceptions: { root: new Error("lol") },
        },
        onChange: () => {},
      });
      expect(router.state).toEqual({
        action: "POP",
        exceptions: {
          root: new Error("lol"),
        },
        loaderData: {
          root: "LOADER DATA",
        },
        location: {
          hash: "",
          key: expect.any(String),
          pathname: "/",
          search: "",
          state: null,
        },
        matches: [
          {
            params: {},
            pathname: "/",
            pathnameBase: "/",
            route: {
              element: {},
              exceptionElement: {},
              id: "root",
              loader: expect.any(Function),
              path: "/",
            },
          },
        ],
        transition: {
          location: undefined,
          state: "idle",
          submission: undefined,
          type: "idle",
        },
      });
    });
  });

  describe("normal navigation", () => {
    it("fetches data on navigation", async () => {
      let t = initializeTmTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(t.router.state.loaderData).toMatchInlineSnapshot(`
        Object {
          "foo": "FOO",
          "root": "ROOT",
        }
      `);
    });

    it("allows `null` as a valid data value", async () => {
      let t = initializeTmTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve(null);
      expect(t.router.state.loaderData.foo).toBe(null);
    });

    it("does not fetch unchanging layout data", async () => {
      let t = initializeTmTest();
      let A = await t.navigate("/foo");
      await A.loaders.foo.resolve("FOO");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData.root).toBe("ROOT");
    });

    it("reloads all routes on search changes", async () => {
      let t = initializeTmTest();
      let A = await t.navigate("/foo?q=1");
      await A.loaders.root.resolve("ROOT1");
      await A.loaders.foo.resolve("1");
      expect(A.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT1",
        foo: "1",
      });

      let B = await t.navigate("/foo?q=2");
      await B.loaders.root.resolve("ROOT2");
      await B.loaders.foo.resolve("2");
      expect(B.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT2",
        foo: "2",
      });
    });

    it("does not reload all routes when search does not change", async () => {
      let t = initializeTmTest();
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
      });

      let A = await t.navigate("/foo?q=1");
      await A.loaders.root.resolve("ROOT1");
      await A.loaders.foo.resolve("1");
      expect(A.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT1",
        foo: "1",
      });

      let B = await t.navigate("/foo/bar?q=1");
      await B.loaders.foobar.resolve("2");
      expect(B.loaders.root.stub.mock.calls.length).toBe(0);

      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT1",
        foobar: "2",
      });
    });

    it("reloads only routes with changed params", async () => {
      let t = initializeTmTest();

      let A = await t.navigate("/p/one");
      await A.loaders.param.resolve("one");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData.param).toBe("one");

      let B = await t.navigate("/p/two");
      await B.loaders.param.resolve("two");
      expect(B.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData.param).toBe("two");
    });

    it("reloads all routes on refresh", async () => {
      let t = initializeTmTest();
      let url = "/p/same";

      let A = await t.navigate(url);
      await A.loaders.param.resolve("1");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT",
        param: "1",
      });

      let B = await t.navigate(url);
      await B.loaders.root.resolve("ROOT2");
      await B.loaders.param.resolve("2");
      expect(B.loaders.root.stub.mock.calls.length).toBe(1);
      expect(t.router.state.loaderData).toMatchObject({
        root: "ROOT2",
        param: "2",
      });
    });

    it("does not load anything on hash change only", async () => {
      let t = initializeTmTest();
      let A = await t.navigate("/#bar");
      expect(A.loaders.root.stub.mock.calls.length).toBe(0);
    });

    it("sets all right states on hash change only", async () => {
      let t = initializeTmTest();
      let key = t.router.state.location.key;
      t.navigate("/#bar");
      // hash changes are synchronous but force a key change
      expect(t.router.state.location.key).not.toBe(key);
      expect(t.router.state.location.hash).toBe("#bar");
      expect(t.router.state.transition.state).toBe("idle");
    });

    it("loads new data on new routes even if there's also a hash change", async () => {
      let t = initializeTmTest();
      let A = await t.navigate("/foo#bar");
      expect(t.router.state.transition.type).toBe("normalLoad");
      await A.loaders.foo.resolve("A");
      expect(t.router.state.loaderData.foo).toBe("A");
    });

    it("redirects from loaders", async () => {
      let t = initializeTmTest();

      let A = await t.navigate("/bar");
      let B = await A.loaders.bar.redirect("/baz");
      expect(t.router.state.transition.type).toBe("normalRedirect");
      expect(t.router.state.transition.location?.pathname).toBe("/baz");

      await B.loaders.baz.resolve("B");
      expect(t.router.state.location.pathname).toBe("/baz");
      expect(t.router.state.loaderData.baz).toBe("B");
    });
  });

  describe("shouldReload", () => {
    it("delegates to the route if it should reload or not", async () => {
      let rootLoader = jest.fn((args) => "ROOT");
      let childLoader = jest.fn((args) => "CHILD");
      let shouldReload = jest.fn(({ request, prevRequest }) => {
        expect(request.url).not.toEqual(prevRequest.url);
        return (
          new URLSearchParams(parsePath(request.url).search).get("reload") ===
          "1"
        );
      });

      let history = createMemoryHistory();
      let router = createRemixRouter({
        history,
        routes: [
          {
            path: "",
            id: "root",
            loader: async (...args) => rootLoader(...args),
            shouldReload: (args) => shouldReload(args) === true,
            element: {},
            children: [
              {
                path: "/",
                id: "index",
                element: {},
              },
              {
                path: "/child",
                id: "child",
                loader: async (...args) => childLoader(...args),
                element: {},
              },
            ],
          },
        ],
        hydrationData: {
          loaderData: {
            "/": "ROOT",
          },
        },
        onChange: () => {},
      });

      await router.navigate("/child?reload=1");
      expect(rootLoader.mock.calls.length).toBe(1);

      await router.navigate("/child?reload=0");
      expect(rootLoader.mock.calls.length).toBe(1);

      // TODO: Re-enable submission aspect
      // await tm.send({
      //   type: "navigation",
      //   location: createLocation("/child"),
      //   submission: createActionSubmission("/child"),
      //   action: Action.Push,
      // });

      // let args = shouldReload.mock.calls[2][0];
      // expect(args).toMatchInlineSnapshot(`
      //   Object {
      //     "params": Object {},
      //     "prevUrl": "http://localhost/child?reload=0",
      //     "submission": Object {
      //       "action": "/child",
      //       "encType": "application/x-www-form-urlencoded",
      //       "formData": FormData {},
      //       "key": "1",
      //       "method": "POST",
      //     },
      //     "url": "http://localhost/child",
      //   }
      // `);
    });
  });

  describe("no route match", () => {
    it("transitions to root catch", () => {
      let t = initializeTmTest();
      t.navigate("/not-found");
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT",
      });
      expect(t.router.state.exceptions).toEqual({
        root: new Response(null, { status: 404 }),
      });
      expect(t.router.state.matches).toMatchObject([
        {
          params: {},
          pathname: "",
          route: {
            exceptionElement: true,
            children: expect.any(Array),
            element: {},
            id: "root",
            loader: expect.any(Function),
            module: "",
            path: "",
          },
        },
      ]);
    });
  });

  describe("errors on navigation", () => {
    describe("with an error boundary in the throwing route", () => {
      it("uses the throwing route's error boundary", async () => {
        let t = setup({
          routes: [
            {
              path: "/",
              id: "parent",
              children: [
                {
                  path: "/child",
                  id: "child",
                  exceptionElement: true,
                  loader: true,
                },
              ],
            },
          ],
        });
        let nav = await t.navigate("/child");
        await nav.loaders.child.reject(new Error("Kaboom!"));
        expect(t.router.state.exceptions).toEqual({
          child: new Error("Kaboom!"),
        });
      });
    });

    describe("with an error boundary above the throwing route", () => {
      it("uses the nearest error boundary", async () => {
        let t = setup({
          routes: [
            {
              path: "/",
              id: "parent",
              exceptionElement: true,
              children: [
                {
                  path: "/child",
                  id: "child",
                  loader: true,
                },
              ],
            },
          ],
        });
        let nav = await t.navigate("/child");
        await nav.loaders.child.reject(new Error("Kaboom!"));
        expect(t.router.state.exceptions).toEqual({
          parent: new Error("Kaboom!"),
        });
      });

      it("clears out the error on new locations", async () => {
        let t = setup({
          routes: [
            {
              path: "",
              id: "root",
              loader: true,
              children: [
                {
                  path: "/",
                  id: "parent",
                  children: [
                    {
                      path: "/child",
                      id: "child",
                      exceptionElement: true,
                      loader: true,
                    },
                  ],
                },
              ],
            },
          ],
        });

        let nav = await t.navigate("/child");
        await nav.loaders.root.resolve("ROOT1");
        await nav.loaders.child.reject("Kaboom!");
        expect(t.router.state.loaderData).toEqual({ root: "ROOT1" });
        expect(t.router.state.exceptions).toEqual({ child: "Kaboom!" });

        await t.navigate("/");
        expect(t.router.state.loaderData).toEqual({ root: "ROOT1" });
        expect(t.router.state.exceptions).toEqual({});
      });
    });

    it("loads data above error boundary route", async () => {
      let t = setup({
        routes: [
          {
            path: "/",
            id: "a",
            loader: true,
            children: [
              {
                path: "/b",
                id: "b",
                loader: true,
                exceptionElement: true,
                children: [
                  {
                    path: "/b/c",
                    id: "c",
                    loader: true,
                  },
                ],
              },
            ],
          },
        ],
        hydrationData: { loaderData: { a: "LOADER A" } },
      });
      let nav = await t.navigate("/b/c");
      await nav.loaders.b.resolve("LOADER B");
      await nav.loaders.c.reject("Kaboom!");
      expect(t.router.state.loaderData).toEqual({
        a: "LOADER A",
        b: "LOADER B",
        // TODO: Check with Ryan on this - the transition manager test had the c
        // error in loaderData?
      });
      expect(t.router.state.exceptions).toEqual({
        b: "Kaboom!",
      });
    });
  });

  // TODO(submissions): describe("POP navigations after action redirect");

  // TODO(submissions): describe("submission navigations");

  // TODO(submissions): describe("action errors");

  describe("transition states", () => {
    it("initialization", async () => {
      let t = initializeTmTest();
      let transition = t.router.state.transition;
      expect(transition.state).toBe("idle");
      expect(transition.type).toBe("idle");
      expect(transition.submission).toBeUndefined();
      expect(transition.location).toBeUndefined();
    });

    it("get", async () => {
      let t = initializeTmTest();
      let A = await t.navigate("/foo");
      let transition = t.router.state.transition;
      expect(transition.state).toBe("loading");
      expect(transition.type).toBe("normalLoad");
      expect(transition.submission).toBeUndefined();
      expect(transition.location).toMatchObject({
        pathname: "/foo",
        search: "",
        hash: "",
      });

      await A.loaders.foo.resolve("A");
      transition = t.router.state.transition;
      expect(transition.state).toBe("idle");
      expect(transition.type).toBe("idle");
      expect(transition.submission).toBeUndefined();
      expect(transition.location).toBeUndefined();
    });

    it("get + redirect", async () => {
      let t = initializeTmTest();

      let A = await t.navigate("/foo");
      let B = await A.loaders.foo.redirect("/bar");

      let transition = t.router.state.transition;
      expect(transition.state).toBe("loading");
      expect(transition.type).toBe("normalRedirect");
      expect(transition.submission).toBeUndefined();
      expect(transition.location?.pathname).toBe("/bar");

      await B.loaders.bar.resolve("B");
      transition = t.router.state.transition;
      expect(transition.state).toBe("idle");
      expect(transition.type).toBe("idle");
      expect(transition.submission).toBeUndefined();
      expect(transition.location).toBeUndefined();
    });

    // TODO(submissions): it("action submission")

    // TODO(submissions): it("action submission + redirect")

    // TODO(submissions): it("loader submission")

    // TODO(submissions): it("loader submission + redirect")
  });

  describe("interruptions", () => {
    describe(`
      A) GET /foo |---X
      B) GET /bar     |---O
    `, () => {
      it("aborts previous load", async () => {
        let t = initializeTmTest();
        let A = await t.navigate("/foo");
        t.navigate("/bar");
        expect(A.loaders.foo.stub.mock.calls.length).toBe(1);
      });
    });

    // TODO(submissions): describe(`
    //   A) GET  /foo |---X
    //   B) POST /bar     |---O
    // `, () => {
    //   it("aborts previous load", async () => {
    //     let t = setup();
    //     let A = t.navigate.get("/foo");
    //     t.navigate.post("/bar");
    //     expect(A.loader.abortMock.calls.length).toBe(1);
    //   });
    // });

    // TODO(submissions): describe(`
    //   A) POST /foo |---X
    //   B) POST /bar     |---O
    // `, () => {
    //   it("aborts previous action", async () => {
    //     let t = setup();
    //     let A = t.navigate.post("/foo");
    //     t.navigate.post("/bar");
    //     expect(A.action.abortMock.calls.length).toBe(1);
    //   });
    // });

    // TODO(submissions): describe(`
    //   A) POST /foo |--|--X
    //   B) GET  /bar       |---O
    // `, () => {
    //   it("aborts previous action reload", async () => {
    //     let t = setup();
    //     let A = t.navigate.post("/foo");
    //     await A.action.resolve("A ACTION");
    //     t.navigate.get("/bar");
    //     expect(A.loader.abortMock.calls.length).toBe(1);
    //   });
    // });

    // TODO(submissions): describe(`
    //   A) POST /foo |--|--X
    //   B) POST /bar       |---O
    // `, () => {
    //   it("aborts previous action reload", async () => {
    //     let t = setup();
    //     let A = t.navigate.post("/foo");
    //     await A.action.resolve("A ACTION");
    //     t.navigate.post("/bar");
    //     expect(A.loader.abortMock.calls.length).toBe(1);
    //   });
    // });

    describe(`
      A) GET /foo |--/bar--X
      B) GET /baz          |---O
    `, () => {
      it("aborts previous action redirect load", async () => {
        let t = initializeTmTest();
        let A = await t.navigate("/foo");
        let AR = await A.loaders.foo.redirect("/bar");
        t.navigate("/baz");
        expect(AR.loaders.bar.stub.mock.calls.length).toBe(1);
      });
    });

    // TODO(submissions): describe(`
    //   A) POST /foo |--/bar--X
    //   B) GET  /baz          |---O
    // `, () => {
    //   it("aborts previous action redirect load", async () => {
    //     let t = setup();
    //     let A = t.navigate.post("/foo");
    //     let AR = await A.action.redirect("/bar");
    //     t.navigate.get("/baz");
    //     expect(AR.loader.abortMock.calls.length).toBe(1);
    //   });
    // });
  });

  describe("navigation (new)", () => {
    it("navigates through a history stack without data loading", async () => {
      let t = setup({
        routes: [
          {
            id: "index",
            index: true,
          },
          {
            id: "tasks",
            path: "tasks",
          },
          {
            id: "tasksId",
            path: "tasks/:id",
          },
        ],
        initialEntries: ["/"],
      });

      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/",
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        transition: IDLE_TRANSITION,
        loaderData: {},
        matches: [expect.objectContaining({ pathname: "/" })],
      });
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/");

      await t.navigate("/tasks");
      expect(t.router.state).toMatchObject({
        action: "PUSH",
        location: {
          pathname: "/tasks",
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        transition: IDLE_TRANSITION,
        loaderData: {},
        matches: [expect.objectContaining({ pathname: "/tasks" })],
      });
      expect(t.history.action).toEqual("PUSH");
      expect(t.history.location.pathname).toEqual("/tasks");

      await t.navigate("/tasks/1", { replace: true });
      expect(t.router.state).toMatchObject({
        action: "REPLACE",
        location: {
          pathname: "/tasks/1",
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        transition: IDLE_TRANSITION,
        loaderData: {},
        matches: [expect.objectContaining({ pathname: "/tasks/1" })],
      });
      expect(t.history.action).toEqual("REPLACE");
      expect(t.history.location.pathname).toEqual("/tasks/1");

      await t.router.navigate(-1);
      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/",
          search: "",
          hash: "",
          state: null,
          key: expect.any(String),
        },
        transition: IDLE_TRANSITION,
        loaderData: {},
        matches: [expect.objectContaining({ pathname: "/" })],
      });
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/");

      await t.navigate("/tasks?foo=bar#hash");
      expect(t.router.state).toMatchObject({
        action: "PUSH",
        location: {
          pathname: "/tasks",
          search: "?foo=bar",
          hash: "#hash",
          state: null,
          key: expect.any(String),
        },
        transition: IDLE_TRANSITION,
        loaderData: {},
        matches: [expect.objectContaining({ pathname: "/tasks" })],
      });
      expect(t.history.action).toEqual("PUSH");
      expect(t.history.location).toEqual({
        pathname: "/tasks",
        search: "?foo=bar",
        hash: "#hash",
        state: null,
        key: expect.any(String),
      });

      t.cleanup();
    });

    it("handles 404 routes", () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
      });
      t.navigate("/junk");
      expect(t.router.state).toMatchObject({
        location: {
          pathname: "/junk",
        },
        transition: IDLE_TRANSITION,
        loaderData: {},
        exceptions: {
          root: new Response(null, { status: 404 }),
        },
      });
    });
  });

  describe("data loading (new)", () => {
    it("starts in an idle state if no hydration data is provided", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
      });

      expect(t.router.state).toMatchObject({
        action: "POP",
        location: expect.objectContaining({ pathname: "/" }),
        transition: IDLE_TRANSITION,
        loaderData: {},
      });
    });

    it("hydrates initial data", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/",
        },
        transition: IDLE_TRANSITION,
        loaderData: {
          root: "ROOT_DATA",
        },
      });
    });

    it("executes loaders on push navigations", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      let nav1 = await t.navigate("/tasks");
      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/",
        },
        transition: {
          location: {
            pathname: "/tasks",
          },
          state: "loading",
          type: "normalLoad",
        },
        loaderData: {
          root: "ROOT_DATA",
        },
      });
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/");

      await nav1.loaders.tasks.resolve("TASKS_DATA");
      expect(t.router.state).toMatchObject({
        action: "PUSH",
        location: {
          pathname: "/tasks",
        },
        transition: IDLE_TRANSITION,
        loaderData: {
          root: "ROOT_DATA",
          tasks: "TASKS_DATA",
        },
      });
      expect(t.history.action).toEqual("PUSH");
      expect(t.history.location.pathname).toEqual("/tasks");

      let nav2 = await t.navigate("/tasks/1");
      await nav2.loaders.tasksId.resolve("TASKS_ID_DATA");
      expect(t.router.state).toMatchObject({
        action: "PUSH",
        location: {
          pathname: "/tasks/1",
        },
        transition: IDLE_TRANSITION,
        loaderData: {
          root: "ROOT_DATA",
          tasksId: "TASKS_ID_DATA",
        },
      });
      expect(t.history.action).toEqual("PUSH");
      expect(t.history.location.pathname).toEqual("/tasks/1");

      t.cleanup();
    });

    it("executes loaders on replace navigations", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      let nav = await t.navigate("/tasks", { replace: true });
      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/",
        },
        transition: {
          location: {
            pathname: "/tasks",
          },
          state: "loading",
          type: "normalLoad",
        },
        loaderData: {
          root: "ROOT_DATA",
        },
      });
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/");

      await nav.loaders.tasks.resolve("TASKS_DATA");
      expect(t.router.state).toMatchObject({
        action: "REPLACE",
        location: {
          pathname: "/tasks",
        },
        transition: IDLE_TRANSITION,
        loaderData: {
          root: "ROOT_DATA",
          tasks: "TASKS_DATA",
        },
      });
      expect(t.history.action).toEqual("REPLACE");
      expect(t.history.location.pathname).toEqual("/tasks");

      t.cleanup();
    });

    it("executes loaders on go navigations", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/", "/tasks"],
        initialIndex: 0,
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      // pop forward to /tasks
      let nav2 = await t.navigate(1);
      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/",
        },
        transition: {
          location: {
            pathname: "/tasks",
          },
          state: "loading",
          type: "normalLoad",
        },
        loaderData: {
          root: "ROOT_DATA",
        },
      });
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/tasks");

      await nav2.loaders.tasks.resolve("TASKS_DATA");
      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/tasks",
        },
        transition: IDLE_TRANSITION,
        loaderData: {
          root: "ROOT_DATA",
          tasks: "TASKS_DATA",
        },
      });
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/tasks");

      t.cleanup();
    });

    it("sends proper arguments to loaders", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      let nav = await t.navigate("/tasks");
      expect(nav.loaders.tasks.stub).toHaveBeenCalledWith({
        params: {},
        request: new Request("/tasks"),
        signal: expect.any(AbortSignal),
      });

      let nav2 = await t.navigate("/tasks/1");
      expect(nav2.loaders.tasksId.stub).toHaveBeenCalledWith({
        params: { id: "1" },
        request: new Request("/tasks/1"),
        signal: expect.any(AbortSignal),
      });

      let nav3 = await t.navigate("/tasks?foo=bar#hash");
      expect(nav3.loaders.tasks.stub).toHaveBeenCalledWith({
        params: {},
        // TODO: Fix this up - transition manager currently ignores hashes in createHref
        request: new Request("/tasks?foo=bar"),
        signal: expect.any(AbortSignal),
      });

      t.cleanup();
    });

    it("handles exceptions thrown from loaders", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      // Throw from tasks, handled by tasks
      let nav = await t.navigate("/tasks");
      await nav.loaders.tasks.reject("TASKS_ERROR");
      expect(t.router.state.transition).toEqual(IDLE_TRANSITION);
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT_DATA",
      });
      expect(t.router.state.exceptions).toEqual({
        tasks: "TASKS_ERROR",
      });

      // Throw from index, handled by root
      let nav2 = await t.navigate("/");
      await nav2.loaders.index.reject("INDEX_ERROR");
      expect(t.router.state.transition).toEqual(IDLE_TRANSITION);
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT_DATA",
      });
      expect(t.router.state.exceptions).toEqual({
        root: "INDEX_ERROR",
      });

      t.cleanup();
    });

    it("re-runs loaders on post-exception navigations", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          exceptions: {
            root: "ROOT_ERROR",
          },
        },
      });

      // If a route has an exception, we should call the loader if that route is
      // re-used on a navigation
      let nav = await t.navigate("/tasks");
      await nav.loaders.tasks.resolve("TASKS_DATA");
      expect(t.router.state.transition.state).toEqual("loading");
      expect(t.router.state.loaderData).toEqual({});
      expect(t.router.state.exceptions).toEqual({
        root: "ROOT_ERROR",
      });

      await nav.loaders.root.resolve("ROOT_DATA");
      expect(t.router.state.transition).toEqual(IDLE_TRANSITION);
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT_DATA",
        tasks: "TASKS_DATA",
      });
      expect(t.router.state.exceptions).toEqual({});

      t.cleanup();
    });

    it("handles interruptions during navigations", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      let historySpy = jest.spyOn(t.history, "push");

      let nav = await t.navigate("/tasks");
      expect(t.router.state.transition.type).toEqual("normalLoad");
      expect(t.router.state.location.pathname).toEqual("/");
      expect(nav.loaders.tasks.signal.aborted).toBe(false);
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/");

      // Interrupt and confirm prior loader was aborted
      let nav2 = await t.navigate("/tasks/1");
      expect(t.router.state.transition.type).toEqual("normalLoad");
      expect(t.router.state.location.pathname).toEqual("/");
      expect(nav.loaders.tasks.signal.aborted).toBe(true);
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/");

      // Complete second navigation
      await nav2.loaders.tasksId.resolve("TASKS_ID_DATA");
      expect(t.router.state.transition).toEqual(IDLE_TRANSITION);
      expect(t.router.state.location.pathname).toEqual("/tasks/1");
      expect(t.history.location.pathname).toEqual("/tasks/1");
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT_DATA",
        tasksId: "TASKS_ID_DATA",
      });
      expect(t.history.action).toEqual("PUSH");
      expect(t.history.location.pathname).toEqual("/tasks/1");

      // Resolve first navigation - should no-op
      await nav.loaders.tasks.resolve("TASKS_DATA");
      expect(t.router.state.transition).toEqual(IDLE_TRANSITION);
      expect(t.router.state.location.pathname).toEqual("/tasks/1");
      expect(t.history.location.pathname).toEqual("/tasks/1");
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT_DATA",
        tasksId: "TASKS_ID_DATA",
      });
      expect(t.history.action).toEqual("PUSH");
      expect(t.history.location.pathname).toEqual("/tasks/1");

      expect(historySpy.mock.calls).toEqual([
        [
          expect.objectContaining({
            pathname: "/tasks/1",
          }),
          null,
        ],
      ]);
      t.cleanup();
    });

    it("handles redirects returned from loaders", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      let nav1 = await t.navigate("/tasks");
      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/",
        },
        transition: {
          location: {
            pathname: "/tasks",
          },
          state: "loading",
          type: "normalLoad",
        },
        loaderData: {
          root: "ROOT_DATA",
        },
      });
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/");

      let nav2 = await nav1.loaders.tasks.redirect("/tasks/1");

      // Should not abort if it redirected
      expect(nav1.loaders.tasks.signal.aborted).toBe(false);
      expect(t.router.state).toMatchObject({
        action: "POP",
        location: {
          pathname: "/",
        },
        transition: {
          location: {
            pathname: "/tasks/1",
          },
          state: "loading",
          type: "normalRedirect",
        },
        loaderData: {
          root: "ROOT_DATA",
        },
        exceptions: {},
      });
      expect(t.history.action).toEqual("POP");
      expect(t.history.location.pathname).toEqual("/");

      await nav2.loaders.tasksId.resolve("TASKS_ID_DATA");
      expect(t.router.state).toMatchObject({
        action: "REPLACE",
        location: {
          pathname: "/tasks/1",
        },
        transition: IDLE_TRANSITION,
        loaderData: {
          root: "ROOT_DATA",
          tasksId: "TASKS_ID_DATA",
        },
        exceptions: {},
      });
      expect(t.history.action).toEqual("REPLACE");
      expect(t.history.location.pathname).toEqual("/tasks/1");

      t.cleanup();
    });

    it("handles thrown non-redirect Responses as normal exceptions", async () => {
      let t = setup({
        routes: TASK_ROUTES,
        initialEntries: ["/"],
        hydrationData: {
          loaderData: {
            root: "ROOT_DATA",
          },
        },
      });

      // Throw from tasks, handled by tasks
      let nav = await t.navigate("/tasks");
      let response = new Response(null, { status: 400 });
      await nav.loaders.tasks.reject(response);
      expect(t.router.state.transition).toEqual(IDLE_TRANSITION);
      expect(t.router.state.loaderData).toEqual({
        root: "ROOT_DATA",
      });
      expect(t.router.state.exceptions).toEqual({
        tasks: response,
      });

      t.cleanup();
    });
  });
});
