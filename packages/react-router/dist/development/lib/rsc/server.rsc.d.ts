
import { Location } from "../router/history.js";
import { ActionFunction, LoaderFunction, Params, RouterContextProvider, ShouldRevalidateFunction } from "../router/utils.js";
import { ClientActionFunction, ClientLoaderFunction, HeadersFunction, LinksFunction, MetaFunction } from "../dom/ssr/routeModules.js";
import * as React$1 from "react";
import { ReactFormState } from "react-dom/client";

//#region lib/rsc/server.rsc.d.ts
declare function getRequest(): Request;
type RSCRouteConfigEntryBase = {
  action?: ActionFunction;
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  ErrorBoundary?: React$1.ComponentType<any>;
  handle?: any;
  headers?: HeadersFunction;
  HydrateFallback?: React$1.ComponentType<any>;
  Layout?: React$1.ComponentType<any>;
  links?: LinksFunction;
  loader?: LoaderFunction;
  meta?: MetaFunction;
  shouldRevalidate?: ShouldRevalidateFunction;
};
type RSCRouteConfigEntry = RSCRouteConfigEntryBase & {
  id: string;
  path?: string;
  Component?: React$1.ComponentType<any>;
  lazy?: () => Promise<RSCRouteConfigEntryBase & ({
    default?: React$1.ComponentType<any>;
    Component?: never;
  } | {
    default?: never;
    Component?: React$1.ComponentType<any>;
  })>;
} & ({
  index: true;
} | {
  children?: RSCRouteConfigEntry[];
});
type RSCRouteConfig = Array<RSCRouteConfigEntry>;
type RSCRouteManifest = {
  clientAction?: ClientActionFunction;
  clientLoader?: ClientLoaderFunction;
  element?: React$1.ReactElement | false;
  errorElement?: React$1.ReactElement;
  handle?: any;
  hasAction: boolean;
  hasComponent: boolean;
  hasLoader: boolean;
  hydrateFallbackElement?: React$1.ReactElement;
  id: string;
  index?: boolean;
  links?: LinksFunction;
  meta?: MetaFunction;
  parentId?: string;
  path?: string;
  shouldRevalidate?: ShouldRevalidateFunction;
};
type RSCRouteMatch = RSCRouteManifest & {
  params: Params;
  pathname: string;
  pathnameBase: string;
};
type RSCRenderPayload = {
  type: "render";
  actionData: Record<string, any> | null;
  basename: string | undefined;
  errors: Record<string, any> | null;
  loaderData: Record<string, any>;
  location: Location;
  routeDiscovery: RouteDiscovery;
  matches: RSCRouteMatch[];
  patches?: Promise<RSCRouteManifest[]>;
  nonce?: string;
  formState?: ReactFormState;
};
type RSCManifestPayload = {
  type: "manifest";
  patches: Promise<RSCRouteManifest[]>;
};
type RSCActionPayload = {
  type: "action";
  actionResult: Promise<unknown>;
  rerender?: Promise<RSCRenderPayload | RSCRedirectPayload>;
};
type RSCRedirectPayload = {
  type: "redirect";
  status: number;
  location: string;
  replace: boolean;
  reload: boolean;
  actionResult?: Promise<unknown>;
};
type RSCPayload = RSCRenderPayload | RSCManifestPayload | RSCActionPayload | RSCRedirectPayload;
type RSCMatch = {
  statusCode: number;
  headers: Headers;
  payload: RSCPayload;
};
type DecodeActionFunction = (formData: FormData) => Promise<() => Promise<unknown>>;
type DecodeFormStateFunction = (result: unknown, formData: FormData) => Promise<ReactFormState | undefined>;
type DecodeReplyFunction = (reply: FormData | string, options: {
  temporaryReferences: unknown;
}) => Promise<unknown[]>;
type LoadServerActionFunction = (id: string) => Promise<Function>;
type RouteDiscovery = {
  mode: "lazy";
  manifestPath?: string | undefined;
} | {
  mode: "initial";
};
/**
 * Matches the given routes to a [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 * and returns an [RSC](https://react.dev/reference/rsc/server-components)
 * [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * encoding an {@link unstable_RSCPayload} for consumption by an [RSC](https://react.dev/reference/rsc/server-components)
 * enabled client router.
 *
 * @example
 * import {
 *   createTemporaryReferenceSet,
 *   decodeAction,
 *   decodeReply,
 *   loadServerAction,
 *   renderToReadableStream,
 * } from "@vitejs/plugin-rsc/rsc";
 * import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
 *
 * matchRSCServerRequest({
 *   createTemporaryReferenceSet,
 *   decodeAction,
 *   decodeFormState,
 *   decodeReply,
 *   loadServerAction,
 *   request,
 *   routes: routes(),
 *   generateResponse(match) {
 *     return new Response(
 *       renderToReadableStream(match.payload),
 *       {
 *         status: match.statusCode,
 *         headers: match.headers,
 *       }
 *     );
 *   },
 * });
 *
 * @name unstable_matchRSCServerRequest
 * @public
 * @category RSC
 * @mode data
 * @param opts Options
 * @param opts.allowedActionOrigins Origin patterns that are allowed to execute actions.
 * @param opts.basename The basename to use when matching the request.
 * @param opts.createTemporaryReferenceSet A function that returns a temporary
 * reference set for the request, used to track temporary references in the [RSC](https://react.dev/reference/rsc/server-components)
 * stream.
 * @param opts.decodeAction Your `react-server-dom-xyz/server`'s `decodeAction`
 * function, responsible for loading a server action.
 * @param opts.decodeFormState A function responsible for decoding form state for
 * progressively enhanceable forms with React's [`useActionState`](https://react.dev/reference/react/useActionState)
 * using your `react-server-dom-xyz/server`'s `decodeFormState`.
 * @param opts.decodeReply Your `react-server-dom-xyz/server`'s `decodeReply`
 * function, used to decode the server function's arguments and bind them to the
 * implementation for invocation by the router.
 * @param opts.generateResponse A function responsible for using your
 * `renderToReadableStream` to generate a [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * encoding the {@link unstable_RSCPayload}.
 * @param opts.loadServerAction Your `react-server-dom-xyz/server`'s
 * `loadServerAction` function, used to load a server action by ID.
 * @param opts.onError An optional error handler that will be called with any
 * errors that occur during the request processing.
 * @param opts.request The [`Request`](https://developer.mozilla.org/en-US/docs/Web/API/Request)
 * to match against.
 * @param opts.requestContext An instance of {@link RouterContextProvider}
 * that should be created per request, to be passed to [`action`](../../start/data/route-object#action)s,
 * [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
 * @param opts.routeDiscovery The route discovery configuration, used to determine how the router should discover new routes during navigations.
 * @param opts.routes Your {@link unstable_RSCRouteConfigEntry | route definitions}.
 * @returns A [`Response`](https://developer.mozilla.org/en-US/docs/Web/API/Response)
 * that contains the [RSC](https://react.dev/reference/rsc/server-components)
 * data for hydration.
 */
