import { renderToReadableStream as renderHTMLToReadableStream } from "react-dom/server.edge";
import {
  unstable_routeRSCServerRequest as routeRSCServerRequest,
  unstable_RSCStaticRouter as RSCStaticRouter,
} from "react-router";
// @ts-expect-error - no types for this yet
import { createFromReadableStream } from "react-server-dom-parcel/client.edge";

export async function prerender(
  request: Request,
  callServer: (request: Request) => Promise<Response>,
  bootstrapScriptContent: string | undefined
): Promise<Response> {
  return await routeRSCServerRequest({
    // The incoming request.
    request,
    // How to call the React Server.
    callServer,
    // Provide the React Server touchpoints.
    decode: createFromReadableStream,
    // Render the router to HTML.
    async renderHTML(getPayload) {
      const payload = await getPayload();
      const formState =
        payload.type === "render" ? await payload.formState : undefined;

      return await renderHTMLToReadableStream(
        <RSCStaticRouter getPayload={getPayload} />,
        {
          bootstrapScriptContent,
          // @ts-expect-error - no types for this yet
          formState,
        }
      );
    },
  });
}
