import {
  matchRSCServerRequest,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";
import { URL_LIMIT } from "../../lib/dom/ssr/fog-of-war";

describe("RSC server", () => {
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
