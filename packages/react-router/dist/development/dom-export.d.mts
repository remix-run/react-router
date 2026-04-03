import * as React from 'react';
import { a as RouterProviderProps$1, R as RouterInit, u as unstable_ClientInstrumentation, C as ClientOnErrorFunction } from './context-phCt_zmH.mjs';
export { D as unstable_DecodeActionFunction, a as unstable_DecodeFormStateFunction, b as unstable_DecodeReplyFunction, R as unstable_RSCHydratedRouter, d as unstable_RSCManifestPayload, e as unstable_RSCPayload, f as unstable_RSCRenderPayload, c as unstable_createCallServer } from './browser-vtIR1Kpe.mjs';
import './routeModules-BRrCYrSL.mjs';

type RouterProviderProps = Omit<RouterProviderProps$1, "flushSync">;
declare function RouterProvider(props: Omit<RouterProviderProps, "flushSync">): React.JSX.Element;

/**
 * Props for the {@link dom.HydratedRouter} component.
 *
 * @category Types
 */
interface HydratedRouterProps {
    /**
     * Context factory function to be passed through to {@link createBrowserRouter}.
     * This function will be called to create a fresh `context` instance on each
     * navigation/fetch and made available to
     * [`clientAction`](../../start/framework/route-module#clientAction)/[`clientLoader`](../../start/framework/route-module#clientLoader)
     * functions.
     */
    getContext?: RouterInit["getContext"];
    /**
     * Array of instrumentation objects allowing you to instrument the router and
     * individual routes prior to router initialization (and on any subsequently
     * added routes via `route.lazy` or `patchRoutesOnNavigation`).  This is
     * mostly useful for observability such as wrapping navigations, fetches,
     * as well as route loaders/actions/middlewares with logging and/or performance
     * tracing. See the [docs](../../how-to/instrumentation) for more information.
     *
     * ```tsx
     * const logging = {
     *   router({ instrument }) {
     *     instrument({
     *       navigate: (impl, { to }) => logExecution(`navigate ${to}`, impl),
     *       fetch: (impl, { to }) => logExecution(`fetch ${to}`, impl)
     *     });
     *   },
     *   route({ instrument, id }) {
     *     instrument({
     *       middleware: (impl, { request }) => logExecution(
     *         `middleware ${request.url} (route ${id})`,
     *         impl
     *       ),
     *       loader: (impl, { request }) => logExecution(
     *         `loader ${request.url} (route ${id})`,
     *         impl
     *       ),
     *       action: (impl, { request }) => logExecution(
     *         `action ${request.url} (route ${id})`,
     *         impl
     *       ),
     *     })
     *   }
     * };
     *
     * async function logExecution(label: string, impl: () => Promise<void>) {
     *   let start = performance.now();
     *   console.log(`start ${label}`);
     *   await impl();
     *   let duration = Math.round(performance.now() - start);
     *   console.log(`end ${label} (${duration}ms)`);
     * }
     *
     * startTransition(() => {
     *   hydrateRoot(
     *     document,
     *     <HydratedRouter unstable_instrumentations={[logging]} />
     *   );
     * });
     * ```
     */
    unstable_instrumentations?: unstable_ClientInstrumentation[];
    /**
     * An error handler function that will be called for any middleware, loader, action,
     * or render errors that are encountered in your application.  This is useful for
     * logging or reporting errors instead of in the {@link ErrorBoundary} because it's not
     * subject to re-rendering and will only run one time per error.
     *
     * The `errorInfo` parameter is passed along from
     * [`componentDidCatch`](https://react.dev/reference/react/Component#componentdidcatch)
     * and is only present for render errors.
     *
     * ```tsx
     * <HydratedRouter onError=(error, info) => {
     *   let { location, params, unstable_pattern, errorInfo } = info;
     *   console.error(error, location, errorInfo);
     *   reportToErrorService(error, location, errorInfo);
     * }} />
     * ```
     */
    onError?: ClientOnErrorFunction;
    /**
     * Control whether router state updates are internally wrapped in
     * [`React.startTransition`](https://react.dev/reference/react/startTransition).
     *
     * - When left `undefined`, all state updates are wrapped in
     *   `React.startTransition`
     *   - This can lead to buggy behaviors if you are wrapping your own
     *     navigations/fetchers in `startTransition`.
     * - When set to `true`, {@link Link} and {@link Form} navigations will be wrapped
     *   in `React.startTransition` and router state changes will be wrapped in
     *   `React.startTransition` and also sent through
     *   [`useOptimistic`](https://react.dev/reference/react/useOptimistic) to
     *   surface mid-navigation router state changes to the UI.
     * - When set to `false`, the router will not leverage `React.startTransition` or
     *   `React.useOptimistic` on any navigations or state changes.
     *
     * For more information, please see the [docs](https://reactrouter.com/explanation/react-transitions).
     */
    unstable_useTransitions?: boolean;
}
/**
 * Framework-mode router component to be used to hydrate a router from a
 * {@link ServerRouter}. See [`entry.client.tsx`](../framework-conventions/entry.client.tsx).
 *
 * @public
 * @category Framework Routers
 * @mode framework
 * @param props Props
 * @param {dom.HydratedRouterProps.getContext} props.getContext n/a
 * @param {dom.HydratedRouterProps.onError} props.onError n/a
 * @returns A React element that represents the hydrated application.
 */
declare function HydratedRouter(props: HydratedRouterProps): React.JSX.Element;

declare global {
    interface Window {
        __FLIGHT_DATA: any[];
    }
}
/**
 * Get the prerendered [RSC](https://react.dev/reference/rsc/server-components)
 * stream for hydration. Usually passed directly to your
 * `react-server-dom-xyz/client`'s `createFromReadableStream`.
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
 * createFromReadableStream(getRSCStream()).then(
 *   (payload: RSCServerPayload) => {
 *     startTransition(async () => {
 *       hydrateRoot(
 *         document,
 *         <StrictMode>
 *           <RSCHydratedRouter {...props} />
 *         </StrictMode>,
 *         {
 *           // Options
 *         }
 *       );
 *     });
 *   }
 * );
 *
 * @name unstable_getRSCStream
 * @public
 * @category RSC
 * @mode data
 * @returns A [`ReadableStream`](https://developer.mozilla.org/en-US/docs/Web/API/ReadableStream)
 * that contains the [RSC](https://react.dev/reference/rsc/server-components)
 * data for hydration.
 */
declare function getRSCStream(): ReadableStream;

export { HydratedRouter, type HydratedRouterProps, RouterProvider, type RouterProviderProps, getRSCStream as unstable_getRSCStream };
