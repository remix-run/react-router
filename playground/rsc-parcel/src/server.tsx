import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";

// @ts-expect-error
import { createFromReadableStream } from "react-server-dom-parcel/client.edge" with {
	env: "react-client",
};
// @ts-expect-error
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge" with {
	env: "react-client",
};

import { routeServerRequest, ServerStaticRouter,type ServerPayload } from "react-router" with {
	env: "react-client",
};

import { callServer } from "./react-server" with {
	env: "react-server",
};

const app = express();

app.use(express.static("dist"));

app.use(
	createRequestListener(async (request) => {
		return routeServerRequest(
			request,
			callServer,
			createFromReadableStream,
			async (payload) => {
				return await renderHTMLToReadableStream(
					<ServerStaticRouter payload={payload} />,
					{
						bootstrapScriptContent: (
							callServer as unknown as { bootstrapScript: string }
						).bootstrapScript,
					},
				);
			}
		);
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
