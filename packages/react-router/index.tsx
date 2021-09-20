import * as React from "react";
import { Action, createMemoryHistory, parsePath } from "history";
import type {
  Blocker,
  History,
  InitialEntry,
  Location,
  MemoryHistory,
  Path,
  State,
  To,
  Transition
} from "history";

type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

function invariant(cond: any, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

function warning(cond: any, message: string): void {
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

const NavigatorContext = React.createContext<Navigator>(null!);

const LocationContext = React.createContext<LocationContextObject>({
  static: false
});

interface LocationContextObject {
  action?: Action;
  location?: Location;
  static: boolean;
}

if (__DEV__) {
  LocationContext.displayName = "Location";
}

const RouteContext = React.createContext<RouteContextObject>({
  outlet: null,
  params: {},
  pathname: "",
  basename: "",
  route: null
});

interface RouteContextObject<ParamKey extends string = string> {
  outlet: React.ReactElement | null;
  params: Readonly<Params<ParamKey>>;
  pathname: string;
  basename: string; // TODO: this shouldn't need to live in route context. it should live higher up in a <Routes> context
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
  index?: boolean;
  path?: string;
}

/**
 * Declares an element that should be rendered at a certain URL path.
 *
 * @see https://reactrouter.com/api/Route
 */
export function Route(_props: RouteProps): React.ReactElement | null {
  invariant(
    false,
    `A <Route> is only ever to be used as the child of <Routes> element, ` +
      `never rendered directly. Please wrap your <Route> in a <Routes>.`
  );
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
    <NavigatorContext.Provider value={navigator}>
      <LocationContext.Provider
        children={children}
        value={{ action, location, static: staticProp }}
      />
    </NavigatorContext.Provider>
  );
}

interface PartialLocation<S extends State = State>
  extends Omit<Partial<Location<S>>, "pathname"> {
  pathname: string;
}

export interface RoutesProps {
  basename?: string;
  children?: React.ReactNode;
  location?: PartialLocation;
}

/**
 * A container for a nested tree of <Route> elements that renders the branch
 * that best matches the current location.
 *
 * @see https://reactrouter.com/api/Routes
 */
export function Routes({
  basename = "",
  children,
  location
}: RoutesProps): React.ReactElement | null {
  return useRoutes(createRoutesFromChildren(children), { location, basename });
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

  let navigator = React.useContext(NavigatorContext);

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

  let navigator = React.useContext(NavigatorContext);

  return navigator.createHref(useResolvedPath(to));
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
export function useMatch<ParamKey extends string = string>(
  pattern: PathPattern | string
): PathMatch<ParamKey> | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useMatch() may be used only in the context of a <Router> component.`
  );

  return matchPath<ParamKey>(pattern, useLocation().pathname);
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

  let navigator = React.useContext(NavigatorContext);
  let { basename, pathname: routePathname } = React.useContext(RouteContext);
  let { pathname: locationPathname } = useLocation();

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
          let toPathname =
            // Empty strings should be treated the same as / paths
            to === "" || (to as Path).pathname === ""
              ? "/"
              : typeof to === "string"
              ? parsePath(to).pathname
              : to.pathname;

          let path = resolvePath(
            to,
            // If a pathname is explicitly provided in `to`, it should be
            // relative to the route context. This is explained in `Note on
            // `<Link to>` values` in our migration guide from v5 as a means of
            // disambiguation between `to` values that begin with `/` and those
            // that do not. However, this is problematic for `to` values that do
            // not provide a pathname. `to` can simply be a search or hash
            // string, in which case we should assume that the navigation is
            // relative to the current location's pathname and *not* the
            // route pathname.
            toPathname ? routePathname : locationPathname,
            basename
          );

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
    [basename, navigator, routePathname, locationPathname]
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
export function useParams<Key extends string = string>(): Readonly<
  Params<Key>
> {
  return React.useContext(RouteContext).params;
}

/**
 * Resolves the pathname of the given `to` value against the current location.
 *
 * @see https://reactrouter.com/api/useResolvedPath
 */
export function useResolvedPath(to: To): Path {
  let { basename, pathname: fromPathname } = React.useContext(RouteContext);
  return React.useMemo(
    () => resolvePath(to, fromPathname, basename),
    [to, fromPathname, basename]
  );
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
  routes: RouteObject[],
  {
    basename = "",
    location: locationArg
  }: {
    basename?: string;
    location?: PartialLocation;
  } = {}
): React.ReactElement | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useRoutes() may be used only in the context of a <Router> component.`
  );

  let {
    route: parentRoute,
    pathname: parentPathname,
    params: parentParams
  } = React.useContext(RouteContext);

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
        `path="${parentPath}/*">.`
    );
  }

  let locationFromContext = useLocation();
  let location = locationArg ?? locationFromContext;

  let basenameForMatching = basename
    ? joinPaths([parentPathname, basename])
    : parentPathname;

  let matches = React.useMemo(
    () => matchRoutes(routes, location, basenameForMatching),
    [routes, location, basenameForMatching]
  );

  if (!matches) {
    // TODO: Warn about nothing matching, suggest using a catch-all route.
    return null;
  }

  // Otherwise render an element.
  let params: Params = Object.assign({}, parentParams);
  let element = matches.reduceRight((outlet, match) => {
    Object.assign(params, match.params);

    return (
      <RouteContext.Provider
        children={match.route.element || <Outlet />}
        value={{
          outlet,
          params: params,
          pathname: joinPaths([basenameForMatching, match.pathname]),
          basename,
          route: match.route
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
      path: element.props.path,
      caseSensitive: element.props.caseSensitive,
      index: element.props.index,
      element: element.props.element
    };

    if (element.props.children) {
      route.children = createRoutesFromChildren(element.props.children);
    }

    routes.push(route);
  });

  return routes;
}

/**
 * The parameters that were parsed from the URL path.
 */
export type Params<Key extends string = string> = {
  readonly [key in Key]: string | undefined;
};

/**
 * A route object represents a logical route, with (optionally) its child
 * routes organized in a tree-like structure.
 */
export interface RouteObject {
  caseSensitive?: boolean;
  children?: RouteObject[];
  element?: React.ReactNode;
  index?: boolean;
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
      return params[key]!;
    })
    .replace(/\/*\*$/, _ =>
      params["*"] == null ? "" : params["*"].replace(/^\/*/, "/")
    );
}

/**
 * A RouteMatch contains info about how a route matched a URL.
 */
export interface RouteMatch<ParamKey extends string = string> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>;
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string;
  /**
   * The route object that was used to match.
   */
  route: RouteObject;
}

/**
 * Matches the given routes to a location and returns the match data.
 *
 * @see https://reactrouter.com/api/matchRoutes
 */
export function matchRoutes(
  routes: RouteObject[],
  location: Partial<Location> | string,
  basename = ""
): RouteMatch[] | null {
  if (typeof location === "string") {
    location = parsePath(location);
  }

  let pathname = location.pathname || "/";
  if (basename) {
    let base = basename.replace(/^\/*/, "/").replace(/\/+$/, "");

    // Basename should be case-insensitive
    // https://github.com/remix-run/react-router/issues/7997#issuecomment-911916907
    if (!pathname.toLowerCase().startsWith(base.toLowerCase())) {
      return null;
    }

    pathname = pathname.slice(base.length) || "/";
  }

  let branches = flattenRoutes(routes);
  rankRouteBranches(branches);

  let matches = null;
  for (let i = 0; matches == null && i < branches.length; ++i) {
    matches = matchRouteBranch(branches[i], pathname, routes);
  }

  return matches;
}

interface RouteMeta {
  relativePath: string;
  caseSensitive: boolean;
  childrenIndex: number;
}

interface RouteBranch {
  path: string;
  score: number;
  routesMeta: RouteMeta[];
}

function flattenRoutes(
  routes: RouteObject[],
  branches: RouteBranch[] = [],
  parentsMeta: RouteMeta[] = [],
  parentPath = ""
): RouteBranch[] {
  routes.forEach((route, index) => {
    let meta: RouteMeta = {
      relativePath: route.path || "",
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index
    };

    if (meta.relativePath.startsWith("/")) {
      invariant(
        meta.relativePath.startsWith(parentPath),
        `Absolute route path "${meta.relativePath}" nested under path ` +
          `"${parentPath}" is not valid. An absolute child route path ` +
          `must start with the combined path of all its parent routes.`
      );

      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }

    let path = joinPaths([parentPath, meta.relativePath]);
    let routesMeta = parentsMeta.concat(meta);

    // Add the children before adding this route to the array so we traverse the
    // route tree depth-first and child routes appear before their parents in
    // the "flattened" version.
    if (route.children && route.children.length > 0) {
      invariant(
        route.index !== true,
        `Index routes must not have child routes. Please remove ` +
          `all child routes from route path "${path}".`
      );

      flattenRoutes(route.children, branches, routesMeta, path);
    }

    branches.push({ path, score: computeScore(path), routesMeta });
  });

  return branches;
}

function rankRouteBranches(branches: RouteBranch[]): void {
  branches.sort((a, b) =>
    a.score !== b.score
      ? b.score - a.score // Higher score first
      : compareIndexes(
          a.routesMeta.map(meta => meta.childrenIndex),
          b.routesMeta.map(meta => meta.childrenIndex)
        )
  );
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

function matchRouteBranch<ParamKey extends string = string>(
  branch: RouteBranch,
  pathname: string,
  originalRoutes: RouteObject[]
): RouteMatch<ParamKey>[] | null {
  let matchedPathname = "/";
  let matchedParams = {} as Params<ParamKey>;

  let { routesMeta } = branch;
  let routes = originalRoutes;

  let matches: RouteMatch[] = [];
  for (let i = 0; i < routesMeta.length; ++i) {
    let meta = routesMeta[i];
    let remainingPathname =
      matchedPathname === "/"
        ? pathname
        : pathname.slice(matchedPathname.length) || "/";
    let match = matchPath(
      {
        path: meta.relativePath,
        caseSensitive: meta.caseSensitive,
        end: i === routesMeta.length - 1
      },
      remainingPathname
    );

    if (!match) return null;

    matchedParams = { ...matchedParams, ...match.params };
    matchedPathname = joinPaths([matchedPathname, match.pathname]);

    let route = routes[meta.childrenIndex];

    matches.push({
      params: matchedParams,
      pathname: matchedPathname,
      route
    });

    routes = route.children!;
  }

  return matches;
}

/**
 * A PathPattern is used to match on some portion of a URL pathname.
 */
export interface PathPattern {
  /**
   * A string to match against a URL pathname. May contain `:id`-style segments
   * to indicate placeholders for dynamic parameters. May also end with `/*` to
   * indicate matching the rest of the URL pathname.
   */
  path: string;
  /**
   * Should be `true` if the static portions of the `path` should be matched in
   * the same case.
   */
  caseSensitive?: boolean;
  /**
   * Should be `true` if this pattern should match the entire URL pathname.
   */
  end?: boolean;
}

