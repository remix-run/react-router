import * as React from "react";

import type {
  BrowserHistory,
  HashHistory,
  History,
  Action as NavigationType,
  Location,
  To,
} from "../router/history";
import {
  createBrowserHistory,
  createHashHistory,
  createPath,
  invariant,
  warning,
} from "../router/history";
import type {
  BlockerFunction,
  Fetcher,
  FutureConfig,
  GetScrollRestorationKeyFunction,
  HydrationState,
  RelativeRoutingType,
  Router as DataRouter,
  RouterInit,
} from "../router/router";
import { IDLE_FETCHER, createRouter } from "../router/router";
import type {
  DataStrategyFunction,
  FormEncType,
  HTMLFormMethod,
  UIMatch,
} from "../router/utils";
import {
  ErrorResponseImpl,
  joinPaths,
  matchPath,
  stripBasename,
} from "../router/utils";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _ from "./global";
import type {
  SubmitOptions,
  URLSearchParamsInit,
  SubmitTarget,
  FetcherSubmitOptions,
} from "./dom";
import {
  createSearchParams,
  defaultMethod,
  getFormSubmissionInfo,
  getSearchParamsForLocation,
  shouldProcessLinkClick,
} from "./dom";

import type {
  DiscoverBehavior,
  PrefetchBehavior,
  ScriptsProps,
} from "./ssr/components";
import {
  PrefetchPageLinks,
  FrameworkContext,
  mergeRefs,
  usePrefetchBehavior,
} from "./ssr/components";
import {
  Router,
  mapRouteProperties,
  hydrationRouteProperties,
} from "../components";
import type {
  RouteObject,
  NavigateOptions,
  PatchRoutesOnNavigationFunction,
} from "../context";
import {
  DataRouterContext,
  DataRouterStateContext,
  FetchersContext,
  NavigationContext,
  RouteContext,
  ViewTransitionContext,
} from "../context";
import {
  useBlocker,
  useHref,
  useLocation,
  useMatches,
  useNavigate,
  useNavigation,
  useResolvedPath,
  useRouteId,
} from "../hooks";
import type { SerializeFrom } from "../types/route-data";
import type { unstable_ClientInstrumentation } from "../router/instrumentation";

////////////////////////////////////////////////////////////////////////////////
//#region Global Stuff
////////////////////////////////////////////////////////////////////////////////

const isBrowser =
  typeof window !== "undefined" &&
  typeof window.document !== "undefined" &&
  typeof window.document.createElement !== "undefined";

// HEY YOU! DON'T TOUCH THIS VARIABLE!
//
// It is replaced with the proper version at build time via a babel plugin in
// the rollup config.
//
// Export a global property onto the window for React Router detection by the
// Core Web Vitals Technology Report.  This way they can configure the `wappalyzer`
// to detect and properly classify live websites as being built with React Router:
// https://github.com/HTTPArchive/wappalyzer/blob/main/src/technologies/r.json
try {
  if (isBrowser) {
    window.__reactRouterVersion =
      // @ts-expect-error
      REACT_ROUTER_VERSION;
  }
} catch (e) {
  // no-op
}
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Routers
////////////////////////////////////////////////////////////////////////////////

/**
 * @category Data Routers
 */
