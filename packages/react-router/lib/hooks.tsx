import * as React from "react";
import type {
  DataRouteMatch,
  NavigateOptions,
  RouteContextObject,
  RouteMatch,
  RouteObject,
} from "./context";
import {
  AwaitContext,
  DataRouterContext,
  DataRouterStateContext,
  ENABLE_DEV_WARNINGS,
  LocationContext,
  NavigationContext,
  RouteContext,
  RouteErrorContext,
} from "./context";
import type { Location, Path, To } from "./router/history";
import {
  Action as NavigationType,
  invariant,
  parsePath,
  warning,
} from "./router/history";
import type {
  Blocker,
  BlockerFunction,
  RelativeRoutingType,
  Router as DataRouter,
  RevalidationState,
  Navigation,
} from "./router/router";
import { IDLE_BLOCKER } from "./router/router";
import type {
  ParamParseKey,
  Params,
  PathMatch,
  PathPattern,
  UIMatch,
} from "./router/utils";
import {
  convertRouteMatchToUiMatch,
  decodePath,
  getResolveToMatches,
  isRouteErrorResponse,
  joinPaths,
  matchPath,
  matchRoutes,
  resolveTo,
  stripBasename,
} from "./router/utils";
import type { SerializeFrom } from "./types/route-data";

/**
 * Resolves a URL against the current {@link Location}.
 *
 * @example
 * import { useHref } from "react-router";
 *
 * function SomeComponent() {
 *   let href = useHref("some/where");
 *   // "/resolved/some/where"
 * }
 *
 * @public
 * @category Hooks
 * @param to The path to resolve
 * @param options Options
 * @param options.relative Defaults to `"route"` so routing is relative to the
 * route tree.
 * Set to `"path"` to make relative routing operate against path segments.
 * @returns The resolved href string
 */
export function useHref(
  to: To,
  { relative }: { relative?: RelativeRoutingType } = {},
): string {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useHref() may be used only in the context of a <Router> component.`,
  );

  let { basename, navigator } = React.useContext(NavigationContext);
  let { hash, pathname, search } = useResolvedPath(to, { relative });

  let joinedPathname = pathname;

  // If we're operating within a basename, prepend it to the pathname prior
  // to creating the href.  If this is a root navigation, then just use the raw
  // basename which allows the basename to have full control over the presence
  // of a trailing slash on root links
  if (basename !== "/") {
    joinedPathname =
      pathname === "/" ? basename : joinPaths([basename, pathname]);
  }

  return navigator.createHref({ pathname: joinedPathname, search, hash });
}

/**
 * Returns `true` if this component is a descendant of a {@link Router}, useful
 * to ensure a component is used within a {@link Router}.
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns Whether the component is within a {@link Router} context
 */
export function useInRouterContext(): boolean {
  return React.useContext(LocationContext) != null;
}

/**
 * Returns the current {@link Location}. This can be useful if you'd like to
 * perform some side effect whenever it changes.
 *
 * @example
 * import * as React from 'react'
 * import { useLocation } from 'react-router'
 *
 * function SomeComponent() {
 *   let location = useLocation()
 *
 *   React.useEffect(() => {
 *     // Google Analytics
 *     ga('send', 'pageview')
 *   }, [location]);
 *
 *   return (
 *     // ...
 *   );
 * }
 *
 * @public
 * @category Hooks
 * @returns The current {@link Location} object
 */
export function useLocation(): Location {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useLocation() may be used only in the context of a <Router> component.`,
  );

  return React.useContext(LocationContext).location;
}

/**
 * Returns the current {@link Navigation} action which describes how the router
 * came to the current {@link Location}, either by a pop, push, or replace on
 * the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) stack.
 *
 * @public
 * @category Hooks
 * @returns The current {@link NavigationType} (`"POP"`, `"PUSH"`, or `"REPLACE"`)
 */
export function useNavigationType(): NavigationType {
  return React.useContext(LocationContext).navigationType;
}

/**
 * Returns a {@link PathMatch} object if the given pattern matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * {@link NavLink | `<NavLink>`}.
 *
 * @public
 * @category Hooks
 * @param pattern The pattern to match against the current {@link Location}
 * @returns The path match object if the pattern matches, `null` otherwise
 */
export function useMatch<
  ParamKey extends ParamParseKey<Path>,
  Path extends string,
