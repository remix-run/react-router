/**
 * @jest-environment node
 */

import { decodeViaTurboStream } from "../../lib/dom/ssr/single-fetch";
import {
  ErrorResponseImpl,
  isRouteErrorResponse,
  type LoaderFunctionArgs,
} from "../../lib/router/utils";
import { createRequestHandler } from "../../lib/server-runtime/server";
import { encodeViaTurboStream } from "../../lib/server-runtime/single-fetch";
import { ServerMode } from "../../lib/server-runtime/mode";
import { mockServerBuild } from "./utils";

describe.each([false, true])(
  "single fetch with v8_passThroughRequests=%s",
  (v8_passThroughRequests) => {
    it.each([
      ["GET", "/items/foo.data.data", "/items/foo.data", false],
      ["POST", "/items/foo.data.data", "/items/foo.data", false],
      ["GET", "/items/foo.data.data", "/items/foo.data", true],
      ["POST", "/items/foo.data.data", "/items/foo.data", true],
      ["GET", "/items/foo.data/_.data", "/items/foo.data/", true],
      ["POST", "/items/foo.data/_.data", "/items/foo.data/", true],
    ] as const)(
      "preserves .data in route params for %s %s matching %s (trailing slash aware=%s)",
      async (
        method,
        requestPath,
        pathname,
        v8_trailingSlashAwareDataRequests,
      ) => {
        let routeId = "routes/items.$id";
        let routeHandler = ({ params, request, url }: LoaderFunctionArgs) => ({
          id: params.id,
          requestUrl: request.url,
          url: url.href,
        });
        let build = mockServerBuild(
          {
            [routeId]: {
              path: "/items/:id",
              default: {},
              loader: routeHandler,
              action: routeHandler,
            },
          },
          {
            future: {
              v8_passThroughRequests,
              v8_trailingSlashAwareDataRequests,
            },
          },
        );
        build.basename = "/base";
        let handler = createRequestHandler(build);
        let requestUrl = `http://example.com/base${requestPath}?index&a=1&_routes=${routeId}`;
        let response = await handler(new Request(requestUrl, { method }));

        expect(response.status).toBe(200);
        if (!response.body) throw new Error("No body");
        let decoded = await decodeViaTurboStream(response.body, global);
        let result = decoded.value as any;
        let expectedUrl = `http://example.com/base${pathname}?a=1`;
        expect(method === "GET" ? result[routeId].data : result.data).toEqual({
          id: "foo.data",
          requestUrl: v8_passThroughRequests ? requestUrl : expectedUrl,
          url: expectedUrl,
        });
      },
    );
  },
);

describe("loaders", () => {
  // so that HTML/Fetch requests are the same, and so redirects don't hang on to
  // this param for no reason
  it("removes .data from request.url", async () => {
    let loader = async ({ request }) => {
      return new URL(request.url).pathname;
    };

    let routeId = "routes/random";
    let build = mockServerBuild({
      [routeId]: {
        path: "/random",
        default: {},
        loader,
      },
    });

    let handler = createRequestHandler(build);

    let request = new Request("http://example.com/random.data", {
      headers: {
        "Content-Type": "application/json",
      },
    });

    let res = await handler(request);
    if (!res.body) throw new Error("No body");
    const decoded = await decodeViaTurboStream(res.body, global);
    expect((decoded.value as any)[routeId].data).toEqual("/random");
  });
});

describe("turbo-stream error decoding", () => {
  it("decodes ErrorResponse instances", async () => {
    let body = encodeViaTurboStream(
      {
        errors: {
          root: new ErrorResponseImpl(404, "Not Found", "Missing", true),
        },
      },
      new AbortController().signal,
      undefined,
      ServerMode.Development,
    );

    let decoded = await decodeViaTurboStream(body, global);
    let error = (decoded.value as any).errors.root;

    expect(isRouteErrorResponse(error)).toBe(true);
    expect(error.status).toBe(404);
    expect(error.statusText).toBe("Not Found");
    expect(error.data).toBe("Missing");
    expect(error.internal).toBe(false);
  });
});
