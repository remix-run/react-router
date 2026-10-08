import {
  matchRSCServerRequest,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";
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