>(pattern: PathPattern<Path> | Path): PathMatch<ParamKey> | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useMatch() may be used only in the context of a <Router> component.`,
  );

  let { pathname } = useLocation();
  return React.useMemo(
    () => matchPath<ParamKey, Path>(pattern, decodePath(pathname)),
    [pathname, pattern],
  );
}

/**
 * The interface for the `navigate` function returned from {@link useNavigate}.
 */
export interface NavigateFunction {
  (to: To, options?: NavigateOptions): Promise<void>;
  (delta: number): Promise<void>;
}

const navigateEffectWarning =
  `You should call navigate() in a React.useEffect(), not when ` +
  `your component is first rendered.`;

// Mute warnings for calls to useNavigate in SSR environments
function useIsomorphicLayoutEffect(
  cb: Parameters<typeof React.useLayoutEffect>[0],
) {
  let isStatic = React.useContext(NavigationContext).static;
  if (!isStatic) {
    // We should be able to get rid of this once react 18.3 is released
    // See: https://github.com/facebook/react/pull/26395
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useLayoutEffect(cb);
  }
}

/**
 * Returns a function that lets you navigate programmatically in the browser in
 * response to user interactions or effects.
 *
 * It's often better to use {@link redirect} in [`action`](../../start/framework/route-module#action)/[`loader`](../../start/framework/route-module#loader)
 * functions than this hook.
 *
 * The returned function signature is `navigate(to, options?)`/`navigate(delta)` where:
 *
 * * `to` can be a string path, a {@link To} object, or a number (delta)
 * * `options` contains options for modifying the navigation
 *   * `flushSync`: Wrap the DOM updates in [`ReactDom.flushSync`](https://react.dev/reference/react-dom/flushSync)
 *   * `preventScrollReset`: Do not scroll back to the top of the page after navigation
 *   * `relative`: `"route"` or `"path"` to control relative routing logic
 *   * `replace`: Replace the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History) stack
 *   * `state`: Optional [`history.state`](https://developer.mozilla.org/en-US/docs/Web/API/History/state) to include with the new {@link Location}
 *   * `viewTransition`: Enable [`document.startViewTransition`](https://developer.mozilla.org/en-US/docs/Web/API/Document/startViewTransition) for this navigation
 *
 * @example
 * import { useNavigate } from "react-router";
 *
 * function SomeComponent() {
 *   let navigate = useNavigate();
 *   return (
 *     <button onClick={() => navigate(-1)}>
 *       Go Back
 *     </button>
 *   );
 * }
 *
 * @additionalExamples
 * ### Navigate to another path
 *
 * ```tsx
 * navigate("/some/route");
 * navigate("/some/route?search=param");
 * ```
 *
 * ### Navigate with a {@link To} object
 *
 * All properties are optional.
 *
 * ```tsx
 * navigate({
 *   pathname: "/some/route",
 *   search: "?search=param",
 *   hash: "#hash",
 *   state: { some: "state" },
 * });
 * ```
 *
 * If you use `state`, that will be available on the {@link Location} object on
 * the next page. Access it with `useLocation().state` (see {@link useLocation}).
 *
 * ### Navigate back or forward in the history stack
 *
 * ```tsx
 * // back
 * // often used to close modals
 * navigate(-1);
 *
 * // forward
 * // often used in a multistep wizard workflows
 * navigate(1);
 * ```
 *
 * Be cautious with `navigate(number)`. If your application can load up to a
 * route that has a button that tries to navigate forward/back, there may not be
 * a `[`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * entry to go back or forward to, or it can go somewhere you don't expect
 * (like a different domain).
 *
 * Only use this if you're sure they will have an entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * stack to navigate to.
 *
 * ### Replace the current entry in the history stack
 *
 * This will remove the current entry in the [`History`](https://developer.mozilla.org/en-US/docs/Web/API/History)
 * stack, replacing it with a new one, similar to a server side redirect.
 *
 * ```tsx
 * navigate("/some/route", { replace: true });
 * ```
 *
 * ### Prevent Scroll Reset
 *
 * [MODES: framework, data]
 *
 * <br/>
 * <br/>
 *
 * To prevent {@link ScrollRestoration | `<ScrollRestoration>`} from resetting
 * the scroll position, use the `preventScrollReset` option.
 *
 * ```tsx
 * navigate("?some-tab=1", { preventScrollReset: true });
 * ```
 *
 * For example, if you have a tab interface connected to search params in the
 * middle of a page, and you don't want it to scroll to the top when a tab is
 * clicked.
 *
 * @public
 * @category Hooks
 * @returns A navigate function for programmatic navigation
 */
export function useNavigate(): NavigateFunction {
  let { isDataRoute } = React.useContext(RouteContext);
  // Conditional usage is OK here because the usage of a data router is static
  // eslint-disable-next-line react-hooks/rules-of-hooks
  return isDataRoute ? useNavigateStable() : useNavigateUnstable();
}

function useNavigateUnstable(): NavigateFunction {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useNavigate() may be used only in the context of a <Router> component.`,
  );

  let dataRouterContext = React.useContext(DataRouterContext);
  let { basename, navigator } = React.useContext(NavigationContext);
  let { matches } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();

  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));

  let activeRef = React.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });

  let navigate: NavigateFunction = React.useCallback(
    (to: To | number, options: NavigateOptions = {}) => {
      warning(activeRef.current, navigateEffectWarning);

      // Short circuit here since if this happens on first render the navigate
      // is useless because we haven't wired up our history listener yet
      if (!activeRef.current) return Promise.resolve();

      if (typeof to === "number") {
        navigator.go(to);
        return Promise.resolve();
      }

      let path = resolveTo(
        to,
        JSON.parse(routePathnamesJson),
        locationPathname,
        options.relative === "path",
      );

      // If we're operating within a basename, prepend it to the pathname prior
      // to handing off to history (but only if we're not in a data router,
      // otherwise it'll prepend the basename inside of the router).
      // If this is a root navigation, then we navigate to the raw basename
      // which allows the basename to have full control over the presence of a
      // trailing slash on root links
      if (dataRouterContext == null && basename !== "/") {
        path.pathname =
          path.pathname === "/"
            ? basename
            : joinPaths([basename, path.pathname]);
      }

      (!!options.replace ? navigator.replace : navigator.push)(
        path,
        options.state,
        options,
      );

      return Promise.resolve();
    },
    [
      basename,
      navigator,
      routePathnamesJson,
      locationPathname,
      dataRouterContext,
    ],
  );

  return navigate;
}

const OutletContext = React.createContext<unknown>(null);

/**
 * Returns the parent route {@link Outlet | `<Outlet context>`}.
 *
 * Often parent routes manage state or other values you want shared with child
 * routes. You can create your own [context provider](https://react.dev/learn/passing-data-deeply-with-context)
 * if you like, but this is such a common situation that it's built-into
 * {@link Outlet | `<Outlet>`}.
 *
 * ```tsx
 * // Parent route
 * function Parent() {
 *   const [count, setCount] = React.useState(0);
 *   return <Outlet context={[count, setCount]} />;
 * }
 * ```
 *
 * ```tsx
 * // Child route
 * import { useOutletContext } from "react-router";
 *
 * function Child() {
 *   const [count, setCount] = useOutletContext();
 *   const increment = () => setCount((c) => c + 1);
 *   return <button onClick={increment}>{count}</button>;
 * }
 * ```
 *
 * If you're using TypeScript, we recommend the parent component provide a
 * custom hook for accessing the context value. This makes it easier for
 * consumers to get nice typings, control consumers, and know who's consuming
 * the context value.
 *
 * Here's a more realistic example:
 *
 * ```tsx filename=src/routes/dashboard.tsx lines=[14,20]
 * import { useState } from "react";
 * import { Outlet, useOutletContext } from "react-router";
 *
 * import type { User } from "./types";
 *
 * type ContextType = { user: User | null };
 *
 * export default function Dashboard() {
 *   const [user, setUser] = useState<User | null>(null);
 *
 *   return (
 *     <div>
 *       <h1>Dashboard</h1>
 *       <Outlet context={{ user } satisfies ContextType} />
 *     </div>
 *   );
 * }
 *
 * export function useUser() {
 *   return useOutletContext<ContextType>();
 * }
 * ```
 *
 * ```tsx filename=src/routes/dashboard/messages.tsx lines=[1,4]
 * import { useUser } from "../dashboard";
 *
 * export default function DashboardMessages() {
 *   const { user } = useUser();
 *   return (
 *     <div>
 *       <h2>Messages</h2>
 *       <p>Hello, {user.name}!</p>
 *     </div>
 *   );
 * }
 * ```
 *
 * @public
 * @category Hooks
 * @returns The context value passed to the parent {@link Outlet} component
 */
