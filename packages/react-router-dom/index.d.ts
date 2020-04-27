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

export class BrowserRouter extends React.Component<BrowserRouterProps, any> {
}

export interface HashRouterProps {
  timeout?: number;
  window?: Window;
}

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

export class NavLink extends React.Component<NavLinkProps, any> {
}

export interface PromptProps {
  message?: string;
  when?: boolean;
}

export class Prompt extends React.Component<PromptProps, any> {
}

export function usePrompt(message: string, when?: boolean): void;

interface SetSearchParams {
  (nextInit: Parameters<typeof createSearchParams>, navigateOpts?: NavigateOptions);
}

export function useSearchParams(): [URLSearchParams, SetSearchParams];

/**
 * Default URLSearchParams constructor parameters
 */
export function createSearchParams(init?: string[][] | Record<string, string> | string | URLSearchParams): URLSearchParams;

/**
 * Additional support for Record<string, string[]>
 */
export function createSearchParams(init?: Record<string, string[]>);
