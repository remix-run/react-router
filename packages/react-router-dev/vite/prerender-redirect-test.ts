import { getPrerenderRedirectHtml } from "./prerender-redirect";

describe("prerender redirect HTML", () => {
  test.each([
    "data:text/plain,Example",
    "file:///tmp/example.html",
    "JaVa\tsCrIpT:void(0)",
    "vbscript:0",
  ])("rejects unsupported redirect protocol in %s", (location) => {
    expect(() =>
      getPrerenderRedirectHtml(
        new Response(null, { status: 302, headers: { Location: location } }),
        "/redirect",
      ),
    ).toThrow("unsafe URL protocol");
  });

  test.each([
    "../target",
    "https://example.com/target",
    "//example.com/target",
    "mailto:hello@example.com",
  ])("preserves redirect target %s", (location) => {
    let html = getPrerenderRedirectHtml(
      new Response(null, { status: 301, headers: { Location: location } }),
      "/source",
    );
    expect(html).toContain(`href="${location}"`);
  });

  test("escapes the source pathname as text", () => {
    let html = getPrerenderRedirectHtml(
      new Response(null, { status: 302, headers: { Location: "/target" } }),
      '/source"&<name>',
    );
    expect(html).toContain("/source&quot;&amp;&lt;name&gt;");
    expect(html).not.toContain("<name>");
  });
});
