import type { InstrumentationResultMeta } from "../../lib/router/instrumentation";
import { data } from "../../lib/router/utils";
import { createRequestHandler } from "../../lib/server-runtime/server";
import { mockServerBuild } from "./utils";

type RequestInstrumentationResult = {
  status: string;
  error: string | undefined;
  statusCode: number;
  meta: InstrumentationResultMeta | undefined;
};

describe("createRequestHandler", () => {
  it("returns route metadata from request handler instrumentations", async () => {
    let meta: unknown;
    let statusCode: number;
    let build = mockServerBuild(
      {
        root: {
          default: true,
        },
        "routes/user": {
          parentId: "root",
          path: "users/:id",
          default: true,
          loader: () => null,
        },
      },
      {
        instrumentations: [
          {
            handler({ instrument }) {
              instrument({
                async request(callHandler) {
                  let result = await callHandler();
                  meta = result.meta;
                  statusCode = result.statusCode;
                },
              });
            },
          },
        ],
      },
    );
    let handler = createRequestHandler(build);

    await handler(
      new Request("http://example.com/users/123", {
        signal: new AbortController().signal,
      }),
    );

    expect(meta).toEqual({
      url: expect.any(URL),
      pattern: "users/:id",
      params: { id: "123" },
    });
    expect(meta?.url.href).toBe("http://example.com/users/123");
    expect(statusCode).toBe(200);
  });

  it("does not return route metadata from request handler instrumentations for manifest requests", async () => {
    let meta: unknown = "unset";
    let statusCode: number | undefined;
    let build = mockServerBuild(
      {
        root: {
          default: {},
        },
        "routes/a": {
          path: "a",
        },
      },
      {
        instrumentations: [
          {
            handler({ instrument }) {
              instrument({
                async request(callHandler) {
                  let result = await callHandler();
                  meta = result.meta;
                  statusCode = result.statusCode;
                },
              });
            },
          },
        ],
      },
    );
    let handler = createRequestHandler(build);

    let response = await handler(
      new Request(
        `http://example.com/__manifest?paths=%2Fa&version=${build.assets.version}`,
        {
          signal: new AbortController().signal,
        },
      ),
    );

    expect(response.status).toBe(200);
    expect(meta).toBeUndefined();
    expect(statusCode).toBe(200);
  });

  it("returns an error boundary response from request handler instrumentations for thrown loader errors", async () => {
    let requestResult: RequestInstrumentationResult | undefined;
    let build = mockServerBuild(
      {
        root: {
          path: "/",
          default: true,
          ErrorBoundary: true,
          loader() {
            throw new Error("Kaboom!");
          },
        },
      },
      {
        handleError() {},
        handleDocumentRequest(_request, status) {
          return new Response("Route error boundary rendered", { status });
        },
        instrumentations: [
          {
            handler({ instrument }) {
              instrument({
                async request(callHandler) {
                  let result = await callHandler();
                  requestResult = {
                    status: result.status,
                    error: result.error?.message,
                    statusCode: result.statusCode,
                    meta: result.meta,
                  };
                },
              });
            },
          },
        ],
      },
    );
    let handler = createRequestHandler(build);

    let response = await handler(
      new Request("http://example.com/", {
        signal: new AbortController().signal,
      }),
    );

    expect(response.status).toBe(500);
    expect(await response.text()).toBe("Route error boundary rendered");
    expect(requestResult).toEqual({
      status: "success",
      error: undefined,
      statusCode: 500,
      meta: {
        url: expect.any(URL),
        pattern: "/",
        params: {},
      },
    });
    expect(requestResult?.meta?.url.href).toBe("http://example.com/");
  });

  it("returns an error boundary response from request handler instrumentations for thrown data", async () => {
    let requestResult: RequestInstrumentationResult | undefined;
    let build = mockServerBuild(
      {
        root: {
          path: "/",
          default: true,
          ErrorBoundary: true,
          loader() {
            throw data(
              { message: "Nope!" },
              { status: 418, statusText: "I'm a teapot" },
            );
          },
        },
      },
      {
        handleError() {},
        handleDocumentRequest(_request, status) {
          return new Response("Route error boundary rendered", { status });
        },
        instrumentations: [
          {
            handler({ instrument }) {
              instrument({
                async request(callHandler) {
                  let result = await callHandler();
                  requestResult = {
                    status: result.status,
                    error: result.error?.message,
                    statusCode: result.statusCode,
                    meta: result.meta,
                  };
                },
              });
            },
          },
        ],
      },
    );
    let handler = createRequestHandler(build);

    let response = await handler(
      new Request("http://example.com/", {
        signal: new AbortController().signal,
      }),
    );

    expect(response.status).toBe(418);
    expect(await response.text()).toBe("Route error boundary rendered");
    expect(requestResult).toEqual({
      status: "success",
      error: undefined,
      statusCode: 418,
      meta: {
        url: expect.any(URL),
        pattern: "/",
        params: {},
      },
    });
    expect(requestResult?.meta?.url.href).toBe("http://example.com/");
  });

  it("retains request headers when stripping body off for loaders", async () => {
    let build = mockServerBuild({
      root: {
        path: "/test",
        loader: ({ request }) => Response.json(request.headers.get("X-Foo")),
      },
    });
    let handler = createRequestHandler(build);

    let response = await handler(
      new Request("http://.../test", {
        headers: {
          "X-Foo": "bar",
        },
        signal: new AbortController().signal,
      }),
    );

    expect(await response.json()).toBe("bar");
  });
});
