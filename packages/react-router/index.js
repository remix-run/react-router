import React from 'react';
import PropTypes from 'prop-types';
import { createMemoryHistory, parsePath } from 'history';

const readOnly = __DEV__ ? obj => Object.freeze(obj) : obj => obj;

function invariant(cond, message) {
  if (!cond) throw new Error(message);
}

function warning(cond, message) {
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

const LocationContext = React.createContext();

if (__DEV__) {
  LocationContext.Consumer.displayName = 'Location.Consumer';
  LocationContext.Provider.displayName = 'Location.Provider';
}

const RouteContext = React.createContext({
  outlet: null,
  params: readOnly({}),
  pathname: '',
  route: null
});

if (__DEV__) {
  RouteContext.Consumer.displayName = 'Route.Consumer';
  RouteContext.Provider.displayName = 'Route.Provider';
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
}) {
  let historyRef = React.useRef(null);

  if (historyRef.current == null) {
    historyRef.current = createMemoryHistory({ initialEntries, initialIndex });
  }

  return (
    <Router
      children={children}
      history={historyRef.current}
      timeout={timeout}
    />
  );
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
export function Navigate({ to, replace = false, state }) {
  let navigate = useNavigate();
  navigate(to, { replace, state });
  return null;
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
export function Outlet() {
  return useOutlet();
}

if (__DEV__) {
  Outlet.displayName = 'Outlet';
  Outlet.propTypes = {};
}

/**
 * Used in a route config to redirect from one location to another.
 */
export function Redirect() {
  return null;
}

if (__DEV__) {
  Redirect.displayName = 'Redirect';

  function redirectChildrenType(props, propName, componentName) {
    if (props[propName] != null) {
      return new Error(
        'A <Redirect> should not have child routes; they will never be rendered.'
      );
    }
  }

  Redirect.propTypes = {
    children: redirectChildrenType,
    from: PropTypes.string,
    to: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string
      })
    ])
  };
}

/**
 * Used in a route config to render an element.
 */
