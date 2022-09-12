import { generatePath } from "react-router";

describe("generatePath", () => {
  describe("with no params", () => {
    it("returns the unmodified path", () => {
      expect(generatePath("/")).toBe("/");
      expect(generatePath("/courses")).toBe("/courses");
    });
  });

  describe("with params", () => {
    it("returns the path without those params interpolated", () => {
      expect(generatePath("/courses/:id", { id: "routing" })).toBe(
        "/courses/routing"
      );
      expect(generatePath("/courses/*", { "*": "routing/grades" })).toBe(
        "/courses/routing/grades"
      );
      expect(generatePath("*", { "*": "routing/grades" })).toBe(
        "routing/grades"
      );
    });
  });

  describe("with extraneous params", () => {
    it("ignores them", () => {
      expect(generatePath("/", { course: "routing" })).toBe("/");
      expect(generatePath("/courses", { course: "routing" })).toBe("/courses");
    });
  });

  describe("with missing params", () => {
    it("throws an error", () => {
      expect(() => {
        generatePath("/:lang/login", {});
      }).toThrow(/Missing ":lang" param/);
    });
  });

  describe("with a missing splat", () => {
    it("omits the splat and trims the trailing slash", () => {
      expect(generatePath("/courses/*", {})).toBe("/courses");
    });
  });

  it("throws only on on missing named parameters, but not missing splat params", () => {
    expect(() => generatePath(":foo")).toThrow();
    expect(() => generatePath("/:foo")).toThrow();
    expect(() => generatePath("*")).not.toThrow();
    expect(() => generatePath("/*")).not.toThrow();
  });

  it("only interpolates and does not add slashes", () => {
    expect(generatePath("*")).toBe("");
    expect(generatePath("/*")).toBe("/");

    expect(generatePath("foo*")).toBe("foo");
    expect(generatePath("/foo*")).toBe("/foo");

    expect(generatePath(":foo", { foo: "bar" })).toBe("bar");
    expect(generatePath("/:foo", { foo: "bar" })).toBe("/bar");

    expect(generatePath("*", { "*": "bar" })).toBe("bar");
    expect(generatePath("/*", { "*": "bar" })).toBe("/bar");

    expect(generatePath("foo:bar", { bar: "baz" })).toBe("foobaz");
    expect(generatePath("/foo:bar", { bar: "baz" })).toBe("/foobaz");

    expect(generatePath("foo*", { "*": "bar" })).toBe("foobar");
    expect(generatePath("/foo*", { "*": "bar" })).toBe("/foobar");
  });
});