/**
 * A PathMatch contains info about how a PathPattern matched on a URL pathname.
 */
export interface PathMatch<ParamKey extends string = string> {
  /**
   * The names and values of dynamic parameters in the URL.
   */
  params: Params<ParamKey>;
  /**
   * The portion of the URL pathname that was matched.
   */
  pathname: string;
  /**
   * The pattern that was used to match.
   */
  pattern: PathPattern;
}

/**
 * Performs pattern matching on a URL pathname and returns information about
 * the match.
 *
 * @see https://reactrouter.com/api/matchPath
 */
export function matchPath<ParamKey extends string = string>(
  pattern: PathPattern | string,
  pathname: string
): PathMatch<ParamKey> | null {
  if (typeof pattern === "string") {
    pattern = { path: pattern, caseSensitive: false, end: true };
  }

  let [matcher, paramNames] = compilePath(
    pattern.path,
    pattern.caseSensitive,
    pattern.end
  );
  let match = pathname.match(matcher);

  if (!match) return null;

  let matchedPathname = match[1];
  let values = match.slice(2);
  let params: Params = paramNames.reduce<Mutable<Params>>(
    (memo, paramName, index) => {
      memo[paramName] = safelyDecodeURIComponent(
        values[index] || "",
        paramName
      );
      return memo;
    },
    {}
  );

  return { params, pathname: matchedPathname, pattern };
}

