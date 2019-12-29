import { matchPath } from "react-router";

describe("matchPath", () => {
  describe("without path property on params", () => {
    it("doesn't throw an exception", () => {
      expect(() => {
        matchPath("/milkyway/eridani", { hash: "foo" });
      }).not.toThrow();
    });
  });

  describe('with path=""', () => {
    it('returns correct url at "/"', () => {
      const path = "";
      const pathname = "/";
      const match = matchPath(pathname, path);
      // TODO: why is match.url "/" instead of ""?
      expect(match.url).toBe("/");
    });

    it('returns correct url at "/somewhere/else"', () => {
      const path = "";
      const pathname = "/somewhere/else";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/");
    });
  });

  describe('with path="/"', () => {
    it('returns correct url at "/"', () => {
      const path = "/";
      const pathname = "/";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/");
    });

    it('returns correct url at "/somewhere/else"', () => {
      const path = "/";
      const pathname = "/somewhere/else";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/");
    });
  });

  describe('with path="/somewhere"', () => {
    it('returns correct url at "/somewhere"', () => {
      const path = "/somewhere";
      const pathname = "/somewhere";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/somewhere");
    });

    it('returns correct url at "/somewhere/else"', () => {
      const path = "/somewhere";
      const pathname = "/somewhere/else";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/somewhere");
    });
  });

  describe("with an array of paths", () => {
    it("accepts an array as 2nd argument", () => {
      const path = ["/somewhere", "/elsewhere"];
      const pathname = "/elsewhere";
      const match = matchPath(pathname, path);
      expect(match.url).toBe("/elsewhere");
    });

    it('return the correct url at "/elsewhere"', () => {
      const path = ["/somewhere", "/elsewhere"];
      const pathname = "/elsewhere";
      const match = matchPath(pathname, { path });
      expect(match.url).toBe("/elsewhere");
    });

    it('returns correct url at "/elsewhere/else"', () => {
      const path = ["/somewhere", "/elsewhere"];
      const pathname = "/elsewhere/else";
      const match = matchPath(pathname, { path });
      expect(match.url).toBe("/elsewhere");
    });

    it('returns correct url at "/elsewhere/else" with path "/" in array', () => {
      const path = ["/somewhere", "/"];
      const pathname = "/elsewhere/else";
      const match = matchPath(pathname, { path });
      expect(match.url).toBe("/");
    });

    it('returns correct url at "/somewhere" with path "/" in array', () => {
      const path = ["/somewhere", "/"];
      const pathname = "/somewhere";
      const match = matchPath(pathname, { path });
      expect(match.url).toBe("/somewhere");
    });
  });

  describe("with sensitive path", () => {
    it("returns non-sensitive url", () => {
      const options = {
        path: "/SomeWhere"
      };
      const pathname = "/somewhere";
      const match = matchPath(pathname, options);
      expect(match.url).toBe("/somewhere");
    });

    it("returns sensitive url", () => {
      const options = {
        path: "/SomeWhere",
        sensitive: true
      };
      const pathname = "/somewhere";
      const match = matchPath(pathname, options);
      expect(match).toBe(null);
    });
  });

  describe("with relative path (no leading slash)", () => {
    it("returns correct match url and params with no parent", () => {
      const pathname = "/7";
      const options = {
        path: ":number"
      };
      const match = matchPath(pathname, options, null);
      expect(match.url).toBe("/7");
      expect(match.params).toEqual({ number: "7" });
    });

    it("returns correct match url and params with parent", () => {
      const pathname = "/test-location/7";
      const options = {
        path: ":number"
      };
      const base = "/test-location";

      const match = matchPath(pathname, options, base);
      expect(match.url).toBe("/test-location/7");
      expect(match.params).toEqual({ number: "7" });
    });

    it("passes along parent match params", () => {
      const pathname = "/test-location/hello/7";
      const options = {
        path: ":number"
      };
      const base = "/test-location/:something";
      const match = matchPath(pathname, options, base);
      expect(match.url).toBe("/test-location/hello/7");
      expect(match.params).toEqual({ something: "hello", number: "7" });
    });

    it("resolves relative path with leading ./", () => {
      const pathname = "/sauce/sriracha";
      const options = {
        path: "./sriracha"
      };
      const base = "/sauce";

      const match = matchPath(pathname, options, base);
      expect(match.url).toBe("/sauce/sriracha");
    });

    it("throws an error for relative path with leading ..", () => {
      const pathname = "/sauce/sriracha";
      const options = {
        path: "../tobasco"
      };

      expect(() => {
        matchPath(pathname, options);
      }).toThrow(/cannot resolve pathname/);
    });
  });

  describe("cache", () => {
    it("creates a cache entry for each exact/strict pair", () => {
      // true/false and false/true will collide when adding booleans
      const trueFalse = matchPath("/one/two", {
        path: "/one/two/",
        exact: true,
        strict: false
      });
      const falseTrue = matchPath("/one/two", {
        path: "/one/two/",
        exact: false,
        strict: true
      });
      expect(!!trueFalse).toBe(true);
      expect(!!falseTrue).toBe(false);
    });
  });
});
