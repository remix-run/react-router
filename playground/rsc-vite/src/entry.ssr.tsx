import bootstrapScriptContent from "virtual:vite-rsc/bootstrap-script-content";
import { createFromReadableStream } from "@hiogawa/vite-rsc/ssr";
// @ts-expect-error
import * as ReactDomServer from "react-dom/server.edge";
import {
  unstable_RSCStaticRouter as RSCStaticRouter,
  unstable_routeRSCServerRequest as routeRSCServerRequest,
} from "react-router";

export default async function handler(
  request: Request,
  fetchServer: (request: Request) => Promise<Response>
) {
  return routeRSCServerRequest({
    request,
    fetchServer,
    decode: (body) => createFromReadableStream(body),
    renderHTML(getPayload) {
      return ReactDomServer.renderToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
          signal: request.signal,
        }
      );
    },
  });
}