export function useOutletContext<Context = unknown>(): Context {
  return React.useContext(OutletContext) as Context;
}

/**
 * Returns the element for the child route at this level of the route
 * hierarchy. Used internally by {@link Outlet | `<Outlet>`} to render child
 * routes.
 *
 * @public
 * @category Hooks
 * @param context The context to pass to the outlet
 * @returns The child route element or `null` if no child routes match
 */
export function useOutlet(context?: unknown): React.ReactElement | null {
  let outlet = React.useContext(RouteContext).outlet;
  if (outlet) {
    return (
      <OutletContext.Provider value={context}>{outlet}</OutletContext.Provider>
    );
  }
  return outlet;
}

/**
 * Returns an object of key/value-pairs of the dynamic params from the current
 * URL that were matched by the routes. Child routes inherit all params from
 * their parent routes.
 *
 * Assuming a route pattern like `/posts/:postId` is matched by `/posts/123`
 * then `params.postId` will be `"123"`.
 *
 * @example
 * import { useParams } from "react-router";
 *
 * function SomeComponent() {
 *   let params = useParams();
 *   params.postId;
 * }
 *
 * @additionalExamples
 * ### Basic Usage
 *
 * ```tsx
 * import { useParams } from "react-router";
 *
 * // given a route like:
 * <Route path="/posts/:postId" element={<Post />} />;
 *
 * // or a data route like:
 * createBrowserRouter([
 *   {
 *     path: "/posts/:postId",
 *     component: Post,
 *   },
 * ]);
 *
 * // or in routes.ts
 * route("/posts/:postId", "routes/post.tsx");
 * ```
 *
 * Access the params in a component:
 *
 * ```tsx
 * import { useParams } from "react-router";
 *
 * export default function Post() {
 *   let params = useParams();
 *   return <h1>Post: {params.postId}</h1>;
 * }
 * ```
 *
 * ### Multiple Params
 *
 * Patterns can have multiple params:
 *
 * ```tsx
 * "/posts/:postId/comments/:commentId";
 * ```
 *
 * All will be available in the params object:
 *
 * ```tsx
 * import { useParams } from "react-router";
 *
 * export default function Post() {
 *   let params = useParams();
 *   return (
 *     <h1>
 *       Post: {params.postId}, Comment: {params.commentId}
 *     </h1>
 *   );
 * }
 * ```
 *
 * ### Catchall Params
 *
 * Catchall params are defined with `*`:
 *
 * ```tsx
 * "/files/*";
 * ```
 *
 * The matched value will be available in the params object as follows:
 *
 * ```tsx
 * import { useParams } from "react-router";
 *
 * export default function File() {
 *   let params = useParams();
 *   let catchall = params["*"];
 *   // ...
 * }
 * ```
 *
 * You can destructure the catchall param:
 *
 * ```tsx
 * export default function File() {
 *   let { "*": catchall } = useParams();
 *   console.log(catchall);
 * }
 * ```
 *
 * @public
 * @category Hooks
 * @returns An object containing the dynamic route parameters
 */
export function useParams<
  ParamsOrKey extends string | Record<string, string | undefined> = string,
>(): Readonly<
  [ParamsOrKey] extends [string] ? Params<ParamsOrKey> : Partial<ParamsOrKey>
> {
  let { matches } = React.useContext(RouteContext);
  let routeMatch = matches[matches.length - 1];
  return routeMatch ? (routeMatch.params as any) : {};
}

/**
 * Resolves the pathname of the given `to` value against the current
 * {@link Location}. Similar to {@link useHref}, but returns a
 * {@link Path} instead of a string.
 *
 * @example
 * import { useResolvedPath } from "react-router";
 *
 * function SomeComponent() {
 *   // if the user is at /dashboard/profile
 *   let path = useResolvedPath("../accounts");
 *   path.pathname; // "/dashboard/accounts"
 *   path.search; // ""
 *   path.hash; // ""
 * }
 *
 * @public
 * @category Hooks
 * @param to The path to resolve
 * @param options Options
 * @param options.relative Defaults to `"route"` so routing is relative to the route tree.
 *                         Set to `"path"` to make relative routing operate against path segments.
 * @returns The resolved {@link Path} object with `pathname`, `search`, and `hash`
 */
export function useResolvedPath(
  to: To,
  { relative }: { relative?: RelativeRoutingType } = {},
): Path {
  let { matches } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();
  let routePathnamesJson = JSON.stringify(getResolveToMatches(matches));

  return React.useMemo(
    () =>
      resolveTo(
        to,
        JSON.parse(routePathnamesJson),
        locationPathname,
        relative === "path",
      ),
    [to, routePathnamesJson, locationPathname, relative],
  );
}

/**
 * Hook version of {@link Routes | `<Routes>`} that uses objects instead of
 * components. These objects have the same properties as the component props.
 * The return value of `useRoutes` is either a valid React element you can use
 * to render the route tree, or `null` if nothing matched.
 *
 * @example
 * import { useRoutes } from "react-router";
 *
 * function App() {
 *   let element = useRoutes([
 *     {
 *       path: "/",
 *       element: <Dashboard />,
 *       children: [
 *         {
 *           path: "messages",
 *           element: <DashboardMessages />,
 *         },
 *         { path: "tasks", element: <DashboardTasks /> },
 *       ],
 *     },
 *     { path: "team", element: <AboutPage /> },
 *   ]);
 *
 *   return element;
 * }
 *
 * @public
 * @category Hooks
 * @param routes An array of {@link RouteObject}s that define the route hierarchy
 * @param locationArg An optional {@link Location} object or pathname string to
 * use instead of the current {@link Location}
 * @returns A React element to render the matched route, or `null` if no routes matched
 */
export function useRoutes(
  routes: RouteObject[],
  locationArg?: Partial<Location> | string,
): React.ReactElement | null {
  return useRoutesImpl(routes, locationArg);
}

