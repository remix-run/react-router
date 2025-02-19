import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
import { injectRSCPayload } from "rsc-html-stream/server";

// @ts-expect-error
import { createFromReadableStream } from "react-server-dom-parcel/client.edge" with {
	env: "react-client",
};
// @ts-expect-error
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge" with {
	env: "react-client",
};
import { PrerenderRouter } from "./react-router.ssr" with {
	env: "react-client",
};

import { handleRequest, type ServerPayload } from "./react-router.server";

import { routes } from "./routes";

const _routes = routes();

const app = express();

app.use(express.static("dist"));

app.use(
	createRequestListener(async (request) => {
		let serverRequest = request;
		const serverURL = new URL(request.url);
		const isDataRequest = serverURL.pathname.endsWith(".data");
		if (isDataRequest) {
			serverURL.pathname = serverURL.pathname.replace(/\.data$/, "");
			serverRequest = new Request(serverURL, {
				body: request.body,
				duplex: request.body ? "half" : undefined,
				headers: request.headers,
				method: request.method,
				signal: request.signal,
			} as RequestInit & { duplex?: "half" });
		}
		const serverResponse = await handleRequest(serverRequest, _routes);

		if (isDataRequest || serverResponse.headers.has("x-react-router-error")) {
			return serverResponse;
		}

		if (!serverResponse.body) {
			throw new Error("No body in server response");
		}

		const [rscStreamA, rscStreamB] = serverResponse.body.tee();

		const payload: ServerPayload = await createFromReadableStream(rscStreamA);

		const htmlStream = await renderHTMLToReadableStream(
			<PrerenderRouter payload={payload} />,
			{
				bootstrapScriptContent: (
					routes as unknown as { bootstrapScript: string }
				).bootstrapScript,
			},
		);

		const headers = new Headers(serverResponse.headers);
		headers.set("Content-Type", "text/html");

		return new Response(htmlStream.pipeThrough(injectRSCPayload(rscStreamB)), {
			status: serverResponse.status,
			headers,
		});
	}),
);

const server = app.listen(3001);
console.log("Server listening on port 3001");

// Restart the server when it changes.
if (module.hot) {
	module.hot.dispose(() => {
		server.close();
	});

	module.hot.accept();
}