declare function matchRSCServerRequest({
  allowedActionOrigins,
  createTemporaryReferenceSet,
  basename,
  decodeReply,
  requestContext,
  routeDiscovery,
  loadServerAction,
  decodeAction,
  decodeFormState,
  onError,
  request,
  routes,
  generateResponse
}: {
  allowedActionOrigins?: string[];
  createTemporaryReferenceSet: () => unknown;
  basename?: string;
  decodeReply?: DecodeReplyFunction;
  decodeAction?: DecodeActionFunction;
  decodeFormState?: DecodeFormStateFunction;
  requestContext?: RouterContextProvider;
  loadServerAction?: LoadServerActionFunction;
  onError?: (error: unknown) => void;
  request: Request;
  routes: RSCRouteConfigEntry[];
  routeDiscovery?: RouteDiscovery;
  generateResponse: (match: RSCMatch, {
    onError,
    temporaryReferences
  }: {
    onError(error: unknown): string | undefined;
    temporaryReferences: unknown;
  }) => Response;
}): Promise<Response>;
//#endregion
export { DecodeActionFunction, DecodeFormStateFunction, DecodeReplyFunction, LoadServerActionFunction, RSCManifestPayload, RSCMatch, RSCPayload, RSCRenderPayload, RSCRouteConfig, RSCRouteConfigEntry, RSCRouteManifest, RSCRouteMatch, getRequest, matchRSCServerRequest };