// Internal implementation with accept optional param for RouterProvider usage
export function useRoutesImpl(
  routes: RouteObject[],
  locationArg?: Partial<Location> | string,
  dataRouterState?: DataRouter["state"],
  future?: DataRouter["future"],
): React.ReactElement | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useRoutes() may be used only in the context of a <Router> component.`,
  );

  let { navigator } = React.useContext(NavigationContext);
  let { matches: parentMatches } = React.useContext(RouteContext);
  let routeMatch = parentMatches[parentMatches.length - 1];
  let parentParams = routeMatch ? routeMatch.params : {};
  let parentPathname = routeMatch ? routeMatch.pathname : "/";
  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
  let parentRoute = routeMatch && routeMatch.route;

  if (ENABLE_DEV_WARNINGS) {
    // You won't get a warning about 2 different <Routes> under a <Route>
    // without a trailing *, but this is a best-effort warning anyway since we
    // cannot even give the warning unless they land at the parent route.
    //
    // Example:
    //
    // <Routes>
    //   {/* This route path MUST end with /* because otherwise
    //       it will never match /blog/post/123 */}
    //   <Route path="blog" element={<Blog />} />
    //   <Route path="blog/feed" element={<BlogFeed />} />
    // </Routes>
    //
    // function Blog() {
    //   return (
    //     <Routes>
    //       <Route path="post/:id" element={<Post />} />
    //     </Routes>
    //   );
    // }
    let parentPath = (parentRoute && parentRoute.path) || "";
    warningOnce(
      parentPathname,
      !parentRoute || parentPath.endsWith("*") || parentPath.endsWith("*?"),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at ` +
        `"${parentPathname}" (under <Route path="${parentPath}">) but the ` +
        `parent route path has no trailing "*". This means if you navigate ` +
        `deeper, the parent won't match anymore and therefore the child ` +
        `routes will never render.\n\n` +
        `Please change the parent <Route path="${parentPath}"> to <Route ` +
        `path="${parentPath === "/" ? "*" : `${parentPath}/*`}">.`,
    );
  }

  let locationFromContext = useLocation();

  let location;
  if (locationArg) {
    let parsedLocationArg =
      typeof locationArg === "string" ? parsePath(locationArg) : locationArg;

    invariant(
      parentPathnameBase === "/" ||
        parsedLocationArg.pathname?.startsWith(parentPathnameBase),
      `When overriding the location using \`<Routes location>\` or \`useRoutes(routes, location)\`, ` +
        `the location pathname must begin with the portion of the URL pathname that was ` +
        `matched by all parent routes. The current pathname base is "${parentPathnameBase}" ` +
        `but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`,
    );

    location = parsedLocationArg;
  } else {
    location = locationFromContext;
  }

  let pathname = location.pathname || "/";

  let remainingPathname = pathname;
  if (parentPathnameBase !== "/") {
    // Determine the remaining pathname by removing the # of URL segments the
    // parentPathnameBase has, instead of removing based on character count.
    // This is because we can't guarantee that incoming/outgoing encodings/
    // decodings will match exactly.
    // We decode paths before matching on a per-segment basis with
    // decodeURIComponent(), but we re-encode pathnames via `new URL()` so they
    // match what `window.location.pathname` would reflect.  Those don't 100%
    // align when it comes to encoded URI characters such as % and &.
    //
    // So we may end up with:
    //   pathname:           "/descendant/a%25b/match"
    //   parentPathnameBase: "/descendant/a%b"
    //
    // And the direct substring removal approach won't work :/
    let parentSegments = parentPathnameBase.replace(/^\//, "").split("/");
    let segments = pathname.replace(/^\//, "").split("/");
    remainingPathname = "/" + segments.slice(parentSegments.length).join("/");
  }

  let matches = matchRoutes(routes, { pathname: remainingPathname });

  if (ENABLE_DEV_WARNINGS) {
    warning(
      parentRoute || matches != null,
      `No routes matched location "${location.pathname}${location.search}${location.hash}" `,
    );

    warning(
      matches == null ||
        matches[matches.length - 1].route.element !== undefined ||
        matches[matches.length - 1].route.Component !== undefined ||
        matches[matches.length - 1].route.lazy !== undefined,
      `Matched leaf route at location "${location.pathname}${location.search}${location.hash}" ` +
        `does not have an element or Component. This means it will render an <Outlet /> with a ` +
        `null value by default resulting in an "empty" page.`,
    );
  }

  let renderedMatches = _renderMatches(
    matches &&
      matches.map((match) =>
        Object.assign({}, match, {
          params: Object.assign({}, parentParams, match.params),
          pathname: joinPaths([
            parentPathnameBase,
            // Re-encode pathnames that were decoded inside matchRoutes
            navigator.encodeLocation
              ? navigator.encodeLocation(match.pathname).pathname
              : match.pathname,
          ]),
          pathnameBase:
            match.pathnameBase === "/"
              ? parentPathnameBase
              : joinPaths([
                  parentPathnameBase,
                  // Re-encode pathnames that were decoded inside matchRoutes
                  navigator.encodeLocation
                    ? navigator.encodeLocation(match.pathnameBase).pathname
                    : match.pathnameBase,
                ]),
        }),
      ),
    parentMatches,
    dataRouterState,
    future,
  );

  // When a user passes in a `locationArg`, the associated routes need to
  // be wrapped in a new `LocationContext.Provider` in order for `useLocation`
  // to use the scoped location instead of the global location.
  if (locationArg && renderedMatches) {
    return (
      <LocationContext.Provider
        value={{
          location: {
            pathname: "/",
            search: "",
            hash: "",
            state: null,
            key: "default",
            ...location,
          },
          navigationType: NavigationType.Pop,
        }}
      >
        {renderedMatches}
      </LocationContext.Provider>
    );
  }

  return renderedMatches;
}

function DefaultErrorComponent() {
  let error = useRouteError();
  let message = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : error instanceof Error
      ? error.message
      : JSON.stringify(error);
  let stack = error instanceof Error ? error.stack : null;
  let lightgrey = "rgba(200,200,200, 0.5)";
  let preStyles = { padding: "0.5rem", backgroundColor: lightgrey };
  let codeStyles = { padding: "2px 4px", backgroundColor: lightgrey };

  let devInfo = null;
  if (ENABLE_DEV_WARNINGS) {
    console.error(
      "Error handled by React Router default ErrorBoundary:",
      error,
    );

    devInfo = (
      <>
        <p>💿 Hey developer 👋</p>
        <p>
          You can provide a way better UX than this when your app throws errors
          by providing your own <code style={codeStyles}>ErrorBoundary</code> or{" "}
          <code style={codeStyles}>errorElement</code> prop on your route.
        </p>
      </>
    );
  }

  return (
    <>
      <h2>Unexpected Application Error!</h2>
      <h3 style={{ fontStyle: "italic" }}>{message}</h3>
      {stack ? <pre style={preStyles}>{stack}</pre> : null}
      {devInfo}
    </>
  );
}

const defaultErrorElement = <DefaultErrorComponent />;

type RenderErrorBoundaryProps = React.PropsWithChildren<{
  location: Location;
  revalidation: RevalidationState;
  error: any;
  component: React.ReactNode;
  routeContext: RouteContextObject;
}>;

type RenderErrorBoundaryState = {
  location: Location;
  revalidation: RevalidationState;
  error: any;
};

export class RenderErrorBoundary extends React.Component<
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState
> {
  constructor(props: RenderErrorBoundaryProps) {
    super(props);
    this.state = {
      location: props.location,
      revalidation: props.revalidation,
      error: props.error,
    };
  }

  static getDerivedStateFromError(error: any) {
    return { error: error };
  }

  static getDerivedStateFromProps(
    props: RenderErrorBoundaryProps,
    state: RenderErrorBoundaryState,
  ) {
    // When we get into an error state, the user will likely click "back" to the
    // previous page that didn't have an error. Because this wraps the entire
    // application, that will have no effect--the error page continues to display.
    // This gives us a mechanism to recover from the error when the location changes.
    //
    // Whether we're in an error state or not, we update the location in state
    // so that when we are in an error state, it gets reset when a new location
    // comes in and the user recovers from the error.
    if (
      state.location !== props.location ||
      (state.revalidation !== "idle" && props.revalidation === "idle")
    ) {
      return {
        error: props.error,
        location: props.location,
        revalidation: props.revalidation,
      };
    }

    // If we're not changing locations, preserve the location but still surface
    // any new errors that may come through. We retain the existing error, we do
    // this because the error provided from the app state may be cleared without
    // the location changing.
    return {
      error: props.error !== undefined ? props.error : state.error,
      location: state.location,
      revalidation: props.revalidation || state.revalidation,
    };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(
      "React Router caught the following error during render",
      error,
      errorInfo,
    );
  }

  render() {
    return this.state.error !== undefined ? (
      <RouteContext.Provider value={this.props.routeContext}>
        <RouteErrorContext.Provider
          value={this.state.error}
          children={this.props.component}
        />
      </RouteContext.Provider>
    ) : (
      this.props.children
    );
  }
}

interface RenderedRouteProps {
  routeContext: RouteContextObject;
  match: RouteMatch<string, RouteObject>;
  children: React.ReactNode | null;
}

function RenderedRoute({ routeContext, match, children }: RenderedRouteProps) {
  let dataRouterContext = React.useContext(DataRouterContext);

  // Track how deep we got in our render pass to emulate SSR componentDidCatch
  // in a DataStaticRouter
  if (
    dataRouterContext &&
    dataRouterContext.static &&
    dataRouterContext.staticContext &&
    (match.route.errorElement || match.route.ErrorBoundary)
  ) {
    dataRouterContext.staticContext._deepestRenderedBoundaryId = match.route.id;
  }

  return (
    <RouteContext.Provider value={routeContext}>
      {children}
    </RouteContext.Provider>
  );
}

export function _renderMatches(
  matches: RouteMatch[] | null,
  parentMatches: RouteMatch[] = [],
  dataRouterState: DataRouter["state"] | null = null,
  future: DataRouter["future"] | null = null,
): React.ReactElement | null {
  if (matches == null) {
    if (!dataRouterState) {
      return null;
    }

    if (dataRouterState.errors) {
      // Don't bail if we have data router errors so we can render them in the
      // boundary.  Use the pre-matched (or shimmed) matches
      matches = dataRouterState.matches as DataRouteMatch[];
    } else if (
      parentMatches.length === 0 &&
      !dataRouterState.initialized &&
      dataRouterState.matches.length > 0
    ) {
      // Don't bail if we're initializing with partial hydration and we have
      // router matches.  That means we're actively running `patchRoutesOnNavigation`
      // so we should render down the partial matches to the appropriate
      // `HydrateFallback`.  We only do this if `parentMatches` is empty so it
      // only impacts the root matches for `RouterProvider` and no descendant
      // `<Routes>`
      matches = dataRouterState.matches as DataRouteMatch[];
    } else {
      return null;
    }
  }

  let renderedMatches = matches;

  // If we have data errors, trim matches to the highest error boundary
  let errors = dataRouterState?.errors;
  if (errors != null) {
    let errorIndex = renderedMatches.findIndex(
      (m) => m.route.id && errors?.[m.route.id] !== undefined,
    );
    invariant(
      errorIndex >= 0,
      `Could not find a matching route for errors on route IDs: ${Object.keys(
        errors,
      ).join(",")}`,
    );
    renderedMatches = renderedMatches.slice(
      0,
      Math.min(renderedMatches.length, errorIndex + 1),
    );
  }

  // If we're in a partial hydration mode, detect if we need to render down to
  // a given HydrateFallback while we load the rest of the hydration data
  let renderFallback = false;
  let fallbackIndex = -1;
  if (dataRouterState) {
    for (let i = 0; i < renderedMatches.length; i++) {
      let match = renderedMatches[i];
      // Track the deepest fallback up until the first route without data
      if (match.route.HydrateFallback || match.route.hydrateFallbackElement) {
        fallbackIndex = i;
      }

      if (match.route.id) {
        let { loaderData, errors } = dataRouterState;
        let needsToRunLoader =
          match.route.loader &&
          !loaderData.hasOwnProperty(match.route.id) &&
          (!errors || errors[match.route.id] === undefined);
        if (match.route.lazy || needsToRunLoader) {
          // We found the first route that's not ready to render (waiting on
          // lazy, or has a loader that hasn't run yet).  Flag that we need to
          // render a fallback and render up until the appropriate fallback
          renderFallback = true;
          if (fallbackIndex >= 0) {
            renderedMatches = renderedMatches.slice(0, fallbackIndex + 1);
          } else {
            renderedMatches = [renderedMatches[0]];
          }
          break;
        }
      }
    }
  }

  return renderedMatches.reduceRight(
    (outlet, match, index) => {
      // Only data routers handle errors/fallbacks
      let error: any;
      let shouldRenderHydrateFallback = false;
      let errorElement: React.ReactNode | null = null;
      let hydrateFallbackElement: React.ReactNode | null = null;
      if (dataRouterState) {
        error = errors && match.route.id ? errors[match.route.id] : undefined;
        errorElement = match.route.errorElement || defaultErrorElement;

        if (renderFallback) {
          if (fallbackIndex < 0 && index === 0) {
            warningOnce(
              "route-fallback",
              false,
              "No `HydrateFallback` element provided to render during initial hydration",
            );
            shouldRenderHydrateFallback = true;
            hydrateFallbackElement = null;
          } else if (fallbackIndex === index) {
            shouldRenderHydrateFallback = true;
            hydrateFallbackElement = match.route.hydrateFallbackElement || null;
          }
        }
      }

      let matches = parentMatches.concat(renderedMatches.slice(0, index + 1));
      let getChildren = () => {
        let children: React.ReactNode;
        if (error) {
          children = errorElement;
        } else if (shouldRenderHydrateFallback) {
          children = hydrateFallbackElement;
        } else if (match.route.Component) {
          // Note: This is a de-optimized path since React won't re-use the
          // ReactElement since it's identity changes with each new
          // React.createElement call.  We keep this so folks can use
          // `<Route Component={...}>` in `<Routes>` but generally `Component`
          // usage is only advised in `RouterProvider` when we can convert it to
          // `element` ahead of time.
          children = <match.route.Component />;
        } else if (match.route.element) {
          children = match.route.element;
        } else {
          children = outlet;
        }

        return (
          <RenderedRoute
            match={match}
            routeContext={{
              outlet,
              matches,
              isDataRoute: dataRouterState != null,
            }}
            children={children}
          />
        );
      };
      // Only wrap in an error boundary within data router usages when we have an
      // ErrorBoundary/errorElement on this route.  Otherwise let it bubble up to
      // an ancestor ErrorBoundary/errorElement
      return dataRouterState &&
        (match.route.ErrorBoundary ||
          match.route.errorElement ||
          index === 0) ? (
        <RenderErrorBoundary
          location={dataRouterState.location}
          revalidation={dataRouterState.revalidation}
          component={errorElement}
          error={error}
          children={getChildren()}
          routeContext={{ outlet: null, matches, isDataRoute: true }}
        />
      ) : (
        getChildren()
      );
    },
    null as React.ReactElement | null,
  );
}

enum DataRouterHook {
  UseBlocker = "useBlocker",
  UseRevalidator = "useRevalidator",
  UseNavigateStable = "useNavigate",
}

enum DataRouterStateHook {
  UseBlocker = "useBlocker",
  UseLoaderData = "useLoaderData",
  UseActionData = "useActionData",
  UseRouteError = "useRouteError",
  UseNavigation = "useNavigation",
  UseRouteLoaderData = "useRouteLoaderData",
  UseMatches = "useMatches",
  UseRevalidator = "useRevalidator",
  UseNavigateStable = "useNavigate",
  UseRouteId = "useRouteId",
}

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

function useRouteContext(hookName: DataRouterStateHook) {
  let route = React.useContext(RouteContext);
  invariant(route, getDataRouterConsoleError(hookName));
  return route;
}

// Internal version with hookName-aware debugging
function useCurrentRouteId(hookName: DataRouterStateHook) {
  let route = useRouteContext(hookName);
  let thisRoute = route.matches[route.matches.length - 1];
  invariant(
    thisRoute.route.id,
    `${hookName} can only be used on routes that contain a unique "id"`,
  );
  return thisRoute.route.id;
}

/**
 * Returns the ID for the nearest contextual route
 *
 * @category Hooks
 * @returns The ID of the nearest contextual route
 */