export interface DOMRouterOpts {
  /**
   * Basename path for the application.
   */
  basename?: string;
  /**
   * A function that returns an {@link RouterContextProvider} instance
   * which is provided as the `context` argument to client [`action`](../../start/data/route-object#action)s,
   * [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
   * This function is called to generate a fresh `context` instance on each
   * navigation or fetcher call.
   *
   * ```tsx
   * import {
   *   createContext,
   *   RouterContextProvider,
   * } from "react-router";
   *
   * const apiClientContext = createContext<APIClient>();
   *
   * function createBrowserRouter(routes, {
   *   getContext() {
   *     let context = new RouterContextProvider();
   *     context.set(apiClientContext, getApiClient());
   *     return context;
   *   }
   * })
   * ```
   */
  getContext?: RouterInit["getContext"];
  /**
   * Future flags to enable for the router.
   */
  future?: Partial<FutureConfig>;
  /**
   * When Server-Rendering and opting-out of automatic hydration, the
   * `hydrationData` option allows you to pass in hydration data from your
   * server-render. This will almost always be a subset of data from the
   * {@link StaticHandlerContext} value you get back from the {@link StaticHandler}'s
   * `query` method:
   *
   * ```tsx
   * const router = createBrowserRouter(routes, {
   *   hydrationData: {
   *     loaderData: {
   *       // [routeId]: serverLoaderData
   *     },
   *     // may also include `errors` and/or `actionData`
   *   },
   * });
   * ```
   *
   * **Partial Hydration Data**
   *
   * You will almost always include a complete set of `loaderData` to hydrate a
   * server-rendered app. But in advanced use-cases (such as Framework Mode's
   * [`clientLoader`](../../start/framework/route-module#clientLoader)), you may
   * want to include `loaderData` for only some routes that were loaded/rendered
   * on the server. This allows you to hydrate _some_ of the routes (such as the
   * app layout/shell) while showing a `HydrateFallback` component and running
   * the [`loader`](../../start/data/route-object#loader)s for other routes
   * during hydration.
   *
   * A route [`loader`](../../start/data/route-object#loader) will run during
   * hydration in two scenarios:
   *
   *  1. No hydration data is provided
   *     In these cases the `HydrateFallback` component will render on initial
   *     hydration
   *  2. The `loader.hydrate` property is set to `true`
   *     This allows you to run the [`loader`](../../start/data/route-object#loader)
   *     even if you did not render a fallback on initial hydration (i.e., to
   *     prime a cache with hydration data)
   *
   * ```tsx
   * const router = createBrowserRouter(
   *   [
   *     {
   *       id: "root",
   *       loader: rootLoader,
   *       Component: Root,
   *       children: [
   *         {
   *           id: "index",
   *           loader: indexLoader,
   *           HydrateFallback: IndexSkeleton,
   *           Component: Index,
   *         },
   *       ],
   *     },
   *   ],
   *   {
   *     hydrationData: {
   *       loaderData: {
   *         root: "ROOT DATA",
   *         // No index data provided
   *       },
   *     },
   *   }
   * );
   * ```
   */
  hydrationData?: HydrationState;
  /**
   * Array of instrumentation objects allowing you to instrument the router and
   * individual routes prior to router initialization (and on any subsequently
   * added routes via `route.lazy` or `patchRoutesOnNavigation`).  This is
   * mostly useful for observability such as wrapping navigations, fetches,
   * as well as route loaders/actions/middlewares with logging and/or performance
   * tracing.
   *
   * ```tsx
   * let router = createBrowserRouter(routes, {
   *   unstable_instrumentations: [logging]
   * });
   *
   *
   * let logging = {
   *   router({ instrument }) {
   *     instrument({
   *       navigate: (impl, info) => logExecution(`navigate ${info.to}`, impl),
   *       fetch: (impl, info) => logExecution(`fetch ${info.to}`, impl)
   *     });
   *   },
   *   route({ instrument, id }) {
   *     instrument({
   *       middleware: (impl, info) => logExecution(
   *         `middleware ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *       loader: (impl, info) => logExecution(
   *         `loader ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *       action: (impl, info) => logExecution(
   *         `action ${info.request.url} (route ${id})`,
   *         impl
   *       ),
   *     })
   *   }
   * };
   *
   * async function logExecution(label: string, impl: () => Promise<void>) {
   *   let start = performance.now();
   *   console.log(`start ${label}`);
   *   await impl();
   *   let duration = Math.round(performance.now() - start);
   *   console.log(`end ${label} (${duration}ms)`);
   * }
   * ```
   */
  unstable_instrumentations?: unstable_ClientInstrumentation[];
  /**
   * Override the default data strategy of running loaders in parallel.
   * See {@link DataStrategyFunction}.
   *
   * <docs-warning>This is a low-level API intended for advanced use-cases. This
   * overrides React Router's internal handling of
   * [`action`](../../start/data/route-object#action)/[`loader`](../../start/data/route-object#loader)
   * execution, and if done incorrectly will break your app code. Please use
   * with caution and perform the appropriate testing.</docs-warning>
   *
   * By default, React Router is opinionated about how your data is loaded/submitted -
   * and most notably, executes all of your [`loader`](../../start/data/route-object#loader)s
   * in parallel for optimal data fetching. While we think this is the right
   * behavior for most use-cases, we realize that there is no "one size fits all"
   * solution when it comes to data fetching for the wide landscape of
   * application requirements.
   *
   * The `dataStrategy` option gives you full control over how your [`action`](../../start/data/route-object#action)s
   * and [`loader`](../../start/data/route-object#loader)s are executed and lays
   * the foundation to build in more advanced APIs such as middleware, context,
   * and caching layers. Over time, we expect that we'll leverage this API
   * internally to bring more first class APIs to React Router, but until then
   * (and beyond), this is your way to add more advanced functionality for your
   * application's data needs.
   *
   * The `dataStrategy` function should return a key/value-object of
   * `routeId` -> {@link DataStrategyResult} and should include entries for any
   * routes where a handler was executed. A `DataStrategyResult` indicates if
   * the handler was successful or not based on the `DataStrategyResult.type`
   * field. If the returned `DataStrategyResult.result` is a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response),
   * React Router will unwrap it for you (via [`res.json`](https://developer.mozilla.org/en-US/docs/Web/API/Response/json)
   * or [`res.text`](https://developer.mozilla.org/en-US/docs/Web/API/Response/text)).
   * If you need to do custom decoding of a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
   * but want to preserve the status code, you can use the `data` utility to
   * return your decoded data along with a `ResponseInit`.
   *
   * <details>
   * <summary><b>Example <code>dataStrategy</code> Use Cases</b></summary>
   *
   * **Adding logging**
   *
   * In the simplest case, let's look at hooking into this API to add some logging
   * for when our route [`action`](../../start/data/route-object#action)s/[`loader`](../../start/data/route-object#loader)s
   * execute:
   *
   * ```tsx
   * let router = createBrowserRouter(routes, {
   *   async dataStrategy({ matches, request }) {
   *     const matchesToLoad = matches.filter((m) => m.shouldLoad);
   *     const results: Record<string, DataStrategyResult> = {};
   *     await Promise.all(
   *       matchesToLoad.map(async (match) => {
   *         console.log(`Processing ${match.route.id}`);
   *         results[match.route.id] = await match.resolve();;
   *       })
   *     );
   *     return results;
   *   },
   * });
   * ```
   *
   * **Middleware**
   *
   * Let's define a middleware on each route via [`handle`](../../start/data/route-object#handle)
   * and call middleware sequentially first, then call all
   * [`loader`](../../start/data/route-object#loader)s in parallel - providing
   * any data made available via the middleware:
   *
   * ```ts
   * const routes = [
   *   {
   *     id: "parent",
   *     path: "/parent",
   *     loader({ request }, context) {
   *        // ...
   *     },
   *     handle: {
   *       async middleware({ request }, context) {
   *         context.parent = "PARENT MIDDLEWARE";
   *       },
   *     },
   *     children: [
   *       {
   *         id: "child",
   *         path: "child",
   *         loader({ request }, context) {
   *           // ...
   *         },
   *         handle: {
   *           async middleware({ request }, context) {
   *             context.child = "CHILD MIDDLEWARE";
   *           },
   *         },
   *       },
   *     ],
   *   },
   * ];
   *
   * let router = createBrowserRouter(routes, {
   *   async dataStrategy({ matches, params, request }) {
   *     // Run middleware sequentially and let them add data to `context`
   *     let context = {};
   *     for (const match of matches) {
   *       if (match.route.handle?.middleware) {
   *         await match.route.handle.middleware(
   *           { request, params },
   *           context
   *         );
   *       }
   *     }
   *
   *     // Run loaders in parallel with the `context` value
   *     let matchesToLoad = matches.filter((m) => m.shouldLoad);
   *     let results = await Promise.all(
   *       matchesToLoad.map((match, i) =>
   *         match.resolve((handler) => {
   *           // Whatever you pass to `handler` will be passed as the 2nd parameter
   *           // to your loader/action
   *           return handler(context);
   *         })
   *       )
   *     );
   *     return results.reduce(
   *       (acc, result, i) =>
   *         Object.assign(acc, {
   *           [matchesToLoad[i].route.id]: result,
   *         }),
   *       {}
   *     );
   *   },
   * });
   * ```
   *
   * **Custom Handler**
   *
   * It's also possible you don't even want to define a [`loader`](../../start/data/route-object#loader)
   * implementation at the route level. Maybe you want to just determine the
   * routes and issue a single GraphQL request for all of your data? You can do
   * that by setting your `route.loader=true` so it qualifies as "having a
   * loader", and then store GQL fragments on `route.handle`:
   *
   * ```ts
   * const routes = [
   *   {
   *     id: "parent",
   *     path: "/parent",
   *     loader: true,
   *     handle: {
   *       gql: gql`
   *         fragment Parent on Whatever {
   *           parentField
   *         }
   *       `,
   *     },
   *     children: [
   *       {
   *         id: "child",
   *         path: "child",
   *         loader: true,
   *         handle: {
   *           gql: gql`
   *             fragment Child on Whatever {
   *               childField
   *             }
   *           `,
   *         },
   *       },
   *     ],
   *   },
   * ];
   *
   * let router = createBrowserRouter(routes, {
   *   async dataStrategy({ matches, params, request }) {
   *     // Compose route fragments into a single GQL payload
   *     let gql = getFragmentsFromRouteHandles(matches);
   *     let data = await fetchGql(gql);
   *     // Parse results back out into individual route level `DataStrategyResult`'s
   *     // keyed by `routeId`
   *     let results = parseResultsFromGql(data);
   *     return results;
   *   },
   * });
   * ```
   *</details>
   */
  dataStrategy?: DataStrategyFunction;
  /**
   * Lazily define portions of the route tree on navigations.
   * See {@link PatchRoutesOnNavigationFunction}.
   *
   * By default, React Router wants you to provide a full route tree up front via
   * `createBrowserRouter(routes)`. This allows React Router to perform synchronous
   * route matching, execute loaders, and then render route components in the most
   * optimistic manner without introducing waterfalls. The tradeoff is that your
   * initial JS bundle is larger by definition — which may slow down application
   * start-up times as your application grows.
   *
   * To combat this, we introduced [`route.lazy`](../../start/data/route-object#lazy)
   * in [v6.9.0](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md#v690)
   * which lets you lazily load the route _implementation_ ([`loader`](../../start/data/route-object#loader),
   * [`Component`](../../start/data/route-object#Component), etc.) while still
   * providing the route _definition_ aspects up front (`path`, `index`, etc.).
   * This is a good middle ground. React Router still knows about your route
   * definitions (the lightweight part) up front and can perform synchronous
   * route matching, but then delay loading any of the route implementation
   * aspects (the heavier part) until the route is actually navigated to.
   *
   * In some cases, even this doesn't go far enough. For huge applications,
   * providing all route definitions up front can be prohibitively expensive.
   * Additionally, it might not even be possible to provide all route definitions
   * up front in certain Micro-Frontend or Module-Federation architectures.
   *
   * This is where `patchRoutesOnNavigation` comes in ([RFC](https://github.com/remix-run/react-router/discussions/11113)).
   * This API is for advanced use-cases where you are unable to provide the full
   * route tree up-front and need a way to lazily "discover" portions of the route
   * tree at runtime. This feature is often referred to as ["Fog of War"](https://en.wikipedia.org/wiki/Fog_of_war),
   * because similar to how video games expand the "world" as you move around -
   * the router would be expanding its routing tree as the user navigated around
   * the app - but would only ever end up loading portions of the tree that the
   * user visited.
   *
   * `patchRoutesOnNavigation` will be called anytime React Router is unable to
   * match a `path`. The arguments include the `path`, any partial `matches`,
   * and a `patch` function you can call to patch new routes into the tree at a
   * specific location. This method is executed during the `loading` portion of
   * the navigation for `GET` requests and during the `submitting` portion of
   * the navigation for non-`GET` requests.
   *
   * <details>
   *   <summary><b>Example <code>patchRoutesOnNavigation</code> Use Cases</b></summary>
   *
   *   **Patching children into an existing route**
   *
   *   ```tsx
   *   const router = createBrowserRouter(
   *     [
   *       {
   *         id: "root",
   *         path: "/",
   *         Component: RootComponent,
   *       },
   *     ],
   *     {
   *       async patchRoutesOnNavigation({ patch, path }) {
   *         if (path === "/a") {
   *           // Load/patch the `a` route as a child of the route with id `root`
   *           let route = await getARoute();
   *           //  ^ { path: 'a', Component: A }
   *           patch("root", [route]);
   *         }
   *       },
   *     }
   *   );
   *   ```
   *
   *   In the above example, if the user clicks a link to `/a`, React Router
   *   won't match any routes initially and will call `patchRoutesOnNavigation`
   *   with a `path = "/a"` and a `matches` array containing the root route
   *   match. By calling `patch('root', [route])`, the new route will be added
   *   to the route tree as a child of the `root` route and React Router will
   *   perform matching on the updated routes. This time it will successfully
   *   match the `/a` path and the navigation will complete successfully.
   *
   *   **Patching new root-level routes**
   *
   *   If you need to patch a new route to the top of the tree (i.e., it doesn't
   *   have a parent), you can pass `null` as the `routeId`:
   *
   *   ```tsx
   *   const router = createBrowserRouter(
   *     [
   *       {
   *         id: "root",
   *         path: "/",
   *         Component: RootComponent,
   *       },
   *     ],
   *     {
   *       async patchRoutesOnNavigation({ patch, path }) {
   *         if (path === "/root-sibling") {
   *           // Load/patch the `/root-sibling` route as a sibling of the root route
   *           let route = await getRootSiblingRoute();
   *           //  ^ { path: '/root-sibling', Component: RootSibling }
   *           patch(null, [route]);
   *         }
   *       },
   *     }
   *   );
   *   ```
   *
   *   **Patching subtrees asynchronously**
   *
   *   You can also perform asynchronous matching to lazily fetch entire sections
   *   of your application:
   *
   *   ```tsx
   *   let router = createBrowserRouter(
   *     [
   *       {
   *         path: "/",
   *         Component: Home,
   *       },
   *     ],
   *     {
   *       async patchRoutesOnNavigation({ patch, path }) {
   *         if (path.startsWith("/dashboard")) {
   *           let children = await import("./dashboard");
   *           patch(null, children);
   *         }
   *         if (path.startsWith("/account")) {
   *           let children = await import("./account");
   *           patch(null, children);
   *         }
   *       },
   *     }
   *   );
   *   ```
   *
   *   <docs-info>If in-progress execution of `patchRoutesOnNavigation` is
   *   interrupted by a later navigation, then any remaining `patch` calls in
   *   the interrupted execution will not update the route tree because the
   *   operation was cancelled.</docs-info>
   *
   *   **Co-locating route discovery with route definition**
   *
   *   If you don't wish to perform your own pseudo-matching, you can leverage
   *   the partial `matches` array and the [`handle`](../../start/data/route-object#handle)
   *   field on a route to keep the children definitions co-located:
   *
   *   ```tsx
   *   let router = createBrowserRouter(
   *     [
   *       {
   *         path: "/",
   *         Component: Home,
   *       },
   *       {
   *         path: "/dashboard",
   *         children: [
   *           {
   *             // If we want to include /dashboard in the critical routes, we need to
   *             // also include it's index route since patchRoutesOnNavigation will not be
   *             // called on a navigation to `/dashboard` because it will have successfully
   *             // matched the `/dashboard` parent route
   *             index: true,
   *             // ...
   *           },
   *         ],
   *         handle: {
   *           lazyChildren: () => import("./dashboard"),
   *         },
   *       },
   *       {
   *         path: "/account",
   *         children: [
   *           {
   *             index: true,
   *             // ...
   *           },
   *         ],
   *         handle: {
   *           lazyChildren: () => import("./account"),
   *         },
   *       },
   *     ],
   *     {
   *       async patchRoutesOnNavigation({ matches, patch }) {
   *         let leafRoute = matches[matches.length - 1]?.route;
   *         if (leafRoute?.handle?.lazyChildren) {
   *           let children =
   *             await leafRoute.handle.lazyChildren();
   *           patch(leafRoute.id, children);
   *         }
   *       },
   *     }
   *   );
   *   ```
   *
   *   **A note on routes with parameters**
   *
   *   Because React Router uses ranked routes to find the best match for a
   *   given path, there is an interesting ambiguity introduced when only a
   *   partial route tree is known at any given point in time. If we match a
   *   fully static route such as `path: "/about/contact-us"` then we know we've
   *   found the right match since it's composed entirely of static URL segments.
   *   Thus, we do not need to bother asking for any other potentially
   *   higher-scoring routes.
   *
   *   However, routes with parameters (dynamic or splat) can't make this
   *   assumption because there might be a not-yet-discovered route that scores
   *   higher. Consider a full route tree such as:
   *
   *   ```tsx
   *   // Assume this is the full route tree for your app
   *   const routes = [
   *     {
   *       path: "/",
   *       Component: Home,
   *     },
   *     {
   *       id: "blog",
   *       path: "/blog",
   *       Component: BlogLayout,
   *       children: [
   *         { path: "new", Component: NewPost },
   *         { path: ":slug", Component: BlogPost },
   *       ],
   *     },
   *   ];
   *   ```
   *
   *   And then assume we want to use `patchRoutesOnNavigation` to fill this in
   *   as the user navigates around:
   *
   *   ```tsx
   *   // Start with only the index route
   *   const router = createBrowserRouter(
   *     [
   *       {
   *         path: "/",
   *         Component: Home,
   *       },
   *     ],
   *     {
   *       async patchRoutesOnNavigation({ patch, path }) {
   *         if (path === "/blog/new") {
   *           patch("blog", [
   *             {
   *               path: "new",
   *               Component: NewPost,
   *             },
   *           ]);
   *         } else if (path.startsWith("/blog")) {
   *           patch("blog", [
   *             {
   *               path: ":slug",
   *               Component: BlogPost,
   *             },
   *           ]);
   *         }
   *       },
   *     }
   *   );
   *   ```
   *
   *   If the user were to a blog post first (i.e., `/blog/my-post`) we would
   *   patch in the `:slug` route. Then, if the user navigated to `/blog/new` to
   *   write a new post, we'd match `/blog/:slug` but it wouldn't be the _right_
   *   match! We need to call `patchRoutesOnNavigation` just in case there
   *   exists a higher-scoring route we've not yet discovered, which in this
   *   case there is.
   *
   *   So, anytime React Router matches a path that contains at least one param,
   *   it will call `patchRoutesOnNavigation` and match routes again just to
   *   confirm it has found the best match.
   *
   *   If your `patchRoutesOnNavigation` implementation is expensive or making
   *   side effect [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch)
   *   calls to a backend server, you may want to consider tracking previously
   *   seen routes to avoid over-fetching in cases where you know the proper
   *   route has already been found. This can usually be as simple as
   *   maintaining a small cache of prior `path` values for which you've already
   *   patched in the right routes:
   *
   *   ```tsx
   *   let discoveredRoutes = new Set();
   *
   *   const router = createBrowserRouter(routes, {
   *     async patchRoutesOnNavigation({ patch, path }) {
   *       if (discoveredRoutes.has(path)) {
   *         // We've seen this before so nothing to patch in and we can let the router
   *         // use the routes it already knows about
   *         return;
   *       }
   *
   *       discoveredRoutes.add(path);
   *
   *       // ... patch routes in accordingly
   *     },
   *   });
   *   ```
   * </details>
   */
  patchRoutesOnNavigation?: PatchRoutesOnNavigationFunction;
  /**
   * [`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) object
   * override. Defaults to the global `window` instance.
   */
  window?: Window;
}

