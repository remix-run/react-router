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

  describe("pathFunctionOptions", () => {
    const pattern = "/password/restore?email=:email";

    describe("pathFunctionOptions ignored", () => {
      // symbols that are escaped by default
      it("returns path with escaped slash symbol (/)", () => {
        const params = { email: "emailWith/Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith%2FSign@gmail.com"
        );
      });
      it("returns path with escaped question mark symbol (?)", () => {
        const params = { email: "emailWith?Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith%3FSign@gmail.com"
        );
      });
      it("returns path with escaped hash symbol (#)", () => {
        const params = { email: "emailWith#Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith%23Sign@gmail.com"
        );
      });

      // symbols that are not escaped by default
      it("returns path with dollar sign symbol ($) encoded as is", () => {
        const params = { email: "emailWith$Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith$Sign@gmail.com"
        );
      });
      it("returns path with ampersand symbol (&) encoded as is", () => {
        const params = { email: "emailWith&Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith&Sign@gmail.com"
        );
      });
      it("returns path with plus symbol (+) encoded as is", () => {
        const params = { email: "emailWith+Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith+Sign@gmail.com"
        );
      });
      it("returns path with comma symbol (,) encoded as is", () => {
        const params = { email: "emailWith,Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith,Sign@gmail.com"
        );
      });
      it("returns path with colon symbol (:) encoded as is", () => {
        const params = { email: "emailWith:Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith:Sign@gmail.com"
        );
      });
      it("returns path with semicolon symbol (;) encoded as is", () => {
        const params = { email: "emailWith;Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith;Sign@gmail.com"
        );
      });
      it("returns path with equals sign symbol (=) encoded as is", () => {
        const params = { email: "emailWith=Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith=Sign@gmail.com"
        );
      });
      it("returns path with at sign symbol (@) encoded as is", () => {
        const params = { email: "emailWith@Sign@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith@Sign@gmail.com"
        );
      });
    });
    describe("pathFunctionOptions when { pretty: true }", () => {
      // basically the same as 'ignored' test case
      it("returns path with escaped symbols (/#?)", () => {
        const params = { email: "emailWith/#?Signs@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith%2F%23%3FSigns@gmail.com"
        );
      });
      it("returns path with symbols that does not escaped", () => {
        const params = { email: "emailWith$&+,:;=@Signs@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).toBe(
          "/password/restore?email=emailWith$&+,:;=@Signs@gmail.com"
        );
      });
    });
    describe("pathFunctionOptions when { pretty: false }", () => {
      it("returns path with dollar sign symbol ($) encoded as an escaped character", () => {
        const params = { email: "emailWith$Sign@gmail.com" };
        const generated = generatePath(pattern, params, { pretty: false });
        expect(generated).toBe(
          "/password/restore?email=emailWith%24Sign%40gmail.com"
        );
      });
      it("returns path with ampersand symbol (&) encoded as an escaped character", () => {
        const params = { email: "emailWith&Sign@gmail.com" };
        const generated = generatePath(pattern, params, { pretty: false });
        expect(generated).toBe(
          "/password/restore?email=emailWith%26Sign%40gmail.com"
        );
      });
      it("returns path with plus symbol (+) encoded as an escaped character", () => {
        const params = { email: "emailWith+Sign@gmail.com" };
        const generated = generatePath(pattern, params, { pretty: false });
        expect(generated).toBe(
          "/password/restore?email=emailWith%2BSign%40gmail.com"
        );
      });
      it("returns path with comma symbol (,) encoded as an escaped character", () => {
        const params = { email: "emailWith,Sign@gmail.com" };
        const generated = generatePath(pattern, params, { pretty: false });
        expect(generated).toBe(
          "/password/restore?email=emailWith%2CSign%40gmail.com"
        );
      });
      it("returns path with colon symbol (:) encoded as an escaped character", () => {
        const params = { email: "emailWith:Sign@gmail.com" };
        const generated = generatePath(pattern, params, { pretty: false });
        expect(generated).toBe(
          "/password/restore?email=emailWith%3ASign%40gmail.com"
        );
      });
      it("returns path with semicolon symbol (;) encoded as an escaped character", () => {
        const params = { email: "emailWith;Sign@gmail.com" };
        const generated = generatePath(pattern, params, { pretty: false });
        expect(generated).toBe(
          "/password/restore?email=emailWith%3BSign%40gmail.com"
        );
      });
      it("returns path with equals sign symbol (=) encoded as an escaped character", () => {
        const params = { email: "emailWith=Sign@gmail.com" };
        const generated = generatePath(pattern, params, { pretty: false });
        expect(generated).toBe(
          "/password/restore?email=emailWith%3DSign%40gmail.com"
        );
      });
      it("returns path with at sign symbol (@) encoded as an escaped character", () => {
        const params = { email: "emailWith@Sign@gmail.com" };
        const generated = generatePath(pattern, params, { pretty: false });
        expect(generated).toBe(
          "/password/restore?email=emailWith%40Sign%40gmail.com"
        );
      });
    });
    describe("pathFunctionOption output expectations with wrong flag", () => {
      it("what it should not be if flag is { pretty: true }", () => {
        const params = { email: "emailWith$&+,:;=@Signs@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).not.toBe(
          "/password/restore?email=emailWith%24%26%2B%2C%3A%3B%3D%40Signs%40gmail.com"
        );
      });
      it("what it should not be if flag is { pretty: false }", () => {
        const params = { email: "emailWith$&+,:;=@Signs@gmail.com" };
        const generated = generatePath(pattern, params);
        expect(generated).not.toBe(
          "/password/restore?email=emailWith$&+,:;=@Signs@gmail.com "
        );
      });
    });
  });
});