export function useRouteId() {
  return useCurrentRouteId(DataRouterStateHook.UseRouteId);
}

/**
 * Returns the current {@link Navigation}, defaulting to an "idle" navigation
 * when no navigation is in progress. You can use this to render pending UI
 * (like a global spinner) or read [`FormData`](https://developer.mozilla.org/en-US/docs/Web/API/FormData)
 * from a form navigation.
 *
 * @example
 * import { useNavigation } from "react-router";
 *
 * function SomeComponent() {
 *   let navigation = useNavigation();
 *   navigation.state;
 *   navigation.formData;
 *   // etc.
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The current {@link Navigation} object
 */
export function useNavigation(): Navigation {
  let state = useDataRouterState(DataRouterStateHook.UseNavigation);
  return state.navigation;
}

/**
 * Revalidate the data on the page for reasons outside of normal data mutations
 * like [`Window` focus](https://developer.mozilla.org/en-US/docs/Web/API/Window/focus_event)
 * or polling on an interval.
 *
 * Note that page data is already revalidated automatically after actions.
 * If you find yourself using this for normal CRUD operations on your data in
 * response to user interactions, you're probably not taking advantage of the
 * other APIs like {@link useFetcher}, {@link Form}, {@link useSubmit} that do
 * this automatically.
 *
 * @example
 * import { useRevalidator } from "react-router";
 *
 * function WindowFocusRevalidator() {
 *   const revalidator = useRevalidator();
 *
 *   useFakeWindowFocus(() => {
 *     revalidator.revalidate();
 *   });
 *
 *   return (
 *     <div hidden={revalidator.state === "idle"}>
 *       Revalidating...
 *     </div>
 *   );
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns An object with a `revalidate` function and the current revalidation
 * `state`
 */
