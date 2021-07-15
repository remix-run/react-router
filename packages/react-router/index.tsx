import * as React from "react";
import {
  Action,
  Blocker,
  History,
  InitialEntry,
  Location,
  MemoryHistory,
  PartialLocation,
  Path,
  State,
  To,
  Transition,
  createMemoryHistory,
  parsePath
} from "history";

const readOnly: <T extends unknown>(obj: T) => T = __DEV__
  ? obj => Object.freeze(obj)
  : obj => obj;

function invariant(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

function warning(cond: boolean, message: string): void {
  if (!cond) {
    // eslint-disable-next-line no-console
    if (typeof console !== "undefined") console.warn(message);

    try {
      // Welcome to debugging React Router!
      //
      // This error is thrown as a convenience so you can more easily
      // find the source for a warning that appears in the console by
      // enabling "pause on exceptions" in your JavaScript debugger.
      throw new Error(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

const alreadyWarned: Record<string, boolean> = {};
function warningOnce(key: string, cond: boolean, message: string) {
  if (!cond && !alreadyWarned[key]) {
    alreadyWarned[key] = true;
    warning(false, message);
  }
}

///////////////////////////////////////////////////////////////////////////////
// CONTEXT
///////////////////////////////////////////////////////////////////////////////

/**
 * A Navigator is a "location changer"; it's how you get to different locations.
 *
 * Every history instance conforms to the Navigator interface, but the
 * distinction is useful primarily when it comes to the low-level <Router> API
 * where both the location and a navigator must be provided separately in order
 * to avoid "tearing" that may occur in a suspense-enabled app if the action
 * and/or location were to be read directly from the history instance.
 */
export type Navigator = Omit<
  History,
  "action" | "location" | "back" | "forward" | "listen"
>;

const LocationContext = React.createContext<LocationContextObject>({
  static: false
});

interface LocationContextObject {
  action?: Action;
  location?: Location;
  navigator?: Navigator;
  static: boolean;
}

if (__DEV__) {
  LocationContext.displayName = "Location";
}

const RouteContext = React.createContext<RouteContextObject>({
  outlet: null,
  params: readOnly<Params>({}),
  pathname: "",
  route: null
});

interface RouteContextObject {
  outlet: React.ReactElement | null;
  params: Params;
  pathname: string;
  route: RouteObject | null;
}

if (__DEV__) {
  RouteContext.displayName = "Route";
}

///////////////////////////////////////////////////////////////////////////////
// COMPONENTS
///////////////////////////////////////////////////////////////////////////////

export interface MemoryRouterProps {
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
}

/**
 * A <Router> that stores all entries in memory.
 *
 * @see https://reactrouter.com/api/MemoryRouter
 */
export function MemoryRouter({
  children,
  initialEntries,
  initialIndex
}: MemoryRouterProps): React.ReactElement {
  let historyRef = React.useRef<MemoryHistory>();
  if (historyRef.current == null) {
    historyRef.current = createMemoryHistory({ initialEntries, initialIndex });
  }

  let history = historyRef.current;
  let [state, setState] = React.useState({
    action: history.action,
    location: history.location
  });

  React.useLayoutEffect(() => history.listen(setState), [history]);

  return (
    <Router
      children={children}
      action={state.action}
      location={state.location}
      navigator={history}
    />
  );
}

export interface NavigateProps {
  to: To;
  replace?: boolean;
  state?: State;
}

/**
 * Changes the current location.
 *
 * Note: This API is mostly useful in React.Component subclasses that are not
 * able to use hooks. In functional components, we recommend you use the
 * `useNavigate` hook instead.
 *
 * @see https://reactrouter.com/api/Navigate
 */
export function Navigate({ to, replace, state }: NavigateProps): null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of
    // the router loaded. We can help them understand how to avoid that.
    `<Navigate> may be used only in the context of a <Router> component.`
  );

  warning(
    !React.useContext(LocationContext).static,
    `<Navigate> must not be used on the initial render in a <StaticRouter>. ` +
      `This is a no-op, but you should modify your code so the <Navigate> is ` +
      `only ever rendered in response to some user interaction or state change.`
  );

  let navigate = useNavigate();
  React.useEffect(() => {
    navigate(to, { replace, state });
  });

  return null;
}

export interface OutletProps {}

/**
 * Renders the child route's element, if there is one.
 *
 * @see https://reactrouter.com/api/Outlet
 */
export function Outlet(_props: OutletProps): React.ReactElement | null {
  return useOutlet();
}

export interface RouteProps {
  caseSensitive?: boolean;
  children?: React.ReactNode;
  element?: React.ReactElement | null;
  path?: string;
}

/**
 * Declares an element that should be rendered at a certain URL path.
 *
 * @see https://reactrouter.com/api/Route
 */
export function Route({
  element = <Outlet />
}: RouteProps): React.ReactElement | null {
  return element;
}

export interface RouterProps {
  action?: Action;
  children?: React.ReactNode;
  location: Location;
  navigator: Navigator;
  static?: boolean;
}

/**
 * Provides location context for the rest of the app.
 *
 * Note: You usually won't render a <Router> directly. Instead, you'll render a
 * router that is more specific to your environment such as a <BrowserRouter>
 * in web browsers or a <StaticRouter> for server rendering.
 *
 * @see https://reactrouter.com/api/Router
 */
export function Router({
  children = null,
  action = Action.Pop,
  location,
  navigator,
  static: staticProp = false
}: RouterProps): React.ReactElement {
  invariant(
    !useInRouterContext(),
    `You cannot render a <Router> inside another <Router>.` +
      ` You never need more than one.`
  );

  return (
    <LocationContext.Provider
      children={children}
      value={{ action, location, navigator, static: staticProp }}
    />
  );
}

export interface RoutesProps {
  basename?: string;
  children?: React.ReactNode;
}

/**
 * A container for a nested tree of <Route> elements that renders the branch
 * that best matches the current location.
 *
 * @see https://reactrouter.com/api/Routes
 */
export function Routes({
  basename = "",
  children
}: RoutesProps): React.ReactElement | null {
  let routes = createRoutesFromChildren(children);
  return useRoutes_(routes, basename);
}

///////////////////////////////////////////////////////////////////////////////
// HOOKS
///////////////////////////////////////////////////////////////////////////////

/**
 * Blocks all navigation attempts. This is useful for preventing the page from
 * changing until some condition is met, like saving form data.
 *
 * @see https://reactrouter.com/api/useBlocker
 */
export function useBlocker(blocker: Blocker, when = true): void {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useBlocker() may be used only in the context of a <Router> component.`
  );

  let navigator = React.useContext(LocationContext).navigator as Navigator;

  React.useEffect(() => {
    if (!when) return;

    let unblock = navigator.block((tx: Transition) => {
      let autoUnblockingTx = {
        ...tx,
        retry() {
          // Automatically unblock the transition so it can play all the way
          // through before retrying it. TODO: Figure out how to re-enable
          // this block if the transition is cancelled for some reason.
          unblock();
          tx.retry();
        }
      };

      blocker(autoUnblockingTx);
    });

    return unblock;
  }, [navigator, blocker, when]);
}

/**
 * Returns the full href for the given "to" value. This is useful for building
 * custom links that are also accessible and preserve right-click behavior.
 *
 * @see https://reactrouter.com/api/useHref
 */
export function useHref(to: To): string {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useHref() may be used only in the context of a <Router> component.`
  );

  let navigator = React.useContext(LocationContext).navigator as Navigator;
  let path = useResolvedPath(to);

  return navigator.createHref(path);
}

/**
 * Returns true if this component is a descendant of a <Router>.
 *
 * @see https://reactrouter.com/api/useInRouterContext
 */
export function useInRouterContext(): boolean {
  return React.useContext(LocationContext).location != null;
}

/**
 * Returns the current location object, which represents the current URL in web
 * browsers.
 *
 * Note: If you're using this it may mean you're doing some of your own
 * "routing" in your app, and we'd like to know what your use case is. We may
 * be able to provide something higher-level to better suit your needs.
 *
 * @see https://reactrouter.com/api/useLocation
 */
export function useLocation(): Location {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useLocation() may be used only in the context of a <Router> component.`
  );

  return React.useContext(LocationContext).location as Location;
}

/**
 * Returns true if the URL for the given "to" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 *
 * @see https://reactrouter.com/api/useMatch
 */
export function useMatch(pattern: PathPattern): PathMatch | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useMatch() may be used only in the context of a <Router> component.`
  );

  let location = useLocation() as Location;
  return matchPath(pattern, location.pathname);
}

type PathPattern =
  | string
  | { path: string; caseSensitive?: boolean; end?: boolean };

/**
 * The interface for the navigate() function returned from useNavigate().
 */
export interface NavigateFunction {
  (to: To, options?: NavigateOptions): void;
  (delta: number): void;
}

export interface NavigateOptions {
  replace?: boolean;
  state?: State;
}

/**
 * Returns an imperative method for changing the location. Used by <Link>s, but
 * may also be used by other elements to change the location.
 *
 * @see https://reactrouter.com/api/useNavigate
 */
export function useNavigate(): NavigateFunction {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useNavigate() may be used only in the context of a <Router> component.`
  );

  let locationContext = React.useContext(LocationContext);
  let navigator = locationContext.navigator as Navigator;
  let { pathname } = React.useContext(RouteContext);

  let activeRef = React.useRef(false);
  React.useEffect(() => {
    activeRef.current = true;
  });

  let navigate: NavigateFunction = React.useCallback(
    (to: To | number, options: { replace?: boolean; state?: State } = {}) => {
      if (activeRef.current) {
        if (typeof to === "number") {
          navigator.go(to);
        } else {
          let path = resolvePath(to, pathname);
          (!!options.replace ? navigator.replace : navigator.push)(
            path,
            options.state
          );
        }
      } else {
        warning(
          false,
          `You should call navigate() in a useEffect, not when ` +
            `your component is first rendered.`
        );
      }
    },
    [navigator, pathname]
  );

  return navigate;
}

/**
 * Returns the element for the child route at this level of the route
 * hierarchy. Used internally by <Outlet> to render child routes.
 *
 * @see https://reactrouter.com/api/useOutlet
 */
export function useOutlet(): React.ReactElement | null {
  return React.useContext(RouteContext).outlet;
}

/**
 * Returns an object of key/value pairs of the dynamic params from the current
 * URL that were matched by the route path.
 *
 * @see https://reactrouter.com/api/useParams
 */
export function useParams(): Params {
  return React.useContext(RouteContext).params;
}

/**
 * Resolves the pathname of the given `to` value against the current location.
 *
 * @see https://reactrouter.com/api/useResolvedPath
 */
export function useResolvedPath(to: To): Path {
  let { pathname } = React.useContext(RouteContext);
  return React.useMemo(() => resolvePath(to, pathname), [to, pathname]);
}

/**
 * Returns the element of the route that matched the current location, prepared
 * with the correct context to render the remainder of the route tree. Route
 * elements in the tree must render an <Outlet> to render their child route's
 * element.
 *
 * @see https://reactrouter.com/api/useRoutes
 */
export function useRoutes(
  partialRoutes: PartialRouteObject[],
  basename = ""
): React.ReactElement | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useRoutes() may be used only in the context of a <Router> component.`
  );

  let routes = React.useMemo(
    () => createRoutesFromArray(partialRoutes),
    [partialRoutes]
  );

  return useRoutes_(routes, basename);
}

