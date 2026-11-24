import {
  matchRSCServerRequest,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";
import { routeRSCServerRequest } from "../../lib/rsc/server.ssr";
import { URL_LIMIT } from "../../lib/dom/ssr/fog-of-war";

describe("RSC server", () => {
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

  test.each(["return", "throw"])(
    "handles HEAD resource middleware responses (%s)",
    async (behavior) => {
      let cancel = jest.fn();
      let resourceResponse = new Response(new ReadableStream({ cancel }), {
        status: 403,
        headers: { "Content-Type": "text/plain" },
      });
      let request = new Request("https://remix.run/resource", {
        method: "HEAD",
      });
      let serverResponse = await matchRSCServerRequest({
        createTemporaryReferenceSet: () => ({}),
        request,
        routes: [
          {
            id: "resource",
            path: "/resource",
            middleware: [
              () => {
                if (behavior === "throw") throw resourceResponse;
                return resourceResponse;
              },
            ],
            loader() {
              throw new Error("Resource loader should not be called");
            },
          },
        ],
        generateResponse() {
          throw new Error("Resource response should not be encoded as Flight");
        },
      });

      expect(serverResponse.status).toBe(403);
      expect(serverResponse.headers.get("Content-Type")).toBe("text/plain");
      expect(serverResponse.headers.get("React-Router-Resource")).toBe("true");
      expect(serverResponse.body).toBeNull();
      expect(cancel).toHaveBeenCalledTimes(1);
      expect(
        await routeRSCServerRequest({
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
        }),
      ).toBe(serverResponse);
    },
  );

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
  });
});

async function matchManifestRequest(
  request: Request,
  routes: RSCRouteConfigEntry[],
) {
  let match: RSCMatch | undefined;
  let response = await matchRSCServerRequest({
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
