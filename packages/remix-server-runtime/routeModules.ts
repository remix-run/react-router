import type { Location } from "history";
import type { ComponentType } from "react";
import type { Params } from "react-router-dom";

import type { AppLoadContext, AppData } from "./data";
import type { LinkDescriptor } from "./links";
import type { RouteData } from "./routeData";

export interface RouteModules<RouteModule> {
  [routeId: string]: RouteModule;
}

/**
 * The arguments passed to ActionFunction and LoaderFunction.
 */
export interface DataFunctionArgs {
  request: Request;
  context: AppLoadContext;
  params: Params;
}

/**
 * A function that handles data mutations for a route.
 */
export interface ActionFunction {
  (args: DataFunctionArgs):
    | Promise<Response>
    | Response
    | Promise<AppData>
    | AppData;
}

/**
 * A React component that is rendered when the server throws a Response.
 */
export type CatchBoundaryComponent = ComponentType<{}>;

/**
 * A React component that is rendered when there is an error on a route.
 */
export type ErrorBoundaryComponent = ComponentType<{ error: Error }>;

/**
 * A function that returns HTTP headers to be used for a route. These headers
 * will be merged with (and take precedence over) headers from parent routes.
 */
export interface HeadersFunction {
  (args: {
    loaderHeaders: Headers;
    parentHeaders: Headers;
    actionHeaders: Headers;
  }): Headers | HeadersInit;
}

/**
 * A function that defines `<link>` tags to be inserted into the `<head>` of
 * the document on route transitions.
 */
export interface LinksFunction {
  (): LinkDescriptor[];
}

/**
 * A function that loads data for a route.
 */
export interface LoaderFunction {
  (args: DataFunctionArgs):
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
  }): HtmlMetaDescriptor;
}

/**
 * A name/content pair used to render `<meta>` tags in a meta function for a
 * route. The value can be either a string, which will render a single `<meta>`
 * tag, or an array of strings that will render multiple tags with the same
 * `name` attribute.
 */
export interface HtmlMetaDescriptor {
  [name: string]: string | string[];
}

export type MetaDescriptor = HtmlMetaDescriptor;

/**
 * A React component that is rendered for a route.
 */
export type RouteComponent = ComponentType<{}>;

/**
 * An arbitrary object that is associated with a route.
 */
export type RouteHandle = any;

export interface EntryRouteModule {
  CatchBoundary?: CatchBoundaryComponent;
  ErrorBoundary?: ErrorBoundaryComponent;
  default: RouteComponent;
  handle?: RouteHandle;
  links?: LinksFunction;
  meta?: MetaFunction | HtmlMetaDescriptor;
}

export interface ServerRouteModule extends EntryRouteModule {
  action?: ActionFunction;
  headers?: HeadersFunction | { [name: string]: string };
  loader?: LoaderFunction;
}
