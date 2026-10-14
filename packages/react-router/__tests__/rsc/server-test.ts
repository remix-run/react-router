import {
  matchRSCServerRequest,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";
import { routeRSCServerRequest } from "../../lib/rsc/server.ssr";
import { URL_LIMIT } from "../../lib/dom/ssr/fog-of-war";

describe("RSC server", () => {
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

  describe("middleware short-circuit responses", () => {
    test("tags non-RSC middleware responses as React-Router-Resource", async () => {
      let generateResponseCalled = false;
      let response = await matchRSCServerRequest({
        createTemporaryReferenceSet: () => ({}),
        request: new Request("https://remix.run/docs/intro.md"),
        routes: [
          {
            id: "root",
            path: "/",
            middleware: [
              async ({ request }, next) => {
                let url = new URL(request.url);
                if (url.pathname.endsWith(".md")) {
                  return new Response("# MARKDOWN_BODY", {
                    headers: { "Content-Type": "text/markdown; charset=utf-8" },
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
      expect(await response.text()).toBe("# MARKDOWN_BODY");
    });

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