export function useRevalidator(): {
  revalidate: () => Promise<void>;
  state: DataRouter["state"]["revalidation"];
} {
  let dataRouterContext = useDataRouterContext(DataRouterHook.UseRevalidator);
  let state = useDataRouterState(DataRouterStateHook.UseRevalidator);
  let revalidate = React.useCallback(async () => {
    await dataRouterContext.router.revalidate();
  }, [dataRouterContext.router]);

  return React.useMemo(
    () => ({ revalidate, state: state.revalidation }),
    [revalidate, state.revalidation],
  );
}

/**
 * Returns the active route matches, useful for accessing `loaderData` for
 * parent/child routes or the route [`handle`](../../start/framework/route-module#handle)
 * property
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns An array of {@link UIMatch | UI matches} for the current route hierarchy
 */
export function useMatches(): UIMatch[] {
  let { matches, loaderData } = useDataRouterState(
    DataRouterStateHook.UseMatches,
  );
  return React.useMemo(
    () => matches.map((m) => convertRouteMatchToUiMatch(m, loaderData)),
    [matches, loaderData],
  );
}

/**
 * Returns the data from the closest route
 * [`loader`](../../start/framework/route-module#loader) or
 * [`clientLoader`](../../start/framework/route-module#clientloader).
 *
 * @example
 * import { useLoaderData } from "react-router";
 *
 * export async function loader() {
 *   return await fakeDb.invoices.findAll();
 * }
 *
 * export default function Invoices() {
 *   let invoices = useLoaderData<typeof loader>();
 *   // ...
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The data returned from the route's [`loader`](../../start/framework/route-module#loader) or [`clientLoader`](../../start/framework/route-module#clientloader) function
 */
