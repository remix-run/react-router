import type { Location } from "history";
import type { ComponentType } from "react";
import type { Params } from "react-router"; // TODO: import/export from react-router-dom

import type { AppLoadContext, AppData } from "./data";
import type { Headers, HeadersInit, Request, Response } from "./fetch";
import type { LinkDescriptor } from "./links";
import type { RouteData } from "./routeData";

export interface RouteModules<RouteModule> {
  [routeId: string]: RouteModule;
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
    | Promise<Response>
    | Response
    | Promise<AppData>
    | AppData;
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
 * A React component that is rendered for a route.
 */
export type RouteComponent = ComponentType<{}>;

/**
 * An arbitrary object that is associated with a route.
 */
export type RouteHandle = any;

export interface EntryRouteModule {
  ErrorBoundary?: ErrorBoundaryComponent;
  default: RouteComponent;
  handle?: RouteHandle;
  links?: LinksFunction;
  meta?: MetaFunction;
}

export interface ServerRouteModule extends EntryRouteModule {
  action?: ActionFunction;
  headers?: HeadersFunction;
  loader?: LoaderFunction;
}
