import {
  claimRSCReloadDocumentAttempt,
  clearRSCReloadDocumentAttempt,
  getRSCManifestReloadDocumentTarget,
  getRSCReloadDocumentTarget,
  isRSCReloadDocumentResponse,
} from "../../lib/rsc/browser";

describe("RSC document reload recovery", () => {
  beforeEach(() => {
    window.history.replaceState(null, "", "/current?tab=one#section");
    // @ts-expect-error test-only router globals
    window.__reactRouterDataRouter = undefined;
    // @ts-expect-error test-only router globals
    window.__reactRouterRSCVersion = undefined;
    clearRSCReloadDocumentAttempt();
  });

  it("recognizes reload-document responses", () => {
    expect(
      isRSCReloadDocumentResponse(
        new Response(null, {
          status: 204,
          headers: { "X-Remix-Reload-Document": "true" },
        }),
      ),
    ).toBe(true);

    expect(
      isRSCReloadDocumentResponse(
        new Response(null, {
          status: 200,
          headers: { "X-Remix-Reload-Document": "true" },
        }),
      ),
    ).toBe(false);
  });

  it("reloads GET RSC responses at the document request target", () => {
    // @ts-expect-error partial router global for this focused unit test
    window.__reactRouterDataRouter = {
      state: {
        navigation: {
          location: {
            pathname: "/target",
            search: "?panel=notes",
            hash: "#source",
          },
        },
      },
    };

    expect(
      getRSCReloadDocumentTarget(
        new Request("http://localhost/target?panel=notes"),
      ),
    ).toBe("/target?panel=notes#source");
  });

  it("reloads GET fetcher RSC responses at the current document", () => {
    expect(
      getRSCReloadDocumentTarget(
        new Request("http://localhost/target?panel=notes"),
        "fetcher",
      ),
    ).toBe("http://localhost/current?tab=one#section");
  });

  it("reloads mutation RSC responses at the current document", () => {
    expect(
      getRSCReloadDocumentTarget(
        new Request("http://localhost/target", { method: "POST" }),
      ),
    ).toBe("http://localhost/current?tab=one#section");
  });

  it("reloads manifest mismatches at the pending navigation target", () => {
    // @ts-expect-error partial router global for this focused unit test
    window.__reactRouterDataRouter = {
      state: {
        navigation: {
          location: {
            pathname: "/target",
            search: "?panel=notes",
            hash: "#source",
          },
        },
      },
    };

    expect(getRSCManifestReloadDocumentTarget("/target")).toBe(
      "/target?panel=notes#source",
    );
  });

  it("reloads fetcher manifest mismatches at the current document", () => {
    expect(getRSCManifestReloadDocumentTarget("/target", "fetcher")).toBe(
      "http://localhost/current?tab=one#section",
    );
  });

  it("bounds reload attempts by target URL and client version", () => {
    // @ts-expect-error test-only router globals
    window.__reactRouterRSCVersion = "version-a";
    expect(claimRSCReloadDocumentAttempt("/target")).toBe(true);
    expect(claimRSCReloadDocumentAttempt("/target")).toBe(false);

    // @ts-expect-error test-only router globals
    window.__reactRouterRSCVersion = "version-b";
    expect(claimRSCReloadDocumentAttempt("/target")).toBe(true);
    expect(claimRSCReloadDocumentAttempt("/other")).toBe(true);

    clearRSCReloadDocumentAttempt();
    expect(claimRSCReloadDocumentAttempt("/target")).toBe(true);
  });
});
