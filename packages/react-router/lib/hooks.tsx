import * as React from "react";
import type {
  Location,
  ParamParseKey,
  Params,
  Path,
  PathMatch,
  PathPattern,
  RouteMatch,
  RouteObject,
  Router as DataRouter,
  To,
} from "@remix-run/router";
import {
  Action as NavigationType,
  getToPathname,
  invariant,
  joinPaths,
  matchPath,
  matchRoutes,
  parsePath,
  resolveTo,
  warning,
  warningOnce,
} from "@remix-run/router";

import {
  DataRouterContext,
  DataRouterStateContext,
  LocationContext,
  NavigationContext,
  RouteContext,
  RouteExceptionContext,
} from "./context";

/**
 * Returns the full href for the given "to" value. This is useful for building
 * custom links that are also accessible and preserve right-click behavior.
 *
 * @see https://reactrouter.com/docs/en/v6/api#usehref
 */
export function useHref(to: To): string {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useHref() may be used only in the context of a <Router> component.`
  );

  let { basename, navigator } = React.useContext(NavigationContext);
  let { hash, pathname, search } = useResolvedPath(to);

  let joinedPathname = pathname;
  if (basename !== "/") {
    let toPathname = getToPathname(to);
    let endsWithSlash = toPathname != null && toPathname.endsWith("/");
    joinedPathname =
      pathname === "/"
        ? basename + (endsWithSlash ? "/" : "")
        : joinPaths([basename, pathname]);
  }

  return navigator.createHref({ pathname: joinedPathname, search, hash });
}

/**
 * Returns true if this component is a descendant of a <Router>.
 *
 * @see https://reactrouter.com/docs/en/v6/api#useinroutercontext
 */
export function useInRouterContext(): boolean {
  return React.useContext(LocationContext) != null;
}

/**
 * Returns the current location object, which represents the current URL in web
 * browsers.
 *
 * Note: If you're using this it may mean you're doing some of your own
 * "routing" in your app, and we'd like to know what your use case is. We may
 * be able to provide something higher-level to better suit your needs.
 *
 * @see https://reactrouter.com/docs/en/v6/api#uselocation
 */
export function useLocation(): Location {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useLocation() may be used only in the context of a <Router> component.`
  );

  return React.useContext(LocationContext).location;
}

/**
 * Returns the current navigation action which describes how the router came to
 * the current location, either by a pop, push, or replace on the history stack.
 *
 * @see https://reactrouter.com/docs/en/v6/api#usenavigationtype
 */
export function useNavigationType(): NavigationType {
  return React.useContext(LocationContext).navigationType;
}

/**
 * Returns true if the URL for the given "to" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 *
 * @see https://reactrouter.com/docs/en/v6/api#usematch
 */
export function useMatch<
  ParamKey extends ParamParseKey<Path>,
  Path extends string
>(pattern: PathPattern<Path> | Path): PathMatch<ParamKey> | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useMatch() may be used only in the context of a <Router> component.`
  );

  let { pathname } = useLocation();
  return React.useMemo(
    () => matchPath<ParamKey, Path>(pattern, pathname),
    [pathname, pattern]
  );
}

/**
 * The interface for the navigate() function returned from useNavigate().
 */
export interface NavigateFunction {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

/**
 * Returns an imperative method for changing the location. Used by <Link>s, but
 * may also be used by other elements to change the location.
 *
 * @see https://reactrouter.com/docs/en/v6/api#usenavigate
 */
export function useNavigate(): NavigateFunction {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useNavigate() may be used only in the context of a <Router> component.`
  );

  let { basename, navigator } = React.useContext(NavigationContext);
  let { matches } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();

  let routePathnamesJson = JSON.stringify(
    matches.map((match) => match.pathnameBase)
  );

  let activeRef = React.useRef(false);
  React.useEffect(() => {
    activeRef.current = true;
  });

  let navigate: NavigateFunction = React.useCallback(
    (to: To | number, options: NavigateOptions = {}) => {
      warning(
        activeRef.current,
        `You should call navigate() in a React.useEffect(), not when ` +
          `your component is first rendered.`
      );

      if (!activeRef.current) return;

      if (typeof to === "number") {
        navigator.go(to);
        return;
      }

      let path = resolveTo(
        to,
        JSON.parse(routePathnamesJson),
        locationPathname
      );

      if (basename !== "/") {
        path.pathname = joinPaths([basename, path.pathname]);
      }

      (!!options.replace ? navigator.replace : navigator.push)(
        path,
        options.state
      );
    },
    [basename, navigator, routePathnamesJson, locationPathname]
  );

  return navigate;
}

const OutletContext = React.createContext<unknown>(null);

/**
 * Returns the context (if provided) for the child route at this level of the route
 * hierarchy.
 * @see https://reactrouter.com/docs/en/v6/api#useoutletcontext
 */
export function useOutletContext<Context = unknown>(): Context {
  return React.useContext(OutletContext) as Context;
}

/**
 * Returns the element for the child route at this level of the route
 * hierarchy. Used internally by <Outlet> to render child routes.
 *
 * @see https://reactrouter.com/docs/en/v6/api#useoutlet
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
 * Returns an object of key/value pairs of the dynamic params from the current
 * URL that were matched by the route path.
 *
 * @see https://reactrouter.com/docs/en/v6/api#useparams
 */
