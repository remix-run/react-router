
//#region lib/rsc/html-stream/browser.d.ts
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
//#endregion
export { getRSCStream };