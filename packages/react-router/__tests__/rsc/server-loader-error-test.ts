import {
  matchRSCServerRequest,
  type RSCMatch,
  type RSCRouteConfigEntry,
} from "../../lib/rsc/server.rsc";

describe("RSC server loader errors", () => {
  it("does not create a Component element for an errored route on a data request", async () => {
    let match: RSCMatch | undefined;

    let routes: RSCRouteConfigEntry[] = [
      {
        id: "root",
        path: "/",
        Component: () => null,
        ErrorBoundary: () => null,
        children: [
          {
            id: "detail",
            path: "p/:id",
            loader: () => {
              throw new Response(JSON.stringify({ error: "not_found" }), {
                status: 404,
              });
            },
            Component: () => null,
            ErrorBoundary: () => null,
          },
        ],
      },
    ];

    await matchRSCServerRequest({
      // A `.rsc` suffix marks this as a data request, so
      // `skipLoaderErrorBubbling: true` keys the loader error to the `detail`
      // route itself instead of bubbling it up to an ancestor boundary.
      request: new Request("https://example.test/p/123.rsc"),
      routes,
      createTemporaryReferenceSet: () => ({}),
      generateResponse(nextMatch) {
        match = nextMatch;
        return new Response(null, {
          status: nextMatch.statusCode,
          headers: nextMatch.headers,
        });
      },
    });

    expect(match).toBeDefined();
    expect(match?.statusCode).toBe(404);

    let payload = match?.payload;
    if (payload?.type !== "render") {
      throw new Error("Expected a render payload");
    }
    await payload.patches;

    // The 404 error must be attributed to the `detail` route itself
    expect(payload.errors).toHaveProperty("detail");
    // ...whose loaderData is never backfilled (errored routes are skipped by
    // the `null` backfill), so rendering its Component would crash on
    // `loaderData === undefined`.
    expect(payload.loaderData.detail).toBeUndefined();

    let detailMatch = payload.matches.find((m) => m.id === "detail");
    expect(detailMatch).toBeDefined();
    // The errored route must NOT ship a renderable Component element - the
    // client renders the errorElement (or the nearest boundary) instead.
    expect(detailMatch!.element).toBeUndefined();
    expect(detailMatch!.errorElement).toBeDefined();

    // Sanity: a non-errored route still gets its Component element.
    let rootMatch = payload.matches.find((m) => m.id === "root");
    expect(rootMatch).toBeDefined();
    expect(rootMatch!.element).toBeDefined();
  });
});
