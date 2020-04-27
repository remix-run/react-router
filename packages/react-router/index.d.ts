import * as React from 'react';
import * as History from 'history';

export interface RouteConfigObject {
  path?: string;
  element?: React.ReactElement;
  children?: RouteConfigObject[];
}

export interface MemoryRouterProps {
  initialEntries?: string[];
  initialIndex?: number;
  timeout?: number;
}

/**
 * A <Router> that stores all entries in memory.
 */
export class MemoryRouter extends React.Component<MemoryRouterProps, any> {
}

export interface NavigateProps extends NavigateOptions {
  to: History.LocationDescriptor;
}

/**
 * Navigate programmatically using a component.
 */
export class Navigate extends React.Component<NavigateProps, any> {
}

/**
 * Renders the child route's element, if there is one.
 */
export class Outlet extends React.Component<{}, any> {
}

export interface RouteProps {
  path?: string;
  element?: React.ReactElement;
}

/**
 * Used in a route config to render an element.
 */
export class Route extends React.Component<RouteProps, any> {
}

export interface RouterProps {
  history?: History;
  timeout?: number;
}

/**
 * The root context provider. There should be only one of these in a given app.
 */
export class Router extends React.Component<RouterProps, any> {
}

export interface RoutesProps {
  basename?: string;
  caseSensitive?: boolean;
}

/**
 * A wrapper for useRoutes that treats its children as route and/or redirect
 * objects.
 */
export class Routes extends React.Component<RoutesProps, any> {
}

/**
 * Utility function that creates a routes config object from a React
 * "children" object, which is usually either a React element or an
 * array of elements.
 */
export function createRoutesFromChildren(children: React.ReactNode): RouteConfigObject[];

/**
 * Blocks all navigation attempts. This is useful for preventing the page from
 * changing until some condition is met, like saving form data.
 */
export function useBlocker(blocker: any, when?: boolean): void;

/**
 * Returns the full href for the given "to" value. This is useful for building
 * custom links that are also accessible and preserve right-click behavior.
 */
export function useHref(to: History.LocationDescriptor): History.Href;

/**
 * Returns true if this component is a descendant of a <Router>.
 */
export function useInRouterContext(): boolean;

/**
 * Returns the current location object, which represents the current URL in web
 * browsers.
 *
 * NOTE: If you're using this it may mean you're doing some of your own "routing"
 * in your app, and we'd like to know what your use case is. We may be able to
 * provide something higher-level to better suit your needs.
 */
export function useLocation(): History.Location;

/**
 * Returns true if the router is pending a location update.
 */
export function useLocationPending(): boolean;

/**
 * Returns true if the URL for the given "to" value matches the current URL.
 * This is useful for components that need to know "active" state, e.g.
 * <NavLink>.
 */
export function useMatch(to: History.Location): boolean;

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

declare function navigate(delta: number): void;
declare function navigate(to: History.LocationDescriptor, options?: NavigateOptions): void;

/**
 * Returns an imperative method for changing the location. Used by <Link>s, but
 * may also be used by other elements to change the location.
 */
export function useNavigate(): typeof navigate;

/**
 * Returns the outlet element at this level of the route hierarchy. Used to
 * render child routes.
 */
export function useOutlet(): React.ReactElement;

/**
 * Returns a hash of the dynamic params that were matched in the route path.
 * This is useful for using ids embedded in the URL to fetch data, but we
 * eventually want to provide something at a higher level for this.
 */
export function useParams(): object;

/**
 * Returns a fully-resolved location object relative to the current location.
 */
export function useResolvedLocation(to: History.LocationDescriptor): History.Location;

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
export function useRoutes(routes: RouteConfigObject[], basename?: string, caseSensitive?: boolean): React.ReactElement | null;

/**
 * Matches the given routes to a location and returns the match data.
 */
export function matchRoutes(routes: RouteConfigObject[], location: History.LocationDescriptor, basename?: string, caseSensitive?: boolean): History.Location | null;

/**
 * Returns a fully resolve location object relative to the given pathname.
 */
export function resolveLocation(to: History.LocationDescriptor, fromPathname?: string): History.Location;

/**
 * Creates a path with params interpolated.
 */
export function generatePath(pathname: string, params?: object): string;
