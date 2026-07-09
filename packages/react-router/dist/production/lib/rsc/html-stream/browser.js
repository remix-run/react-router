/**
 * react-router v8.1.0
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */
//#region lib/rsc/html-stream/browser.ts
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
function getRSCStream() {
	let encoder = new TextEncoder();
	let streamController = null;
	let rscStream = new ReadableStream({ start(controller) {
		if (typeof window === "undefined") return;
		let handleChunk = (chunk) => {
			if (typeof chunk === "string") controller.enqueue(encoder.encode(chunk));
			else controller.enqueue(chunk);
		};
		window.__FLIGHT_DATA ||= [];
		window.__FLIGHT_DATA.forEach(handleChunk);
		window.__FLIGHT_DATA.push = (chunk) => {
			handleChunk(chunk);
			return 0;
		};
		streamController = controller;
	} });
	if (typeof document !== "undefined" && document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => {
		streamController?.close();
	});
	else streamController?.close();
	return rscStream;
}
//#endregion
export { getRSCStream };
