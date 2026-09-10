/* eslint-disable jest/expect-expect */
import { RoutePatternDataRouteMatcher } from "../../lib/router/matcher-route-pattern";
import { V6RegExMatcher } from "../../lib/router/matcher";
import type {
  DataRouteMatch,
  DataRouteObject,
  Params,
} from "../../lib/router/utils";

type MatchSummary = {
  routeIds: string[];
  params: Params;
};

function summarizeMatches(
  matches: DataRouteMatch[] | null,
): MatchSummary | null {
  if (matches == null) {
    return null;
  }

  return {
    routeIds: matches.map((match) => match.route.id),
    params: matches[0]?.params ?? {},
  };
}

describe("V6 regex and route-pattern matcher comparison", () => {
  describe("shared behavior", () => {
    function assertSameBehavior(
      routes: DataRouteObject[],
      pathname: string,
      expected: MatchSummary | null,
    ) {
      let v6Regex = new V6RegExMatcher("/");
      let routePattern = new RoutePatternDataRouteMatcher("/");

      v6Regex.update(routes);
      routePattern.update(routes);

      expect(summarizeMatches(v6Regex.match(pathname))).toEqual(expected);
      expect(summarizeMatches(routePattern.match(pathname))).toEqual(expected);
    }

    it("static segments rank above dynamic segments", () => {
      let routes: DataRouteObject[] = [
        { path: "/users/:id", id: "user" },
        { path: "/users/new", id: "new-user" },
      ];

      assertSameBehavior(routes, "/users/new", {
        routeIds: ["new-user"],
        params: {},
      });
    });

    it("dynamic segments rank above splats", () => {
      let routes: DataRouteObject[] = [
        { path: "/files/*", id: "files" },
        { path: "/files/:id", id: "file" },
      ];

      assertSameBehavior(routes, "/files/readme", {
        routeIds: ["file"],
        params: { id: "readme" },
      });
    });

    it("nested index routes match exact parent paths", () => {
      let routes: DataRouteObject[] = [
        {
          path: "/",
          id: "root",
          children: [
            {
              path: "projects",
              id: "projects",
              children: [
                { index: true, id: "projects-index" },
                { path: ":projectId", id: "project" },
              ],
            },
          ],
        },
      ];

      assertSameBehavior(routes, "/projects", {
        routeIds: ["root", "projects", "projects-index"],
        params: {},
      });
    });

    it("optional params bind from left to right", () => {
      let routes: DataRouteObject[] = [
        {
          path: "/archive/:year?/:month?",
          id: "archive",
        },
      ];

      assertSameBehavior(routes, "/archive/2024", {
        routeIds: ["archive"],
        params: { year: "2024" },
      });
    });

    it("preserves absolute children under optional parents", () => {
      let routes: DataRouteObject[] = [
        {
          path: "/:lang?",
          id: "language",
          children: [{ path: "/dashboard", id: "dashboard" }],
        },
      ];

      assertSameBehavior(routes, "/dashboard", {
        routeIds: ["language", "dashboard"],
        params: {},
      });
    });

    it("matching is case-insensitive and ignores trailing slashes", () => {
      let routes: DataRouteObject[] = [{ path: "/users/:id", id: "user" }];

      assertSameBehavior(routes, "/USERS/123/", {
        routeIds: ["user"],
        params: { id: "123" },
      });
    });

    it("encoded path params are decoded", () => {
      let routes: DataRouteObject[] = [{ path: "/view/:id", id: "view" }];

      assertSameBehavior(routes, "/view/%23intro", {
        routeIds: ["view"],
        params: { id: "#intro" },
      });
    });

    it("matches special characters literally in static segments", () => {
      let routes: DataRouteObject[] = [
        { path: "/docs/report(v1)+[final].json", id: "document" },
      ];

      assertSameBehavior(routes, "/docs/report(v1)+[final].json", {
        routeIds: ["document"],
        params: {},
      });
    });

    it("matches percent-encoded Unicode in static segments", () => {
      let routes: DataRouteObject[] = [
        { path: "/docs/café-✅", id: "unicode-document" },
      ];

      assertSameBehavior(routes, "/docs/caf%C3%A9-%E2%9C%85", {
        routeIds: ["unicode-document"],
        params: {},
      });
    });

    it("decodes percent-encoded Unicode and URL delimiters in params", () => {
      let routes: DataRouteObject[] = [{ path: "/search/:term", id: "search" }];

      assertSameBehavior(
        routes,
        "/search/React%20Router%20%E2%9C%85%23%25%26",
        {
          routeIds: ["search"],
          params: { term: "React Router ✅#%&" },
        },
      );
    });

    it("preserves percent-encoded slashes within path params", () => {
      let routes: DataRouteObject[] = [
        { path: "/files/:name/details", id: "file-details" },
      ];

      assertSameBehavior(routes, "/files/a%2Fb/details", {
        routeIds: ["file-details"],
        params: { name: "a/b" },
      });
    });
  });

  describe("intentional ranking differences", () => {
    it("uses positional specificity instead of aggregate segment scores", () => {
      let routes: DataRouteObject[] = [
        { path: "/products/*", id: "static-prefix" },
        {
          path: "/:first/:second/:third/:fourth",
          id: "all-dynamic",
        },
      ];

      let v6Regex = new V6RegExMatcher("/");
      let routePattern = new RoutePatternDataRouteMatcher("/");

      v6Regex.update(routes);
      routePattern.update(routes);

      expect(
        summarizeMatches(v6Regex.match("/products/one/two/three")),
      ).toEqual({
        routeIds: ["all-dynamic"],
        params: {
          first: "products",
          second: "one",
          third: "two",
          fourth: "three",
        },
      });
      expect(
        summarizeMatches(routePattern.match("/products/one/two/three")),
      ).toEqual({
        routeIds: ["static-prefix"],
        params: { "*": "one/two/three" },
      });
    });
  });
});
