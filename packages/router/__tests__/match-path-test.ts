import { matchPath } from "@remix-run/router";

describe("matchPath", () => {
  describe("given a pattern with optional parameters", () => {
    it("matches paths with or without these optional parameters", () => {
      const pattern = { path: "/foo/:bar?/:baz?" };

      expect(matchPath(pattern, "/foo/bar/baz")).toEqual({
        params: { bar: "bar", baz: "baz" },
        pathname: "/foo/bar/baz",
        pathnameBase: "/foo/bar/baz",
        pattern
      });

      expect(matchPath(pattern, "/foo/bar")).toEqual({
        params: { bar: "bar", baz: "" },
        pathname: "/foo/bar",
        pathnameBase: "/foo/bar",
        pattern
      });

      expect(matchPath(pattern, "/foo")).toEqual({
        params: { bar: "", baz: "" },
        pathname: "/foo",
        pathnameBase: "/foo",
        pattern
      });
    });
  });
});
