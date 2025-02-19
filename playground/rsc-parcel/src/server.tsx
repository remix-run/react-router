import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";

// @ts-expect-error
import { renderToReadableStream } from "react-server-dom-parcel/server.edge";
// @ts-expect-error
import { createFromReadableStream } from "react-server-dom-parcel/client.edge" with {
	env: "react-client",
};
// @ts-expect-error
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge" with {
	env: "react-client",
};

import { matchServerRequest, type ServerPayload } from "react-router";
import { routeServerRequest, ServerStaticRouter } from "react-router" with {
	env: "react-client",
};

import { routes } from "./routes" with {
	env: "react-server",
};

const _routes = routes();

const app = express();

app.use(express.static("dist"));

app.use(
	createRequestListener(async (request) => {
		return routeServerRequest(
			request,
			async (request) => {
				const match = await matchServerRequest(request, _routes);
				if (match instanceof Response) {
					return match;
				}

				return new Response(renderToReadableStream(match.payload), {
					status: match.statusCode,
					headers: match.headers,
				});
			},
			async (response) => {
				const payload: ServerPayload = await createFromReadableStream(response.body);

				return await renderHTMLToReadableStream(
					<ServerStaticRouter payload={payload} />,
					{
						bootstrapScriptContent: (
							routes as unknown as { bootstrapScript: string }
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