export function useLoaderData<T = any>(): SerializeFrom<T> {
  let state = useDataRouterState(DataRouterStateHook.UseLoaderData);
  let routeId = useCurrentRouteId(DataRouterStateHook.UseLoaderData);
  return state.loaderData[routeId] as SerializeFrom<T>;
}

/**
 * Returns the [`loader`](../../start/framework/route-module#loader) data for a
 * given route by route ID.
 *
 * Route IDs are created automatically. They are simply the path of the route file
 * relative to the app folder without the extension.
 *
 * | Route Filename               | Route ID               |
 * | ---------------------------- | ---------------------- |
 * | `app/root.tsx`               | `"root"`               |
 * | `app/routes/teams.tsx`       | `"routes/teams"`       |
 * | `app/whatever/teams.$id.tsx` | `"whatever/teams.$id"` |
 *
 * @example
 * import { useRouteLoaderData } from "react-router";
 *
 * function SomeComponent() {
 *   const { user } = useRouteLoaderData("root");
 * }
 *
 * // You can also specify your own route ID's manually in your routes.ts file:
 * route("/", "containers/app.tsx", { id: "app" })
 * useRouteLoaderData("app");
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @param routeId The ID of the route to return loader data from
 * @returns The data returned from the specified route's [`loader`](../../start/framework/route-module#loader)
 * function, or `undefined` if not found
 */
export function useRouteLoaderData<T = any>(
  routeId: string,
): SerializeFrom<T> | undefined {
  let state = useDataRouterState(DataRouterStateHook.UseRouteLoaderData);
  return state.loaderData[routeId] as SerializeFrom<T> | undefined;
}

/**
 * Returns the [`action`](../../start/framework/route-module#action) data from
 * the most recent `POST` navigation form submission or `undefined` if there
 * hasn't been one.
 *
 * @example
 * import { Form, useActionData } from "react-router";
 *
 * export async function action({ request }) {
 *   const body = await request.formData();
 *   const name = body.get("visitorsName");
 *   return { message: `Hello, ${name}` };
 * }
 *
 * export default function Invoices() {
 *   const data = useActionData();
 *   return (
 *     <Form method="post">
 *       <input type="text" name="visitorsName" />
 *       {data ? data.message : "Waiting..."}
 *     </Form>
 *   );
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The data returned from the route's [`action`](../../start/framework/route-module#action)
 * function, or `undefined` if no [`action`](../../start/framework/route-module#action)
 * has been called
 */
export function useActionData<T = any>(): SerializeFrom<T> | undefined {
  let state = useDataRouterState(DataRouterStateHook.UseActionData);
  let routeId = useCurrentRouteId(DataRouterStateHook.UseLoaderData);
  return (state.actionData ? state.actionData[routeId] : undefined) as
    | SerializeFrom<T>
    | undefined;
}

/**
 * Accesses the error thrown during an
 * [`action`](../../start/framework/route-module#action),
 * [`loader`](../../start/framework/route-module#loader),
 * or component render to be used in a route module
 * [`ErrorBoundary`](../../start/framework/route-module#errorboundary).
 *
 * @example
 * export function ErrorBoundary() {
 *   const error = useRouteError();
 *   return <div>{error.message}</div>;
 * }
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The error that was thrown during route [loading](../../start/framework/route-module#loader),
 * [`action`](../../start/framework/route-module#action) execution, or rendering
 */
export function useRouteError(): unknown {
  let error = React.useContext(RouteErrorContext);
  let state = useDataRouterState(DataRouterStateHook.UseRouteError);
  let routeId = useCurrentRouteId(DataRouterStateHook.UseRouteError);

  // If this was a render error, we put it in a RouteError context inside
  // of RenderErrorBoundary
  if (error !== undefined) {
    return error;
  }

  // Otherwise look for errors from our data router state
  return state.errors?.[routeId];
}

/**
 * Returns the resolved promise value from the closest {@link Await | `<Await>`}.
 *
 * @example
 * function SomeDescendant() {
 *   const value = useAsyncValue();
 *   // ...
 * }
 *
 * // somewhere in your app
 * <Await resolve={somePromise}>
 *   <SomeDescendant />
 * </Await>;
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The resolved value from the nearest {@link Await} component
 */
export function useAsyncValue(): unknown {
  let value = React.useContext(AwaitContext);
  return value?._data;
}

/**
 * Returns the rejection value from the closest {@link Await | `<Await>`}.
 *
 * @example
 * import { Await, useAsyncError } from "react-router";
 *
 * function ErrorElement() {
 *   const error = useAsyncError();
 *   return (
 *     <p>Uh Oh, something went wrong! {error.message}</p>
 *   );
 * }
 *
 * // somewhere in your app
 * <Await
 *   resolve={promiseThatRejects}
 *   errorElement={<ErrorElement />}
 * />;
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @returns The error that was thrown in the nearest {@link Await} component
 */
export function useAsyncError(): unknown {
  let value = React.useContext(AwaitContext);
  return value?._error;
}

let blockerId = 0;

