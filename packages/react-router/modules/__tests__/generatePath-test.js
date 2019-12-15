import { generatePath } from "react-router";

describe("generatePath", () => {
  describe('with pattern="/"', () => {
    it("returns correct url with no params", () => {
      const pattern = "/";
      const generated = generatePath(pattern);
      expect(generated).toBe("/");
    });

    it("returns correct url with params", () => {
      const pattern = "/";
      const params = { foo: "tobi", bar: 123 };
      const generated = generatePath(pattern, params);
      expect(generated).toBe("/");
    });
  });

  describe('with pattern="/:foo/somewhere/:bar"', () => {
    it("throws with no params", () => {
      const pattern = "/:foo/somewhere/:bar";
      expect(() => {
        generatePath(pattern);
      }).toThrow();
    });

    it("throws with some params", () => {
      const pattern = "/:foo/somewhere/:bar";
      const params = { foo: "tobi", quux: 999 };
      expect(() => {
        generatePath(pattern, params);
      }).toThrow();
    });

    it("returns correct url with params", () => {
      const pattern = "/:foo/somewhere/:bar";
      const params = { foo: "tobi", bar: 123 };
      const generated = generatePath(pattern, params);
      expect(generated).toBe("/tobi/somewhere/123");
    });

    it("returns correct url with additional params", () => {
      const pattern = "/:foo/somewhere/:bar";
      const params = { foo: "tobi", bar: 123, quux: 999 };
      const generated = generatePath(pattern, params);
      expect(generated).toBe("/tobi/somewhere/123");
    });
  });

  describe("with no path", () => {
    it("matches the root URL", () => {
      const generated = generatePath();
      expect(generated).toBe("/");
    });
  });

  describe('simple pattern="/view/:id"', () => {
    it("handle = on params", () => {
      const pattern = "/view/:id";
      const params = { id: "Q29tcGxhaW50OjVhZjFhMDg0MzhjMTk1MThiMTdlOTQ2Yg==" };

      const generated = generatePath(pattern, params);
      expect(generated).toBe(
        "/view/Q29tcGxhaW50OjVhZjFhMDg0MzhjMTk1MThiMTdlOTQ2Yg=="
      );
    });
  });

  describe("with optional params=/posts/:id?", () => {
    it("returns correct url with optional params", () => {
      const pattern = "/posts/:id?";
      const params = { id: "post-id" };

      const generated = generatePath(pattern, params);
      expect(generated).toBe("/posts/post-id");
    });

    it("returns correct url without optional params", () => {
      const pattern = "/posts/:id?";

      const generated = generatePath(pattern);
      expect(generated).toBe("/posts");
    });
  });

  describe("with zero or more params modifier=/some/:path*", () => {
    it("returns correct url without params", () => {
      const pattern = "/some/:path*";

      const generated = generatePath(pattern);
      expect(generated).toBe("/some");
    });

    it("returns correct url with empty array", () => {
      const pattern = "/some/:path*";
      const params = { path: [] };

      const generated = generatePath(pattern, params);
      expect(generated).toBe("/some");
    });

    it("returns correct url with primitive params", () => {
      const pattern = "/some/:path*";
      const params = { path: "primitive" };

      const generated = generatePath(pattern, params);
      expect(generated).toBe("/some/primitive");
    });

    it("returns correct url with array of params", () => {
      const pattern = "/some/:path*";
      const params = { path: ["array", "of", "params"] };

      const generated = generatePath(pattern, params);
      expect(generated).toBe("/some/array/of/params");
    });
  });

  describe("with one or more params modifier=/some/:path+", () => {
    it("throws error without params", () => {
      const pattern = "/some/:path+";

      expect(() => {
        generatePath(pattern);
      }).toThrow();
    });

    it("throws error with empty array", () => {
      const pattern = "/some/:path+";
      const params = { path: [] };

      expect(() => {
        generatePath(pattern, params);
      }).toThrow();
    });

    it("returns correct url with primitive params", () => {
      const pattern = "/some/:path+";
      const params = { path: "primitive" };

      const generated = generatePath(pattern, params);
      expect(generated).toBe("/some/primitive");
    });

    it("returns correct url with array of params", () => {
      const pattern = "/some/:path+";
      const params = { path: ["array", "of", "params"] };

      const generated = generatePath(pattern, params);
      expect(generated).toBe("/some/array/of/params");
    });
  });
});