function useRoutes_(
  routes: RouteObject[],
  basename = ""
): React.ReactElement | null {
  let {
    route: parentRoute,
    pathname: parentPathname,
    params: parentParams
  } = React.useContext(RouteContext);

  if (__DEV__) {
    // You won't get a warning about 2 different <Routes> under a <Route>
    // without a trailing *, but this is a best-effort warning anyway since we
    // cannot even give the warning unless they land at the parent route.
    let parentPath = parentRoute && parentRoute.path;
    warningOnce(
      parentPathname,
      !parentRoute || parentRoute.path.endsWith("*"),
      `You rendered descendant <Routes> (or called \`useRoutes\`) at ` +
        `"${parentPathname}" (under <Route path="${parentPath}">) but the ` +
        `parent route path has no trailing "*". This means if you navigate ` +
        `deeper, the parent won't match anymore and therefore the child ` +
        `routes will never render.\n\n` +
        `Please change the parent <Route path="${parentPath}"> to <Route ` +
        `path="${parentPath}/*">.`
    );
  }

  basename = basename ? joinPaths([parentPathname, basename]) : parentPathname;

  let location = useLocation() as Location;
  let matches = React.useMemo(
    () => matchRoutes(routes, location, basename),
    [location, routes, basename]
  );

  if (!matches) {
    // TODO: Warn about nothing matching, suggest using a catch-all route.
    return null;
  }

  // Otherwise render an element.
  let element = matches.reduceRight((outlet, { params, pathname, route }) => {
    return (
      <RouteContext.Provider
        children={route.element}
        value={{
          outlet,
          params: readOnly<Params>({ ...parentParams, ...params }),
          pathname: joinPaths([basename, pathname]),
          route
        }}
      />
    );
  }, null as React.ReactElement | null);

  return element;
}

