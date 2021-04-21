import type { Location } from "history";
import type { ComponentType } from "react";
import type { Params } from "react-router";

import type { HeadersInit, Headers, Request, Response } from "./fetch";
import type { LinkDescriptor } from "./links";

/**
 * An object of data returned from the server's `getLoadContext` function. This
 * will be passed to the data loaders.
 */
export type AppLoadContext = any;

/**
 * Some data that was returned from a route data loader.
 */
export type AppData = any;

/**
 * A React component that is rendered for a route.
 */
export type RouteComponent = ComponentType;

/**
 * A React component that is rendered when there is an error on a route.
 */
export type ErrorBoundaryComponent = ComponentType<{ error: Error }>;

/**
 * A function that returns HTTP headers to be used for a route. These headers
 * will be merged with (and take precedence over) headers from parent routes.
 */
export interface HeadersFunction {
  (args: { loaderHeaders: Headers; parentHeaders: Headers }):
    | Headers
    | HeadersInit;
}

/**
 * A function that returns an object of name + content pairs to use for
 * `<meta>` tags for a route. These tags will be merged with (and take
 * precedence over) tags from parent routes.
 */
export interface MetaFunction {
  (args: {
    data: AppData;
    parentsData: RouteData;
    params: Params;
    location: Location;
  }): { [name: string]: string };
}

/**
 * A function that defines `<link>` tags to be inserted into the `<head>` of
 * the document on route transitions.
 */
export interface LinksFunction {
  (args: { data: AppData }): LinkDescriptor[];
}

/**
 * A function that loads data for a route.
 */
export interface LoaderFunction {
  (args: { request: Request; context: AppLoadContext; params: Params }):
    | Promise<AppData>
    | AppData;
}

/**
 * A function that handles data mutations for a route.
 */
export interface ActionFunction {
  (args: { request: Request; context: AppLoadContext; params: Params }):
    | Promise<Response>
    | Response;
}

/**
 * A module that contains info about a route including headers, meta tags, and
 * the route component for rendering HTML markup.
 */
export interface RouteModule {
  default: RouteComponent;
  ErrorBoundary?: ErrorBoundaryComponent;
  headers?: HeadersFunction;
  meta?: MetaFunction;
  loader?: LoaderFunction;
  action?: ActionFunction;
  links?: LinksFunction;
  handle?: any;
}

export interface RouteManifest<Route> {
  [routeId: string]: Route;
}

export type RouteData = RouteManifest<AppData>;
export type RouteModules = RouteManifest<RouteModule>;

export interface Route {
  path: string;
  caseSensitive?: boolean;
  id: string;
  parentId?: string;
}

export interface ServerRoute extends Route {
  module: RouteModule;
  children: ServerRoute[];
}

export type ServerRouteManifest = RouteManifest<Omit<ServerRoute, "children">>;