/**
 * Create a new {@link DataRouter| data router} that manages the application
 * path via [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState)
 * and [`history.replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState).
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param routes Application routes
 * @param opts Options
 * @param {DOMRouterOpts.basename} opts.basename n/a
 * @param {DOMRouterOpts.dataStrategy} opts.dataStrategy n/a
 * @param {DOMRouterOpts.future} opts.future n/a
 * @param {DOMRouterOpts.getContext} opts.getContext n/a
 * @param {DOMRouterOpts.hydrationData} opts.hydrationData n/a
 * @param {DOMRouterOpts.unstable_instrumentations} opts.unstable_instrumentations n/a
 * @param {DOMRouterOpts.patchRoutesOnNavigation} opts.patchRoutesOnNavigation n/a
 * @param {DOMRouterOpts.window} opts.window n/a
 * @returns An initialized {@link DataRouter| data router} to pass to {@link RouterProvider | `<RouterProvider>`}
 */
export function createBrowserRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts,
): DataRouter {
  return createRouter({
    basename: opts?.basename,
    getContext: opts?.getContext,
    future: opts?.future,
    history: createBrowserHistory({ window: opts?.window }),
    hydrationData: opts?.hydrationData || parseHydrationData(),
    routes,
    mapRouteProperties,
    hydrationRouteProperties,
    dataStrategy: opts?.dataStrategy,
    patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
    window: opts?.window,
    unstable_instrumentations: opts?.unstable_instrumentations,
  }).initialize();
}

/**
 * Create a new {@link DataRouter| data router} that manages the application
 * path via the URL [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash).
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param routes Application routes
 * @param opts Options
 * @param {DOMRouterOpts.basename} opts.basename n/a
 * @param {DOMRouterOpts.future} opts.future n/a
 * @param {DOMRouterOpts.getContext} opts.getContext n/a
 * @param {DOMRouterOpts.hydrationData} opts.hydrationData n/a
 * @param {DOMRouterOpts.unstable_instrumentations} opts.unstable_instrumentations n/a
 * @param {DOMRouterOpts.dataStrategy} opts.dataStrategy n/a
 * @param {DOMRouterOpts.patchRoutesOnNavigation} opts.patchRoutesOnNavigation n/a
 * @param {DOMRouterOpts.window} opts.window n/a
 * @returns An initialized {@link DataRouter| data router} to pass to {@link RouterProvider | `<RouterProvider>`}
 */
export function createHashRouter(
  routes: RouteObject[],
  opts?: DOMRouterOpts,
): DataRouter {
  return createRouter({
    basename: opts?.basename,
    getContext: opts?.getContext,
    future: opts?.future,
    history: createHashHistory({ window: opts?.window }),
    hydrationData: opts?.hydrationData || parseHydrationData(),
    routes,
    mapRouteProperties,
    hydrationRouteProperties,
    dataStrategy: opts?.dataStrategy,
    patchRoutesOnNavigation: opts?.patchRoutesOnNavigation,
    window: opts?.window,
    unstable_instrumentations: opts?.unstable_instrumentations,
  }).initialize();
}

function parseHydrationData(): HydrationState | undefined {
  let state = window?.__staticRouterHydrationData;
  if (state && state.errors) {
    state = {
      ...state,
      errors: deserializeErrors(state.errors),
    };
  }
  return state;
}

function deserializeErrors(
  errors: DataRouter["state"]["errors"],
): DataRouter["state"]["errors"] {
  if (!errors) return null;
  let entries = Object.entries(errors);
  let serialized: DataRouter["state"]["errors"] = {};
  for (let [key, val] of entries) {
    // Hey you!  If you change this, please change the corresponding logic in
    // serializeErrors in react-router-dom/server.tsx :)
    if (val && val.__type === "RouteErrorResponse") {
      serialized[key] = new ErrorResponseImpl(
        val.status,
        val.statusText,
        val.data,
        val.internal === true,
      );
    } else if (val && val.__type === "Error") {
      // Attempt to reconstruct the right type of Error (i.e., ReferenceError)
      if (val.__subType) {
        let ErrorConstructor = window[val.__subType];
        if (typeof ErrorConstructor === "function") {
          try {
            // @ts-expect-error
            let error = new ErrorConstructor(val.message);
            // Wipe away the client-side stack trace.  Nothing to fill it in with
            // because we don't serialize SSR stack traces for security reasons
            error.stack = "";
            serialized[key] = error;
          } catch (e) {
            // no-op - fall through and create a normal Error
          }
        }
      }

      if (serialized[key] == null) {
        let error = new Error(val.message);
        // Wipe away the client-side stack trace.  Nothing to fill it in with
        // because we don't serialize SSR stack traces for security reasons
        error.stack = "";
        serialized[key] = error;
      }
    } else {
      serialized[key] = val;
    }
  }
  return serialized;
}

//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Components
////////////////////////////////////////////////////////////////////////////////

/**
 * @category Types
 */
export interface BrowserRouterProps {
  /**
   * Application basename
   */
  basename?: string;
  /**
   * {@link Route | `<Route>`} components describing your route configuration
   */
  children?: React.ReactNode;
  /**
   * [`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) object
   * override. Defaults to the global `window` instance
   */
  window?: Window;
}

/**
 * A declarative {@link Router | `<Router>`} using the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * API for client-side routing.
 *
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {BrowserRouterProps.basename} props.basename n/a
 * @param {BrowserRouterProps.children} props.children n/a
 * @param {BrowserRouterProps.window} props.window n/a
 * @returns A declarative {@link Router | `<Router>`} using the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * API for client-side routing.
 */
export function BrowserRouter({
  basename,
  children,
  window,
}: BrowserRouterProps) {
  let historyRef = React.useRef<BrowserHistory>();
  if (historyRef.current == null) {
    historyRef.current = createBrowserHistory({ window, v5Compat: true });
  }

  let history = historyRef.current;
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      React.startTransition(() => setStateImpl(newState));
    },
    [setStateImpl],
  );

  React.useLayoutEffect(() => history.listen(setState), [history, setState]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}

/**
 * @category Types
 */
export interface HashRouterProps {
  /**
   * Application basename
   */
  basename?: string;
  /**
   * {@link Route | `<Route>`} components describing your route configuration
   */
  children?: React.ReactNode;
  /**
   * [`Window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) object
   * override. Defaults to the global `window` instance
   */
  window?: Window;
}

/**
 * A declarative {@link Router | `<Router>`} that stores the location in the
 * [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash) portion
 * of the URL so it is not sent to the server.
 *
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {HashRouterProps.basename} props.basename n/a
 * @param {HashRouterProps.children} props.children n/a
 * @param {HashRouterProps.window} props.window n/a
 * @returns A declarative {@link Router | `<Router>`} using the URL [`hash`](https://developer.mozilla.org/en-US/docs/Web/API/URL/hash)
 * for client-side routing.
 */
export function HashRouter({ basename, children, window }: HashRouterProps) {
  let historyRef = React.useRef<HashHistory>();
  if (historyRef.current == null) {
    historyRef.current = createHashHistory({ window, v5Compat: true });
  }

  let history = historyRef.current;
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      React.startTransition(() => setStateImpl(newState));
    },
    [setStateImpl],
  );

  React.useLayoutEffect(() => history.listen(setState), [history, setState]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}

/**
 * @category Types
 */
export interface HistoryRouterProps {
  /**
   * Application basename
   */
  basename?: string;
  /**
   * {@link Route | `<Route>`} components describing your route configuration
   */
  children?: React.ReactNode;
  /**
   *  A {@link History} implementation for use by the router
   */
  history: History;
}

/**
 * A declarative {@link Router | `<Router>`} that accepts a pre-instantiated
 * `history` object.
 * It's important to note that using your own `history` object is highly discouraged
 * and may add two versions of the `history` library to your bundles unless you use
 * the same version of the `history` library that React Router uses internally.
 *
 * @name unstable_HistoryRouter
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {HistoryRouterProps.basename} props.basename n/a
 * @param {HistoryRouterProps.children} props.children n/a
 * @param {HistoryRouterProps.history} props.history n/a
 * @returns A declarative {@link Router | `<Router>`} using the provided history
 * implementation for client-side routing.
 */
export function HistoryRouter({
  basename,
  children,
  history,
}: HistoryRouterProps) {
  let [state, setStateImpl] = React.useState({
    action: history.action,
    location: history.location,
  });
  let setState = React.useCallback(
    (newState: { action: NavigationType; location: Location }) => {
      React.startTransition(() => setStateImpl(newState));
    },
    [setStateImpl],
  );

  React.useLayoutEffect(() => history.listen(setState), [history, setState]);

  return (
    <Router
      basename={basename}
      children={children}
      location={state.location}
      navigationType={state.action}
      navigator={history}
    />
  );
}
HistoryRouter.displayName = "unstable_HistoryRouter";

/**
 * @category Types
 */
export interface LinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
  /**
   * Defines the link discovery behavior
   *
   * ```tsx
   * <Link /> // default ("render")
   * <Link discover="render" />
   * <Link discover="none" />
   * ```
   *
   * - **render** — default, discover the route when the link renders
   * - **none** — don't eagerly discover, only discover if the link is clicked
   */
  discover?: DiscoverBehavior;

  /**
   * Defines the data and module prefetching behavior for the link.
   *
   * ```tsx
   * <Link /> // default
   * <Link prefetch="none" />
   * <Link prefetch="intent" />
   * <Link prefetch="render" />
   * <Link prefetch="viewport" />
   * ```
   *
   * - **none** — default, no prefetching
   * - **intent** — prefetches when the user hovers or focuses the link
   * - **render** — prefetches when the link renders
   * - **viewport** — prefetches when the link is in the viewport, very useful for mobile
   *
   * Prefetching is done with HTML [`<link rel="prefetch">`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
   * tags. They are inserted after the link.
   *
   * ```tsx
   * <a href="..." />
   * <a href="..." />
   * <link rel="prefetch" /> // might conditionally render
   * ```
   *
   * Because of this, if you are using `nav :last-child` you will need to use
   * `nav :last-of-type` so the styles don't conditionally fall off your last link
   * (and any other similar selectors).
   */
  prefetch?: PrefetchBehavior;

  /**
   * Will use document navigation instead of client side routing when the link is
   * clicked: the browser will handle the transition normally (as if it were an
   * [`<a href>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a)).
   *
   * ```tsx
   * <Link to="/logout" reloadDocument />
   * ```
   */
  reloadDocument?: boolean;

  /**
   * Replaces the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
   * stack instead of pushing a new one onto it.
   *
   * ```tsx
   * <Link replace />
   * ```
   *
   * ```
   * # with a history stack like this
   * A -> B
   *
   * # normal link click pushes a new entry
   * A -> B -> C
   *
   * # but with `replace`, B is replaced by C
   * A -> C
   * ```
   */
  replace?: boolean;

  /**
   * Adds persistent client side routing state to the next location.
   *
   * ```tsx
   * <Link to="/somewhere/else" state={{ some: "value" }} />
   * ```
   *
   * The location state is accessed from the `location`.
   *
   * ```tsx
   * function SomeComp() {
   *   const location = useLocation();
   *   location.state; // { some: "value" }
   * }
   * ```
   *
   * This state is inaccessible on the server as it is implemented on top of
   * [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state)
   */
  state?: any;

  /**
   * Prevents the scroll position from being reset to the top of the window when
   * the link is clicked and the app is using {@link ScrollRestoration}. This only
   * prevents new locations resetting scroll to the top, scroll position will be
   * restored for back/forward button navigation.
   *
   * ```tsx
   * <Link to="?tab=one" preventScrollReset />
   * ```
   */
  preventScrollReset?: boolean;

  /**
   * Defines the relative path behavior for the link.
   *
   * ```tsx
   * <Link to=".." /> // default: "route"
   * <Link relative="route" />
   * <Link relative="path" />
   * ```
   *
   * Consider a route hierarchy where a parent route pattern is `"blog"` and a child
   * route pattern is `"blog/:slug/edit"`.
   *
   * - **route** — default, resolves the link relative to the route pattern. In the
   * example above, a relative link of `"..."` will remove both `:slug/edit` segments
   * back to `"/blog"`.
   * - **path** — relative to the path so `"..."` will only remove one URL segment up
   * to `"/blog/:slug"`
   *
   * Note that index routes and layout routes do not have paths so they are not
   * included in the relative path calculation.
   */
  relative?: RelativeRoutingType;

  /**
   * Can be a string or a partial {@link Path}:
   *
   * ```tsx
   * <Link to="/some/path" />
   *
   * <Link
   *   to={{
   *     pathname: "/some/path",
   *     search: "?query=string",
   *     hash: "#hash",
   *   }}
   * />
   * ```
   */
  to: To;

  /**
   * Enables a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
   * for this navigation.
   *
   * ```jsx
   * <Link to={to} viewTransition>
   *   Click me
   * </Link>
   * ```
   *
   * To apply specific styles for the transition, see {@link useViewTransitionState}
   */
  viewTransition?: boolean;
}