///////////////////////////////////////////////////////////////////////////////
// UTILS
///////////////////////////////////////////////////////////////////////////////

/**
 * Creates a route config from an array of JavaScript objects. Used internally
 * by `useRoutes` to normalize the route config.
 *
 * @see https://reactrouter.com/api/createRoutesFromArray
 */
export function createRoutesFromArray(
  array: PartialRouteObject[]
): RouteObject[] {
  return array.map(partialRoute => {
    let route: RouteObject = {
      path: partialRoute.path || "/",
      caseSensitive: partialRoute.caseSensitive === true,
      element: partialRoute.element || <Outlet />
    };

    if (partialRoute.children) {
      route.children = createRoutesFromArray(partialRoute.children);
    }

    return route;
  });
}

/**
 * Creates a route config from a React "children" object, which is usually
 * either a `<Route>` element or an array of them. Used internally by
 * `<Routes>` to create a route config from its children.
 *
 * @see https://reactrouter.com/api/createRoutesFromChildren
 */
export function createRoutesFromChildren(
  children: React.ReactNode
): RouteObject[] {
  let routes: RouteObject[] = [];

  React.Children.forEach(children, element => {
    if (!React.isValidElement(element)) {
      // Ignore non-elements. This allows people to more easily inline
      // conditionals in their route config.
      return;
    }

    if (element.type === React.Fragment) {
      // Transparently support React.Fragment and its children.
      routes.push.apply(
        routes,
        createRoutesFromChildren(element.props.children)
      );
      return;
    }

    let route: RouteObject = {
      path: element.props.path || "/",
      caseSensitive: element.props.caseSensitive === true,
      // Default behavior is to just render the element that was given. This
      // permits people to use any element they prefer, not just <Route> (though
      // all our official examples and docs use <Route> for clarity).
      element
    };

    if (element.props.children) {
      let childRoutes = createRoutesFromChildren(element.props.children);
      if (childRoutes.length) {
        route.children = childRoutes;
      }
    }

    routes.push(route);
  });

  return routes;
}

