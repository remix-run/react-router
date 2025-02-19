"use client-entry";

import { startTransition, StrictMode, type ReactElement } from "react";
import { hydrateRoot } from "react-dom/client";
// @ts-expect-error
import { createFromReadableStream } from "react-server-dom-parcel/client";
import { rscStream } from "rsc-html-stream/client";

import { BrowserRouter } from "./react-router.browser";
import type { ServerPayload } from "./react-router.server";

const initialRSCPayloadPromise =
	createFromReadableStream<ReactElement>(rscStream);

initialRSCPayloadPromise.then((initialRSCPayload: ServerPayload) => {
	console.log(initialRSCPayload);
	startTransition(() => {
		hydrateRoot(
			document,
			<StrictMode>
				<BrowserRouter payload={initialRSCPayload} />
			</StrictMode>,
		);
	});
});
