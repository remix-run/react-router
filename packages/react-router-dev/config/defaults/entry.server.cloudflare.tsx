import {
  type AppLoadContext,
  type EntryContext,
  ServerRouter,
} from "react-router";
import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";

const ABORT_DELAY = 5_000;

export default async function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext
) {
  let userAgent = request.headers.get("user-agent");

  let ac = new AbortController();

  let timeoutId = setTimeout(() => {
    ac.abort();
  }, ABORT_DELAY);

  let body = await renderToReadableStream(
    <ServerRouter
      context={routerContext}
      url={request.url}
      abortDelay={ABORT_DELAY}
    />,
    {
      signal: ac.signal,
      onError(error: unknown) {
        responseStatusCode = 500;
        console.error(error);
      },
    }
  );

  /** Ensure requests from bots and SPA Mode renders wait for all content to load before responding
   * {@link https://react.dev/reference/react-dom/server/renderToReadableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation | Waiting for all content to load for crawlers and static generation }
   */
  if ((userAgent && isbot(userAgent)) || routerContext.isSpaMode) {
    await body.allReady;
  }

  responseHeaders.set("Content-Type", "text/html");
  clearTimeout(timeoutId);
  return new Response(body, {
    headers: responseHeaders,
    status: responseStatusCode,
  });
}
