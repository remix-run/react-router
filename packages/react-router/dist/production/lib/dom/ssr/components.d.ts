
import { PageLinkDescriptor } from "../../router/links.js";
import { FrameworkContextObject } from "./entry.js";
import * as React$1 from "react";

//#region lib/dom/ssr/components.d.ts
declare const FrameworkContext: React$1.Context<FrameworkContextObject | undefined>;
/**
 * Defines the [lazy route discovery](../../explanation/lazy-route-discovery)
 * behavior of the link/form:
 *
 * - "render" - default, discover the route when the link renders
 * - "none" - don't eagerly discover, only discover if the link is clicked
 */
type DiscoverBehavior = "render" | "none";
/**
 * Defines the prefetching behavior of the link:
 *
 * - "none": Never fetched
 * - "intent": Fetched when the user focuses or hovers the link
 * - "render": Fetched when the link is rendered
 * - "viewport": Fetched when the link is in the viewport
 */
type PrefetchBehavior = "intent" | "render" | "none" | "viewport";
/**
 * Props for the {@link Links} component.
 *
 * @category Types
 */
interface LinksProps {
  /**
   * A [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
   * attribute to render on the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
   * element. If not provided in Framework Mode, it will default to any
   * {@link ServerRouter | `<ServerRouter nonce>`} prop.
   */
  nonce?: string | undefined;
  /**
   * A [`crossOrigin`](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin)
   * attribute to render on the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
   * element
   */
  crossOrigin?: "anonymous" | "use-credentials";
}
/**
 * Renders all the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
 * tags created by the route module's [`links`](../../start/framework/route-module#links)
 * export. You should render it inside the [`<head>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)
 * of your document.
 *
 * @example
 * import { Links } from "react-router";
 *
 * export default function Root() {
 *   return (
 *     <html>
 *       <head>
 *         <Links />
 *       </head>
 *       <body></body>
 *     </html>
 *   );
 * }
 *
 * @public
 * @category Components
 * @mode framework
 * @param props Props
 * @param {LinksProps.nonce} props.nonce n/a
 * @param {LinksProps.crossOrigin} props.crossOrigin n/a
 * @returns A collection of React elements for [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
 * tags
 */
declare function Links({
  nonce,
  crossOrigin
}: LinksProps): React$1.JSX.Element;
/**
 * Renders [`<link rel=prefetch|modulepreload>`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/rel)
 * tags for modules and data of another page to enable an instant navigation to
 * that page. [`<Link prefetch>`](./Link#prefetch) uses this internally, but you
 * can render it to prefetch a page for any other reason.
 *
 * For example, you may render one of this as the user types into a search field
 * to prefetch search results before they click through to their selection.
 *
 * @example
 * import { PrefetchPageLinks } from "react-router";
 *
 * <PrefetchPageLinks page="/absolute/path" />
 *
 * @public
 * @category Components
 * @mode framework
 * @param props Props
 * @param {PageLinkDescriptor.page} props.page n/a
 * @param props.linkProps Additional props to spread onto the [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
 * tags, such as [`crossOrigin`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/crossOrigin),
 * [`integrity`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/integrity),
 * [`rel`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLLinkElement/rel),
 * etc.
 * @returns A collection of React elements for [`<link>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/link)
 * tags
 */
declare function PrefetchPageLinks({
  page,
  ...linkProps
}: PageLinkDescriptor): React$1.JSX.Element | null;
/**
 * Renders all the [`<meta>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta)
 * tags created by the route module's [`meta`](../../start/framework/route-module#meta)
 * export. You should render it inside the [`<head>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/head)
 * of your document.
 *
 * @example
 * import { Meta } from "react-router";
 *
 * export default function Root() {
 *   return (
 *     <html>
 *       <head>
 *         <Meta />
 *       </head>
 *     </html>
 *   );
 * }
 *
 * @public
 * @category Components
 * @mode framework
 * @returns A collection of React elements for [`<meta>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/meta)
 * tags
 */
declare function Meta(): React$1.JSX.Element;
/**
 * A couple common attributes:
 *
 * - `<Scripts crossOrigin>` for hosting your static assets on a different
 *   server than your app.
 * - `<Scripts nonce>` to support a [content security policy for scripts](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/script-src)
 * with [nonce-sources](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/Sources#sources)
 * for your [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
 * tags.
 *
 * You cannot pass through attributes such as [`async`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/async),
 * [`defer`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/defer),
 * [`noModule`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/noModule),
 * [`src`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/src),
 * or [`type`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/type),
 * because they are managed by React Router internally.
 *
 * @category Types
 */
type ScriptsProps = Omit<React$1.HTMLProps<HTMLScriptElement>, "async" | "children" | "dangerouslySetInnerHTML" | "defer" | "noModule" | "src" | "suppressHydrationWarning" | "type"> & {
  /**
   * A [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce)
   * attribute to render on the [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
   * element. If not provided in Framework Mode, it will default to any
   * {@link ServerRouter | `<ServerRouter nonce>`} prop.
   */
  nonce?: string | undefined;
};
/**
 * Renders the client runtime of your app. It should be rendered inside the
 * [`<body>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/body)
 *  of the document.
 *
 * If server rendering, you can omit `<Scripts/>` and the app will work as a
 * traditional web app without JavaScript, relying solely on HTML and browser
 * behaviors.
 *
 * @example
 * import { Scripts } from "react-router";
 *
 * export default function Root() {
 *   return (
 *     <html>
 *       <head />
 *       <body>
 *         <Scripts />
 *       </body>
 *     </html>
 *   );
 * }
 *
 * @public
 * @category Components
 * @mode framework
 * @param scriptProps Additional props to spread onto the [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
 * tags, such as [`crossOrigin`](https://developer.mozilla.org/en-US/docs/Web/API/HTMLScriptElement/crossOrigin),
 * [`nonce`](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Global_attributes/nonce),
 * etc.
 * @returns A collection of React elements for [`<script>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script)
 * tags
 */
declare function Scripts(scriptProps: ScriptsProps): React$1.JSX.Element | null;
//#endregion
export { DiscoverBehavior, FrameworkContext, Links, LinksProps, Meta, PrefetchBehavior, PrefetchPageLinks, Scripts, ScriptsProps };