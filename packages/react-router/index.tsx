import * as React from 'react';
import PropTypes from 'prop-types';
import {
  // types
  Path,
  State,
  PathPieces,
  Location,
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

const LocationContext = React.createContext<LocationContextObject>({
  history: null,
  location: null,
  pending: false,
  static: false
});

interface LocationContextObject {
  history: History | null;
  location: Location | null;
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
  initialIndex,
  timeout
}: MemoryRouterProps): React.ReactElement {
  let historyRef = React.useRef<MemoryHistory>(null);

  if (historyRef.current == null) {
    (historyRef as React.MutableRefObject<
      MemoryHistory
    >).current = createMemoryHistory({ initialEntries, initialIndex });
  }

  return (
    <Router
      children={children}
      history={historyRef.current as MemoryHistory}
      timeout={timeout}
    />
  );
}

export interface MemoryRouterProps {
  children?: React.ReactNode;
  initialEntries?: InitialEntry[];
  initialIndex?: number;
  timeout?: number;
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

  let locationContext = React.useContext(LocationContext);

  warning(
    !locationContext.static,
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

// TODO: Remove once React.useTransition is stable.
const startTransition = (tx: Function) => tx();
// @ts-ignore
const useTransition = React.useTransition || (() => [startTransition, false]);

/**
 * The root context provider. There should be only one of these in a given app.
 */
export function Router({
  children = null,
  history,
  static: staticProp = false,
  timeout = 2000
}: RouterProps): React.ReactElement {
  invariant(
    !useInRouterContext(),
    `You cannot render a <Router> inside another <Router>.` +
      ` You never need more than one.`
  );

  let [location, setLocation] = React.useState(history.location);
  let [startTransition, pending] = useTransition({ timeoutMs: timeout });
  let shouldListenRef = React.useRef(!staticProp);

  if (shouldListenRef.current) {
    shouldListenRef.current = false;
    history.listen(({ location }) => {
      startTransition(() => {
        setLocation(location);
      });
    });
  }

  return (
    <LocationContext.Provider
      children={children}
      value={{ history, location, pending, static: staticProp }}
    />
  );
}

export interface RouterProps {
  children?: React.ReactNode;
  history: History;
  static?: boolean;
  timeout?: number;
}

if (__DEV__) {
  Router.displayName = 'Router';
  Router.propTypes = {
    children: PropTypes.node,
    history: PropTypes.shape({
      action: PropTypes.string,
      location: PropTypes.object,
      push: PropTypes.func,
      replace: PropTypes.func,
      go: PropTypes.func,
      listen: PropTypes.func,
      block: PropTypes.func
    }),
    timeout: PropTypes.number
  };
}

/**
 * A wrapper for useRoutes that treats its children as route and/or redirect
 * objects.
 */
export function Routes({
  basename = '',
  caseSensitive = false,
  children
}: RoutesProps): React.ReactElement | null {
  let routes = createRoutesFromChildren(children);
  return useRoutes(routes, basename, caseSensitive);
}

export interface RoutesProps {
  basename?: string;
  caseSensitive?: boolean;
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
export function useBlocker(blocker: Blocker, when: boolean = true): void {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useBlocker() may be used only in the context of a <Router> component.`
  );

  let history = React.useContext(LocationContext).history as History;

  React.useEffect(() => {
    if (!when) return;

    let unblock = history.block((tx: Transition) => {
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
  }, [history, when, blocker]);
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

  let history = React.useContext(LocationContext).history as History;
  let resolvedLocation = useResolvedLocation(to);

  return history.createHref(resolvedLocation);
}

/**
 * Returns true if this component is a descendant of a <Router>.
 */
export function useInRouterContext(): boolean {
  let locationContext = React.useContext(LocationContext);
  return locationContext.location != null;
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
export function useMatch(to: To): boolean {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useMatch() may be used only in the context of a <Router> component.`
  );

  let location = useLocation() as Location;
  let resolvedLocation = useResolvedLocation(to);

  // TODO: Try to match search + hash as well
  return location.pathname === resolvedLocation.pathname;
}

/**
 * The interface for the navigate() function returned from useNavigate().
 */
export interface NavigateFunction {
  (
    to: To | number,
    options?: { replace?: boolean; state?: State | null }
  ): void;
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
  let history = locationContext.history as History;
  let pending = locationContext.pending;
  let { pathname } = React.useContext(RouteContext);

  let activeRef = React.useRef(false);
  React.useEffect(() => {
    activeRef.current = true;
  });

  let navigate: NavigateFunction = React.useCallback(
    (
      to: To | number,
      opts: { replace?: boolean; state?: State | null } = {}
    ) => {
      if (activeRef.current) {
        if (typeof to === 'number') {
          history.go(to);
        } else {
          let relativeTo = resolveLocation(to, pathname);
          // If we are pending transition, use REPLACE instead of PUSH. This
          // will prevent URLs that we started navigating to but never fully
          // loaded from appearing in the history stack.
          (!!opts.replace || pending ? history.replace : history.push)(
            relativeTo,
            opts.state
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
    [history, pathname, pending]
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

let missingTrailingSplatWarnings: { [key: string]: boolean } | undefined;
let warnAboutMissingTrailingSplatAt: (
  pathname: string,
  cond: boolean,
  message: string
) => void | undefined;
if (__DEV__) {
  missingTrailingSplatWarnings = {};
  warnAboutMissingTrailingSplatAt = (
    pathname: string,
    cond: boolean,
    message: string
  ) => {
    if (!cond && !missingTrailingSplatWarnings![pathname]) {
      missingTrailingSplatWarnings![pathname] = true;
      warning(false, message);
    }
  };
}

/**
 * Returns the element of the route that matched the current location, prepared
 * with the correct context to render the remainder of the route tree. Route
 * elements in the tree must render an <Outlet> to render their child route's
 * element.
 */
export function useRoutes(
  routes: PartialRouteObject[],
  basename: string = '',
  caseSensitive: boolean = false
): React.ReactElement | null {
  invariant(
    useInRouterContext(),
    // TODO: This error is probably because they somehow have 2 versions of the
    // router loaded. We can help them understand how to avoid that.
    `useRoutes() may be used only in the context of a <Router> component.`
  );

  let {
    params: parentParams,
    pathname: parentPathname,
    route: parentRoute
  } = React.useContext(RouteContext);

  if (warnAboutMissingTrailingSplatAt) {
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
  let matches = React.useMemo(
    () => matchRoutes(routes, location, basename, caseSensitive),
    [routes, location, basename, caseSensitive]
  );

  if (!matches) {
    // TODO: Warn about nothing matching, suggest using a catch-all route.
    return null;
  }

  // TODO: Initiate preload sequence here.

  // Otherwise render an element.
  let element = matches.reduceRight(
    (outlet: React.ReactElement | null, { params, pathname, route }) => {
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
    },
    null
  );

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
      ...(partialRoute as any),
      path: partialRoute.path || '/',
      element: partialRoute.element || <Outlet />
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
    // Ignore non-elements. This allows people to more
    // easily inline conditionals in their route config.
    if (!React.isValidElement(element)) return;

    let { children, path = '/' } = element.props;

    if (element.type === React.Fragment) {
      // Transparently support React.Fragment and its children.
      routes.push.apply(routes, createRoutesFromChildren(children));
    } else {
      let route: RouteObject = { path, element };
      let childRoutes = createRoutesFromChildren(children);
      if (childRoutes.length) {
        route.children = childRoutes;
      }

      routes.push(route);
    }
  });

  return routes;
}

/**
 * A "partial route" object is usually supplied by the user and may omit certain
 * properties of a real route object such as `path` and `element`, which have
 * reasonable defaults.
 */
export interface PartialRouteObject {
  path?: string;
  element?: React.ReactNode;
  children?: PartialRouteObject[];
}

/**
 * A route object represents a logical route, with (optionally) its child routes
 * organized in a tree-like structure.
 */
export interface RouteObject {
  path: string;
  element: React.ReactNode;
  children?: RouteObject[];
}

/**
 * Creates a path with params interpolated.
 */
export function generatePath(pathname: string, params: Params = {}): string {
  return pathname
    .replace(/:(\w+)/g, (_, key) => params[key] || `:${key}`)
    .replace(/\*$/, splat => params[splat] || splat);
}

/**
 * The parameters that were parsed from the URL path.
 */
export type Params = Record<string, string>;

/**
 * Matches the given routes to a location and returns the match data.
 */
export function matchRoutes(
  routes: PartialRouteObject[],
  location: Path | PathPieces,
  basename: string = '',
  caseSensitive: boolean = false
): MatchObject[] | null {
  if (typeof location === 'string') {
    location = parsePath(location);
  }

  let base = basename.replace(/^\/+|\/+$/g, '');
  let pathname = location.pathname || '/';
  let target = pathname.slice(1);

  if (base) {
    if (base === target) {
      target = '';
    } else if (target.startsWith(base)) {
      target = target.slice(base.length).replace(/^\/+/, '');
    } else {
      return null;
    }
  }

  let flattenedRoutes = flattenRoutes(createRoutesFromArray(routes));
  rankFlattenedRoutes(flattenedRoutes);

  for (let i = 0; i < flattenedRoutes.length; ++i) {
    let [path, flatRoutes] = flattenedRoutes[i];

    // TODO: Match on search, state too
    let [matcher] = compilePath(path, true, caseSensitive);

    if (matcher.test(target)) {
      let matches: MatchObject[] = flatRoutes.map((route, index: number) => {
        let routes = flatRoutes.slice(0, index + 1);
        let path = joinPaths(routes.map(r => r.path));
        let [matcher, paramNames] = compilePath(path, false, caseSensitive);
        let match = target.match(matcher) as string[];
        let pathname = '/' + match[1];
        let values = match.slice(2);
        let params = paramNames.reduce((memo, paramName, index) => {
          memo[paramName] = safelyDecodeURIComponent(values[index], paramName);
          return memo;
        }, {} as Params);

        return { params, pathname, route };
      });

      return matches;
    }
  }

  return null;
}

export interface MatchObject {
  params: Params;
  pathname: string;
  route: RouteObject;
}

function safelyDecodeURIComponent(value: string, paramName: string) {
  try {
    return decodeURIComponent(value.replace(/\+/g, ' '));
  } catch (error) {
    warning(
      false,
      `The value for the URL param "${paramName}" will not be decoded because` +
        ` the string "${value}" is a malformed URL segment. This is probably` +
        ` due to a bad percent encoding (the error message was: ${error.message}).`
    );

    return value;
  }
}

function flattenRoutes(
  routes: RouteObject[],
  flattenedRoutes: FlattenedRoute[] = [],
  parentPath: string = '',
  parentRoutes: RouteObject[] = [],
  parentIndexes: number[] = []
): FlattenedRoute[] {
  routes.forEach((route, index) => {
    let path = joinPaths([parentPath, route.path]);
    let routes = parentRoutes.concat(route);
    let indexes = parentIndexes.concat(index);

    // Add the children before adding this route to the array so we traverse the
    // route tree depth-first and child routes appear before their parents in
    // the "flattened" version.
    if (route.children) {
      flattenRoutes(route.children, flattenedRoutes, path, routes, indexes);
    }

    flattenedRoutes.push([path, routes, indexes]);
  });

  return flattenedRoutes;
}

type FlattenedRoute = [string, RouteObject[], number[]];

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

function rankFlattenedRoutes(flattenedRoutes: FlattenedRoute[]): void {
  let pathScores = flattenedRoutes.reduce((memo, [path]) => {
    memo[path] = computeScore(path);
    return memo;
  }, {} as { [key: string]: number });

  // Sorting is stable in modern browsers, but we still support IE 11, so we
  // need this little helper.
  stableSort(flattenedRoutes, (a, b) => {
    let [aPath, , aIndexes] = a;
    let aScore = pathScores[aPath];

    let [bPath, , bIndexes] = b;
    let bScore = pathScores[bPath];

    return aScore !== bScore
      ? bScore - aScore // Higher score first
      : compareIndexes(aIndexes, bIndexes);
  });
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

function compilePath(
  path: string,
  end: boolean,
  caseSensitive: boolean
): [RegExp, string[]] {
  let keys: string[] = [];
  let pattern =
    '^(' +
    path
      .replace(/^\/+/, '') // Ignore leading /
      .replace(/\*\//g, '') // Ignore */ (from paths nested under a *)
      .replace(/\/?\*?$/, '') // Ignore trailing /*, we'll handle it below
      .replace(/[\\.*+^$?{}|()[\]]/g, '\\$&') // Escape special regex chars
      .replace(/:(\w+)/g, (_: string, key: string) => {
        keys.push(key);
        return '([^\\/]+)';
      }) +
    ')';

  if (path.endsWith('*')) {
    if (path.endsWith('/*')) {
      pattern += '\\/?'; // Don't include the / in params['*']
    }
    keys.push('*');
    pattern += '(.*)';
  } else if (end) {
    pattern += '\\/?';
  }

  if (end) pattern += '$';

  let flags = caseSensitive ? undefined : 'i';
  let matcher = new RegExp(pattern, flags);

  return [matcher, keys];
}

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
    ? toPathname.startsWith('/')
      ? resolvePathname(toPathname, '/')
      : resolvePathname(toPathname, fromPathname)
    : fromPathname;

  return { pathname, search, hash };
}

export type ResolvedLocation = Omit<Location, 'state' | 'key'>;
