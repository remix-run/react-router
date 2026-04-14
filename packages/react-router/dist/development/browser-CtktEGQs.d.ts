import * as React from 'react';
import { R as RouterInit } from './instrumentation-CMVbvxj9.js';
import { L as Location, C as ClientActionFunction, a as ClientLoaderFunction, b as LinksFunction, M as MetaFunction, S as ShouldRevalidateFunction, P as Params, c as RouterContextProvider, A as ActionFunction, H as HeadersFunction, d as LoaderFunction } from './routeModules-CM_clkdE.js';

declare function getRequest(): Request;
type RSCRouteConfigEntryBase = {
    action?: ActionFunction;
    clientAction?: ClientActionFunction;
    clientLoader?: ClientLoaderFunction;
    ErrorBoundary?: React.ComponentType<any>;
    handle?: any;
    headers?: HeadersFunction;
    HydrateFallback?: React.ComponentType<any>;
    Layout?: React.ComponentType<any>;
    links?: LinksFunction;
    loader?: LoaderFunction;
    meta?: MetaFunction;
    shouldRevalidate?: ShouldRevalidateFunction;
};
type RSCRouteConfigEntry = RSCRouteConfigEntryBase & {
    id: string;
    path?: string;
    Component?: React.ComponentType<any>;
    lazy?: () => Promise<RSCRouteConfigEntryBase & ({
        default?: React.ComponentType<any>;
        Component?: never;
    } | {
        default?: never;
        Component?: React.ComponentType<any>;
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
    element?: React.ReactElement | false;
    errorElement?: React.ReactElement;
    handle?: any;
    hasAction: boolean;
    hasComponent: boolean;
    hasErrorBoundary: boolean;
    hasLoader: boolean;
    hydrateFallbackElement?: React.ReactElement;
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
    formState?: unknown;
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
type DecodeFormStateFunction = (result: unknown, formData: FormData) => unknown;
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
declare function matchRSCServerRequest({ allowedActionOrigins, createTemporaryReferenceSet, basename, decodeReply, requestContext, routeDiscovery, loadServerAction, decodeAction, decodeFormState, onError, request, routes, generateResponse, }: {
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
    generateResponse: (match: RSCMatch, { onError, temporaryReferences, }: {
        onError(error: unknown): string | undefined;
        temporaryReferences: unknown;
    }) => Response;
}): Promise<Response>;

type BrowserCreateFromReadableStreamFunction = (body: ReadableStream<Uint8Array>, { temporaryReferences, }: {
    temporaryReferences: unknown;
}) => Promise<unknown>;
type EncodeReplyFunction = (args: unknown[], options: {
    temporaryReferences: unknown;
}) => Promise<BodyInit>;
/**
 * Create a React `callServer` implementation for React Router.
 *
 * @example
 * import {
 *   createFromReadableStream,
 *   createTemporaryReferenceSet,
 *   encodeReply,
 *   setServerCallback,
 * } from "@vitejs/plugin-rsc/browser";
 * import { unstable_createCallServer as createCallServer } from "react-router";
 *
 * setServerCallback(
 *   createCallServer({
 *     createFromReadableStream,
 *     createTemporaryReferenceSet,
 *     encodeReply,
 *   })
 * );
 *
 * @name unstable_createCallServer
 * @public
 * @category RSC
 * @mode data
 * @param opts Options
 * @param opts.createFromReadableStream Your `react-server-dom-xyz/client`'s
 * `createFromReadableStream`. Used to decode payloads from the server.
 * @param opts.createTemporaryReferenceSet A function that creates a temporary
 * reference set for the [RSC](https://react.dev/reference/rsc/server-components)
 * payload.
 * @param opts.encodeReply Your `react-server-dom-xyz/client`'s `encodeReply`.
 * Used when sending payloads to the server.
 * @param opts.fetch Optional [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
 * implementation. Defaults to global [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch).
 * @returns A function that can be used to call server actions.
 */
declare function createCallServer({ createFromReadableStream, createTemporaryReferenceSet, encodeReply, fetch: fetchImplementation, }: {
    createFromReadableStream: BrowserCreateFromReadableStreamFunction;
    createTemporaryReferenceSet: () => unknown;
    encodeReply: EncodeReplyFunction;
    fetch?: (request: Request) => Promise<Response>;
}): (id: string, args: unknown[]) => Promise<unknown>;
/**
 * Props for the {@link unstable_RSCHydratedRouter} component.
 *
 * @name unstable_RSCHydratedRouterProps
 * @category Types
 */
interface RSCHydratedRouterProps {
    /**
     * Your `react-server-dom-xyz/client`'s `createFromReadableStream` function,
     * used to decode payloads from the server.
     */
    createFromReadableStream: BrowserCreateFromReadableStreamFunction;
    /**
     * Optional fetch implementation. Defaults to global [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch).
     */
    fetch?: (request: Request) => Promise<Response>;
    /**
     * The decoded {@link unstable_RSCPayload} to hydrate.
     */
    payload: RSCPayload;
    /**
     * A function that returns an {@link RouterContextProvider} instance
     * which is provided as the `context` argument to client [`action`](../../start/data/route-object#action)s,
     * [`loader`](../../start/data/route-object#loader)s and [middleware](../../how-to/middleware).
     * This function is called to generate a fresh `context` instance on each
     * navigation or fetcher call.
     */
    getContext?: RouterInit["getContext"];
}
/**
 * Hydrates a server rendered {@link unstable_RSCPayload} in the browser.
 *
 * @example
 * import { startTransition, StrictMode } from "react";
 * import { hydrateRoot } from "react-dom/client";
 * import {
 *   unstable_getRSCStream as getRSCStream,
 *   unstable_RSCHydratedRouter as RSCHydratedRouter,
 * } from "react-router";
 * import type { unstable_RSCPayload as RSCPayload } from "react-router";
 *
 * createFromReadableStream(getRSCStream()).then((payload) =>
 *   startTransition(async () => {
 *     hydrateRoot(
 *       document,
 *       <StrictMode>
 *         <RSCHydratedRouter
 *           createFromReadableStream={createFromReadableStream}
 *           payload={payload}
 *         />
 *       </StrictMode>,
 *       { formState: await getFormState(payload) },
 *     );
 *   }),
 * );
 *
 * @name unstable_RSCHydratedRouter
 * @public
 * @category RSC
 * @mode data
 * @param props Props
 * @param {unstable_RSCHydratedRouterProps.createFromReadableStream} props.createFromReadableStream n/a
 * @param {unstable_RSCHydratedRouterProps.fetch} props.fetch n/a
 * @param {unstable_RSCHydratedRouterProps.getContext} props.getContext n/a
 * @param {unstable_RSCHydratedRouterProps.payload} props.payload n/a
 * @returns A hydrated {@link DataRouter} that can be used to navigate and
 * render routes.
 */
declare function RSCHydratedRouter({ createFromReadableStream, fetch: fetchImplementation, payload, getContext, }: RSCHydratedRouterProps): React.JSX.Element;

export { type BrowserCreateFromReadableStreamFunction as B, type DecodeActionFunction as D, type EncodeReplyFunction as E, type LoadServerActionFunction as L, RSCHydratedRouter as R, type DecodeFormStateFunction as a, type DecodeReplyFunction as b, createCallServer as c, type RSCManifestPayload as d, type RSCPayload as e, type RSCRenderPayload as f, getRequest as g, type RSCHydratedRouterProps as h, type RSCMatch as i, type RSCRouteManifest as j, type RSCRouteMatch as k, type RSCRouteConfigEntry as l, matchRSCServerRequest as m, type RSCRouteConfig as n };