/**
 * The parameters that were parsed from the URL path.
 */
export type Params = Record<string, string>;

/**
 * A route object represents a logical route, with (optionally) its child
 * routes organized in a tree-like structure.
 */
export interface RouteObject {
  caseSensitive: boolean;
  children?: RouteObject[];
  element: React.ReactNode;
  path: string;
}

/**
 * A "partial route" object is usually supplied by the user and may omit
 * certain properties of a real route object such as `path` and `element`,
 * which have reasonable defaults.
 */
export interface PartialRouteObject {
  caseSensitive?: boolean;
  children?: PartialRouteObject[];
  element?: React.ReactNode;
  path?: string;
}

/**
 * Returns a path with params interpolated.
 *
 * @see https://reactrouter.com/api/generatePath
 */
export function generatePath(path: string, params: Params = {}): string {
  return path
    .replace(/:(\w+)/g, (_, key) => {
      invariant(params[key] != null, `Missing ":${key}" param`);
      return params[key];
    })
    .replace(/\/*\*$/, _ =>
      params["*"] == null ? "" : params["*"].replace(/^\/*/, "/")
    );
}

/**
 * Matches the given routes to a location and returns the match data.
 *
 * @see https://reactrouter.com/api/matchRoutes
 */
export function matchRoutes(
  routes: RouteObject[],
  location: string | PartialLocation,
  basename = ""
): RouteMatch[] | null {
  if (typeof location === "string") {
    location = parsePath(location);
  }

  let pathname = location.pathname || "/";
  if (basename) {
    let base = basename.replace(/^\/*/, "/").replace(/\/+$/, "");
    if (pathname.startsWith(base)) {
      pathname = pathname === base ? "/" : pathname.slice(base.length);
    } else {
      // Pathname does not start with the basename, no match.
      return null;
    }
  }

  let branches = flattenRoutes(routes);
  rankRouteBranches(branches);

  let matches = null;
  for (let i = 0; matches == null && i < branches.length; ++i) {
    // TODO: Match on search, state too?
    matches = matchRouteBranch(branches[i], pathname);
  }

  return matches;
}

export interface RouteMatch {
  route: RouteObject;
  pathname: string;
  params: Params;
}

function flattenRoutes(
  routes: RouteObject[],
  branches: RouteBranch[] = [],
  parentPath = "",
  parentRoutes: RouteObject[] = [],
  parentIndexes: number[] = []
): RouteBranch[] {
  routes.forEach((route, index) => {
    let path = joinPaths([parentPath, route.path]);
    let routes = parentRoutes.concat(route);
    let indexes = parentIndexes.concat(index);

    // Add the children before adding this route to the array so we traverse the
    // route tree depth-first and child routes appear before their parents in
    // the "flattened" version.
    if (route.children) {
      flattenRoutes(route.children, branches, path, routes, indexes);
    }

    branches.push([path, routes, indexes]);
  });

  return branches;
}

type RouteBranch = [string, RouteObject[], number[]];

function rankRouteBranches(branches: RouteBranch[]): void {
  let pathScores = branches.reduce<Record<string, number>>((memo, [path]) => {
    memo[path] = computeScore(path);
    return memo;
  }, {});

  // Sorting is stable in modern browsers, but we still support IE 11, so we
  // need this little helper.
  stableSort(branches, (a, b) => {
    let [aPath, , aIndexes] = a;
    let aScore = pathScores[aPath];

    let [bPath, , bIndexes] = b;
    let bScore = pathScores[bPath];

    return aScore !== bScore
      ? bScore - aScore // Higher score first
      : compareIndexes(aIndexes, bIndexes);
  });
}

const paramRe = /^:\w+$/;
const dynamicSegmentValue = 2;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = (s: string) => s === "*";

function computeScore(path: string): number {
  let segments = path.split("/");
  let initialScore = segments.length;
  if (segments.some(isSplat)) {
    initialScore += splatPenalty;
  }

  return segments
    .filter(s => !isSplat(s))
    .reduce(
      (score, segment) =>
        score +
        (paramRe.test(segment)
          ? dynamicSegmentValue
          : segment === ""
          ? emptySegmentValue
          : staticSegmentValue),
      initialScore
    );
}

function compareIndexes(a: number[], b: number[]): number {
  let siblings =
    a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);

  return siblings
    ? // If two routes are siblings, we should try to match the earlier sibling
      // first. This allows people to have fine-grained control over the matching
      // behavior by simply putting routes with identical paths in the order they
      // want them tried.
      a[a.length - 1] - b[b.length - 1]
    : // Otherwise, it doesn't really make sense to rank non-siblings by index,
      // so they sort equally.
      0;
}

function stableSort(array: any[], compareItems: (a: any, b: any) => number) {
  // This copy lets us get the original index of an item so we can preserve the
  // original ordering in the case that they sort equally.
  let copy = array.slice(0);
  array.sort((a, b) => compareItems(a, b) || copy.indexOf(a) - copy.indexOf(b));
}

function matchRouteBranch(
  branch: RouteBranch,
  pathname: string
): RouteMatch[] | null {
  let routes = branch[1];
  let matchedPathname = "/";
  let matchedParams: Params = {};

  let matches: RouteMatch[] = [];
  for (let i = 0; i < routes.length; ++i) {
    let route = routes[i];
    let remainingPathname =
      matchedPathname === "/"
        ? pathname
        : pathname.slice(matchedPathname.length) || "/";
    let routeMatch = matchPath(
      {
        path: route.path,
        caseSensitive: route.caseSensitive,
        end: i === routes.length - 1
      },
      remainingPathname
    );

    if (!routeMatch) return null;

    matchedPathname = joinPaths([matchedPathname, routeMatch.pathname]);
    matchedParams = { ...matchedParams, ...routeMatch.params };

    matches.push({
      route,
      pathname: matchedPathname,
      params: readOnly<Params>(matchedParams)
    });
  }

  return matches;
}

/**
 * Performs pattern matching on a URL pathname and returns information about
 * the match.
 *
 * @see https://reactrouter.com/api/matchPath
 */
export function matchPath(
  pattern: PathPattern,
  pathname: string
): PathMatch | null {
  if (typeof pattern === "string") {
    pattern = { path: pattern };
  }

  let { path, caseSensitive = false, end = true } = pattern;
  let [matcher, paramNames] = compilePath(path, caseSensitive, end);
  let match = pathname.match(matcher);

  if (!match) return null;

  let matchedPathname = match[1];
  let values = match.slice(2);
  let params = paramNames.reduce((memo, paramName, index) => {
    memo[paramName] = safelyDecodeURIComponent(values[index], paramName);
    return memo;
  }, {} as Params);

  return { path, pathname: matchedPathname, params };
}

export interface PathMatch {
  path: string;
  pathname: string;
  params: Params;
}

function compilePath(
  path: string,
  caseSensitive: boolean,
  end: boolean
): [RegExp, string[]] {
  let keys: string[] = [];
  let source =
    "^(" +
    path
      .replace(/^\/*/, "/") // Make sure it has a leading /
      .replace(/\/?\*?$/, "") // Ignore trailing / and /*, we'll handle it below
      .replace(/[\\.*+^$?{}|()[\]]/g, "\\$&") // Escape special regex chars
      .replace(/:(\w+)/g, (_: string, key: string) => {
        keys.push(key);
        return "([^\\/]+)";
      }) +
    ")";

  if (path.endsWith("*")) {
    if (path.endsWith("/*")) {
      source += "\\/?"; // Don't include the / in params['*']
    }
    keys.push("*");
    source += "(.*)";
  } else if (end) {
    source += "\\/?";
  }

  if (end) source += "$";

  let flags = caseSensitive ? undefined : "i";
  let matcher = new RegExp(source, flags);

  return [matcher, keys];
}

function safelyDecodeURIComponent(value: string, paramName: string) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    warning(
      false,
      `The value for the URL param "${paramName}" will not be decoded because` +
        ` the string "${value}" is a malformed URL segment. This is probably` +
        ` due to a bad percent encoding (${error}).`
    );

    return value;
  }
}

/**
 * Returns a resolved path object relative to the given pathname.
 *
 * @see https://reactrouter.com/api/resolvePath
 */
export function resolvePath(to: To, fromPathname = "/"): Path {
  let {
    pathname: toPathname,
    search = "",
    hash = ""
  } = typeof to === "string" ? parsePath(to) : to;

  let pathname = toPathname
    ? resolvePathname(
        toPathname,
        toPathname.startsWith("/") ? "/" : fromPathname
      )
    : fromPathname;

  return { pathname, search, hash };
}

const trimTrailingSlashes = (path: string) => path.replace(/\/+$/, "");
const normalizeSlashes = (path: string) => path.replace(/\/\/+/g, "/");
const joinPaths = (paths: string[]) => normalizeSlashes(paths.join("/"));
const splitPath = (path: string) => normalizeSlashes(path).split("/");

function resolvePathname(toPathname: string, fromPathname: string): string {
  let segments = splitPath(trimTrailingSlashes(fromPathname));
  let relativeSegments = splitPath(toPathname);

  relativeSegments.forEach(segment => {
    if (segment === "..") {
      // Keep the root "" segment so the pathname starts at /
      if (segments.length > 1) segments.pop();
    } else if (segment !== ".") {
      segments.push(segment);
    }
  });

  return segments.length > 1 ? joinPaths(segments) : "/";
}