export function useParams<
  ParamsOrKey extends string | Record<string, string | undefined> = string
>(): Readonly<
  [ParamsOrKey] extends [string] ? Params<ParamsOrKey> : Partial<ParamsOrKey>
> {
  let { matches } = React.useContext(RouteContext);
  let routeMatch = matches[matches.length - 1];
  return routeMatch ? (routeMatch.params as any) : {};
}

/**
 * Resolves the pathname of the given `to` value against the current location.
 *
 * @see https://reactrouter.com/docs/en/v6/api#useresolvedpath
 */
export function useResolvedPath(to: To): Path {
  let { matches } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();

  let routePathnamesJson = JSON.stringify(
    matches.map((match) => match.pathnameBase)
  );

  return React.useMemo(
    () => resolveTo(to, JSON.parse(routePathnamesJson), locationPathname),
    [to, routePathnamesJson, locationPathname]
  );
}

/**
 * Returns the element of the route that matched the current location, prepared
 * with the correct context to render the remainder of the route tree. Route
 * elements in the tree must render an <Outlet> to render their child route's
 * element.
 *
 * @see https://reactrouter.com/docs/en/v6/api#useroutes
 */
export function useRoutes(
  routes: RouteObject[],
  locationArg?: Partial<Location> | string
): React.ReactElement | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useRoutes() may be used only in the context of a <Router> component.`
  );

  let dataRouterStateContext = React.useContext(DataRouterStateContext);
  let { matches: parentMatches } = React.useContext(RouteContext);
  let routeMatch = parentMatches[parentMatches.length - 1];
  let parentParams = routeMatch ? routeMatch.params : {};
  let parentPathname = routeMatch ? routeMatch.pathname : "/";
  let parentPathnameBase = routeMatch ? routeMatch.pathnameBase : "/";
  let parentRoute = routeMatch && routeMatch.route;

  if (__DEV__) {
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
      !parentRoute || parentPath.endsWith("*"),
      `You rendered descendant <Routes> (or called \`useRoutes()\`) at ` +
        `"${parentPathname}" (under <Route path="${parentPath}">) but the ` +
        `parent route path has no trailing "*". This means if you navigate ` +
        `deeper, the parent won't match anymore and therefore the child ` +
        `routes will never render.\n\n` +
        `Please change the parent <Route path="${parentPath}"> to <Route ` +
        `path="${parentPath === "/" ? "*" : `${parentPath}/*`}">.`
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
        `but pathname "${parsedLocationArg.pathname}" was given in the \`location\` prop.`
    );

    location = parsedLocationArg;
  } else {
    location = locationFromContext;
  }

  let pathname = location.pathname || "/";
  let remainingPathname =
    parentPathnameBase === "/"
      ? pathname
      : pathname.slice(parentPathnameBase.length) || "/";
  let matches = matchRoutes(routes, { pathname: remainingPathname });

  if (__DEV__) {
    warning(
      parentRoute || matches != null,
      `No routes matched location "${location.pathname}${location.search}${location.hash}" `
    );

    warning(
      matches == null ||
        matches[matches.length - 1].route.element !== undefined,
      `Matched leaf route at location "${location.pathname}${location.search}${location.hash}" does not have an element. ` +
        `This means it will render an <Outlet /> with a null value by default resulting in an "empty" page.`
    );
  }

  return _renderMatches(
    matches &&
      matches.map((match) =>
        Object.assign({}, match, {
          params: Object.assign({}, parentParams, match.params),
          pathname: joinPaths([parentPathnameBase, match.pathname]),
          pathnameBase:
            match.pathnameBase === "/"
              ? parentPathnameBase
              : joinPaths([parentPathnameBase, match.pathnameBase]),
        })
      ),
    parentMatches,
    dataRouterStateContext
  );
}

function DefaultExceptionElement() {
  let exception = useRouteException();
  let lightgrey = "rgba(200,200,200, 0.5)";
  let preStyles = { padding: "0.5rem", backgroundColor: lightgrey };
  let codeStyles = { padding: "2px 4px", backgroundColor: lightgrey };
  return (
    <>
      <h2>Unhandled Thrown Exception!</h2>
      <p style={{ fontStyle: "italic" }}>{exception?.message || exception}</p>
      {exception?.stack ? (
        <pre style={preStyles}>{exception?.stack}</pre>
      ) : null}
      <p>💿 Hey developer 👋</p>
      <p>
        You can provide a way better UX than this when your app throws errors by
        providing your own&nbsp;
        <code style={codeStyles}>exceptionElement</code> props on&nbsp;
        <code style={codeStyles}>&lt;Route&gt;</code>
      </p>
    </>
  );
}

type RenderErrorBoundaryProps = React.PropsWithChildren<{
  exception: any;
  component: React.ReactNode;
}>;

type RenderErrorBoundaryState = {
  exception: any;
};

export class RenderErrorBoundary extends React.Component<
  RenderErrorBoundaryProps,
  RenderErrorBoundaryState
> {
  constructor(props: RenderErrorBoundaryProps) {
    super(props);
    this.state = { exception: props.exception || null };
  }

  static getDerivedStateFromError(error: any) {
    return { exception: error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error(
      "React Router caught the following error during render",
      error,
      errorInfo
    );
  }

  render() {
    return this.state.exception ? (
      <RouteExceptionContext.Provider
        value={this.state.exception}
        children={this.props.component}
      />
    ) : (
      this.props.children
    );
  }
}

export function _renderMatches(
  matches: RouteMatch[] | null,
  parentMatches: RouteMatch[] = [],
  dataRouterState?: DataRouter["state"] | null
): React.ReactElement | null {
  if (matches == null) return null;

  let renderedMatches = matches;

  // If we have data exceptions, trim matches to the highest exception boundary
  let exceptions = dataRouterState?.exceptions;
  if (exceptions != null) {
    let exceptionIndex = renderedMatches.findIndex(
      (m) => m.route.id && exceptions?.[m.route.id]
    );
    invariant(
      exceptionIndex >= 0,
      `Could not find a matching route for the current exceptions: ${exceptions}`
    );
    renderedMatches = renderedMatches.slice(
      0,
      Math.min(renderedMatches.length, exceptionIndex + 1)
    );
  }

  //TODO: add <RouteRenderErrorBoundary element={exceptionElement || DefaultExceptionElement} />
  // to handle render exceptions.  Make sure it gets the right useRouteException()
  // based on where it lives in the hierarchy
  return renderedMatches.reduceRight((outlet, match, index) => {
    let exception = match.route.id ? exceptions?.[match.route.id] : null;
    // Only data routers handle exceptions
    let exceptionElement = dataRouterState
      ? match.route.exceptionElement || <DefaultExceptionElement />
      : null;
    let getChildren = () => (
      <RouteContext.Provider
        children={
          exception
            ? exceptionElement
            : match.route.element !== undefined
            ? match.route.element
            : outlet
        }
        value={{
          outlet,
          matches: parentMatches.concat(renderedMatches.slice(0, index + 1)),
        }}
      />
    );

    // Only wrap in an error boundary within data router usages when we have an
    // exceptionElement on this route.  Otherwise let it bubble up to an ancestor
    // exceptionElement
    return dataRouterState && (match.route.exceptionElement || index === 0) ? (
      <RenderErrorBoundary
        component={exceptionElement}
        exception={exception}
        children={getChildren()}
      />
    ) : (
      getChildren()
    );
  }, null as React.ReactElement | null);
}

type DataRouterHook =
  | "useLoaderData"
  | "useActionData"
  | "useRouteException"
  | "useNavigation"
  | "useRouteLoaderData"
  | "useMatches"
  | "useRevalidator";

function useDataRouterState(hookName: DataRouterHook) {
  let state = React.useContext(DataRouterStateContext);
  invariant(state, `${hookName} must be rendered within a DataRouter`);
  return state;
}

export function useNavigation() {
  let state = useDataRouterState("useNavigation");
  return state.transition;
}

export function useRevalidator() {
  let router = React.useContext(DataRouterContext);
  invariant(router, `useRevalidator must be rendered within a DataRouter`);
  let state = useDataRouterState("useRevalidator");
  return { revalidate: router.revalidate, state: state.revalidation };
}

export function useMatches() {
  let { matches, loaderData } = useDataRouterState("useMatches");
  return React.useMemo(
    () =>
      matches.map((match) => {
        let { pathname, params } = match;
        return {
          id: match.route.id,
          pathname,
          params,
          data: loaderData[match.route.id],
        };
      }),
    [matches, loaderData]
  );
}

export function useLoaderData() {
  let state = useDataRouterState("useLoaderData");

  let route = React.useContext(RouteContext);
  invariant(route, `useLoaderData must be used inside a RouteContext`);

  let thisRoute = route.matches[route.matches.length - 1];
  invariant(
    thisRoute.route.id,
    `${useLoaderData} can only be used on routes that contain a unique "id"`
  );

  return state.loaderData?.[thisRoute.route.id];
}

export function useRouteLoaderData(routeId: string): any {
  let state = useDataRouterState("useRouteLoaderData");
  return state.loaderData?.[routeId];
}

export function useActionData() {
  let state = useDataRouterState("useRouteException");

  let route = React.useContext(RouteContext);
  invariant(route, `useRouteException must be used inside a RouteContext`);

  return Object.values(state?.actionData || {})[0];
}

export function useRouteException() {
  let exception = React.useContext(RouteExceptionContext);
  let state = useDataRouterState("useRouteException");
  let route = React.useContext(RouteContext);
  let thisRoute = route.matches[route.matches.length - 1];

  // If this was a render error, we put it in a RouteException context inside
  // of RenderErrorBoundary
  if (exception) {
    return exception;
  }

  invariant(route, `useRouteException must be used inside a RouteContext`);
  invariant(
    thisRoute.route.id,
    `useRouteException can only be used on routes that contain a unique "id"`
  );

  // Otherwise look for exceptions from our data router state
  return state.exceptions?.[thisRoute.route.id];
}
