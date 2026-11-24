import * as React from "react";
import { renderToReadableStream } from "react-dom/server.edge";
import { renderToString } from "react-dom/server.node";

import {
  Await,
  matchRSCServerRequest,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";
import {
  RSCStaticRouter,
  routeRSCServerRequest,
} from "../../lib/rsc/server.ssr";
import { URL_LIMIT } from "../../lib/dom/ssr/fog-of-war";

describe("RSC server", () => {
  describe("Await", () => {
    describe.each(["resolve", "unstable_promise"] as const)("%s", (prop) => {
      test.each(["Value", undefined, null, false, 0, ""])(
        "supplies the resolved value to children: %p",
        async (value) => {
          let received: unknown = "unset";
          await Await({
            ...(prop === "unstable_promise"
              ? { unstable_promise: value }
              : { resolve: value }),
            children(data) {
              received = data;
              return null;
            },
          });
          expect(received).toBe(value);
        },
      );

      test("supplies fulfilled promises to children", async () => {
        let promise = Promise.resolve("Value");
        let received: unknown;
        await Await({
          ...(prop === "unstable_promise"
            ? { unstable_promise: promise }
            : { resolve: promise }),
          children(value) {
            received = value;
            return null;
          },
        });
        expect(received).toBe("Value");
      });

      test("propagates rejections without an errorElement", async () => {
        let error = new Error("Rejected");
        let promise = Promise.reject(error);
        promise.catch(() => {});
        await expect(
          Await({
            ...(prop === "unstable_promise"
              ? { unstable_promise: promise }
              : { resolve: promise }),
            children: "Success",
          }),
        ).rejects.toBe(error);
      });

      test("propagates child render errors past errorElement", async () => {
        let error = new Error("Render failed");
        await expect(
          Await({
            ...(prop === "unstable_promise"
              ? { unstable_promise: "Value" }
              : { resolve: "Value" }),
            children() {
              throw error;
            },
            errorElement: "Await error",
          }),
        ).rejects.toBe(error);
      });

      test.each([undefined, null, false, 0, "", NaN, 0n])(
        "propagates rejections with falsy errorElement=%p",
        async (errorElement) => {
          let error = new Error("Rejected");
          let promise = Promise.reject(error);
          await expect(
            Await({
              ...(prop === "unstable_promise"
                ? { unstable_promise: promise }
                : { resolve: promise }),
              children: "Success",
              errorElement,
            }),
          ).rejects.toBe(error);
        },
      );

      test("renders an empty fragment errorElement on rejection", async () => {
        let promise = Promise.reject(new Error("Rejected"));
        let result = await Await({
          ...(prop === "unstable_promise"
            ? { unstable_promise: promise }
            : { resolve: promise }),
          children: "Success",
          errorElement: React.createElement(React.Fragment),
        });
        expect(renderToString(result)).toBe("");
      });
    });

    test("accepts promise-like values", async () => {
      let received: unknown;
      await Await({
        unstable_promise: {
          then(resolve: (value: string) => void) {
            resolve("Thenable");
          },
        },
        children(value) {
          received = value;
          return null;
        },
      });
      expect(received).toBe("Thenable");
    });

    test.each([{}, { resolve: undefined, unstable_promise: undefined }])(
      "requires exactly one promise prop: %p",
      async (props) => {
        await expect(
          Await({ ...props, children: null } as any),
        ).rejects.toThrow(
          "<Await> requires exactly one of `resolve` or `unstable_promise`",
        );
      },
    );
  });

  test("reuses the static handler route matcher after exploding lazy routes", async () => {
    let childRoute: RSCRouteConfigEntry = {
      id: "child",
      path: "child",
      lazy: async () => {
        // Mutate the source route tree so compiling it again would fail. The
        // static handler's enhanced route tree and matcher should be reused.
        childRoute.path = "/invalid";
        return { Component: () => null };
      },
    };
    let match: RSCMatch | undefined;

    let response = await matchRSCServerRequest({
      createTemporaryReferenceSet: () => ({}),
      request: new Request("https://remix.run/parent/child"),
      routes: [
        {
          id: "parent",
          path: "/parent",
          children: [childRoute],
        },
      ],
      generateResponse(nextMatch) {
        match = nextMatch;
        return new Response(null, { status: nextMatch.statusCode });
      },
    });

    expect(response.status).toBe(200);
    expect(match?.payload.type).toBe("render");
  });

  test("runs eager and lazy middleware before resource loaders", async () => {
    let calls: string[] = [];
    let lazyModule: Awaited<
      ReturnType<NonNullable<RSCRouteConfigEntry["lazy"]>>
    > = {
      middleware: [
        async (_, next) => {
          calls.push("lazy middleware");
          let response = await next();
          response.headers.set("X-Lazy-Middleware", "true");
          return response;
        },
      ],
      loader() {
        calls.push("loader");
        return new Response("Resource body");
      },
    };

    let response = await matchRSCServerRequest({
      createTemporaryReferenceSet: () => ({}),
      request: new Request("https://remix.run/resource"),
      routes: [
        {
          id: "root",
          path: "/",
          middleware: [
            async (_, next) => {
              calls.push("eager middleware");
              return next();
            },
          ],
          children: [
            { id: "resource", path: "resource", lazy: async () => lazyModule },
          ],
        },
      ],
      generateResponse() {
        throw new Error("Resource response should not be encoded as Flight");
      },
    });

    expect(calls).toEqual(["eager middleware", "lazy middleware", "loader"]);
    expect(response.headers.get("X-Lazy-Middleware")).toBe("true");
    expect(response.headers.get("React-Router-Resource")).toBe("true");
    expect(await response.text()).toBe("Resource body");
  });

  describe("request validation", () => {
    describe.each(["/action", "/action.rsc"])("%s", (pathname) => {
      test.each(["POST", "PUT", "PATCH", "DELETE"])(
        "returns 400 for invalid %s requests",
        async (method) => {
          let calls: string[] = [];
          let errors: unknown[] = [];
          let request = new Request(`https://remix.run${pathname}`, {
            method,
            headers: { Origin: "https://other.example" },
            body: "intent=mutate",
          });
          let response = await matchRSCServerRequest({
            createTemporaryReferenceSet: () => ({}),
            request,
            onError: (error) => errors.push(error),
            routes: [
              {
                id: "action",
                path: "/action",
                Component: () => null,
                middleware: [
                  async (_, next) => {
                    calls.push("middleware");
                    return next();
                  },
                ],
                loader() {
                  calls.push("loader");
                  return null;
                },
                action() {
                  calls.push("action");
                  return null;
                },
              },
            ],
            generateResponse(match) {
              calls.push("generateResponse");
              return new Response("Encoded Flight", {
                status: match.statusCode,
              });
            },
          });

          expect(response.status).toBe(400);
          expect(calls).toEqual([]);
          expect(errors).toHaveLength(1);
          expect(errors[0]).toBeInstanceOf(Error);

          let result = await routeRSCServerRequest({
            request,
            serverResponse: response,
            createFromReadableStream() {
              throw new Error("Rejected requests should not decode Flight");
            },
            renderHTML() {
              throw new Error("Rejected requests should not render HTML");
            },
          });
          expect(result).toBe(response);
          expect(await result.text()).toBe("Bad Request");
        },
      );
    });

    test.each([
      { origin: "https://remix.run", allowedActionOrigins: undefined },
      {
        origin: "https://trusted.example",
        allowedActionOrigins: ["trusted.example"],
      },
    ])("processes valid submissions from $origin", async (options) => {
      let calls: string[] = [];
      let response = await matchRSCServerRequest({
        allowedActionOrigins: options.allowedActionOrigins,
        createTemporaryReferenceSet: () => ({}),
        request: new Request("https://remix.run/action", {
          method: "POST",
          headers: { Origin: options.origin },
          body: "intent=mutate",
        }),
        routes: [
          {
            id: "action",
            path: "/action",
            Component: () => null,
            middleware: [
              async ({ request }, next) => {
                calls.push(`middleware ${request.method}`);
                return next();
              },
            ],
            action() {
              calls.push("action");
              return null;
            },
          },
        ],
        generateResponse(match) {
          return new Response("Encoded Flight", { status: match.statusCode });
        },
      });

      expect(response.status).toBe(200);
      expect(calls).toEqual(["middleware POST", "action"]);
    });
  });

  describe("manifest requests", () => {
    test("rejects manifest requests over the URL limit", async () => {
      let path = `/${"a".repeat(URL_LIMIT)}.manifest`;

      let { response, match } = await matchManifestRequest(
        new Request(`https://remix.run${path}`),
        [],
      );

      expect(response.status).toBe(400);
      expect(match).toBeUndefined();
    });

    test("signals a reload when the client version does not match", async () => {
      let { response, match } = await matchManifestRequest(
        new Request("https://remix.run/path.manifest?version=old"),
        [],
        "new",
      );

      expect(response.status).toBe(204);
      expect(response.headers.get("X-Remix-Reload-Document")).toBe("true");
      expect(match).toBeUndefined();
    });

    test("returns patches when the client version matches", async () => {
      let { response, match } = await matchManifestRequest(
        new Request("https://remix.run/path.manifest?version=current"),
        [],
        "current",
      );

      expect(response.status).toBe(200);
      expect(match?.payload.type).toBe("manifest");
    });
  });

  describe("request methods", () => {
    test.each(["GET", "HEAD"])(
      "handles %s resource responses",
      async (method) => {
        let finishCancellation = () => {};
        let cancel = jest.fn(
          () =>
            new Promise<void>((_, reject) => {
              finishCancellation = () => reject(new Error("Stream closed"));
            }),
        );
        let body = new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode("Hello"));
          },
          pull(controller) {
            controller.close();
          },
          cancel,
        });
        let middlewareHasBody = false;
        let response = await matchRSCServerRequest({
          createTemporaryReferenceSet: () => ({}),
          request: new Request("https://remix.run/resource", { method }),
          routes: [
            {
              id: "resource",
              path: "/resource",
              middleware: [
                async (_, next) => {
                  let response = await next();
                  middlewareHasBody = response.body !== null;
                  response.headers.set("X-Middleware", "yes");
                  return response;
                },
              ],
              loader: () =>
                new Response(body, {
                  status: 201,
                  statusText: "Created",
                  headers: {
                    "Content-Type": "text/plain",
                    "Content-Length": "5",
                  },
                }),
            },
          ],
          generateResponse() {
            throw new Error(
              "Resource response should not be encoded as Flight",
            );
          },
        });

        expect(middlewareHasBody).toBe(true);
        expect(response.status).toBe(201);
        expect(response.statusText).toBe("Created");
        expect(response.headers.get("Content-Type")).toBe("text/plain");
        expect(response.headers.get("Content-Length")).toBe("5");
        expect(response.headers.get("X-Middleware")).toBe("yes");
        expect(response.body === null).toBe(method === "HEAD");
        expect(await response.text()).toBe(method === "HEAD" ? "" : "Hello");
        expect(cancel).toHaveBeenCalledTimes(method === "HEAD" ? 1 : 0);
        finishCancellation();
        await new Promise((resolve) => setTimeout(resolve, 0));
      },
    );

    test("preserves HEAD Flight bodies for SSR rendering", async () => {
      let response = await matchRSCServerRequest({
        createTemporaryReferenceSet: () => ({}),
        request: new Request("https://remix.run/", { method: "HEAD" }),
        routes: [{ id: "root", path: "/", Component: () => null }],
        generateResponse: () => new Response("Encoded Flight"),
      });

      expect(response.headers.get("React-Router-Resource")).toBeNull();
      expect(await response.text()).toBe("Encoded Flight");
    });
  });

  describe("middleware short-circuit responses", () => {
    test("preserves cached Flight responses returned by middleware", async () => {
      let cachedResponse: Response | undefined;
      let renderCount = 0;
      let routes: RSCRouteConfigEntry[] = [
        {
          id: "root",
          path: "/",
          Component: () => null,
          middleware: [
            async (_, next) => {
              if (cachedResponse) {
                return cachedResponse.clone();
              }
              let response = await next();
              cachedResponse = response.clone();
              return response;
            },
          ],
        },
      ];
      let generateResponse = (match: RSCMatch) => {
        renderCount++;
        return new Response("Encoded Flight", {
          status: match.statusCode,
          headers: match.headers,
        });
      };

      for (let i = 0; i < 2; i++) {
        let response = await matchRSCServerRequest({
          createTemporaryReferenceSet: () => ({}),
          request: new Request("https://remix.run/"),
          routes,
          generateResponse,
        });

        expect(response.headers.get("React-Router-Resource")).toBeNull();
        expect(await response.text()).toBe("Encoded Flight");
      }

      expect(renderCount).toBe(1);
      expect(cachedResponse?.headers.get("Content-Type")).toBe(
        "text/x-component",
      );
    });

    test.each(["return", "throw"])(
      "passes through resource route middleware responses (%s)",
      async (behavior) => {
        let request = new Request("https://remix.run/resource");
        let serverResponse = await matchRSCServerRequest({
          createTemporaryReferenceSet: () => ({}),
          request,
          routes: [
            {
              id: "root",
              path: "/",
              middleware: [
                async () => {
                  let response = new Response("Access denied", {
                    status: 403,
                    statusText: "Forbidden",
                    headers: {
                      "Content-Type": "text/plain; charset=utf-8",
                      "Set-Cookie": "session=; Max-Age=0; Path=/",
                    },
                  });
                  if (behavior === "throw") {
                    throw response;
                  }
                  return response;
                },
              ],
              children: [
                {
                  id: "resource",
                  path: "resource",
                  loader() {
                    throw new Error("Resource loader should not be called");
                  },
                },
              ],
            },
          ],
          generateResponse() {
            throw new Error(
              "Resource response should not be encoded as Flight",
            );
          },
        });

        expect(serverResponse.headers.get("React-Router-Resource")).toBe(
          "true",
        );

        let response = await routeRSCServerRequest({
          request,
          serverResponse,
          createFromReadableStream() {
            throw new Error(
              "Resource response should not be decoded as Flight",
            );
          },
          renderHTML() {
            throw new Error("Resource response should not be rendered as HTML");
          },
        });

        expect(response).toBe(serverResponse);
        expect(response.status).toBe(403);
        expect(response.statusText).toBe("Forbidden");
        expect(response.headers.get("Content-Type")).toBe(
          "text/plain; charset=utf-8",
        );
        expect(response.headers.get("Set-Cookie")).toBe(
          "session=; Max-Age=0; Path=/",
        );
        expect(await response.text()).toBe("Access denied");
      },
    );

    test.each(["GET", "HEAD"])(
      "tags %s non-RSC middleware responses as React-Router-Resource",
      async (method) => {
        let generateResponseCalled = false;
        let response = await matchRSCServerRequest({
          createTemporaryReferenceSet: () => ({}),
          request: new Request("https://remix.run/docs/intro.md", { method }),
          routes: [
            {
              id: "root",
              path: "/",
              middleware: [
                async ({ request }, next) => {
                  let url = new URL(request.url);
                  if (url.pathname.endsWith(".md")) {
                    return new Response("# MARKDOWN_BODY", {
                      headers: {
                        "Content-Type": "text/markdown; charset=utf-8",
                      },
                    });
                  }
                  return next();
                },
              ],
              children: [
                {
                  id: "intro",
                  path: "docs/intro.md",
                  Component: () => null,
                },
              ],
            },
          ],
          generateResponse() {
            generateResponseCalled = true;
            return new Response(null);
          },
        });

        expect(generateResponseCalled).toBe(false);
        expect(response.headers.get("React-Router-Resource")).toBe("true");
        expect(response.headers.get("Content-Type")).toBe(
          "text/markdown; charset=utf-8",
        );
        expect(response.body === null).toBe(method === "HEAD");
        expect(await response.text()).toBe(
          method === "HEAD" ? "" : "# MARKDOWN_BODY",
        );
      },
    );

    test("routeRSCServerRequest passes through tagged resource response without decoding as Flight", async () => {
      let serverResponse = new Response("# MARKDOWN_BODY", {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "React-Router-Resource": "true",
        },
      });

      let createFromReadableStreamCalled = false;
      let result = await routeRSCServerRequest({
        request: new Request("https://remix.run/docs/intro.md"),
        serverResponse,
        createFromReadableStream() {
          createFromReadableStreamCalled = true;
          throw new Error("Should not decode as Flight");
        },
        renderHTML() {
          throw new Error("renderHTML should not be called");
        },
      });

      expect(createFromReadableStreamCalled).toBe(false);
      expect(result).toBe(serverResponse);
      expect(await result.text()).toBe("# MARKDOWN_BODY");
    });

    test("normal middleware calling next() generates standard RSC render response", async () => {
      let generateResponseCalled = false;
      let match: RSCMatch | undefined;
      let response = await matchRSCServerRequest({
        createTemporaryReferenceSet: () => ({}),
        request: new Request("https://remix.run/docs/intro"),
        routes: [
          {
            id: "root",
            path: "/",
            middleware: [
              async ({ request }, next) => {
                let res = await next();
                return res;
              },
            ],
            children: [
              {
                id: "intro",
                path: "docs/intro",
                Component: () => null,
              },
            ],
          },
        ],
        generateResponse(nextMatch) {
          generateResponseCalled = true;
          match = nextMatch;
          return new Response(null, { status: nextMatch.statusCode });
        },
      });

      expect(generateResponseCalled).toBe(true);
      expect(response.headers.get("React-Router-Resource")).toBeNull();
      expect(match?.payload.type).toBe("render");
    });

    test("middleware short-circuit redirect returns redirect payload without resource header", async () => {
      let generateResponseCalled = false;
      let match: RSCMatch | undefined;
      let response = await matchRSCServerRequest({
        createTemporaryReferenceSet: () => ({}),
        request: new Request("https://remix.run/protected"),
        routes: [
          {
            id: "root",
            path: "/",
            middleware: [
              async () => {
                return new Response(null, {
                  status: 302,
                  headers: { Location: "/login" },
                });
              },
            ],
            children: [
              {
                id: "protected",
                path: "protected",
                Component: () => null,
              },
            ],
          },
        ],
        generateResponse(nextMatch) {
          generateResponseCalled = true;
          match = nextMatch;
          return new Response(null, { status: nextMatch.statusCode });
        },
      });

      expect(generateResponseCalled).toBe(true);
      expect(response.headers.get("React-Router-Resource")).toBeNull();
      expect(match?.payload).toMatchObject({
        type: "redirect",
        location: "/login",
        status: 302,
      });
    });
  });

  test("switches to initial discovery above the pathname work limit", async () => {
    let routeDiscovery = Object.freeze({ mode: "lazy" } as const);
    let routes: RSCRouteConfigEntry[] = [
      {
        id: "root",
        path: "",
        Component: () => null,
        children: [
          { id: "other", path: "other" },
          { id: "splat", path: "*", Component: () => null },
        ],
      },
    ];

    async function getPayload(pathname: string) {
      let match: RSCMatch | undefined;
      let response = await matchRSCServerRequest({
        createTemporaryReferenceSet: () => ({}),
        request: new Request(`https://remix.run${pathname}`),
        routes,
        routeDiscovery,
        generateResponse(nextMatch) {
          match = nextMatch;
          return new Response(null, { status: nextMatch.statusCode });
        },
      });
      expect(response.status).toBe(200);
      if (match?.payload.type !== "render") {
        throw new Error("Expected a render payload");
      }
      return match.payload;
    }

    let pathname = `/${Array.from({ length: 60 }, (_, i) => i % 10).join("/")}`;
    let payload = await getPayload(pathname);
    expect(payload.routeDiscovery.mode).toBe("lazy");
    expect(await payload.patches).toEqual([]);

    payload = await getPayload(`${pathname}.rsc`);
    expect(payload.routeDiscovery.mode).toBe("lazy");
    expect(await payload.patches).toEqual([]);

    pathname = `/${Array.from({ length: 70 }, (_, i) => i % 10).join("/")}`;
    payload = await getPayload(pathname);
    expect(payload.routeDiscovery.mode).toBe("initial");
    expect((await payload.patches).map((patch) => patch.id)).toEqual(["other"]);

    payload = await getPayload(`${pathname}.rsc`);
    expect(payload.routeDiscovery.mode).toBe("initial");
    expect((await payload.patches).map((patch) => patch.id)).toEqual(["other"]);
    expect(routeDiscovery.mode).toBe("lazy");
  });

  describe("error reporting", () => {
    let consoleError: jest.SpyInstance;
    let abortController: AbortController;

    beforeEach(() => {
      consoleError = jest.spyOn(console, "error").mockImplementation(() => {});
      abortController = new AbortController();
    });

    afterEach(() => {
      consoleError.mockRestore();
    });

    let routes: RSCRouteConfigEntry[] = [
      {
        id: "root",
        path: "/",
        Component: () => null,
        ErrorBoundary: () => null,
        children: [
          {
            id: "loader-error",
            path: "loader-error",
            Component: () => null,
            loader() {
              throw new Error("LOADER_ERROR");
            },
          },
          {
            id: "action-error",
            path: "action-error",
            Component: () => null,
            action() {
              throw new Error("ACTION_ERROR");
            },
          },
          {
            id: "middleware-error",
            path: "middleware-error",
            Component: () => null,
            middleware: [
              () => {
                throw new Error("MIDDLEWARE_ERROR");
              },
            ],
          },
          {
            id: "post-middleware-error",
            path: "post-middleware-error",
            Component: () => null,
            async action({ request }) {
              await request.formData();
              return null;
            },
            middleware: [
              async (_, next) => {
                await next();
                throw new Error("POST_MIDDLEWARE_ERROR");
              },
            ],
          },
          {
            id: "thrown-response",
            path: "thrown-response",
            Component: () => null,
            loader() {
              throw new Response("Nope", { status: 401 });
            },
          },
          {
            id: "aborted-resource",
            path: "aborted-resource",
            loader() {
              abortController.abort();
              throw new Error("ABORTED_ERROR");
            },
          },
        ],
      },
    ];

    function match(request: Request, onError?: (error: unknown) => void) {
      return matchRSCServerRequest({
        createTemporaryReferenceSet: () => ({}),
        request,
        routes,
        onError,
        generateResponse(match) {
          return new Response(null, { status: match.statusCode });
        },
      });
    }

    test.each([
      ["loader", new Request("https://remix.run/loader-error"), "LOADER_ERROR"],
      [
        "action",
        new Request("https://remix.run/action-error", {
          method: "POST",
          body: new URLSearchParams({ a: "b" }),
        }),
        "ACTION_ERROR",
      ],
      [
        "middleware",
        new Request("https://remix.run/middleware-error"),
        "MIDDLEWARE_ERROR",
      ],
      [
        "post-form-action middleware",
        new Request("https://remix.run/post-middleware-error", {
          method: "POST",
          body: new URLSearchParams({ a: "b" }),
        }),
        "POST_MIDDLEWARE_ERROR",
      ],
    ])("calls onError with %s errors", async (_, request, message) => {
      let onError = jest.fn();
      let response = await match(request, onError);
      expect(response.status).toBe(500);
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(new Error(message));
    });

    test("does not call onError with thrown responses", async () => {
      let onError = jest.fn();
      let response = await match(
        new Request("https://remix.run/thrown-response"),
        onError,
      );
      expect(response.status).toBe(401);
      expect(onError).not.toHaveBeenCalled();
    });

    test("logs errors with console.error when no onError is provided", async () => {
      await match(new Request("https://remix.run/loader-error"));
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(new Error("LOADER_ERROR"));
    });

    test("logs an RSC Data loader error once when SSR renders the default boundary", async () => {
      let error = new Error("LOADER_ERROR");
      let payload: RSCMatch["payload"] | undefined;
      let response = await matchRSCServerRequest({
        createTemporaryReferenceSet: () => ({}),
        request: new Request("https://remix.run/"),
        routes: [
          {
            id: "root",
            path: "/",
            Component: () => null,
            loader() {
              throw error;
            },
          },
        ],
        generateResponse(match) {
          payload = match.payload;
          return new Response(null, { status: match.statusCode });
        },
      });
      expect(response.status).toBe(500);

      let decoded = Object.assign(Promise.resolve(payload!), {
        formState: Promise.resolve(undefined),
      });
      let stream = await renderToReadableStream(
        React.createElement(RSCStaticRouter, { getPayload: () => decoded }),
      );
      expect(await new Response(stream).text()).toContain(
        "Unexpected Application Error!",
      );
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(error);
    });

    test("logs the underlying error for internal error responses", async () => {
      await match(new Request("https://remix.run/does-not-exist"));
      expect(consoleError).toHaveBeenCalledTimes(1);
      expect(consoleError).toHaveBeenCalledWith(
        new Error('No route matches URL "/does-not-exist"'),
      );
    });

    test("does not log errors for aborted requests", async () => {
      await match(
        new Request("https://remix.run/aborted-resource", {
          signal: abortController.signal,
        }),
      );
      expect(consoleError).not.toHaveBeenCalled();
    });
  });
});

async function matchManifestRequest(
  request: Request,
  routes: RSCRouteConfigEntry[],
  clientVersion?: string,
) {
  let match: RSCMatch | undefined;
  let response = await matchRSCServerRequest({
    clientVersion,
    createTemporaryReferenceSet: () => ({}),
    request,
    routes,
    generateResponse(nextMatch) {
      match = nextMatch;
      return new Response(null, {
        status: nextMatch.statusCode,
        headers: nextMatch.headers,
      });
    },
  });

  return { response, match };
}
