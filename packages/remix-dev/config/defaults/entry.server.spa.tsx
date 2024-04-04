import type { EntryContext } from "@remix-run/node";
import { RemixServer } from "react-router-dom";
import * as React from "react";
import { renderToString } from "react-dom/server";

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext
) {
  let html = renderToString(
    <RemixServer context={remixContext} url={request.url} />
  );
  html = "<!DOCTYPE html>\n" + html;
  return new Response(html, {
    headers: { "Content-Type": "text/html" },
    status: responseStatusCode,
  });
}
