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
      expect(
        generatePath("/courses/:id/student/:studentId", {
          id: "routing",
          studentId: "matt",
        })
      ).toBe("/courses/routing/student/matt");
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
    let consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});

    expect(generatePath("*")).toBe("");
    expect(generatePath("/*")).toBe("/");

    expect(generatePath("foo*")).toBe("foo");
    expect(generatePath("/foo*")).toBe("/foo");

    expect(generatePath(":foo", { foo: "bar" })).toBe("bar");
    expect(generatePath("/:foo", { foo: "bar" })).toBe("/bar");

    expect(generatePath("*", { "*": "bar" })).toBe("bar");
    expect(generatePath("/*", { "*": "bar" })).toBe("/bar");

    // No support for partial dynamic params
    expect(generatePath("foo:bar", { bar: "baz" })).toBe("foo:bar");
    expect(generatePath("/foo:bar", { bar: "baz" })).toBe("/foo:bar");

    // Partial splats are treated as independent path segments
    expect(generatePath("foo*", { "*": "bar" })).toBe("foo/bar");
    expect(generatePath("/foo*", { "*": "bar" })).toBe("/foo/bar");

    // Ensure we warn on partial splat usages
    expect(consoleWarn.mock.calls).toMatchInlineSnapshot(`
      Array [
        Array [
          "Route path \\"foo*\\" will be treated as if it were \\"foo/*\\" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to \\"foo/*\\".",
        ],
        Array [
          "Route path \\"/foo*\\" will be treated as if it were \\"/foo/*\\" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to \\"/foo/*\\".",
        ],
        Array [
          "Route path \\"foo*\\" will be treated as if it were \\"foo/*\\" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to \\"foo/*\\".",
        ],
        Array [
          "Route path \\"/foo*\\" will be treated as if it were \\"/foo/*\\" because the \`*\` character must always follow a \`/\` in the pattern. To get rid of this warning, please change the route path to \\"/foo/*\\".",
        ],
      ]
    `);

    consoleWarn.mockRestore();
  });
});
