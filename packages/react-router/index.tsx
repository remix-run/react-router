import * as React from 'react';
import PropTypes from 'prop-types';
import {
  // types
  Action,
  Path,
  State,
  LocationPieces,
  Location,
  Update,
  Transition,
  Blocker,
  To,
  History,
  MemoryHistory,
  InitialEntry,
  // utils
  createMemoryHistory,
  parsePath
} from 'history';

const readOnly: (obj: any) => any = __DEV__
  ? obj => Object.freeze(obj)
  : obj => obj;

function invariant(cond: boolean, message: string): void {
  if (!cond) throw new Error(message);
}

function warning(cond: boolean, message: string): void {
  if (!cond) {
    // eslint-disable-next-line no-console
    if (typeof console !== 'undefined') console.warn(message);

    try {
      throw new Error(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
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
  'action' | 'location' | 'back' | 'forward' | 'listen'
>;

const LocationContext = React.createContext<LocationContextObject>({
  pending: false,
  static: false
});

interface LocationContextObject {
  action?: Action;
  location?: Location;
  navigator?: Navigator;
  pending: boolean;
  static: boolean;
}

if (__DEV__) {
  LocationContext.displayName = 'Location';
}

const RouteContext = React.createContext<RouteContextObject>({
  outlet: null,
  params: readOnly({}),
  pathname: '',
  route: null
});

interface RouteContextObject {
  outlet: React.ReactElement | null;
  params: Params;
  pathname: string;
  route: RouteObject | null;
}

if (__DEV__) {
  RouteContext.displayName = 'Route';
}

///////////////////////////////////////////////////////////////////////////////
// COMPONENTS
///////////////////////////////////////////////////////////////////////////////

/**
 * A <Router> that stores all entries in memory.
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
  let [state, dispatch] = React.useReducer(
    (_: Update, action: Update) => action,
    {
      action: history.action,
      location: history.location
    }
  );

  React.useLayoutEffect(() => history.listen(dispatch), [history]);

  return (
    <Router
      children={children}
      action={state.action}
      location={state.location}
      navigator={history}
    />
  );
}

export interface MemoryRouterProps {
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
}

if (__DEV__) {
  MemoryRouter.displayName = 'MemoryRouter';
  MemoryRouter.propTypes = {
    children: PropTypes.node,
    timeout: PropTypes.number,
    initialEntries: PropTypes.arrayOf(
      PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          pathname: PropTypes.string,
          search: PropTypes.string,
          hash: PropTypes.string,
          state: PropTypes.object,
          key: PropTypes.string
        })
      ])
    ),
    initialIndex: PropTypes.number
  };
}

/**
 * Navigate programmatically using a component.
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

export interface NavigateProps {
  to: To;
  replace?: boolean;
  state?: State;
}

if (__DEV__) {
  Navigate.displayName = 'Navigate';
  Navigate.propTypes = {
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string
      })
    ]).isRequired,
    replace: PropTypes.bool,
    state: PropTypes.object
  };
}

/**
 * Renders the child route's element, if there is one.
 */
export function Outlet(): React.ReactElement | null {
  return useOutlet();
}

export interface OutletProps {}

if (__DEV__) {
  Outlet.displayName = 'Outlet';
  Outlet.propTypes = {};
}

/**
 * Used in a route config to render an element.
 */
export function Route({
  element = <Outlet />
}: RouteProps): React.ReactElement | null {
  return element;
}

export interface RouteProps {
  children?: React.ReactNode;
  element?: React.ReactElement | null;
  path?: string;
}

if (__DEV__) {
  Route.displayName = 'Route';
  Route.propTypes = {
    children: PropTypes.node,
    element: PropTypes.element,
    path: PropTypes.string
  };
}

/**
 * The low-level root context provider in a React Router app. You usually won't
 * render a <Router> directly. Instead, you'll render a router that is more
 * specific to your environment such as a <BrowserRouter> in web browsers or a
 * <StaticRouter> for server rendering.
 */
export function Router({
  children = null,
  action = Action.Pop,
  location,
  navigator,
  pending = false,
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
      value={{ action, location, navigator, pending, static: staticProp }}
    />
  );
}

export interface RouterProps {
  children?: React.ReactNode;
  action?: Action;
  location: Location;
  navigator: Navigator;
  pending?: boolean;
  static?: boolean;
}

if (__DEV__) {
  Router.displayName = 'Router';
  Router.propTypes = {
    children: PropTypes.node,
    action: PropTypes.oneOf(['POP', 'PUSH', 'REPLACE']),
    location: PropTypes.object.isRequired,
    navigator: PropTypes.shape({
      createHref: PropTypes.func.isRequired,
      push: PropTypes.func.isRequired,
      replace: PropTypes.func.isRequired,
      go: PropTypes.func.isRequired,
      block: PropTypes.func.isRequired
    }).isRequired,
    pending: PropTypes.bool,
    static: PropTypes.bool
  };
}

/**
 * A container for a nested tree of <Route> elements that renders the branch
 * that best matches the current location.
 */
export function Routes({
  basename = '',
  children
}: RoutesProps): React.ReactElement | null {
  let routes = createRoutesFromChildren(children);
  return useRoutes_(routes, basename);
}

export interface RoutesProps {
  basename?: string;
  children?: React.ReactNode;
}

if (__DEV__) {
  Routes.displayName = 'Routes';
  Routes.propTypes = {
    basename: PropTypes.string,
    caseSensitive: PropTypes.bool,
    children: PropTypes.node
  };
}

///////////////////////////////////////////////////////////////////////////////
// HOOKS
///////////////////////////////////////////////////////////////////////////////

/**
 * Blocks all navigation attempts. This is useful for preventing the page from
 * changing until some condition is met, like saving form data.
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
 */
export function useHref(to: To): string {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useHref() may be used only in the context of a <Router> component.`
  );

  let navigator = React.useContext(LocationContext).navigator as Navigator;
  let resolvedLocation = useResolvedLocation(to);

  return navigator.createHref(resolvedLocation);
}

/**
 * Returns true if this component is a descendant of a <Router>.
 */
export function useInRouterContext(): boolean {
  return React.useContext(LocationContext).location != null;
}

/**
 * Returns the current location object, which represents the current URL in web
 * browsers.
 *
 * NOTE: If you're using this it may mean you're doing some of your own
 * "routing" in your app, and we'd like to know what your use case is. We may be
 * able to provide something higher-level to better suit your needs.
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
 * Returns true if the router is pending a location update.
 */
export function useLocationPending(): boolean {
  return React.useContext(LocationContext).pending;
}

/**
 * Returns true if the URL for the given "to" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 */
export function useMatch(path: PathPattern): PathMatch | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useMatch() may be used only in the context of a <Router> component.`
  );

  let location = useLocation() as Location;
  return matchPath(path, location.pathname);
}

type PathPattern =
  | string
  | { path: string; caseSensitive?: boolean; end?: boolean };

/**
 * The interface for the navigate() function returned from useNavigate().
 */
export interface NavigateFunction {
  (delta: number): void;
  (to: To, options?: { replace?: boolean; state?: State }): void;
}

/**
 * Returns an imperative method for changing the location. Used by <Link>s, but
 * may also be used by other elements to change the location.
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
  let pending = locationContext.pending;
  let { pathname } = React.useContext(RouteContext);

  let activeRef = React.useRef(false);
  React.useEffect(() => {
    activeRef.current = true;
  });

  let navigate: NavigateFunction = React.useCallback(
    (to: To | number, options: { replace?: boolean; state?: State } = {}) => {
      if (activeRef.current) {
        if (typeof to === 'number') {
          navigator.go(to);
        } else {
          let relativeTo = resolveLocation(to, pathname);
          // If we are pending transition, use REPLACE instead of PUSH. This
          // will prevent URLs that we started navigating to but never fully
          // loaded from appearing in the history stack.
          (!!options.replace || pending ? navigator.replace : navigator.push)(
            relativeTo,
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
    [navigator, pathname, pending]
  );

  return navigate;
}

/**
 * Returns the outlet element at this level of the route hierarchy. Used to
 * render child routes.
 */
export function useOutlet(): React.ReactElement | null {
  return React.useContext(RouteContext).outlet;
}

/**
 * Returns a hash of the dynamic params that were matched in the route path.
 * This is useful for using ids embedded in the URL to fetch data, but we
 * eventually want to provide something at a higher level for this.
 */
export function useParams(): Params {
  return React.useContext(RouteContext).params;
}

/**
 * Returns a fully-resolved location object relative to the current location.
 */
export function useResolvedLocation(to: To): ResolvedLocation {
  let { pathname } = React.useContext(RouteContext);
  return React.useMemo(() => resolveLocation(to, pathname), [to, pathname]);
}

/**
 * Returns the element of the route that matched the current location, prepared
 * with the correct context to render the remainder of the route tree. Route
 * elements in the tree must render an <Outlet> to render their child route's
 * element.
 */
export function useRoutes(
  partialRoutes: PartialRouteObject[],
  basename: string = ''
): React.ReactElement | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useRoutes() may be used only in the context of a <Router> component.`
  );

  let routes = React.useMemo(() => createRoutesFromArray(partialRoutes), [
    partialRoutes
  ]);

  return useRoutes_(routes, basename);
}

let missingTrailingSplatWarnings: { [key: string]: boolean } = {};
function warnAboutMissingTrailingSplatAt(
  pathname: string,
  cond: boolean,
  message: string
) {
  if (!cond && !missingTrailingSplatWarnings[pathname]) {
    missingTrailingSplatWarnings![pathname] = true;
    warning(false, message);
  }
}

function useRoutes_(
  routes: RouteObject[],
  basename = ''
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
    warnAboutMissingTrailingSplatAt(
      parentPathname,
      !parentRoute || parentRoute.path.endsWith('*'),
      `You rendered descendant <Routes> (or called \`useRoutes\`) at "${parentPathname}"` +
        ` (under <Route path="${parentPath}">) but the parent route path has no trailing "*".` +
        ` This means if you navigate deeper, the parent won't match anymore and therefore` +
        ` the child routes will never render.` +
        `\n\n` +
        `Please change the parent <Route path="${parentPath}"> to <Route path="${parentPath}/*">.`
    );
  }

  basename = basename ? joinPaths([parentPathname, basename]) : parentPathname;

  let location = useLocation() as Location;
  let matches = React.useMemo(() => matchRoutes(routes, location, basename), [
    location,
    routes,
    basename
  ]);

  if (!matches) {
    // TODO: Warn about nothing matching, suggest using a catch-all route.
    return null;
  }

  // TODO: Initiate preload sequence here.

  // Otherwise render an element.
  let element = matches.reduceRight((outlet, { params, pathname, route }) => {
    return (
      <RouteContext.Provider
        children={route.element}
        value={{
          outlet,
          params: readOnly({ ...parentParams, ...params }),
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
 * Utility function that creates a routes config object from an array of
 * PartialRouteObject objects.
 */
export function createRoutesFromArray(
  array: PartialRouteObject[]
): RouteObject[] {
  return array.map(partialRoute => {
    let route: RouteObject = {
      caseSensitive: partialRoute.caseSensitive === true,
      element: partialRoute.element || <Outlet />,
      path: partialRoute.path || '/'
    };

    if (partialRoute.children) {
      route.children = createRoutesFromArray(partialRoute.children);
    }

    return route;
  });
}

/**
 * Utility function that creates a routes config object from a React "children"
 * object, which is usually either a <Route> element or an array of them.
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
      caseSensitive: element.props.caseSensitive === true,
      // Default behavior is to just render the element that was given. This
      // permits people to use any element they prefer, not just <Route> (though
      // all our official examples and docs use <Route> for clarity).
      element,
      path: element.props.path || '/'
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
 * A "partial route" object is usually supplied by the user and may omit certain
 * properties of a real route object such as `path` and `element`, which have
 * reasonable defaults.
 */
export interface PartialRouteObject {
  caseSensitive?: boolean;
  children?: PartialRouteObject[];
  element?: React.ReactNode;
  path?: string;
}

/**
 * A route object represents a logical route, with (optionally) its child routes
 * organized in a tree-like structure.
 */
export interface RouteObject {
  caseSensitive: boolean;
  children?: RouteObject[];
  element: React.ReactNode;
  path: string;
}

/**
 * Creates a path with params interpolated.
 */
export function generatePath(pathname: string, params: Params = {}): string {
  return pathname
    .replace(/:(\w+)/g, (_, key) => {
      invariant(params[key] != null, `Missing ":${key}" param`);
      return params[key];
    })
    .replace(/\/*\*$/, _ =>
      params['*'] == null ? '' : params['*'].replace(/^\/*/, '/')
    );
}

/**
 * The parameters that were parsed from the URL path.
 */
export type Params = Record<string, string>;

/**
 * Matches the given routes to a location and returns the match data.
 */
export function matchRoutes(
  routes: RouteObject[],
  location: Path | LocationPieces,
  basename = ''
): RouteMatch[] | null {
  if (typeof location === 'string') {
    location = parsePath(location);
  }

  let pathname = location.pathname || '/';
  if (basename) {
    let base = basename.replace(/^\/*/, '/').replace(/\/+$/, '');
    if (pathname.startsWith(base)) {
      pathname = pathname === base ? '/' : pathname.slice(base.length);
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
  parentPath = '',
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
  let pathScores = branches.reduce((memo, [path]) => {
    memo[path] = computeScore(path);
    return memo;
  }, {} as { [key: string]: number });

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
const isSplat = (s: string) => s === '*';

function computeScore(path: string): number {
  let segments = path.split('/');
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
          : segment === ''
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
  let matchedPathname = '/';
  let matchedParams: Params = {};

  let matches: RouteMatch[] = [];
  for (let i = 0; i < routes.length; ++i) {
    let route = routes[i];
    let remainingPathname =
      matchedPathname === '/'
        ? pathname
        : pathname.slice(matchedPathname.length) || '/';
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
      params: readOnly(matchedParams)
    });
  }

  return matches;
}

/**
 * Performs pattern matching on a URL pathname and returns information about the
 * match.
 */
export function matchPath(
  pattern: PathPattern,
  pathname: string
): PathMatch | null {
  if (typeof pattern === 'string') {
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
    '^(' +
    path
      .replace(/^\/*/, '/') // Make sure it has a leading /
      .replace(/\/?\*?$/, '') // Ignore trailing / and /*, we'll handle it below
      .replace(/[\\.*+^$?{}|()[\]]/g, '\\$&') // Escape special regex chars
      .replace(/:(\w+)/g, (_: string, key: string) => {
        keys.push(key);
        return '([^\\/]+)';
      }) +
    ')';

  if (path.endsWith('*')) {
    if (path.endsWith('/*')) {
      source += '\\/?'; // Don't include the / in params['*']
    }
    keys.push('*');
    source += '(.*)';
  } else if (end) {
    source += '\\/?';
  }

  if (end) source += '$';

  let flags = caseSensitive ? undefined : 'i';
  let matcher = new RegExp(source, flags);

  return [matcher, keys];
}

function safelyDecodeURIComponent(value: string, paramName: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
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
 * Returns a fully resolved location object relative to the given pathname.
 */
export function resolveLocation(
  to: To,
  fromPathname: string = '/'
): ResolvedLocation {
  let { pathname: toPathname, search = '', hash = '' } =
    typeof to === 'string' ? parsePath(to) : to;

  let pathname = toPathname
    ? resolvePathname(
        toPathname,
        toPathname.startsWith('/') ? '/' : fromPathname
      )
    : fromPathname;

  return { pathname, search, hash };
}

export type ResolvedLocation = Omit<Location, 'state' | 'key'>;

const trimTrailingSlashes = (path: string) => path.replace(/\/+$/, '');
const normalizeSlashes = (path: string) => path.replace(/\/\/+/g, '/');
const joinPaths = (paths: string[]) => normalizeSlashes(paths.join('/'));
const splitPath = (path: string) => normalizeSlashes(path).split('/');

function resolvePathname(toPathname: string, fromPathname: string): string {
  let segments = splitPath(trimTrailingSlashes(fromPathname));
  let relativeSegments = splitPath(toPathname);

  relativeSegments.forEach(segment => {
    if (segment === '..') {
      // Keep the root "" segment so the pathname starts at /
      if (segments.length > 1) segments.pop();
    } else if (segment !== '.') {
      segments.push(segment);
    }
  });

  return segments.length > 1 ? joinPaths(segments) : '/';
}
