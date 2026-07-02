import type { RouteObject } from "react-router";
import { matchRoutes } from "react-router";

describe("route ranking with suffixed params", () => {
  it("ranks a static route above a dynamic param with a static suffix", () => {
    let dynamicFirst: RouteObject[] = [
      { path: "/:lang.xml" },
      { path: "/sitemap.xml" },
    ];
    let staticFirst: RouteObject[] = [
      { path: "/sitemap.xml" },
      { path: "/:lang.xml" },
    ];

    for (let routes of [dynamicFirst, staticFirst]) {
      let matches = matchRoutes(routes, "/sitemap.xml");
      expect(matches).not.toBeNull();
      expect(matches![0].route.path).toBe("/sitemap.xml");
      expect(matches![0].params).toEqual({});
    }
  });

  it("still matches the suffixed-param route for a non-literal value", () => {
    let routes: RouteObject[] = [
      { path: "/:lang.xml" },
      { path: "/sitemap.xml" },
    ];

    let matches = matchRoutes(routes, "/fr.xml");
    expect(matches).not.toBeNull();
    expect(matches![0].route.path).toBe("/:lang.xml");
    expect(matches![0].params).toEqual({ lang: "fr" });
  });
});
