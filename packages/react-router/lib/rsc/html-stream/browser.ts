// https://github.com/devongovett/rsc-html-stream/blob/main/client.js

declare global {
  interface Window {
    __FLIGHT_DATA: any[];
  }
}

/**
 * Get the prerendered RSC stream for hydration. Usually passed directly to your
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
 *           <RSCHydratedRouter ...props />
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
 * @returns A `ReadableStream` that contains the RSC data for hydration.
 */
export function getRSCStream(): ReadableStream<any> {
  let encoder = new TextEncoder();
  let streamController: ReadableStreamDefaultController<Uint8Array> | null =
    null;
  let rscStream = new ReadableStream({
    start(controller) {
      if (typeof window === "undefined") {
        return;
      }
      let handleChunk = (chunk: string) => {
        if (typeof chunk === "string") {
          controller.enqueue(encoder.encode(chunk));
        } else {
          controller.enqueue(chunk);
        }
      };
      window.__FLIGHT_DATA ||= [];
      window.__FLIGHT_DATA.forEach(handleChunk);
      window.__FLIGHT_DATA.push = (chunk) => {
        handleChunk(chunk);
        return 0;
      };
      streamController = controller;
    },
  });

  if (typeof document !== "undefined" && document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      streamController?.close();
    });
  } else {
    (streamController as any)?.close();
  }

  return rscStream;
}
