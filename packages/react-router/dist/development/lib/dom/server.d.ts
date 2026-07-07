
import { Location } from "../router/history.js";
import { DataRouteObject, RouteBranch, RouteObject } from "../router/utils.js";
import { FutureConfig, Router, StaticHandlerContext } from "../router/router.js";
import * as React$1 from "react";

//#region lib/dom/server.d.ts
/**
 * @category Types
 */
interface StaticRouterProps {
  /**
   * The base URL for the static router (default: `/`)
   */
  basename?: string;
  /**
   * The child elements to render inside the static router
   */
  children?: React$1.ReactNode;
  /**
   * The {@link Location} to render the static router at (default: `/`)
   */
  location: Partial<Location> | string;
}
/**
 * A {@link Router | `<Router>`} that may not navigate to any other {@link Location}.
 * This is useful on the server where there is no stateful UI.
 *
 * @public
 * @category Declarative Routers
 * @mode declarative
 * @param props Props
 * @param {StaticRouterProps.basename} props.basename n/a
 * @param {StaticRouterProps.children} props.children n/a
 * @param {StaticRouterProps.location} props.location n/a
 * @returns A React element that renders the static {@link Router | `<Router>`}
 */
declare function StaticRouter({
  basename,
  children,
  location: locationProp
}: StaticRouterProps): React$1.JSX.Element;
/**
 * @category Types
 */
interface StaticRouterProviderProps {
  /**
   * The {@link StaticHandlerContext} returned from {@link StaticHandler}'s
   * `query`
   */
  context: StaticHandlerContext;
  /**
   * The static {@link DataRouter} from {@link createStaticRouter}
   */
  router: Router;
  /**
   * Whether to hydrate the router on the client (default `true`)
   */
  hydrate?: boolean;
  /**
   * The [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
   * to use for the hydration [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
   * tag
   */
  nonce?: string;
}
/**
 * A {@link DataRouter} that may not navigate to any other {@link Location}.
 * This is useful on the server where there is no stateful UI.
 *
 * @example
 * export async function handleRequest(request: Request) {
 *   let { query, dataRoutes } = createStaticHandler(routes);
 *   let context = await query(request));
 *
 *   if (context instanceof Response) {
 *     return context;
 *   }
 *
 *   let router = createStaticRouter(dataRoutes, context);
 *   return new Response(
 *     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
 *     { headers: { "Content-Type": "text/html" } }
 *   );
 * }
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param props Props
 * @param {StaticRouterProviderProps.context} props.context n/a
 * @param {StaticRouterProviderProps.hydrate} props.hydrate n/a
 * @param {StaticRouterProviderProps.nonce} props.nonce n/a
 * @param {StaticRouterProviderProps.router} props.router n/a
 * @returns A React element that renders the static router provider
 */
declare function StaticRouterProvider({
  context,
  router,
  hydrate,
  nonce
}: StaticRouterProviderProps): React$1.JSX.Element;
/**
 * Create a static {@link DataRouter} for server-side rendering
 *
 * @example
 * export async function handleRequest(request: Request) {
 *   let { query, dataRoutes } = createStaticHandler(routes);
 *   let context = await query(request);
 *
 *   if (context instanceof Response) {
 *     return context;
 *   }
 *
 *   let router = createStaticRouter(dataRoutes, context);
 *   return new Response(
 *     ReactDOMServer.renderToString(<StaticRouterProvider ... />),
 *     { headers: { "Content-Type": "text/html" } }
 *   );
 * }
 *
 * @public
 * @category Data Routers
 * @mode data
 * @param routes The route objects to create a static {@link DataRouter} for
 * @param context The {@link StaticHandlerContext} returned from {@link StaticHandler}'s
 * `query`
 * @param opts Options
 * @param opts.future Future flags for the static {@link DataRouter}
 * @param opts.branches Optional pre-computed route branches
 * @returns A static {@link DataRouter} that can be used to render the provided routes
 */
declare function createStaticRouter(routes: RouteObject[], context: StaticHandlerContext, opts?: {
  branches?: RouteBranch<DataRouteObject>[];
  future?: Partial<FutureConfig>;
}): Router;
//#endregion
export { StaticRouter, StaticRouterProps, StaticRouterProvider, StaticRouterProviderProps, createStaticRouter };