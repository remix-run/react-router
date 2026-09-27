
import { RouterInit } from "../router/router.js";
import { RSCPayload } from "./server.rsc.js";
import * as React$1 from "react";

//#region lib/rsc/browser.d.ts
type BrowserCreateFromReadableStreamFunction = (body: ReadableStream<Uint8Array>, {
  temporaryReferences
}: {
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
declare function createCallServer({
  createFromReadableStream,
  createTemporaryReferenceSet,
  encodeReply,
  fetch: fetchImplementation
}: {
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
declare function RSCHydratedRouter({
  createFromReadableStream,
  fetch: fetchImplementation,
  payload,
  getContext
}: RSCHydratedRouterProps): React$1.JSX.Element;
//#endregion
export { BrowserCreateFromReadableStreamFunction, EncodeReplyFunction, RSCHydratedRouter, RSCHydratedRouterProps, createCallServer };