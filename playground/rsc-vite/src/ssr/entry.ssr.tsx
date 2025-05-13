/// <reference types="@cloudflare/workers-types" />

// @ts-expect-error
import RSD from "@jacob-ebey/react-server-dom-vite/client";
// @ts-expect-error
import RDS from "react-dom/server.edge";
// @ts-expect-error
import { bootstrapModules, manifest } from "virtual:react-manifest";

import { routeRSCServerRequest, RSCStaticRouter } from "react-router";

type CloudflareEnv = {
  ASSETS: Fetcher;
  SERVER: Fetcher;
};

export default {
  async fetch(request, { SERVER }) {
    const callServer = async (request: Request) => await SERVER.fetch(request);
    try {
      return await routeRSCServerRequest({
        request,
        requestServer: callServer,
        decode: (body) => RSD.createFromReadableStream(body, manifest),
        async renderHTML(getPayload) {
          return await RDS.renderToReadableStream(
            <RSCStaticRouter getPayload={getPayload} />,
            {
              bootstrapModules,
              signal: request.signal,
            }
          );
        },
      });
    } catch (reason) {
      console.error(reason);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
