import { createFromReadableStream } from "@vitejs/plugin-rsc/ssr";
// @ts-expect-error
import * as ReactDomServer from "react-dom/server.edge";
import {
  unstable_RSCStaticRouter as RSCStaticRouter,
  unstable_routeRSCServerRequest as routeRSCServerRequest,
} from "react-router";

export default async function handler(
  request: Request,
  serverResponse: Response,
) {
  const bootstrapScriptContent =
    await import.meta.viteRsc.loadBootstrapScriptContent("index");

  return routeRSCServerRequest({
    request,
    serverResponse,
    createFromReadableStream,
    async renderHTML(getPayload) {
      const payload = getPayload();

      return ReactDomServer.renderToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
          signal: request.signal,
          formState: await payload.formState,
        },
      );
    },
  });
}
