import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
import {
  createTemporaryReferenceSet,
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
  // @ts-expect-error - no types for this yet
} from "react-server-dom-parcel/server.edge";

// Import the prerender function from the client environment
import { prerender } from "./prerender" with { env: "react-client" };
import { routes } from "./routes";
import { assets } from "./parcel-entry-wrapper"
import { basename } from "./config/basename";
import { requestContext } from "./config/request-context";

function fetchServer(request: Request) {
  return matchRSCServerRequest({
    // Provide the React Server touchpoints.
    createTemporaryReferenceSet,
    decodeReply,
    decodeAction,
    decodeFormState,
    loadServerAction,
    // The incoming request.
    request,
    requestContext,
    // The app routes.
    routes,
    basename,
    // Encode the match with the React Server implementation.
    generateResponse(match, options) {
      return new Response(renderToReadableStream(match.payload, options), {
        status: match.statusCode,
        headers: match.headers,
      });
    },
  });
}

const app = express();

// Serve static assets with compression and long cache lifetime.
app.use(
  "/client",
  express.static("dist/client", {
    immutable: true,
    maxAge: "1y",
  })
);
app.use(express.static("public"));

// Ignore Chrome extension requests.
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(404);
  res.end();
});

// Hookup our application.
app.use(
  createRequestListener((request) =>
    prerender(
      request,
      fetchServer,
      (assets as unknown as { bootstrapScript?: string }).bootstrapScript
    )
  )
);

const port = parseInt(process.env.RR_PORT || "3000", 10);
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
