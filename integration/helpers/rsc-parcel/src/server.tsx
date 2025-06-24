import { createRequestListener } from "@mjackson/node-fetch-server";
import express from "express";
import type {
  unstable_DecodeCallServerFunction as DecodeCallServerFunction,
  unstable_DecodeFormActionFunction as DecodeFormActionFunction,
} from "react-router";
import { unstable_matchRSCServerRequest as matchRSCServerRequest } from "react-router";
import {
  decodeAction,
  decodeFormState,
  decodeReply,
  loadServerAction,
  renderToReadableStream,
  // @ts-expect-error - no types for this yet
} from "react-server-dom-parcel/server.edge";

// Import the prerender function from the client envrionment
import { prerender } from "./prerender" with { env: "react-client" };
import { routes } from "./routes";
import { assets } from "./parcel-entry-wrapper"

// Decode and load actions by ID to support post-hydration server actions.
const decodeCallServer: DecodeCallServerFunction = async (actionId, reply) => {
  const args = await decodeReply(reply);
  const action = await loadServerAction(actionId);
  return action.bind(null, ...args);
};

// Decode and load actions by form data to pre-hydration server actions.
const decodeFormAction: DecodeFormActionFunction = async (formData) => {
  return await decodeAction(formData);
};

function callServer(request: Request) {
  return matchRSCServerRequest({
    // Provide the React Server touchpoints.
    decodeCallServer,
    decodeFormAction,
    decodeFormState,
    // The incoming request.
    request,
    // The app routes.
    routes,
    // Encode the match with the React Server implementation.
    generateResponse(match) {
      return new Response(renderToReadableStream(match.payload), {
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
      callServer,
      (assets as unknown as { bootstrapScript?: string }).bootstrapScript
    )
  )
);

const port = parseInt(process.env.RR_PORT || "3000", 10);
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