/**
 * Allow the application to block navigations within the SPA and present the
 * user a confirmation dialog to confirm the navigation. Mostly used to avoid
 * using half-filled form data. This does not handle hard-reloads or
 * cross-origin navigations.
 *
 * The {@link Blocker} object returned by the hook has the following properties:
 *
 * - **`state`**
 *   - `unblocked` - the blocker is idle and has not prevented any navigation
 *   - `blocked` - the blocker has prevented a navigation
 *   - `proceeding` - the blocker is proceeding through from a blocked navigation
 * - **`location`**
 *   - When in a `blocked` state, this represents the {@link Location} to which
 *     we blocked a navigation. When in a `proceeding` state, this is the
 *     location being navigated to after a `blocker.proceed()` call.
 * - **`proceed()`**
 *   - When in a `blocked` state, you may call `blocker.proceed()` to proceed to
 *     the blocked location.
 * - **`reset()`**
 *   - When in a `blocked` state, you may call `blocker.reset()` to return the
 *     blocker to an `unblocked` state and leave the user at the current
 *     location.
 *
 * @example
 * // Boolean version
 * let blocker = useBlocker(value !== "");
 *
 * // Function version
 * let blocker = useBlocker(
 *   ({ currentLocation, nextLocation, historyAction }) =>
 *     value !== "" &&
 *     currentLocation.pathname !== nextLocation.pathname
 * );
 *
 * @additionalExamples
 * ```tsx
 * import { useCallback, useState } from "react";
 * import { BlockerFunction, useBlocker } from "react-router";
 *
 * export function ImportantForm() {
 *   const [value, setValue] = useState("");
 *
 *   const shouldBlock = useCallback<BlockerFunction>(
 *     () => value !== "",
 *     [value]
 *   );
 *   const blocker = useBlocker(shouldBlock);
 *
 *   return (
 *     <form
 *       onSubmit={(e) => {
 *         e.preventDefault();
 *         setValue("");
 *         if (blocker.state === "blocked") {
 *           blocker.proceed();
 *         }
 *       }}
 *     >
 *       <input
 *         name="data"
 *         value={value}
 *         onChange={(e) => setValue(e.target.value)}
 *       />
 *
 *       <button type="submit">Save</button>
 *
 *       {blocker.state === "blocked" ? (
 *         <>
 *           <p style={{ color: "red" }}>
 *             Blocked the last navigation to
 *           </p>
 *           <button
 *             type="button"
 *             onClick={() => blocker.proceed()}
 *           >
 *             Let me through
 *           </button>
 *           <button
 *             type="button"
 *             onClick={() => blocker.reset()}
 *           >
 *             Keep me here
 *           </button>
 *         </>
 *       ) : blocker.state === "proceeding" ? (
 *         <p style={{ color: "orange" }}>
 *           Proceeding through blocked navigation
 *         </p>
 *       ) : (
 *         <p style={{ color: "green" }}>
 *           Blocker is currently unblocked
 *         </p>
 *       )}
 *     </form>
 *   );
 * }
 * ```
 *
 * @public
 * @category Hooks
 * @mode framework
 * @mode data
 * @param shouldBlock Either a boolean or a function returning a boolean which
 * indicates whether the navigation should be blocked. The function format
 * receives a single object parameter containing the `currentLocation`,
 * `nextLocation`, and `historyAction` of the potential navigation.
 * @returns A {@link Blocker} object with state and reset functionality
 */
export function useBlocker(shouldBlock: boolean | BlockerFunction): Blocker {
  let { router, basename } = useDataRouterContext(DataRouterHook.UseBlocker);
  let state = useDataRouterState(DataRouterStateHook.UseBlocker);

  let [blockerKey, setBlockerKey] = React.useState("");
  let blockerFunction = React.useCallback<BlockerFunction>(
    (arg) => {
      if (typeof shouldBlock !== "function") {
        return !!shouldBlock;
      }
      if (basename === "/") {
        return shouldBlock(arg);
      }

      // If they provided us a function and we've got an active basename, strip
      // it from the locations we expose to the user to match the behavior of
      // useLocation
      let { currentLocation, nextLocation, historyAction } = arg;
      return shouldBlock({
        currentLocation: {
          ...currentLocation,
          pathname:
            stripBasename(currentLocation.pathname, basename) ||
            currentLocation.pathname,
        },
        nextLocation: {
          ...nextLocation,
          pathname:
            stripBasename(nextLocation.pathname, basename) ||
            nextLocation.pathname,
        },
        historyAction,
      });
    },
    [basename, shouldBlock],
  );

  // This effect is in charge of blocker key assignment and deletion (which is
  // tightly coupled to the key)
  React.useEffect(() => {
    let key = String(++blockerId);
    setBlockerKey(key);
    return () => router.deleteBlocker(key);
  }, [router]);

  // This effect handles assigning the blockerFunction.  This is to handle
  // unstable blocker function identities, and happens only after the prior
  // effect so we don't get an orphaned blockerFunction in the router with a
  // key of "".  Until then we just have the IDLE_BLOCKER.
  React.useEffect(() => {
    if (blockerKey !== "") {
      router.getBlocker(blockerKey, blockerFunction);
    }
  }, [router, blockerKey, blockerFunction]);

  // Prefer the blocker from `state` not `router.state` since DataRouterContext
  // is memoized so this ensures we update on blocker state updates
  return blockerKey && state.blockers.has(blockerKey)
    ? state.blockers.get(blockerKey)!
    : IDLE_BLOCKER;
}

// Stable version of useNavigate that is used when we are in the context of
// a RouterProvider.
function useNavigateStable(): NavigateFunction {
  let { router } = useDataRouterContext(DataRouterHook.UseNavigateStable);
  let id = useCurrentRouteId(DataRouterStateHook.UseNavigateStable);

  let activeRef = React.useRef(false);
  useIsomorphicLayoutEffect(() => {
    activeRef.current = true;
  });

  let navigate: NavigateFunction = React.useCallback(
    async (to: To | number, options: NavigateOptions = {}) => {
      warning(activeRef.current, navigateEffectWarning);

      // Short circuit here since if this happens on first render the navigate
      // is useless because we haven't wired up our router subscriber yet
      if (!activeRef.current) return;

      if (typeof to === "number") {
        return router.navigate(to);
      } else {
        return router.navigate(to, { fromRouteId: id, ...options });
      }
    },
    [router, id],
  );

  return navigate;
}

const alreadyWarned: Record<string, boolean> = {};

function warningOnce(key: string, cond: boolean, message: string) {
  if (!cond && !alreadyWarned[key]) {
    alreadyWarned[key] = true;
    warning(false, message);
  }
}
