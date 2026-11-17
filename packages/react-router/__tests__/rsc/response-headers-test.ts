import {
  getRequest,
  responseHeaders,
  responseStatus,
  matchRSCServerRequest,
  redirect,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";

async function handleRequest(
  request: Request,
  routes: RSCRouteConfigEntry[],
  {
    serverFunction,
    onGenerateResponse,
  }: {
    serverFunction?: () => unknown;
    onGenerateResponse?: () => void;
  } = {},
) {
  let match: RSCMatch | undefined;
  let response = await matchRSCServerRequest({
    createTemporaryReferenceSet: () => ({}),
    decodeReply: async () => [],
    loadServerAction: async () => serverFunction!,
    decodeAction: async () => async () => serverFunction!(),
    request,
    routes,
    generateResponse(nextMatch) {
      match = nextMatch;
      onGenerateResponse?.();
      return new Response("Encoded Flight", {
        status: nextMatch.statusCode,
        headers: nextMatch.headers,
      });
    },
  });
  return { response, match };
}

function serverFunctionRequest(requestType: "enhanced" | "form") {
  return new Request("https://remix.run/", {
    method: "POST",
    headers: {
      Origin: "https://remix.run",
      ...(requestType === "enhanced"
        ? { "rsc-action-id": "action-id" }
        : { "Content-Type": "application/x-www-form-urlencoded" }),
    },
    body: requestType === "enhanced" ? "[]" : "$ACTION_ID_action-id=",
  });
}

let rootRoute: RSCRouteConfigEntry = {
  id: "root",
  path: "/",
  Component: () => null,
};

describe("unstable_responseHeaders and unstable_responseStatus", () => {
  test("throws outside of a request", () => {
    expect(() => responseHeaders()).toThrow(
      "responseHeaders must be called from within a React Server render context",
    );
    expect(() => responseStatus(400)).toThrow(
      "responseStatus must be called from within a React Server render context",
    );
  });

  describe.each(["enhanced", "form"] as const)(
    "%s server function requests",
    (requestType) => {
      test("adds headers and status without a redirect", async () => {
        let { response, match } = await handleRequest(
          serverFunctionRequest(requestType),
          [rootRoute],
          {
            serverFunction: async () => {
              responseHeaders().append("Set-Cookie", "a=b");
              responseHeaders().set("X-Test", "test");
              responseStatus(400);
            },
          },
        );

        expect(match?.payload.type).toBe(
          requestType === "enhanced" ? "action" : "render",
        );
        expect(response.headers.getSetCookie()).toEqual(["a=b"]);
        expect(response.headers.get("X-Test")).toBe("test");
        expect(response.status).toBe(400);
      });

      test("adds headers but not status to a redirect", async () => {
        let { response, match } = await handleRequest(
          serverFunctionRequest(requestType),
          [rootRoute],
          {
            serverFunction: async () => {
              responseHeaders().append("Set-Cookie", "a=b");
              responseHeaders().set("X-Test", "headers");
              responseStatus(400);
              throw redirect("/target", {
                headers: { "Set-Cookie": "c=d", "X-Test": "redirect" },
              });
            },
          },
        );

        expect(match?.payload).toMatchObject({
          type: "redirect",
          location: "/target",
          status: 302,
        });
        expect(response.status).toBe(202);
        expect(response.headers.getSetCookie()).toEqual(["c=d", "a=b"]);
        expect(response.headers.get("X-Test")).toBe("headers");
      });
    },
  );

  test("adds headers and status from middleware, loaders, and actions", async () => {
    let routes: RSCRouteConfigEntry[] = [
      {
        id: "root",
        path: "/",
        middleware: [
          async (_, next) => {
            responseHeaders().append("Set-Cookie", "middleware=1");
            return next();
          },
        ],
        action() {
          responseHeaders().append("Set-Cookie", "action=1");
          return null;
        },
        loader() {
          responseHeaders().append("Set-Cookie", "loader=1");
          responseStatus(404);
          return null;
        },
        Component: () => null,
      },
    ];

    let document = await handleRequest(
      new Request("https://remix.run/"),
      routes,
    );
    expect(document.response.status).toBe(404);
    expect(document.response.headers.getSetCookie()).toEqual([
      "middleware=1",
      "loader=1",
    ]);

    let submission = await handleRequest(
      new Request("https://remix.run/", {
        method: "POST",
        headers: { Origin: "https://remix.run" },
        body: new URLSearchParams({ a: "b" }),
      }),
      routes,
    );
    expect(submission.response.headers.getSetCookie()).toContain("action=1");
  });

  test("applies set, append, and delete in order on top of route headers", async () => {
    let { response } = await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        headers: {
          "Set-Cookie": "route=1",
          "Cache-Control": "max-age=60",
          Vary: "Accept-Encoding",
          "X-Remove": "route",
        },
        loader() {
          responseHeaders().append("Set-Cookie", "loader=1");
          responseHeaders().append("Vary", "Cookie");
          responseHeaders().set("Cache-Control", "no-store");
          responseHeaders().delete("X-Remove");
          return null;
        },
        Component: () => null,
      },
    ]);

    expect(response.headers.getSetCookie()).toEqual(["route=1", "loader=1"]);
    expect(response.headers.get("Vary")).toBe("Accept-Encoding, Cookie");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.has("X-Remove")).toBe(false);
  });

  test("adds headers and status to resource routes", async () => {
    let routes: RSCRouteConfigEntry[] = [
      {
        id: "root",
        path: "/",
        middleware: [
          async (_, next) => {
            responseHeaders().append("Set-Cookie", "middleware=1");
            return next();
          },
        ],
        Component: () => null,
        children: [
          {
            id: "api",
            path: "api",
            loader() {
              responseStatus(201);
              return Response.json({ method: getRequest().method });
            },
          },
          {
            id: "api-error",
            path: "api-error",
            loader() {
              responseHeaders().append("Set-Cookie", "loader=1");
              throw new Response("Not found", { status: 404 });
            },
          },
        ],
      },
    ];

    let { response } = await handleRequest(
      new Request("https://remix.run/api"),
      routes,
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ method: "GET" });
    expect(response.headers.getSetCookie()).toEqual(["middleware=1"]);

    let { response: errorResponse } = await handleRequest(
      new Request("https://remix.run/api-error"),
      routes,
    );
    expect(errorResponse.status).toBe(404);
    expect(errorResponse.headers.getSetCookie()).toEqual([
      "middleware=1",
      "loader=1",
    ]);
  });

  test.each(["text/markdown", "text/x-component"])(
    "adds headers to %s responses returned by middleware",
    async (contentType) => {
      let { response } = await handleRequest(
        new Request("https://remix.run/"),
        [
          {
            id: "root",
            path: "/",
            middleware: [
              async (_, next) => {
                responseHeaders().append("Set-Cookie", "a=b");
                return next();
              },
              async () =>
                new Response("Body", {
                  headers: { "Content-Type": contentType },
                }),
            ],
            Component: () => null,
          },
        ],
      );

      expect(await response.text()).toBe("Body");
      expect(response.headers.getSetCookie()).toEqual(["a=b"]);
    },
  );

  test("rejects headers and statuses React Router manages", async () => {
    let errors: string[] = [];
    await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        loader() {
          for (let name of ["Content-Length", "location", "X-Remix-Response"]) {
            try {
              responseHeaders().set(name, "1");
            } catch (error) {
              errors.push(String(error));
            }
          }
          for (let status of [302, 99, 600, 200.5]) {
            try {
              responseStatus(status);
            } catch (error) {
              errors.push(String(error));
            }
          }
          return null;
        },
        Component: () => null,
      },
    ]);

    expect(errors).toEqual([
      expect.stringContaining(`The "Content-Length" header is managed`),
      expect.stringContaining(`The "location" header is managed`),
      expect.stringContaining(`The "X-Remix-Response" header is managed`),
      expect.stringContaining("Invalid response status 302"),
      expect.stringContaining("Invalid response status 99"),
      expect.stringContaining("Invalid response status 600"),
      expect.stringContaining("Invalid response status 200.5"),
    ]);
  });

  test("throws once the response has been created", async () => {
    let errors: unknown[] = [];
    let lateWrite: Promise<unknown> | undefined;

    await handleRequest(
      new Request("https://remix.run/"),
      [
        {
          id: "root",
          path: "/",
          middleware: [
            async (_, next) => {
              let response = await next();
              for (let fn of [
                () => responseHeaders(),
                () => responseStatus(500),
              ]) {
                try {
                  fn();
                } catch (error) {
                  errors.push(error);
                }
              }
              return response;
            },
          ],
          loader() {
            let savedHeaders = responseHeaders();
            lateWrite = new Promise((resolve) => setTimeout(resolve, 5)).then(
              () => savedHeaders.set("X-Late", "1"),
            );
            lateWrite.catch(() => {});
            return null;
          },
          Component: () => null,
        },
      ],
      {
        // Server components render while the response body streams
        onGenerateResponse() {
          try {
            responseHeaders();
          } catch (error) {
            errors.push(error);
          }
        },
      },
    );
    await lateWrite?.catch((error) => errors.push(error));

    expect(errors.map(String)).toEqual(
      Array(4).fill(
        expect.stringContaining(
          "can't be changed after the response has been created",
        ),
      ),
    );
  });
});
