import * as React from 'react';
import * as History from 'history';

export {
  // interfaces
  RouteConfigObject,
  MemoryRouterProps,
  NavigateProps,
  RouteProps,
  RouterProps,
  RoutesProps,
  // components
  MemoryRouter,
  Navigate,
  Outlet,
  Route,
  Router,
  Routes,
  // hooks
  useBlocker,
  useHref,
  useInRouterContext,
  useLocation,
  useLocationPending,
  useMatch,
  useNavigate,
  useOutlet,
  useParams,
  useResolvedLocation,
  useRoutes,
  // utils
  createRoutesFromChildren,
  matchRoutes,
  resolveLocation,
  generatePath
} from 'react-router';

import {
  NavigateOptions
} from 'react-router';

export interface BrowserRouterProps {
  timeout?: number;
  window?: Window;
}

/**
 * A <Router> for use in web browsers. Provides the cleanest URLs.
 */
export class BrowserRouter extends React.Component<BrowserRouterProps, any> {
}

export interface HashRouterProps {
  timeout?: number;
  window?: Window;
}

/**
 * A <Router> for use in web browsers. Stores the location in the hash
 * portion of the URL so it is not sent to the server.
 */
export class HashRouter extends React.Component<HashRouterProps, any> {
}

export interface LinkProps {
  as?: React.ElementType;
  onClick?(event: React.SyntheticEvent): void;
  replace?: boolean;
  state?: object;
  target?: string;
  to: History.LocationDescriptor;
}

/**
 * The public API for rendering a history-aware <a>.
 */
export class Link extends React.Component<LinkProps, any> {
}

export interface NavLinkProps extends LinkProps {
  'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true';
  activeClassName?: string;
  activeStyle?: object;
  className?: string;
  style?: object;
  to: History.LocationDescriptor;
}

/**
 * A <Link> wrapper that knows if it's "active" or not.
 */
export class NavLink extends React.Component<NavLinkProps, any> {
}

export interface PromptProps {
  message?: string;
  when?: boolean;
}

/**
 * A declarative interface for showing a window.confirm dialog with the given
 * message when the user tries to navigate away from the current page.
 *
 * This also serves as a reference implementation for anyone who wants to
 * create their own custom prompt component.
 */
export class Prompt extends React.Component<PromptProps, any> {
}

/**
 * Prevents navigation away from the current page using a window.confirm prompt
 * with the given message.
 */
export function usePrompt(message: string, when?: boolean): void;

interface SetSearchParams {
  (nextInit: Parameters<typeof createSearchParams>, navigateOpts?: NavigateOptions);
}

/**
 * A convenient wrapper for accessing individual query parameters via the
 * URLSearchParams interface.
 */
export function useSearchParams(): [URLSearchParams, SetSearchParams];

/**
 * Default URLSearchParams constructor parameters
 */
export function createSearchParams(init?: string[][] | Record<string, string> | string | URLSearchParams): URLSearchParams;

/**
 * Additional support for Record<string, string[]>
 */
export function createSearchParams(init?: Record<string, string[]>);
