import type * as express from "express";
import { createStaticHandler } from "@remix-run/router";
import * as React from "react";
import ReactDOMServer from "react-dom/server";
import { DataStaticRouter } from "react-router-dom/server";
import { routes } from "./App";

export async function render(request: express.Request) {
  let { dataRoutes, query } = createStaticHandler({ routes });
  let remixRequest = createFetchRequest(request);
  let state = await query(remixRequest);

  if (state instanceof Response) {
    throw state;
  }

  let html = ReactDOMServer.renderToString(
    <React.StrictMode>
      <DataStaticRouter dataRoutes={dataRoutes} state={state} />
    </React.StrictMode>
  );

  return {
    hydrationData: {
      loaderData: state.loaderData,
      actionData: state.loaderData,
      errors: state.errors,
    },
    html,
  };
}

export function createFetchHeaders(
  requestHeaders: express.Request["headers"]
): Headers {
  let headers = new Headers();

  for (let [key, values] of Object.entries(requestHeaders)) {
    if (values) {
      if (Array.isArray(values)) {
        for (let value of values) {
          headers.append(key, value);
        }
      } else {
        headers.set(key, values);
      }
    }
  }

  return headers;
}

export function createFetchRequest(req: express.Request): Request {
  let origin = `${req.protocol}://${req.get("host")}`;
  // Note: This had to take originalUrl into account for presumably vite's proxying
  let url = new URL(req.originalUrl || req.url, origin);

  let controller = new AbortController();

  req.on("close", () => {
    controller.abort();
  });

  let init: RequestInit = {
    method: req.method,
    headers: createFetchHeaders(req.headers),
    signal: controller.signal,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = req.body;
  }

  return new Request(url.href, init);
}
