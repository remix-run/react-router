
import { EntryContext } from "./entry.js";
import { ReactElement } from "react";

//#region lib/dom/ssr/server.d.ts
/**
 * @category Types
 */
interface ServerRouterProps {
  /**
   * The entry context containing the manifest, route modules, and other data
   * needed for rendering.
   */
  context: EntryContext;
  /**
   * The URL of the request being handled.
   */
  url: string | URL;
  /**
   * An optional `nonce` for [Content Security Policy (CSP)](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
   * compliance. This is applied to inline scripts rendered by React Router and
   * used as the default for nonce-aware components such as {@link Links | `<Links>`},
   * {@link Scripts | `<Scripts>`}, and {@link ScrollRestoration | `<ScrollRestoration>`}
   * when they do not provide their own `nonce`.
   */
  nonce?: string;
}
/**
 * The server entry point for a React Router app in Framework Mode. This
 * component is used to generate the HTML in the response from the server. See
 * [`entry.server.tsx`](../framework-conventions/entry.server.tsx).
 *
 * @public
 * @category Framework Routers
 * @mode framework
 * @param props Props
 * @param {ServerRouterProps.context} props.context n/a
 * @param {ServerRouterProps.nonce} props.nonce n/a
 * @param {ServerRouterProps.url} props.url n/a
 * @returns A React element that represents the server-rendered application.
 */
declare function ServerRouter({
  context,
  url,
  nonce
}: ServerRouterProps): ReactElement;
//#endregion
export { ServerRouter, ServerRouterProps };