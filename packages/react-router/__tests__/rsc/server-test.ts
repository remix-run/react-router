import {
  matchRSCServerRequest,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";
import { routeRSCServerRequest } from "../../lib/rsc/server.ssr";
import { URL_LIMIT } from "../../lib/dom/ssr/fog-of-war";

describe("RSC server", () => {
  test("normalizes redirect locations", async () => {
    let response = await routeRSCServerRequest({
      request: new Request("https://remix.run/"),
      serverResponse: new Response("RSC payload", { status: 202 }),
      createFromReadableStream: async () => ({
        type: "redirect",
        location: "//example/path?search=value#hash",
        status: 302,
      }),
      async renderHTML() {
        throw new Error("Unexpected HTML render");
      },
    });

    expect(response.headers.get("Location")).toBe(
      "/example/path?search=value#hash",
    );
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