function compilePath(
  path: string,
  caseSensitive = false,
  end = true
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
      source += "(?:\\/(.+)|\\/?)"; // Don't include the / in params['*']
    } else {
      source += "(.*)";
    }
    keys.push("*");
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
export function resolvePath(to: To, fromPathname = "/", basename = ""): Path {
  let {
    pathname: toPathname,
    search = "",
    hash = ""
  } = typeof to === "string" ? parsePath(to) : to;

  let pathname = toPathname
    ? resolvePathname(
        toPathname,
        toPathname.startsWith("/")
          ? basename
            ? normalizeSlashes(`/${basename}`)
            : "/"
          : fromPathname
      )
    : fromPathname;

  return {
    pathname,
    search: normalizeSearch(search),
    hash: normalizeHash(hash)
  };
}

const trimTrailingSlashes = (path: string) => path.replace(/\/+$/, "");
const normalizeSlashes = (path: string) => path.replace(/\/\/+/g, "/");
const joinPaths = (paths: string[]) => normalizeSlashes(paths.join("/"));
const splitPath = (path: string) => normalizeSlashes(path).split("/");
const normalizeSearch = (search: string) =>
  !search || search === "?"
    ? ""
    : search.startsWith("?")
    ? search
    : "?" + search;
const normalizeHash = (hash: string) =>
  !hash || hash === "#" ? "" : hash.startsWith("#") ? hash : "#" + hash;

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

///////////////////////////////////////////////////////////////////////////////
// DANGER! PLEASE READ ME!
// We provide these exports as an escape hatch in the event that you need any
// routing data that we don't provide an explicit API for. With that said, we
// want to cover your use case if we can, so if you feel the need to use these
// we want to hear from you. Let us know what you're building and we'll do our
// best to make sure we can support you!
//
// We consider these exports an implementation detail and do not guarantee
// against any breaking changes, regardless of the semver release. Use with
// extreme caution and only if you understand the consequences. Godspeed.
///////////////////////////////////////////////////////////////////////////////

/** @internal */
export {
  NavigatorContext as UNSAFE_NavigatorContext,
  LocationContext as UNSAFE_LocationContext,
  RouteContext as UNSAFE_RouteContext
};
