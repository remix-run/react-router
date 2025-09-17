// @ts-expect-error - no types for this yet
import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";
// @ts-expect-error - no types for this yet
import { createFromReadableStream } from "react-server-dom-parcel/client.edge";

export async function prerender(
  request: Request,
  fetchServer: (request: Request) => Promise<Response>,
  bootstrapScriptContent: string | undefined,
): Promise<Response> {
  return await routeRSCServerRequest({
    // The incoming request.
    request,
    // How to fetch from the React Server.
    fetchServer,
    // Provide the React Server touchpoints.
    createFromReadableStream,
    // Render the router to HTML.
    async renderHTML(getPayload) {
      const payload = getPayload();

      return await renderHTMLToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
          formState: await payload.formState,
        },
      );
    },
  });
}
