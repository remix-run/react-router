/// <reference types="@cloudflare/workers-types" />

import { renderToReadableStream } from "../../framework/server";

import { matchServerRequest } from "react-router";

import { routes } from "../routes";

export default {
  async fetch(request, env) {
    const match = await matchServerRequest(request, routes);
    if (match instanceof Response) {
      return match;
    }

    return new Response(renderToReadableStream(match.payload), {
      status: match.statusCode,
      headers: match.headers,
    });
  },
} satisfies ExportedHandler;
