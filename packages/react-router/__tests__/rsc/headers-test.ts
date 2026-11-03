import {
  getRequest,
  headers,
  matchRSCServerRequest,
  redirect,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";
import { routeRSCServerRequest } from "../../lib/rsc/server.ssr";

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

describe("unstable_headers", () => {
  test("throws outside of a request", () => {
    expect(() => headers()).toThrow(
      "headers must be called from within a React Server render context",
    );
  });

  describe.each(["enhanced", "form"] as const)(
    "%s server function requests",
    (requestType) => {
      test("adds headers without a redirect", async () => {
        let { response, match } = await handleRequest(
          serverFunctionRequest(requestType),
          [rootRoute],
          {
            serverFunction: async () => {
              headers().append("Set-Cookie", "a=b");
              headers().append("Set-Cookie", "c=d");
              headers().set("X-Test", "test");
            },
          },
        );

        expect(match?.payload.type).toBe(
          requestType === "enhanced" ? "action" : "render",
        );
        expect(response.headers.getSetCookie()).toEqual(["a=b", "c=d"]);
        expect(response.headers.get("X-Test")).toBe("test");
      });

      test("merges headers into a side-effect redirect", async () => {
        let { response, match } = await handleRequest(
          serverFunctionRequest(requestType),
          [rootRoute],
          {
            serverFunction: async () => {
              headers().append("Set-Cookie", "a=b");
              redirect("/target", { headers: { "Set-Cookie": "c=d" } });
            },
          },
        );

        expect(match?.payload).toMatchObject({
          type: "redirect",
          location: "/target",
        });
        expect(response.headers.getSetCookie()).toEqual(["c=d", "a=b"]);
      });

      test("merges headers into a thrown redirect", async () => {
        let { response, match } = await handleRequest(
          serverFunctionRequest(requestType),
          [rootRoute],
          {
            serverFunction: async () => {
              headers().append("Set-Cookie", "a=b");
              headers().set("X-Test", "headers");
              throw redirect("/target", {
                headers: { "Set-Cookie": "c=d", "X-Test": "redirect" },
              });
            },
          },
        );

        expect(match?.payload).toMatchObject({
          type: "redirect",
          location: "/target",
        });
        expect(response.headers.getSetCookie()).toEqual(["c=d", "a=b"]);
        expect(response.headers.get("X-Test")).toBe("headers");
      });
    },
  );

  test("adds headers set in loaders, actions, and middleware", async () => {
    let routes: RSCRouteConfigEntry[] = [
      {
        id: "root",
        path: "/",
        middleware: [
          async (_, next) => {
            headers().append("Set-Cookie", "middleware=1");
            return next();
          },
        ],
        loader() {
          headers().append("Set-Cookie", "root-loader=1");
          return null;
        },
        Component: () => null,
        children: [
          {
            id: "child",
            path: "child",
            action() {
              headers().append("Set-Cookie", "action=1");
              return null;
            },
            loader() {
              headers().append("Set-Cookie", "child-loader=1");
              return null;
            },
            Component: () => null,
          },
        ],
      },
    ];

    let document = await handleRequest(
      new Request("https://remix.run/child"),
      routes,
    );
    expect(document.match?.payload.type).toBe("render");
    expect(document.response.headers.getSetCookie().sort()).toEqual([
      "child-loader=1",
      "middleware=1",
      "root-loader=1",
    ]);

    let submission = await handleRequest(
      new Request("https://remix.run/child", {
        method: "POST",
        headers: { Origin: "https://remix.run" },
        body: new URLSearchParams({ a: "b" }),
      }),
      routes,
    );
    expect(submission.response.headers.getSetCookie()).toContain("action=1");
  });

  test("overrides route headers and keeps their cookies", async () => {
    let { response } = await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        headers: { "Set-Cookie": "route=1", "X-Test": "route" },
        loader() {
          headers().append("Set-Cookie", "loader=1");
          headers().set("X-Test", "loader");
          return null;
        },
        Component: () => null,
      },
    ]);

    expect(response.headers.getSetCookie()).toEqual(["route=1", "loader=1"]);
    expect(response.headers.get("X-Test")).toBe("loader");
  });

  test("adds headers to loader redirects", async () => {
    let { response, match } = await handleRequest(
      new Request("https://remix.run/"),
      [
        {
          id: "root",
          path: "/",
          loader() {
            headers().append("Set-Cookie", "a=b");
            throw redirect("/target");
          },
          Component: () => null,
        },
      ],
    );

    expect(match?.payload).toMatchObject({
      type: "redirect",
      location: "/target",
    });
    expect(response.headers.getSetCookie()).toEqual(["a=b"]);
  });

  test("adds headers to non-RSC middleware responses", async () => {
    let { response } = await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        middleware: [
          async () => {
            headers().append("Set-Cookie", "a=b");
            return new Response("Markdown", {
              headers: { "Content-Type": "text/markdown" },
            });
          },
        ],
        Component: () => null,
      },
    ]);

    expect(response.headers.get("React-Router-Resource")).toBe("true");
    expect(response.headers.getSetCookie()).toEqual(["a=b"]);
  });

  test("throws once the response has been created", async () => {
    let renderError: unknown;
    let middlewareError: unknown;

    await handleRequest(
      new Request("https://remix.run/"),
      [
        {
          id: "root",
          path: "/",
          middleware: [
            async (_, next) => {
              let response = await next();
              try {
                headers();
              } catch (error) {
                middlewareError = error;
              }
              return response;
            },
          ],
          Component: () => null,
        },
      ],
      {
        // Server components render while the response body streams
        onGenerateResponse() {
          try {
            headers();
          } catch (error) {
            renderError = error;
          }
        },
      },
    );

    expect(String(renderError)).toMatch(
      "headers can't be used after the response has been created",
    );
    expect(String(middlewareError)).toMatch(
      "headers can't be used after the response has been created",
    );
  });

  test("keeps headers separate between concurrent requests", async () => {
    let routes: RSCRouteConfigEntry[] = [
      {
        id: "root",
        path: "/",
        async loader({ request }) {
          let id = new URL(request.url).searchParams.get("id");
          await new Promise((resolve) =>
            setTimeout(resolve, id === "1" ? 5 : 0),
          );
          headers().set("X-Id", id!);
          return null;
        },
        Component: () => null,
      },
    ];

    let [one, two] = await Promise.all([
      handleRequest(new Request("https://remix.run/?id=1"), routes),
      handleRequest(new Request("https://remix.run/?id=2"), routes),
    ]);

    expect(one.response.headers.get("X-Id")).toBe("1");
    expect(two.response.headers.get("X-Id")).toBe("2");
  });

  describe("resource routes", () => {
    let routes: RSCRouteConfigEntry[] = [
      {
        id: "root",
        path: "/",
        middleware: [
          async (_, next) => {
            headers().append("Set-Cookie", "middleware=1");
            return next();
          },
        ],
        Component: () => null,
        children: [
          {
            id: "api",
            path: "api",
            loader() {
              headers().set("X-Loader", "loader");
              return Response.json({ ok: true });
            },
          },
          {
            id: "api-error",
            path: "api-error",
            loader() {
              headers().append("Set-Cookie", "loader=1");
              throw new Response("Not found", { status: 404 });
            },
          },
        ],
      },
    ];

    test("adds headers from middleware and loaders", async () => {
      let { response } = await handleRequest(
        new Request("https://remix.run/api"),
        routes,
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
      expect(response.headers.get("React-Router-Resource")).toBe("true");
      expect(response.headers.getSetCookie()).toEqual(["middleware=1"]);
      expect(response.headers.get("X-Loader")).toBe("loader");
    });

    test("supports getRequest", async () => {
      let { response } = await handleRequest(
        new Request("https://remix.run/method"),
        [
          {
            id: "method",
            path: "/method",
            loader: () => new Response(getRequest().method),
          },
        ],
      );

      expect(await response.text()).toBe("GET");
    });

    test("adds headers to thrown responses", async () => {
      let { response } = await handleRequest(
        new Request("https://remix.run/api-error"),
        routes,
      );

      expect(response.status).toBe(404);
      expect(response.headers.getSetCookie()).toEqual([
        "middleware=1",
        "loader=1",
      ]);
    });
  });

  test("adds headers to Flight responses returned by middleware", async () => {
    let cached = new Response("Cached Flight", {
      headers: { "Content-Type": "text/x-component" },
    });
    let { response } = await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        middleware: [
          async (_, next) => {
            headers().append("Set-Cookie", "session=abc");
            return next();
          },
          async () => cached.clone(),
        ],
        Component: () => null,
      },
    ]);

    expect(await response.text()).toBe("Cached Flight");
    expect(response.headers.getSetCookie()).toEqual(["session=abc"]);
    expect(response.headers.get("X-Remix-Response")).toBe("yes");
  });

  test("doesn't duplicate cookies when middleware reuses next() headers", async () => {
    let { response } = await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        middleware: [
          async (_, next) => {
            headers().append("Set-Cookie", "a=1");
            let res = await next();
            throw redirect("/login", { headers: res.headers });
          },
        ],
        Component: () => null,
      },
    ]);

    expect(response.headers.getSetCookie()).toEqual(["a=1"]);
  });

  test.each([
    "Content-Length",
    "content-type",
    "Location",
    "React-Router-Resource",
    "X-Remix-Response",
  ])("rejects the React Router managed %s header", async (name) => {
    let error: unknown;
    await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        loader() {
          try {
            headers().set(name, "1");
          } catch (e) {
            error = e;
          }
          return null;
        },
        Component: () => null,
      },
    ]);

    expect(String(error)).toMatch(
      `The "${name}" header is managed by React Router`,
    );
  });

  test("throws when a held reference is written to after the response is created", async () => {
    let lateWrite: Promise<unknown> | undefined;
    let { response } = await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        loader() {
          let responseHeaders = headers();
          lateWrite = new Promise((resolve) => setTimeout(resolve, 5)).then(
            () => responseHeaders.set("X-Late", "1"),
          );
          lateWrite.catch(() => {});
          return null;
        },
        Component: () => null,
      },
    ]);

    await expect(lateWrite).rejects.toThrow(
      "headers can't be used after the response has been created",
    );
    expect(response.headers.get("X-Late")).toBeNull();
  });

  test("applies set, append, and delete in order on top of route headers", async () => {
    let { response } = await handleRequest(new Request("https://remix.run/"), [
      {
        id: "root",
        path: "/",
        headers: {
          "Cache-Control": "max-age=60",
          Vary: "Accept-Encoding",
          "X-Remove": "route",
        },
        loader() {
          headers().append("Vary", "Cookie");
          headers().set("Cache-Control", "no-store");
          headers().delete("X-Remove");
          return null;
        },
        Component: () => null,
      },
    ]);

    expect(response.headers.get("Vary")).toBe("Accept-Encoding, Cookie");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(response.headers.has("X-Remove")).toBe(false);
  });

  test("keeps headers on CSRF error responses", async () => {
    let { response } = await handleRequest(
      new Request("https://remix.run/", {
        method: "POST",
        headers: { Origin: "https://evil.com", "rsc-action-id": "action-id" },
        body: "[]",
      }),
      [
        {
          id: "root",
          path: "/",
          middleware: [
            async (_, next) => {
              headers().append("Set-Cookie", "mw=1");
              return next();
            },
          ],
          Component: () => null,
        },
      ],
      { serverFunction: () => {} },
    );

    expect(response.status).toBe(400);
    expect(response.headers.getSetCookie()).toEqual(["mw=1"]);
  });

  test("sends cookies once on no-JS server function redirects", async () => {
    let match: RSCMatch | undefined;
    let request = serverFunctionRequest("form");
    let serverResponse = await matchRSCServerRequest({
      createTemporaryReferenceSet: () => ({}),
      decodeAction: async () => async () => {
        headers().append("Set-Cookie", "a=b");
        throw redirect("/target");
      },
      request,
      routes: [rootRoute],
      generateResponse(nextMatch) {
        match = nextMatch;
        return new Response("Encoded Flight", {
          status: nextMatch.statusCode,
          headers: nextMatch.headers,
        });
      },
    });
    let response = await routeRSCServerRequest({
      request,
      serverResponse,
      createFromReadableStream: async () => match?.payload,
      renderHTML() {
        throw new Error("Redirect responses should not render HTML");
      },
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("Location")).toBe("/target");
    expect(response.headers.getSetCookie()).toEqual(["a=b"]);
  });

  test("explains when another copy of React Router handles the request", async () => {
    let storage = (globalThis as any).___reactRouterServerStorage___;
    expect(() =>
      storage.run(
        { request: new Request("https://remix.run/"), runningAction: false },
        () => headers(),
      ),
    ).toThrow("Make sure only one copy of react-router is installed");
  });
});