const ABSOLUTE_URL_REGEX = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * A progressively enhanced [`<a href>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a)
 * wrapper to enable navigation with client-side routing.
 *
 * @example
 * import { Link } from "react-router";
 *
 * <Link to="/dashboard">Dashboard</Link>;
 *
 * <Link
 *   to={{
 *     pathname: "/some/path",
 *     search: "?query=string",
 *     hash: "#hash",
 *   }}
 * />;
 *
 * @public
 * @category Components
 * @param {LinkProps.discover} props.discover [modes: framework] n/a
 * @param {LinkProps.prefetch} props.prefetch [modes: framework] n/a
 * @param {LinkProps.preventScrollReset} props.preventScrollReset [modes: framework, data] n/a
 * @param {LinkProps.relative} props.relative n/a
 * @param {LinkProps.reloadDocument} props.reloadDocument n/a
 * @param {LinkProps.replace} props.replace n/a
 * @param {LinkProps.state} props.state n/a
 * @param {LinkProps.to} props.to n/a
 * @param {LinkProps.viewTransition} props.viewTransition [modes: framework, data] n/a
 */
export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  function LinkWithRef(
    {
      onClick,
      discover = "render",
      prefetch = "none",
      relative,
      reloadDocument,
      replace,
      state,
      target,
      to,
      preventScrollReset,
      viewTransition,
      ...rest
    },
    forwardedRef,
  ) {
    let { basename } = React.useContext(NavigationContext);
    let isAbsolute = typeof to === "string" && ABSOLUTE_URL_REGEX.test(to);

    // Rendered into <a href> for absolute URLs
    let absoluteHref;
    let isExternal = false;

    if (typeof to === "string" && isAbsolute) {
      // Render the absolute href server- and client-side
      absoluteHref = to;

      // Only check for external origins client-side
      if (isBrowser) {
        try {
          let currentUrl = new URL(window.location.href);
          let targetUrl = to.startsWith("//")
            ? new URL(currentUrl.protocol + to)
            : new URL(to);
          let path = stripBasename(targetUrl.pathname, basename);

          if (targetUrl.origin === currentUrl.origin && path != null) {
            // Strip the protocol/origin/basename for same-origin absolute URLs
            to = path + targetUrl.search + targetUrl.hash;
          } else {
            isExternal = true;
          }
        } catch (e) {
          // We can't do external URL detection without a valid URL
          warning(
            false,
            `<Link to="${to}"> contains an invalid URL which will probably break ` +
              `when clicked - please update to a valid URL path.`,
          );
        }
      }
    }

    // Rendered into <a href> for relative URLs
    let href = useHref(to, { relative });
    let [shouldPrefetch, prefetchRef, prefetchHandlers] = usePrefetchBehavior(
      prefetch,
      rest,
    );

    let internalOnClick = useLinkClickHandler(to, {
      replace,
      state,
      target,
      preventScrollReset,
      relative,
      viewTransition,
    });
    function handleClick(
      event: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
    ) {
      if (onClick) onClick(event);
      if (!event.defaultPrevented) {
        internalOnClick(event);
      }
    }

    let link = (
      // eslint-disable-next-line jsx-a11y/anchor-has-content
      <a
        {...rest}
        {...prefetchHandlers}
        href={absoluteHref || href}
        onClick={isExternal || reloadDocument ? onClick : handleClick}
        ref={mergeRefs(forwardedRef, prefetchRef)}
        target={target}
        data-discover={
          !isAbsolute && discover === "render" ? "true" : undefined
        }
      />
    );

    return shouldPrefetch && !isAbsolute ? (
      <>
        {link}
        <PrefetchPageLinks page={href} />
      </>
    ) : (
      link
    );
  },
);
Link.displayName = "Link";

/**
 * The object passed to {@link NavLink} `children`, `className`, and `style` prop
 * callbacks to render and style the link based on its state.
 *
 * ```
 * // className
 * <NavLink
 *   to="/messages"
 *   className={({ isActive, isPending }) =>
 *     isPending ? "pending" : isActive ? "active" : ""
 *   }
 * >
 *   Messages
 * </NavLink>
 *
 * // style
 * <NavLink
 *   to="/messages"
 *   style={({ isActive, isPending }) => {
 *     return {
 *       fontWeight: isActive ? "bold" : "",
 *       color: isPending ? "red" : "black",
 *     }
 *   )}
 * />
 *
 * // children
 * <NavLink to="/tasks">
 *   {({ isActive, isPending }) => (
 *     <span className={isActive ? "active" : ""}>Tasks</span>
 *   )}
 * </NavLink>
 * ```
 *
 */
export type NavLinkRenderProps = {
  /**
   * Indicates if the link's URL matches the current {@link Location}.
   */
  isActive: boolean;

  /**
   * Indicates if the pending {@link Location} matches the link's URL. Only
   * available in Framework/Data modes.
   */
  isPending: boolean;

  /**
   * Indicates if a view transition to the link's URL is in progress.
   * See {@link useViewTransitionState}
   */
  isTransitioning: boolean;
};

/**
 * @category Types
 */
export interface NavLinkProps
  extends Omit<LinkProps, "className" | "style" | "children"> {
  /**
   *  Can be regular React children or a function that receives an object with the
   * `active` and `pending` states of the link.
   *
   *  ```tsx
   *  <NavLink to="/tasks">
   *    {({ isActive }) => (
   *      <span className={isActive ? "active" : ""}>Tasks</span>
   *    )}
   *  </NavLink>
   *  ```
   */
  children?: React.ReactNode | ((props: NavLinkRenderProps) => React.ReactNode);

  /**
   * Changes the matching logic to make it case-sensitive:
   *
   * | Link                                         | URL           | isActive |
   * | -------------------------------------------- | ------------- | -------- |
   * | `<NavLink to="/SpOnGe-bOB" />`               | `/sponge-bob` | true     |
   * | `<NavLink to="/SpOnGe-bOB" caseSensitive />` | `/sponge-bob` | false    |
   */
  caseSensitive?: boolean;

  /**
   * Classes are automatically applied to `NavLink` that correspond to the state.
   *
   * ```css
   * a.active {
   *   color: red;
   * }
   * a.pending {
   *   color: blue;
   * }
   * a.transitioning {
   *   view-transition-name: my-transition;
   * }
   * ```
   *
   * Or you can specify a function that receives {@link NavLinkRenderProps} and
   * returns the `className`:
   *
   * ```tsx
   * <NavLink className={({ isActive, isPending }) => (
   *   isActive ? "my-active-class" :
   *   isPending ? "my-pending-class" :
   *   ""
   * )} />
   * ```
   */
  className?: string | ((props: NavLinkRenderProps) => string | undefined);

  /**
   * Changes the matching logic for the `active` and `pending` states to only match
   * to the "end" of the {@link NavLinkProps.to}. If the URL is longer, it will no
   * longer be considered active.
   *
   * | Link                          | URL          | isActive |
   * | ----------------------------- | ------------ | -------- |
   * | `<NavLink to="/tasks" />`     | `/tasks`     | true     |
   * | `<NavLink to="/tasks" />`     | `/tasks/123` | true     |
   * | `<NavLink to="/tasks" end />` | `/tasks`     | true     |
   * | `<NavLink to="/tasks" end />` | `/tasks/123` | false    |
   *
   * `<NavLink to="/">` is an exceptional case because _every_ URL matches `/`.
   * To avoid this matching every single route by default, it effectively ignores
   * the `end` prop and only matches when you're at the root route.
   */
  end?: boolean;

  /**
   * Styles can also be applied dynamically via a function that receives
   * {@link NavLinkRenderProps} and returns the styles:
   *
   * ```tsx
   * <NavLink to="/tasks" style={{ color: "red" }} />
   * <NavLink to="/tasks" style={({ isActive, isPending }) => ({
   *   color:
   *     isActive ? "red" :
   *     isPending ? "blue" : "black"
   * })} />
   * ```
   */
  style?:
    | React.CSSProperties
    | ((props: NavLinkRenderProps) => React.CSSProperties | undefined);
}

/**
 * Wraps {@link Link | `<Link>`} with additional props for styling active and
 * pending states.
 *
 * - Automatically applies classes to the link based on its `active` and `pending`
 * states, see {@link NavLinkProps.className}
 *   - Note that `pending` is only available with Framework and Data modes.
 * - Automatically applies `aria-current="page"` to the link when the link is active.
 * See [`aria-current`](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-current)
 * on MDN.
 * - States are additionally available through the className, style, and children
 * render props. See {@link NavLinkRenderProps}.
 *
 * @example
 * <NavLink to="/message">Messages</NavLink>
 *
 * // Using render props
 * <NavLink
 *   to="/messages"
 *   className={({ isActive, isPending }) =>
 *     isPending ? "pending" : isActive ? "active" : ""
 *   }
 * >
 *   Messages
 * </NavLink>
 *
 * @public
 * @category Components
 * @param {NavLinkProps.caseSensitive} props.caseSensitive n/a
 * @param {NavLinkProps.children} props.children n/a
 * @param {NavLinkProps.className} props.className n/a
 * @param {NavLinkProps.discover} props.discover [modes: framework] n/a
 * @param {NavLinkProps.end} props.end n/a
 * @param {NavLinkProps.prefetch} props.prefetch [modes: framework] n/a
 * @param {NavLinkProps.preventScrollReset} props.preventScrollReset [modes: framework, data] n/a
 * @param {NavLinkProps.relative} props.relative n/a
 * @param {NavLinkProps.reloadDocument} props.reloadDocument n/a
 * @param {NavLinkProps.replace} props.replace n/a
 * @param {NavLinkProps.state} props.state n/a
 * @param {NavLinkProps.style} props.style n/a
 * @param {NavLinkProps.to} props.to n/a
 * @param {NavLinkProps.viewTransition} props.viewTransition [modes: framework, data] n/a
 */
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  function NavLinkWithRef(
    {
      "aria-current": ariaCurrentProp = "page",
      caseSensitive = false,
      className: classNameProp = "",
      end = false,
      style: styleProp,
      to,
      viewTransition,
      children,
      ...rest
    },
    ref,
  ) {
    let path = useResolvedPath(to, { relative: rest.relative });
    let location = useLocation();
    let routerState = React.useContext(DataRouterStateContext);
    let { navigator, basename } = React.useContext(NavigationContext);
    let isTransitioning =
      routerState != null &&
      // Conditional usage is OK here because the usage of a data router is static
      // eslint-disable-next-line react-hooks/rules-of-hooks
      useViewTransitionState(path) &&
      viewTransition === true;

    let toPathname = navigator.encodeLocation
      ? navigator.encodeLocation(path).pathname
      : path.pathname;
    let locationPathname = location.pathname;
    let nextLocationPathname =
      routerState && routerState.navigation && routerState.navigation.location
        ? routerState.navigation.location.pathname
        : null;

    if (!caseSensitive) {
      locationPathname = locationPathname.toLowerCase();
      nextLocationPathname = nextLocationPathname
        ? nextLocationPathname.toLowerCase()
        : null;
      toPathname = toPathname.toLowerCase();
    }

    if (nextLocationPathname && basename) {
      nextLocationPathname =
        stripBasename(nextLocationPathname, basename) || nextLocationPathname;
    }

    // If the `to` has a trailing slash, look at that exact spot.  Otherwise,
    // we're looking for a slash _after_ what's in `to`.  For example:
    //
    // <NavLink to="/users"> and <NavLink to="/users/">
    // both want to look for a / at index 6 to match URL `/users/matt`
    const endSlashPosition =
      toPathname !== "/" && toPathname.endsWith("/")
        ? toPathname.length - 1
        : toPathname.length;
    let isActive =
      locationPathname === toPathname ||
      (!end &&
        locationPathname.startsWith(toPathname) &&
        locationPathname.charAt(endSlashPosition) === "/");

    let isPending =
      nextLocationPathname != null &&
      (nextLocationPathname === toPathname ||
        (!end &&
          nextLocationPathname.startsWith(toPathname) &&
          nextLocationPathname.charAt(toPathname.length) === "/"));

    let renderProps = {
      isActive,
      isPending,
      isTransitioning,
    };

    let ariaCurrent = isActive ? ariaCurrentProp : undefined;

    let className: string | undefined;
    if (typeof classNameProp === "function") {
      className = classNameProp(renderProps);
    } else {
      // If the className prop is not a function, we use a default `active`
      // class for <NavLink />s that are active. In v5 `active` was the default
      // value for `activeClassName`, but we are removing that API and can still
      // use the old default behavior for a cleaner upgrade path and keep the
      // simple styling rules working as they currently do.
      className = [
        classNameProp,
        isActive ? "active" : null,
        isPending ? "pending" : null,
        isTransitioning ? "transitioning" : null,
      ]
        .filter(Boolean)
        .join(" ");
    }

    let style =
      typeof styleProp === "function" ? styleProp(renderProps) : styleProp;

    return (
      <Link
        {...rest}
        aria-current={ariaCurrent}
        className={className}
        ref={ref}
        style={style}
        to={to}
        viewTransition={viewTransition}
      >
        {typeof children === "function" ? children(renderProps) : children}
      </Link>
    );
  },
);
NavLink.displayName = "NavLink";

/**
 * Form props shared by navigations and fetchers
 */
interface SharedFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  /**
   * The HTTP verb to use when the form is submitted. Supports `"delete"`,
   * `"get"`, `"patch"`, `"post"`, and `"put"`.
   *
   * Native [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
   * only supports `"get"` and `"post"`, avoid the other verbs if you'd like to
   * support progressive enhancement
   */
  method?: HTMLFormMethod;

  /**
   * The encoding type to use for the form submission.
   *
   * ```tsx
   * <Form encType="application/x-www-form-urlencoded"/>  // Default
   * <Form encType="multipart/form-data"/>
   * <Form encType="text/plain"/>
   * ```
   */
  encType?:
    | "application/x-www-form-urlencoded"
    | "multipart/form-data"
    | "text/plain";

  /**
   * The URL to submit the form data to. If `undefined`, this defaults to the
   * closest route in context.
   */
  action?: string;

  /**
   * Determines whether the form action is relative to the route hierarchy or
   * the pathname. Use this if you want to opt out of navigating the route
   * hierarchy and want to instead route based on slash-delimited URL segments.
   * See {@link RelativeRoutingType}.
   */
  relative?: RelativeRoutingType;

  /**
   * Prevent the scroll position from resetting to the top of the viewport on
   * completion of the navigation when using the
   * {@link ScrollRestoration | `<ScrollRestoration>`} component
   */
  preventScrollReset?: boolean;

  /**
   * A function to call when the form is submitted. If you call
   * [`event.preventDefault()`](https://developer.mozilla.org/en-US/docs/Web/API/Event/preventDefault)
   * then this form will not do anything.
   */
  onSubmit?: React.FormEventHandler<HTMLFormElement>;

  /**
   * Determine if revalidation should occur post-submission.
   */
  defaultShouldRevalidate?: boolean;
}

/**
 * Form props available to fetchers
 * @category Types
 */
export interface FetcherFormProps extends SharedFormProps {}

/**
 * Form props available to navigations
 * @category Types
 */
export interface FormProps extends SharedFormProps {
  /**
   * Defines the link discovery behavior. See {@link DiscoverBehavior}.
   *
   * ```tsx
   * <Link /> // default ("render")
   * <Link discover="render" />
   * <Link discover="none" />
   * ```
   *
   * - **render** — default, discover the route when the link renders
   * - **none** — don't eagerly discover, only discover if the link is clicked
   */
  discover?: DiscoverBehavior;

  /**
   * Indicates a specific fetcherKey to use when using `navigate={false}` so you
   * can pick up the fetcher's state in a different component in a {@link useFetcher}.
   */
  fetcherKey?: string;

  /**
   * When `false`, skips the navigation and submits via a fetcher internally.
   * This is essentially a shorthand for {@link useFetcher} + `<fetcher.Form>` where
   * you don't care about the resulting data in this component.
   */
  navigate?: boolean;

  /**
   * Forces a full document navigation instead of client side routing and data
   * fetch.
   */
  reloadDocument?: boolean;

  /**
   * Replaces the current entry in the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
   * stack when the form navigates. Use this if you don't want the user to be
   * able to click "back" to the page with the form on it.
   */
  replace?: boolean;

  /**
   * State object to add to the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
   * stack entry for this navigation
   */
  state?: any;

  /**
   * Enables a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
   * for this navigation. To apply specific styles during the transition, see
   * {@link useViewTransitionState}.
   */
  viewTransition?: boolean;
}

type HTMLSubmitEvent = React.BaseSyntheticEvent<
  SubmitEvent,
  Event,
  HTMLFormElement
>;

type HTMLFormSubmitter = HTMLButtonElement | HTMLInputElement;

/**
 * A progressively enhanced HTML [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
 * that submits data to actions via [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch),
 * activating pending states in {@link useNavigation} which enables advanced
 * user interfaces beyond a basic HTML [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).
 * After a form's `action` completes, all data on the page is automatically
 * revalidated to keep the UI in sync with the data.
 *
 * Because it uses the HTML form API, server rendered pages are interactive at a
 * basic level before JavaScript loads. Instead of React Router managing the
 * submission, the browser manages the submission as well as the pending states
 * (like the spinning favicon). After JavaScript loads, React Router takes over
 * enabling web application user experiences.
 *
 * `Form` is most useful for submissions that should also change the URL or
 * otherwise add an entry to the browser history stack. For forms that shouldn't
 * manipulate the browser [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * stack, use {@link FetcherWithComponents.Form | `<fetcher.Form>`}.
 *
 * @example
 * import { Form } from "react-router";
 *
 * function NewEvent() {
 *   return (
 *     <Form action="/events" method="post">
 *       <input name="title" type="text" />
 *       <input name="description" type="text" />
 *     </Form>
 *   );
 * }
 *
 * @public
 * @category Components
 * @mode framework
 * @mode data
 * @param {FormProps.action} action n/a
 * @param {FormProps.discover} discover n/a
 * @param {FormProps.encType} encType n/a
 * @param {FormProps.fetcherKey} fetcherKey n/a
 * @param {FormProps.method} method n/a
 * @param {FormProps.navigate} navigate n/a
 * @param {FormProps.onSubmit} onSubmit n/a
 * @param {FormProps.preventScrollReset} preventScrollReset n/a
 * @param {FormProps.relative} relative n/a
 * @param {FormProps.reloadDocument} reloadDocument n/a
 * @param {FormProps.replace} replace n/a
 * @param {FormProps.state} state n/a
 * @param {FormProps.viewTransition} viewTransition n/a
 * @param {FormProps.defaultShouldRevalidate} defaultShouldRevalidate n/a
 * @returns A progressively enhanced [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) component
 */
export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  (
    {
      discover = "render",
      fetcherKey,
      navigate,
      reloadDocument,
      replace,
      state,
      method = defaultMethod,
      action,
      onSubmit,
      relative,
      preventScrollReset,
      viewTransition,
      defaultShouldRevalidate,
      ...props
    },
    forwardedRef,
  ) => {
    let submit = useSubmit();
    let formAction = useFormAction(action, { relative });
    let formMethod: HTMLFormMethod =
      method.toLowerCase() === "get" ? "get" : "post";
    let isAbsolute =
      typeof action === "string" && ABSOLUTE_URL_REGEX.test(action);

    let submitHandler: React.FormEventHandler<HTMLFormElement> = (event) => {
      onSubmit && onSubmit(event);
      if (event.defaultPrevented) return;
      event.preventDefault();

      let submitter = (event as unknown as HTMLSubmitEvent).nativeEvent
        .submitter as HTMLFormSubmitter | null;

      let submitMethod =
        (submitter?.getAttribute("formmethod") as HTMLFormMethod | undefined) ||
        method;

      submit(submitter || event.currentTarget, {
        fetcherKey,
        method: submitMethod,
        navigate,
        replace,
        state,
        relative,
        preventScrollReset,
        viewTransition,
        defaultShouldRevalidate,
      });
    };

    return (
      <form
        ref={forwardedRef}
        method={formMethod}
        action={formAction}
        onSubmit={reloadDocument ? onSubmit : submitHandler}
        {...props}
        data-discover={
          !isAbsolute && discover === "render" ? "true" : undefined
        }
      />
    );
  },
);
Form.displayName = "Form";

export type ScrollRestorationProps = ScriptsProps & {
  /**
   * A function that returns a key to use for scroll restoration. This is useful
   * for custom scroll restoration logic, such as using only the pathname so
   * that later navigations to prior paths will restore the scroll. Defaults to
   * `location.key`. See {@link GetScrollRestorationKeyFunction}.
   *
   * ```tsx
   * <ScrollRestoration
   *   getKey={(location, matches) => {
   *     // Restore based on a unique location key (default behavior)
   *     return location.key
   *
   *     // Restore based on pathname
   *     return location.pathname
   *   }}
   * />
   * ```
   */
  getKey?: GetScrollRestorationKeyFunction;

  /**
   * The key to use for storing scroll positions in [`sessionStorage`](https://developer.mozilla.org/en-US/docs/Web/API/Window/sessionStorage).
   * Defaults to `"react-router-scroll-positions"`.
   */
  storageKey?: string;
};

/**
 * Emulates the browser's scroll restoration on location changes. Apps should only render one of these, right before the {@link Scripts} component.
 *
 * ```tsx
 * import { ScrollRestoration } from "react-router";
 *
 * export default function Root() {
 *   return (
 *     <html>
 *       <body>
 *         <ScrollRestoration />
 *         <Scripts />
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * This component renders an inline `<script>` to prevent scroll flashing. The `nonce` prop will be passed down to the script tag to allow CSP nonce usage.
 *
 * ```tsx
 * <ScrollRestoration nonce={cspNonce} />
 * ```
 *
 * @public
 * @category Components
 * @mode framework
 * @mode data
 * @param props Props
 * @param {ScrollRestorationProps.getKey} props.getKey n/a
 * @param {ScriptsProps.nonce} props.nonce n/a
 * @param {ScrollRestorationProps.storageKey} props.storageKey n/a
 * @returns A [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
 * tag that restores scroll positions on navigation.
 */
export function ScrollRestoration({
  getKey,
  storageKey,
  ...props
}: ScrollRestorationProps) {
  let remixContext = React.useContext(FrameworkContext);
  let { basename } = React.useContext(NavigationContext);
  let location = useLocation();
  let matches = useMatches();
  useScrollRestoration({ getKey, storageKey });

  // In order to support `getKey`, we need to compute a "key" here so we can
  // hydrate that up so that SSR scroll restoration isn't waiting on React to
  // hydrate. *However*, our key on the server is not the same as our key on
  // the client!  So if the user's getKey implementation returns the SSR
  // location key, then let's ignore it and let our inline <script> below pick
  // up the client side history state key
  let ssrKey = React.useMemo(
    () => {
      if (!remixContext || !getKey) return null;
      let userKey = getScrollRestorationKey(
        location,
        matches,
        basename,
        getKey,
      );
      return userKey !== location.key ? userKey : null;
    },
    // Nah, we only need this the first time for the SSR render
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // In SPA Mode, there's nothing to restore on initial render since we didn't
  // render anything on the server
  if (!remixContext || remixContext.isSpaMode) {
    return null;
  }

  let restoreScroll = ((storageKey: string, restoreKey: string) => {
    if (!window.history.state || !window.history.state.key) {
      let key = Math.random().toString(32).slice(2);
      window.history.replaceState({ key }, "");
    }
    try {
      let positions = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
      let storedY = positions[restoreKey || window.history.state.key];
      if (typeof storedY === "number") {
        window.scrollTo(0, storedY);
      }
    } catch (error: unknown) {
      console.error(error);
      sessionStorage.removeItem(storageKey);
    }
  }).toString();

  return (
    <script
      {...props}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{
        __html: `(${restoreScroll})(${JSON.stringify(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY,
        )}, ${JSON.stringify(ssrKey)})`,
      }}
    />
  );
}
ScrollRestoration.displayName = "ScrollRestoration";
//#endregion

////////////////////////////////////////////////////////////////////////////////
//#region Hooks
////////////////////////////////////////////////////////////////////////////////

enum DataRouterHook {
  UseScrollRestoration = "useScrollRestoration",
  UseSubmit = "useSubmit",
  UseSubmitFetcher = "useSubmitFetcher",
  UseFetcher = "useFetcher",
  useViewTransitionState = "useViewTransitionState",
}

enum DataRouterStateHook {
  UseFetcher = "useFetcher",
  UseFetchers = "useFetchers",
  UseScrollRestoration = "useScrollRestoration",
}

// Internal hooks

function getDataRouterConsoleError(
  hookName: DataRouterHook | DataRouterStateHook,
) {
  return `${hookName} must be used within a data router.  See https://reactrouter.com/en/main/routers/picking-a-router.`;
}

function useDataRouterContext(hookName: DataRouterHook) {
  let ctx = React.useContext(DataRouterContext);
  invariant(ctx, getDataRouterConsoleError(hookName));
  return ctx;
}

function useDataRouterState(hookName: DataRouterStateHook) {
  let state = React.useContext(DataRouterStateContext);
  invariant(state, getDataRouterConsoleError(hookName));
  return state;
}

// External hooks

/**
 * Handles the click behavior for router {@link Link | `<Link>`} components.This
 * is useful if you need to create custom {@link Link | `<Link>`} components with
 * the same click behavior we use in our exported {@link Link | `<Link>`}.
 *
 * @public
 * @category Hooks
 * @param to The URL to navigate to, can be a string or a partial {@link Path}.
 * @param options Options
 * @param options.preventScrollReset Whether to prevent the scroll position from
 * being reset to the top of the viewport on completion of the navigation when
 * using the {@link ScrollRestoration} component. Defaults to `false`.
 * @param options.relative The {@link RelativeRoutingType | relative routing type}
 * to use for the link. Defaults to `"route"`.
 * @param options.replace Whether to replace the current [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * entry instead of pushing a new one. Defaults to `false`.
 * @param options.state The state to add to the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * entry for this navigation. Defaults to `undefined`.
 * @param options.target The target attribute for the link. Defaults to `undefined`.
 * @param options.viewTransition Enables a [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
 * for this navigation. To apply specific styles during the transition, see
 * {@link useViewTransitionState}. Defaults to `false`.
 * @returns A click handler function that can be used in a custom {@link Link} component.
 */
export function useLinkClickHandler<E extends Element = HTMLAnchorElement>(
  to: To,
  {
    target,
    replace: replaceProp,
    state,
    preventScrollReset,
    relative,
    viewTransition,
  }: {
    target?: React.HTMLAttributeAnchorTarget;
    replace?: boolean;
    state?: any;
    preventScrollReset?: boolean;
    relative?: RelativeRoutingType;
    viewTransition?: boolean;
  } = {},
): (event: React.MouseEvent<E, MouseEvent>) => void {
  let navigate = useNavigate();
  let location = useLocation();
  let path = useResolvedPath(to, { relative });

  return React.useCallback(
    (event: React.MouseEvent<E, MouseEvent>) => {
      if (shouldProcessLinkClick(event, target)) {
        event.preventDefault();

        // If the URL hasn't changed, a regular <a> will do a replace instead of
        // a push, so do the same here unless the replace prop is explicitly set
        let replace =
          replaceProp !== undefined
            ? replaceProp
            : createPath(location) === createPath(path);

        navigate(to, {
          replace,
          state,
          preventScrollReset,
          relative,
          viewTransition,
        });
      }
    },
    [
      location,
      navigate,
      path,
      replaceProp,
      state,
      target,
      to,
      preventScrollReset,
      relative,
      viewTransition,
    ],
  );
}

/**
 * Returns a tuple of the current URL's [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
 * and a function to update them. Setting the search params causes a navigation.
 *
 * ```tsx
 * import { useSearchParams } from "react-router";
 *
 * export function SomeComponent() {
 *   const [searchParams, setSearchParams] = useSearchParams();
 *   // ...
 * }
 * ```
 *
 * ### `setSearchParams` function
 *
 * The second element of the tuple is a function that can be used to update the
 * search params. It accepts the same types as `defaultInit` and will cause a
 * navigation to the new URL.
 *
 * ```tsx
 * let [searchParams, setSearchParams] = useSearchParams();
 *
 * // a search param string
 * setSearchParams("?tab=1");
 *
 * // a shorthand object
 * setSearchParams({ tab: "1" });
 *
 * // object keys can be arrays for multiple values on the key
 * setSearchParams({ brand: ["nike", "reebok"] });
 *
 * // an array of tuples
 * setSearchParams([["tab", "1"]]);
 *
 * // a `URLSearchParams` object
 * setSearchParams(new URLSearchParams("?tab=1"));
 * ```
 *
 * It also supports a function callback like React's
 * [`setState`](https://react.dev/reference/react/useState#setstate):
 *
 * ```tsx
 * setSearchParams((searchParams) => {
 *   searchParams.set("tab", "2");
 *   return searchParams;
 * });
 * ```
 *
 * <docs-warning>The function callback version of `setSearchParams` does not support
 * the [queueing](https://react.dev/reference/react/useState#setstate-parameters)
 * logic that React's `setState` implements.  Multiple calls to `setSearchParams`
 * in the same tick will not build on the prior value.  If you need this behavior,
 * you can use `setState` manually.</docs-warning>
 *
 * ### Notes
 *
 * Note that `searchParams` is a stable reference, so you can reliably use it
 * as a dependency in React's [`useEffect`](https://react.dev/reference/react/useEffect)
 * hooks.
 *
 * ```tsx
 * useEffect(() => {
 *   console.log(searchParams.get("tab"));
 * }, [searchParams]);
 * ```
 *
 * However, this also means it's mutable. If you change the object without
 * calling `setSearchParams`, its values will change between renders if some
 * other state causes the component to re-render and URL will not reflect the
 * values.
 *
 * @public
 * @category Hooks
 * @param defaultInit
 * You can initialize the search params with a default value, though it **will
 * not** change the URL on the first render.
 *
 * ```tsx
 * // a search param string
 * useSearchParams("?tab=1");
 *
 * // a shorthand object
 * useSearchParams({ tab: "1" });
 *
 * // object keys can be arrays for multiple values on the key
 * useSearchParams({ brand: ["nike", "reebok"] });
 *
 * // an array of tuples
 * useSearchParams([["tab", "1"]]);
 *
 * // a `URLSearchParams` object
 * useSearchParams(new URLSearchParams("?tab=1"));
 * ```
 * @returns A tuple of the current [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams)
 * and a function to update them.
 */
export function useSearchParams(
  defaultInit?: URLSearchParamsInit,
): [URLSearchParams, SetURLSearchParams] {
  warning(
    typeof URLSearchParams !== "undefined",
    `You cannot use the \`useSearchParams\` hook in a browser that does not ` +
      `support the URLSearchParams API. If you need to support Internet ` +
      `Explorer 11, we recommend you load a polyfill such as ` +
      `https://github.com/ungap/url-search-params.`,
  );

  let defaultSearchParamsRef = React.useRef(createSearchParams(defaultInit));
  let hasSetSearchParamsRef = React.useRef(false);

  let location = useLocation();
  let searchParams = React.useMemo(
    () =>
      // Only merge in the defaults if we haven't yet called setSearchParams.
      // Once we call that we want those to take precedence, otherwise you can't
      // remove a param with setSearchParams({}) if it has an initial value
      getSearchParamsForLocation(
        location.search,
        hasSetSearchParamsRef.current ? null : defaultSearchParamsRef.current,
      ),
    [location.search],
  );

  let navigate = useNavigate();
  let setSearchParams = React.useCallback<SetURLSearchParams>(
    (nextInit, navigateOptions) => {
      const newSearchParams = createSearchParams(
        typeof nextInit === "function"
          ? nextInit(new URLSearchParams(searchParams))
          : nextInit,
      );
      hasSetSearchParamsRef.current = true;
      navigate("?" + newSearchParams, navigateOptions);
    },
    [navigate, searchParams],
  );

  return [searchParams, setSearchParams];
}

/**
 *  Sets new search params and causes a navigation when called.
 *
 *  ```tsx
 *  <button
 *    onClick={() => {
 *      const params = new URLSearchParams();
 *      params.set("someKey", "someValue");
 *      setSearchParams(params, {
 *        preventScrollReset: true,
 *      });
 *    }}
 *  />
 *  ```
 *
 *  It also supports a function for setting new search params.
 *
 *  ```tsx
 *  <button
 *    onClick={() => {
 *      setSearchParams((prev) => {
 *        prev.set("someKey", "someValue");
 *        return prev;
 *      });
 *    }}
 *  />
 *  ```
 */
export type SetURLSearchParams = (
  nextInit?:
    | URLSearchParamsInit
    | ((prev: URLSearchParams) => URLSearchParamsInit),
  navigateOpts?: NavigateOptions,
) => void;

/**
 * Submits a HTML [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
 * to the server without reloading the page.
 */
export interface SubmitFunction {
  (
    /**
     * Can be multiple types of elements and objects
     *
     * **[`HTMLFormElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement)**
     *
     * ```tsx
     * <Form
     *   onSubmit={(event) => {
     *     submit(event.currentTarget);
     *   }}
     * />
     * ```
     *
     * **[`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)**
     *
     * ```tsx
     * const formData = new FormData();
     * formData.append("myKey", "myValue");
     * submit(formData, { method: "post" });
     * ```
     *
     * **Plain object that will be serialized as [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)**
     *
     * ```tsx
     * submit({ myKey: "myValue" }, { method: "post" });
     * ```
     *
     * **Plain object that will be serialized as JSON**
     *
     * ```tsx
     * submit(
     *   { myKey: "myValue" },
     *   { method: "post", encType: "application/json" }
     * );
     * ```
     */
    target: SubmitTarget,

    /**
     * Options that override the [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)'s
     * own attributes. Required when submitting arbitrary data without a backing
     * [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form).
     */
    options?: SubmitOptions,
  ): Promise<void>;
}

/**
 * Submits a fetcher [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) to the server without reloading the page.
 */
export interface FetcherSubmitFunction {
  (
    /**
     * Can be multiple types of elements and objects
     *
     * **[`HTMLFormElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement)**
     *
     * ```tsx
     * <fetcher.Form
     *   onSubmit={(event) => {
     *     fetcher.submit(event.currentTarget);
     *   }}
     * />
     * ```
     *
     * **[`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)**
     *
     * ```tsx
     * const formData = new FormData();
     * formData.append("myKey", "myValue");
     * fetcher.submit(formData, { method: "post" });
     * ```
     *
     * **Plain object that will be serialized as [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)**
     *
     * ```tsx
     * fetcher.submit({ myKey: "myValue" }, { method: "post" });
     * ```
     *
     * **Plain object that will be serialized as JSON**
     *
     * ```tsx
     * fetcher.submit(
     *   { myKey: "myValue" },
     *   { method: "post", encType: "application/json" }
     * );
     * ```
     */
    target: SubmitTarget,

    // Fetchers cannot replace or set state because they are not navigation events
    options?: FetcherSubmitOptions,
  ): Promise<void>;
}

let fetcherId = 0;
let getUniqueFetcherId = () => `__${String(++fetcherId)}__`;

/**
 * The imperative version of {@link Form | `<Form>`} that lets you submit a form
 * from code instead of a user interaction.
 *
 * @example
 * import { useSubmit } from "react-router";
 *
 * function SomeComponent() {
 *   const submit = useSubmit();
 *   return (
 *     <Form onChange={(event) => submit(event.currentTarget)} />
 *   );
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns A function that can be called to submit a {@link Form} imperatively.
 */
export function useSubmit(): SubmitFunction {
  let { router } = useDataRouterContext(DataRouterHook.UseSubmit);
  let { basename } = React.useContext(NavigationContext);
  let currentRouteId = useRouteId();

  return React.useCallback<SubmitFunction>(
    async (target, options = {}) => {
      debugger;
      console.log("useSubmit", target, options);
      let { action, method, encType, formData, body } = getFormSubmissionInfo(
        target,
        basename,
      );

      if (options.navigate === false) {
        let key = options.fetcherKey || getUniqueFetcherId();
        await router.fetch(key, currentRouteId, options.action || action, {
          defaultShouldRevalidate: options.defaultShouldRevalidate,
          preventScrollReset: options.preventScrollReset,
          formData,
          body,
          formMethod: options.method || (method as HTMLFormMethod),
          formEncType: options.encType || (encType as FormEncType),
          flushSync: options.flushSync,
        });
      } else {
        await router.navigate(options.action || action, {
          defaultShouldRevalidate: options.defaultShouldRevalidate,
          preventScrollReset: options.preventScrollReset,
          formData,
          body,
          formMethod: options.method || (method as HTMLFormMethod),
          formEncType: options.encType || (encType as FormEncType),
          replace: options.replace,
          state: options.state,
          fromRouteId: currentRouteId,
          flushSync: options.flushSync,
          viewTransition: options.viewTransition,
        });
      }
    },
    [router, basename, currentRouteId],
  );
}

// v7: Eventually we should deprecate this entirely in favor of using the
// router method directly?
/**
 * Resolves the URL to the closest route in the component hierarchy instead of
 * the current URL of the app.
 *
 * This is used internally by {@link Form} to resolve the `action` to the closest
 * route, but can be used generically as well.
 *
 * @example
 * import { useFormAction } from "react-router";
 *
 * function SomeComponent() {
 *   // closest route URL
 *   let action = useFormAction();
 *
 *   // closest route URL + "destroy"
 *   let destroyAction = useFormAction("destroy");
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @param action The action to append to the closest route URL. Defaults to the
 * closest route URL.
 * @param options Options
 * @param options.relative The relative routing type to use when resolving the
 * action. Defaults to `"route"`.
 * @returns The resolved action URL.
 */
export function useFormAction(
  action?: string,
  { relative }: { relative?: RelativeRoutingType } = {},
): string {
  let { basename } = React.useContext(NavigationContext);
  let routeContext = React.useContext(RouteContext);
  invariant(routeContext, "useFormAction must be used inside a RouteContext");

  let [match] = routeContext.matches.slice(-1);
  // Shallow clone path so we can modify it below, otherwise we modify the
  // object referenced by useMemo inside useResolvedPath
  let path = { ...useResolvedPath(action ? action : ".", { relative }) };

  // If no action was specified, browsers will persist current search params
  // when determining the path, so match that behavior
  // https://github.com/remix-run/remix/issues/927
  let location = useLocation();
  if (action == null) {
    // Safe to write to this directly here since if action was undefined, we
    // would have called useResolvedPath(".") which will never include a search
    path.search = location.search;

    // When grabbing search params from the URL, remove any included ?index param
    // since it might not apply to our contextual route.  We add it back based
    // on match.route.index below
    let params = new URLSearchParams(path.search);
    let indexValues = params.getAll("index");
    let hasNakedIndexParam = indexValues.some((v) => v === "");
    if (hasNakedIndexParam) {
      params.delete("index");
      indexValues.filter((v) => v).forEach((v) => params.append("index", v));
      let qs = params.toString();
      path.search = qs ? `?${qs}` : "";
    }
  }

  if ((!action || action === ".") && match.route.index) {
    path.search = path.search
      ? path.search.replace(/^\?/, "?index&")
      : "?index";
  }

  // If we're operating within a basename, prepend it to the pathname prior
  // to creating the form action.  If this is a root navigation, then just use
  // the raw basename which allows the basename to have full control over the
  // presence of a trailing slash on root actions
  if (basename !== "/") {
    path.pathname =
      path.pathname === "/" ? basename : joinPaths([basename, path.pathname]);
  }

  return createPath(path);
}

/**
 * The return value {@link useFetcher} that keeps track of the state of a fetcher.
 *
 * ```tsx
 * let fetcher = useFetcher();
 * ```
 */
export type FetcherWithComponents<TData> = Fetcher<TData> & {
  /**
   * Just like {@link Form} except it doesn't cause a navigation.
   *
   * ```tsx
   * function SomeComponent() {
   *   const fetcher = useFetcher()
   *   return (
   *     <fetcher.Form method="post" action="/some/route">
   *       <input type="text" />
   *     </fetcher.Form>
   *   )
   * }
   * ```
   */
  Form: React.ForwardRefExoticComponent<
    FetcherFormProps & React.RefAttributes<HTMLFormElement>
  >;

  /**
   * Loads data from a route. Useful for loading data imperatively inside user
   * events outside a normal button or form, like a combobox or search input.
   *
   * ```tsx
   * let fetcher = useFetcher()
   *
   * <input onChange={e => {
   *   fetcher.load(`/search?q=${e.target.value}`)
   * }} />
   * ```
   */
  load: (
    href: string,
    opts?: {
      /**
       * Wraps the initial state update for this `fetcher.load` in a
       * [`ReactDOM.flushSync`](https://react.dev/reference/react-dom/flushSync)
       * call instead of the default [`React.startTransition`](https://react.dev/reference/react/startTransition).
       * This allows you to perform synchronous DOM actions immediately after the
       * update is flushed to the DOM.
       */
      flushSync?: boolean;
    },
  ) => Promise<void>;

  /**
   * Reset a fetcher back to an empty/idle state.
   *
   * If the fetcher is currently in-flight, the
   * [`AbortController`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
   * will be aborted with the `reason`, if provided.
   *
   * @param reason Optional `reason` to provide to [`AbortController.abort()`](https://developer.mozilla.org/en-US/docs/Web/API/AbortController/abort)
   * @returns void
   */
  unstable_reset: (opts?: { reason?: unknown }) => void;

  /**
   *  Submits form data to a route. While multiple nested routes can match a URL, only the leaf route will be called.
   *
   *  The `formData` can be multiple types:
   *
   *  - [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
   *    A `FormData` instance.
   *  - [`HTMLFormElement`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement)
   *    A [`<form>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) DOM element.
   *  - `Object`
   *    An object of key/value-pairs that will be converted to a [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
   *    instance by default. You can pass a more complex object and serialize it
   *    as JSON by specifying `encType: "application/json"`. See
   *    {@link useSubmit} for more details.
   *
   *  If the method is `GET`, then the route [`loader`](../../start/framework/route-module#loader)
   *  is being called and with the `formData` serialized to the url as [`URLSearchParams`](https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams).
   *  If `DELETE`, `PATCH`, `POST`, or `PUT`, then the route [`action`](../../start/framework/route-module#action)
   *  is being called with `formData` as the body.
   *
   *  ```tsx
   *  // Submit a FormData instance (GET request)
   *  const formData = new FormData();
   *  fetcher.submit(formData);
   *
   *  // Submit the HTML form element
   *  fetcher.submit(event.currentTarget.form, {
   *    method: "POST",
   *  });
   *
   *  // Submit key/value JSON as a FormData instance
   *  fetcher.submit(
   *    { serialized: "values" },
   *    { method: "POST" }
   *  );
   *
   *  // Submit raw JSON
   *  fetcher.submit(
   *    {
   *      deeply: {
   *        nested: {
   *          json: "values",
   *        },
   *      },
   *    },
   *    {
   *      method: "POST",
   *      encType: "application/json",
   *    }
   *  );
   *  ```
   */
  submit: FetcherSubmitFunction;
};

// TODO: (v7) Change the useFetcher generic default from `any` to `unknown`

/**
 * Useful for creating complex, dynamic user interfaces that require multiple,
 * concurrent data interactions without causing a navigation.
 *
 * Fetchers track their own, independent state and can be used to load data, submit
 * forms, and generally interact with [`action`](../../start/framework/route-module#action)
 * and [`loader`](../../start/framework/route-module#loader) functions.
 *
 * @example
 * import { useFetcher } from "react-router"
 *
 * function SomeComponent() {
 *   let fetcher = useFetcher()
 *
 *   // states are available on the fetcher
 *   fetcher.state // "idle" | "loading" | "submitting"
 *   fetcher.data // the data returned from the action or loader
 *
 *   // render a form
 *   <fetcher.Form method="post" />
 *
 *   // load data
 *   fetcher.load("/some/route")
 *
 *   // submit data
 *   fetcher.submit(someFormRef, { method: "post" })
 *   fetcher.submit(someData, {
 *     method: "post",
 *     encType: "application/json"
 *   })
 *
 *   // reset fetcher
 *   fetcher.unstable_reset()
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @param options Options
 * @param options.key A unique key to identify the fetcher.
 *
 *
 * By default, `useFetcher` generates a unique fetcher scoped to that component.
 * If you want to identify a fetcher with your own key such that you can access
 * it from elsewhere in your app, you can do that with the `key` option:
 *
 * ```tsx
 * function SomeComp() {
 *   let fetcher = useFetcher({ key: "my-key" })
 *   // ...
 * }
 *
 * // Somewhere else
 * function AnotherComp() {
 *   // this will be the same fetcher, sharing the state across the app
 *   let fetcher = useFetcher({ key: "my-key" });
 *   // ...
 * }
 * ```
 * @returns A {@link FetcherWithComponents} object that contains the fetcher's state, data, and components for submitting forms and loading data.
 */
export function useFetcher<T = any>({
  key,
}: {
  key?: string;
} = {}): FetcherWithComponents<SerializeFrom<T>> {
  let { router } = useDataRouterContext(DataRouterHook.UseFetcher);
  let state = useDataRouterState(DataRouterStateHook.UseFetcher);
  let fetcherData = React.useContext(FetchersContext);
  let route = React.useContext(RouteContext);
  let routeId = route.matches[route.matches.length - 1]?.route.id;

  invariant(fetcherData, `useFetcher must be used inside a FetchersContext`);
  invariant(route, `useFetcher must be used inside a RouteContext`);
  invariant(
    routeId != null,
    `useFetcher can only be used on routes that contain a unique "id"`,
  );

  // Fetcher key handling
  let defaultKey = React.useId();
  let [fetcherKey, setFetcherKey] = React.useState<string>(key || defaultKey);
  if (key && key !== fetcherKey) {
    setFetcherKey(key);
  }

  // Registration/cleanup
  React.useEffect(() => {
    router.getFetcher(fetcherKey);
    return () => router.deleteFetcher(fetcherKey);
  }, [router, fetcherKey]);

  // Fetcher additions
  let load = React.useCallback(
    async (href: string, opts?: { flushSync?: boolean }) => {
      invariant(routeId, "No routeId available for fetcher.load()");
      await router.fetch(fetcherKey, routeId, href, opts);
    },
    [fetcherKey, routeId, router],
  );

  let submitImpl = useSubmit();
  let submit = React.useCallback<FetcherSubmitFunction>(
    async (target, opts) => {
      await submitImpl(target, {
        ...opts,
        navigate: false,
        fetcherKey,
      });
    },
    [fetcherKey, submitImpl],
  );

  let unstable_reset = React.useCallback<
    FetcherWithComponents<T>["unstable_reset"]
  >((opts) => router.resetFetcher(fetcherKey, opts), [router, fetcherKey]);

  let FetcherForm = React.useMemo(() => {
    let FetcherForm = React.forwardRef<HTMLFormElement, FetcherFormProps>(
      (props, ref) => {
        return (
          <Form {...props} navigate={false} fetcherKey={fetcherKey} ref={ref} />
        );
      },
    );
    FetcherForm.displayName = "fetcher.Form";
    return FetcherForm;
  }, [fetcherKey]);

  // Exposed FetcherWithComponents
  let fetcher = state.fetchers.get(fetcherKey) || IDLE_FETCHER;
  let data = fetcherData.get(fetcherKey);
  let fetcherWithComponents = React.useMemo(
    () => ({
      Form: FetcherForm,
      submit,
      load,
      unstable_reset,
      ...fetcher,
      data,
    }),
    [FetcherForm, submit, load, unstable_reset, fetcher, data],
  );

  return fetcherWithComponents;
}

/**
 * Returns an array of all in-flight {@link Fetcher}s. This is useful for components
 * throughout the app that didn't create the fetchers but want to use their submissions
 * to participate in optimistic UI.
 *
 * @example
 * import { useFetchers } from "react-router";
 *
 * function SomeComponent() {
 *   const fetchers = useFetchers();
 *   fetchers[0].formData; // FormData
 *   fetchers[0].state; // etc.
 *   // ...
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns An array of all in-flight {@link Fetcher}s, each with a unique `key`
 * property.
 */
export function useFetchers(): (Fetcher & { key: string })[] {
  let state = useDataRouterState(DataRouterStateHook.UseFetchers);
  return Array.from(state.fetchers.entries()).map(([key, fetcher]) => ({
    ...fetcher,
    key,
  }));
}

const SCROLL_RESTORATION_STORAGE_KEY = "react-router-scroll-positions";
let savedScrollPositions: Record<string, number> = {};

function getScrollRestorationKey(
  location: Location,
  matches: UIMatch[],
  basename: string,
  getKey?: GetScrollRestorationKeyFunction,
) {
  let key: string | null = null;
  if (getKey) {
    if (basename !== "/") {
      key = getKey(
        {
          ...location,
          pathname:
            stripBasename(location.pathname, basename) || location.pathname,
        },
        matches,
      );
    } else {
      key = getKey(location, matches);
    }
  }
  if (key == null) {
    key = location.key;
  }
  return key;
}

/**
 * When rendered inside a {@link RouterProvider}, will restore scroll positions
 * on navigations
 *
 * <!--
 * Not marked `@public` because we only export as UNSAFE_ and therefore we don't
 * maintain an .md file for this hook
 * -->
 *
 * @name UNSAFE_useScrollRestoration
 * @category Hooks
 * @mode framework
 * @mode data
 * @param options Options
 * @param options.getKey A function that returns a key to use for scroll restoration.
 * This is useful for custom scroll restoration logic, such as using only the pathname
 * so that subsequent navigations to prior paths will restore the scroll. Defaults
 * to `location.key`.
 * @param options.storageKey The key to use for storing scroll positions in
 * `sessionStorage`. Defaults to `"react-router-scroll-positions"`.
 * @returns {void}
 */
export function useScrollRestoration({
  getKey,
  storageKey,
}: {
  getKey?: GetScrollRestorationKeyFunction;
  storageKey?: string;
} = {}): void {
  let { router } = useDataRouterContext(DataRouterHook.UseScrollRestoration);
  let { restoreScrollPosition, preventScrollReset } = useDataRouterState(
    DataRouterStateHook.UseScrollRestoration,
  );
  let { basename } = React.useContext(NavigationContext);
  let location = useLocation();
  let matches = useMatches();
  let navigation = useNavigation();

  // Trigger manual scroll restoration while we're active
  React.useEffect(() => {
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = "auto";
    };
  }, []);

  // Save positions on pagehide
  usePageHide(
    React.useCallback(() => {
      if (navigation.state === "idle") {
        let key = getScrollRestorationKey(location, matches, basename, getKey);
        savedScrollPositions[key] = window.scrollY;
      }
      try {
        sessionStorage.setItem(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY,
          JSON.stringify(savedScrollPositions),
        );
      } catch (error) {
        warning(
          false,
          `Failed to save scroll positions in sessionStorage, <ScrollRestoration /> will not work properly (${error}).`,
        );
      }
      window.history.scrollRestoration = "auto";
    }, [navigation.state, getKey, basename, location, matches, storageKey]),
  );

  // Read in any saved scroll locations
  if (typeof document !== "undefined") {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(() => {
      try {
        let sessionPositions = sessionStorage.getItem(
          storageKey || SCROLL_RESTORATION_STORAGE_KEY,
        );
        if (sessionPositions) {
          savedScrollPositions = JSON.parse(sessionPositions);
        }
      } catch (e) {
        // no-op, use default empty object
      }
    }, [storageKey]);

    // Enable scroll restoration in the router
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(() => {
      let disableScrollRestoration = router?.enableScrollRestoration(
        savedScrollPositions,
        () => window.scrollY,
        getKey
          ? (location, matches) =>
              getScrollRestorationKey(location, matches, basename, getKey)
          : undefined,
      );
      return () => disableScrollRestoration && disableScrollRestoration();
    }, [router, basename, getKey]);

    // Restore scrolling when state.restoreScrollPosition changes
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(() => {
      // Explicit false means don't do anything (used for submissions or revalidations)
      if (restoreScrollPosition === false) {
        return;
      }

      // been here before, scroll to it
      if (typeof restoreScrollPosition === "number") {
        window.scrollTo(0, restoreScrollPosition);
        return;
      }

      // try to scroll to the hash
      try {
        if (location.hash) {
          let el = document.getElementById(
            decodeURIComponent(location.hash.slice(1)),
          );
          if (el) {
            el.scrollIntoView();
            return;
          }
        }
      } catch {
        warning(
          false,
          `"${location.hash.slice(
            1,
          )}" is not a decodable element ID. The view will not scroll to it.`,
        );
      }

      // Don't reset if this navigation opted out
      if (preventScrollReset === true) {
        return;
      }

      // otherwise go to the top on new locations
      window.scrollTo(0, 0);
    }, [location, restoreScrollPosition, preventScrollReset]);
  }
}

/**
 * Set up a callback to be fired on [Window's `beforeunload` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event).
 *
 * @public
 * @category Hooks
 * @param callback The callback to be called when the [`beforeunload` event](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event)
 * is fired.
 * @param options Options
 * @param options.capture If `true`, the event will be captured during the capture
 * phase. Defaults to `false`.
 * @returns {void}
 */
export function useBeforeUnload(
  callback: (event: BeforeUnloadEvent) => any,
  options?: { capture?: boolean },
): void {
  let { capture } = options || {};
  React.useEffect(() => {
    let opts = capture != null ? { capture } : undefined;
    window.addEventListener("beforeunload", callback, opts);
    return () => {
      window.removeEventListener("beforeunload", callback, opts);
    };
  }, [callback, capture]);
}

/*
 * Setup a callback to be fired on the window's `pagehide` event. This is
 * useful for saving some data to `window.localStorage` just before the page
 * refreshes.  This event is better supported than beforeunload across browsers.
 *
 * Note: The `callback` argument should be a function created with
 * `React.useCallback()`.
 */
function usePageHide(
  callback: (event: PageTransitionEvent) => any,
  options?: { capture?: boolean },
): void {
  let { capture } = options || {};
  React.useEffect(() => {
    let opts = capture != null ? { capture } : undefined;
    window.addEventListener("pagehide", callback, opts);
    return () => {
      window.removeEventListener("pagehide", callback, opts);
    };
  }, [callback, capture]);
}

/**
 * Wrapper around {@link useBlocker} to show a [`window.confirm`](https://developer.mozilla.org/en-US/docs/Web/API/Window/confirm)
 * prompt to users instead of building a custom UI with {@link useBlocker}.
 *
 * The `unstable_` flag will not be removed because this technique has a lot of
 * rough edges and behaves very differently (and incorrectly sometimes) across
 * browsers if users click addition back/forward navigations while the
 * confirmation is open. Use at your own risk.
 *
 * @example
 * function ImportantForm() {
 *   let [value, setValue] = React.useState("");
 *
 *   // Block navigating elsewhere when data has been entered into the input
 *   unstable_usePrompt({
 *     message: "Are you sure?",
 *     when: ({ currentLocation, nextLocation }) =>
 *       value !== "" &&
 *       currentLocation.pathname !== nextLocation.pathname,
 *   });
 *
 *   return (
 *     <Form method="post">
 *       <label>
 *         Enter some important data:
 *         <input
 *           name="data"
 *           value={value}
 *           onChange={(e) => setValue(e.target.value)}
 *         />
 *       </label>
 *       <button type="submit">Save</button>
 *     </Form>
 *   );
 * }
 *
 * @name unstable_usePrompt
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @param options Options
 * @param options.message The message to show in the confirmation dialog.
 * @param options.when A boolean or a function that returns a boolean indicating
 * whether to block the navigation. If a function is provided, it will receive an
 * object with `currentLocation` and `nextLocation` properties.
 * @returns {void}
 */
export function usePrompt({
  when,
  message,
}: {
  when: boolean | BlockerFunction;
  message: string;
}): void {
  let blocker = useBlocker(when);

  React.useEffect(() => {
    if (blocker.state === "blocked") {
      let proceed = window.confirm(message);
      if (proceed) {
        // This timeout is needed to avoid a weird "race" on POP navigations
        // between the `window.history` revert navigation and the result of
        // `window.confirm`
        setTimeout(blocker.proceed, 0);
      } else {
        blocker.reset();
      }
    }
  }, [blocker, message]);

  React.useEffect(() => {
    if (blocker.state === "blocked" && !when) {
      blocker.reset();
    }
  }, [blocker, when]);
}

/**
 * This hook returns `true` when there is an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
 * to the specified location. This can be used to apply finer-grained styles to
 * elements to further customize the view transition. This requires that view
 * transitions have been enabled for the given navigation via {@link LinkProps.viewTransition}
 * (or the `Form`, `submit`, or `navigate` call)
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @param to The {@link To} location to check for an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API).
 * @param options Options
 * @param options.relative The relative routing type to use when resolving the
 * `to` location, defaults to `"route"`. See {@link RelativeRoutingType} for
 * more details.
 * @returns `true` if there is an active [View Transition](https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API)
 * to the specified {@link Location}, otherwise `false`.
 */
export function useViewTransitionState(
  to: To,
  { relative }: { relative?: RelativeRoutingType } = {},
) {
  let vtContext = React.useContext(ViewTransitionContext);

  invariant(
    vtContext != null,
    "`useViewTransitionState` must be used within `react-router-dom`'s `RouterProvider`.  " +
      "Did you accidentally import `RouterProvider` from `react-router`?",
  );

  let { basename } = useDataRouterContext(
    DataRouterHook.useViewTransitionState,
  );
  let path = useResolvedPath(to, { relative });
  if (!vtContext.isTransitioning) {
    return false;
  }

  let currentPath =
    stripBasename(vtContext.currentLocation.pathname, basename) ||
    vtContext.currentLocation.pathname;
  let nextPath =
    stripBasename(vtContext.nextLocation.pathname, basename) ||
    vtContext.nextLocation.pathname;

  // Transition is active if we're going to or coming from the indicated
  // destination.  This ensures that other PUSH navigations that reverse
  // an indicated transition apply.  I.e., on the list view you have:
  //
  //   <NavLink to="/details/1" viewTransition>
  //
  // If you click the breadcrumb back to the list view:
  //
  //   <NavLink to="/list" viewTransition>
  //
  // We should apply the transition because it's indicated as active going
  // from /list -> /details/1 and therefore should be active on the reverse
  // (even though this isn't strictly a POP reverse)
  return (
    matchPath(path.pathname, nextPath) != null ||
    matchPath(path.pathname, currentPath) != null
  );
}

//#endregion
