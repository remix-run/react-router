import * as React from 'react';
import * as History from 'history';

interface RouteConfigObject {
  path?: string;
  from?: string;
  redirectTo?: string;
  element?: React.ReactElement;
  children?: RouteConfigObject[];
}

export interface MemoryRouterProps {
  initialEntries?: string[];
  initialIndex?: number;
  timeout?: number;
}

export class MemoryRouter extends React.Componet<MemoryRouterProps, any> {
}

export interface NavigateProps extends NavigateOptions {
  to: History.LocationDescriptor;
}

export class Navigate extends React.Component<NavigateProps, any> {
}

export class Outlet extends React.Component<{}, any> {
}

export interface RedirectProps {
  from?: string;
  to: History.LocationDescriptor;
}

export class Redirect extends React.Component<RedirectProps, any> {
}

export interface RouteProps {
  path?: string;
  element?: React.ReactElement;
}

export class Route extends React.Component<RouteProps, any> {
}

export interface RouterProps {
  history?: History;
  timeout?: number;
}

export class Router extends React.Component<RouterProps, any> {
}

export interface RoutesProps {
  basename?: string;
  caseSensitive?: boolean;
}

export class Routes extends React.Component<RoutesProps, any> {
}

export function createRoutesFromChildren(children: React.ReactNode): RouteConfigObject[];

export function useBlocker(blocker: any, when?: boolean): void;

export function useHref(to: History.LocationDescriptor): History.Href;

export function useLocation(): History.Location;

export function useMatch(to: History.Location): boolean;

export interface NavigateOptions {
  replace?: boolean;
  state?: any;
}

declare function navigate(delta: number): void;
declare function navigate(to: History.LocationDescriptor, options?: NavigateOptions): void;

export function useNavigate(): typeof navigate;

export function useOutlet(): React.ReactElement;

export function useParams(): object;

export function useResolvedLocation(to: History.LocationDescriptor): History.Location;

export function useRoutes(routes: RouteConfigObject[], basename?: string, caseSensitive?: boolean): React.ReactElement | null;

export function matchRoutes(routes: RouteConfigObject[], location: History.LocationDescriptor, basename?: string, caseSensitive?: boolean): History.Location | null;

export function resolveLocation(to: History.LocationDescriptor, fromPathname?: string): History.Location;

export function generatePath(pathname: string, params?: object): string;