export function Route({ element = <Outlet /> }) {
  return element;
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
const startTransition = tx => tx();
const useTransition = React.useTransition || (() => [startTransition, false]);

/**
 * The root context provider. There should be only one of these in a given app.
 */
export function Router({ children = null, history, timeout = 2000 }) {
  let [location, setLocation] = React.useState(history.location);
  let [startTransition, pending] = useTransition({ timeoutMs: timeout });
  let listeningRef = React.useRef(false);

  invariant(
    !React.useContext(LocationContext),
    `You cannot render a <Router> inside another <Router>.` +
      ` You never need more than one.`
  );

  if (!listeningRef.current) {
    listeningRef.current = true;
    history.listen(({ location }) => {
      startTransition(() => {
        setLocation(location);
      });
    });
  }

  return (
    <LocationContext.Provider
      children={children}
      value={{ history, location, pending }}
    />
  );
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
export function Routes({ basename = '', caseSensitive = false, children }) {
  let routes = createRoutesFromChildren(children);
  return useRoutes(routes, basename, caseSensitive);
}

if (__DEV__) {
  Routes.displayName = 'Routes';
  Routes.propTypes = {
    basename: PropTypes.string,
    caseSensitive: PropTypes.bool,
    children: PropTypes.node
  };
}

/**
 * Utility function that creates a routes config object from a React
 * "children" object, which is usually either a React element or an
 * array of elements.
 */
export function createRoutesFromChildren(children) {
  let routes = [];

  React.Children.forEach(children, element => {
    // Ignore non-elements. This allows people to more
    // easily inline conditionals in their route config.
    if (!React.isValidElement(element)) return;

    let { children, from, path, to } = element.props;

    // Transparently support React.Fragment and its children.
    if (element.type === React.Fragment) {
      routes.push.apply(routes, createRoutesFromChildren(children));
      return;
    }

    path = path || from || '/';

    // Components that have a to prop are redirects.
    // All others should use path + element (and maybe children) props.
    let route;
    if (to) {
      route = { path, redirectTo: to };
    } else {
      route = { path, element };

      let childRoutes = createRoutesFromChildren(children);
      if (childRoutes.length) {
        route.children = childRoutes;
      }
    }

    routes.push(route);
  });

  return routes;
}

///////////////////////////////////////////////////////////////////////////////
// HOOKS
///////////////////////////////////////////////////////////////////////////////

/**
 * Blocks all navigation attempts. This is useful for preventing the page from
 * changing until some condition is met, like saving form data.
 */
export function useBlocker(blocker, when = true) {
  let { history } = React.useContext(LocationContext);

  // TODO: This error is probably because they somehow have
  // 2 versions of the router loaded. We can help them understand
  // how to avoid that.
  invariant(
    history != null,
    'navigation blocking may be used only in the context of a <Router> component'
  );

  React.useEffect(() => {
    if (when) {
      let unblock = history.block(tx => {
        let autoUnblockingTx = {
          ...tx,
          retry() {
            // Automatically unblock the transition so it can
            // play all the way through before retrying it.
            // TODO: Figure out how to re-enable this block if the
            // transition is cancelled for some reason.
            unblock();
            tx.retry();
          }
        };

        blocker(autoUnblockingTx);
      });

      return unblock;
    }
  }, [history, when, blocker]);
}

/**
 * Returns the full href for the given "to" value. This is useful for building
 * custom links that are also accessible and preserve right-click behavior.
 */
export function useHref(to) {
  let resolvedLocation = useResolvedLocation(to);
  let { history } = React.useContext(LocationContext);

  // TODO: This error is probably because they somehow have
  // 2 versions of the router loaded. We can help them understand
  // how to avoid that.
  invariant(
    history != null,
    'href resolution may be used only in the context of a <Router> component'
  );

  return history.createHref(resolvedLocation);
}

/**
 * Returns the current location object, which represents the current URL in web
 * browsers.
 *
 * NOTE: If you're using this it may mean you're doing some of your own "routing"
 * in your app, and we'd like to know what your use case is. We may be able to
 * provide something higher-level to better suit your needs.
 */
export function useLocation() {
  return React.useContext(LocationContext).location;
}

/**
 * Returns true if the URL for the given "to" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 */
export function useMatch(to) {
  let location = useLocation();
  let resolvedLocation = useResolvedLocation(to);
  // TODO: Try to match search + hash as well
  return location.pathname === resolvedLocation.pathname;
}

/**
 * Returns an imperative method for changing the location. Used by <Link>s, but
 * may also be used by other elements to change the location.
 */
export function useNavigate() {
  let { history, pending } = React.useContext(LocationContext);
  let { pathname } = React.useContext(RouteContext);

  // TODO: This error is probably because they somehow have
  // 2 versions of the router loaded. We can help them understand
  // how to avoid that.
  invariant(
    history != null,
    'navigation may be used only in the context of a <Router> component'
  );

  let navigate = React.useCallback(
    (to, { replace, state } = {}) => {
      if (typeof to === 'number') {
        history.go(to);
      } else {
        let relativeTo = resolveLocation(to, pathname);

        // If we are pending transition, use REPLACE instead of PUSH.
        // This will prevent URLs that we started navigating to but
        // never fully loaded from appearing in the history stack.
        let method = !!replace || pending ? 'replace' : 'push';
        history[method](relativeTo, state);
      }
    },
    [history, pending, pathname]
  );

  return navigate;
}

/**
 * Returns the outlet element at this level of the route hierarchy. Used to
 * render child routes.
 */
export function useOutlet() {
  return React.useContext(RouteContext).outlet;
}

/**
 * Returns a hash of the dynamic params that were matched in the route path.
 * This is useful for using ids embedded in the URL to fetch data, but we
 * eventually want to provide something at a higher level for this.
 */
export function useParams() {
  return React.useContext(RouteContext).params;
}

/**
 * Returns a fully-resolved location object relative to the current location.
 */
export function useResolvedLocation(to) {
  let { pathname } = React.useContext(RouteContext);
  return React.useMemo(() => resolveLocation(to, pathname), [to, pathname]);
}

let missingTrailingSplatWarnings, warnAboutMissingTrailingSplatAt;
if (__DEV__) {
  missingTrailingSplatWarnings = {};
  warnAboutMissingTrailingSplatAt = (pathname, cond, message) => {
    if (!cond && !missingTrailingSplatWarnings[pathname]) {
      missingTrailingSplatWarnings[pathname] = true;
      warning(false, message);
    }
  };
}

/**
 * Returns the element of the route that matched the current location, prepared
 * with the correct context to render the remainder of the route tree. Route
 * elements in the tree must render an <Outlet> to render their child route's
 * element.
 *
 * Route objects may take one of 2 forms:
 *
 * - { path, element, children }
 * - { path, redirectTo }
 *
 * We should probably write this up in TypeScript instead of in a comment. In
 * fact, what am I even doing here. Nobody is ever going to read this.
 */
export function useRoutes(routes, basename = '', caseSensitive = false) {
  let {
    params: parentParams,
    pathname: parentPathname,
    route: parentRoute
  } = React.useContext(RouteContext);

  if (warnAboutMissingTrailingSplatAt) {
    // You won't get a warning about 2 different <Routes> under a <Route>
    // without a trailing *, but this is a best-effort warning anyway since
    // we cannot even give the warning unless they land at the parent route.
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

  let navigate = useNavigate();
  let location = useLocation();
  let matches = React.useMemo(
    () => matchRoutes(routes, location, basename, caseSensitive),
    [routes, location, basename, caseSensitive]
  );

  if (!matches) {
    // TODO: Warn about nothing matching, suggest using a catch-all route.
    return null;
  }

  // If we matched a redirect, navigate and return null.
  let redirectMatch = matches.find(match => isRedirectRoute(match.route));
  if (redirectMatch) {
    let { params, route } = redirectMatch;
    let relativeTo = resolveLocation(route.redirectTo, parentPathname);

    let { pathname } = relativeTo;
    if (/:\w+/.test(pathname)) {
      // Allow param interpolation into <Redirect to>, e.g.
      // <Redirect from="users/:id" to="profile/:id">
      relativeTo = { ...relativeTo, pathname: generatePath(pathname, params) };
    }

    navigate(relativeTo, { replace: true });

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
  }, null);

  return element;
}

function isRedirectRoute(route) {
  return route.redirectTo != null;
}

///////////////////////////////////////////////////////////////////////////////
// UTILS
///////////////////////////////////////////////////////////////////////////////

/**
 * Matches the given routes to a location and returns the match data.
 */
export function matchRoutes(
  routes,
  location,
  basename = '',
  caseSensitive = false
) {
  if (typeof location === 'string') {
    location = parsePath(location);
  }

  // TODO: Validate location
  // - it should have a pathname
  let base = basename.replace(/^\/+|\/+$/g, '');
  let target = location.pathname.slice(1);

  if (base) {
    if (base === target) {
      target = '';
    } else if (target.startsWith(base)) {
      target = target.slice(base.length).replace(/^\/+/, '');
    } else {
      return null;
    }
  }

  let flattenedRoutes = flattenRoutes(routes);

  // TODO: Validate the routes config
  // - routes should all have paths and elements
  // - redirects should have a redirectTo
  // - redirects should not have children
  // - warn about unreachable routes

  rankFlattenedRoutes(flattenedRoutes);

  for (let i = 0; i < flattenedRoutes.length; ++i) {
    let [path, flatRoutes] = flattenedRoutes[i];

    // TODO: Match on search, state too
    let [matcher] = compilePath(path, /* end */ true, caseSensitive);

    if (matcher.test(target)) {
      return flatRoutes.map((route, index) => {
        let routes = flatRoutes.slice(0, index + 1);
        let path = joinPaths(routes.map(r => r.path));
        let [matcher, keys] = compilePath(path, /* end */ false, caseSensitive);
        let match = target.match(matcher);
        let pathname = '/' + match[1];
        let values = match.slice(2);
        let params = keys.reduce((memo, key, index) => {
          memo[key] = safelyDecodeURIComponent(values[index], key);
          return memo;
        }, {});

        return { params, pathname, route };
      });
    }
  }

  return null;
}

function safelyDecodeURIComponent(value, paramName) {
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
  routes,
  flattenedRoutes = [],
  parentPath = '',
  parentRoutes = [],
  parentIndexes = []
) {
  routes.forEach((route, index) => {
    let path = joinPaths([parentPath, route.path]);
    let routes = parentRoutes.concat(route);
    let indexes = parentIndexes.concat(index);

    flattenedRoutes.push([path, routes, indexes]);

    if (route.children) {
      flattenRoutes(route.children, flattenedRoutes, path, routes, indexes);
    }
  });

  return flattenedRoutes;
}

const paramRe = /^:\w+$/;
const dynamicSegmentValue = 2;
const emptySegmentValue = 1;
const staticSegmentValue = 10;
const splatPenalty = -2;
const isSplat = s => s === '*';

function computeScore(path) {
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

function rankFlattenedRoutes(flattenedRoutes) {
  let pathScores = flattenedRoutes.reduce((memo, [path]) => {
    memo[path] = computeScore(path);
    return memo;
  }, {});

  flattenedRoutes.sort((a, b) => {
    let [aPath, , aIndexes] = a;
    let aScore = pathScores[aPath];

    let [bPath, , bIndexes] = b;
    let bScore = pathScores[bPath];

    return aScore !== bScore
      ? bScore - aScore // Higher score first
      : compareIndexes(aIndexes, bIndexes);
  });
}

function compareIndexes(a, b) {
  let siblings =
    a.length === b.length && a.slice(0, -1).every((n, i) => n === b[i]);

  return siblings
    ? a[a.length - 1] - b[b.length - 1] // Earlier siblings come first
    : 0; // It doesn't make sense to rank non-siblings by index, so they sort equal
}

function compilePath(path, end, caseSensitive) {
  let keys = [];
  let pattern =
    '^(' +
    path
      .replace(/^\/+/, '') // Ignore leading /
      .replace(/\*\//g, '') // Ignore */ (from paths nested under a *)
      .replace(/\/?\*?$/, '') // Ignore trailing /*, we'll handle it below
      .replace(/[\\.*+^$?{}|()[\]]/g, '\\$&') // Escape special regex chars
      .replace(/:(\w+)/g, (_, key) => {
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

const trimTrailingSlashes = path => path.replace(/\/+$/, '');
const normalizeSlashes = path => path.replace(/\/\/+/g, '/');
const joinPaths = paths => normalizeSlashes(paths.join('/'));
const splitPath = path => normalizeSlashes(path).split('/');

function resolvePathname(toPathname, fromPathname) {
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
 * Returns a fully resolve location object relative to the given pathname.
 */
export function resolveLocation(to, fromPathname = '/') {
  let { pathname: toPathname, search = '', hash = '' } =
    typeof to === 'string' ? parsePath(to) : to;

  let pathname = toPathname
    ? toPathname.startsWith('/')
      ? resolvePathname(toPathname, '/')
      : resolvePathname(toPathname, fromPathname)
    : fromPathname;

  return { pathname, search, hash };
}

/**
 * Creates a path with params interpolated.
 */
export function generatePath(pathname, params = {}) {
  return pathname
    .replace(/:(\w+)/g, (_, key) => params[key] || `:${key}`)
    .replace(/\*$/, splat => params[splat] || splat);
}
