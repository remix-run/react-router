import { href } from "../lib/href";
import { matchPath } from "../lib/router/utils";

describe("href", () => {
  it.each([
    ["/*", { "*": "/example.com/a//b" }, "/example.com/a//b"],
    ["/:lang?/*", { "*": "//example.com/path" }, "/example.com/path"],
    ["/:org/:repo", { org: "", repo: "example.com" }, "/example.com"],
    ["/*", { "*": "\\example.com/path" }, "/example.com/path"],
    ["/:value", { value: "\\example.com/path" }, "/example.com/path"],
  ])("normalizes leading separators for %s", (pattern, params, expected) => {
    let result = href(pattern, params);
    expect(result).toBe(expected);
    expect(new URL(result, "https://app.example/").origin).toBe(
      "https://app.example",
    );
  });

  it.each(["/de//example.com/path", "/de/%2Fexample.com/path"])(
    "interpolates splats matched from %s",
    (pathname) => {
      let match = matchPath("/:lang/*", pathname);
      let result = href("/:lang?/*", { "*": match!.params["*"] });
      expect(result).toBe("/example.com/path");
      expect(new URL(result, "https://app.example/").origin).toBe(
        "https://app.example",
      );
    },
  );

  it.each([
    ["/:value", { value: "a/b%20c?next=1#top" }, "/a/b%20c?next=1#top"],
    ["/*", { "*": "a b/café\\file?next=1#top" }, "/a b/café\\file?next=1#top"],
  ])("preserves interpolation for %s", (pattern, params, expected) => {
    expect(href(pattern, params)).toBe(expected);
  });

  it.each([
    ["/*", { "*": "/\t/example.com/path" }],
    ["/:value", { value: "/\t/example.com/path" }],
  ])("validates generated URL prefixes for %s", (pattern, params) => {
    expect(() => href(pattern, params)).toThrow(
      "External navigation is not allowed",
    );
  });

  it("works with param-less paths", () => {
    expect(href("/a/b/c")).toBe("/a/b/c");
  });

  it("works with params", () => {
    expect(href("/a/:b", { b: "hello", z: "ignored" })).toBe("/a/hello");
    expect(href("/a/:b?", { b: "hello", z: "ignored" })).toBe("/a/hello");
    expect(href("/a/:b?")).toBe("/a");
    expect(href("/:b?")).toBe("/");
    expect(href("/a/:e-z", { "e-z": "hello" })).toBe("/a/hello");
  });

  it("works with repeated params", () => {
    expect(href("/a/:b?/:b/:b?/:b", { b: "hello" })).toBe(
      "/a/hello/hello/hello/hello",
    );
    expect(href("/a/:c?/:b/:c?/:b", { b: "hello" })).toBe("/a/hello/hello");
  });

  it("works with splats", () => {
    expect(href("/a/*", { "*": "b/c" })).toBe("/a/b/c");
    expect(href("/a/*", {})).toBe("/a");
  });

  it("works with malformed splats", () => {
    // this is how packages\react-router\lib\router\utils.ts: compilePath() will handle these routes.
    expect(href("/a/z*", { "*": "b/c" })).toBe("/a/z/b/c");
    expect(href("/a/z*", {})).toBe("/a/z");
  });

  it("throws when required params are missing", () => {
    expect(() => href("/a/:b")).toThrow(
      `Path '/a/:b' requires param 'b' but it was not provided`,
    );
  });

  it("works with periods", () => {
    expect(href("/a/:b.zip", { b: "hello" })).toBe("/a/hello.zip");
  });
});
