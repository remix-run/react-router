import { href } from "../lib/href";
import { matchPath } from "../lib/router/utils";

describe("href", () => {
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

  it("encodes param values that contain a /", () => {
    expect(href("/products/:id", { id: "shoes/2026-summer" })).toBe(
      "/products/shoes%2F2026-summer",
    );
  });

  it("encodes param values that contain # or ?", () => {
    expect(href("/products/:id", { id: "abc#frag" })).toBe(
      "/products/abc%23frag",
    );
    // "?" is escaped (it would start the query string), "=" is not (it is a
    // valid pchar in a path segment, unlike in a query string)
    expect(href("/products/:id", { id: "abc?x=1" })).toBe(
      "/products/abc%3Fx=1",
    );
  });

  it("preserves characters RFC 3986 allows literally in a path segment", () => {
    // pchar sub-delims plus ":" and "@" — see RFC 3986 §3.3
    expect(href("/products/:id", { id: "$&+,;=:@" })).toBe(
      "/products/$&+,;=:@",
    );
    // e.g. a semver build suffix survives untouched
    expect(href("/releases/:version", { version: "1.0.0+1" })).toBe(
      "/releases/1.0.0+1",
    );
  });

  it("encodes splat param values while preserving segments", () => {
    expect(href("/:param/*", { param: "a?b/c#d", "*": "e?f/g#h" })).toBe(
      "/a%3Fb%2Fc%23d/e%3Ff/g%23h",
    );
    expect(href("/releases/*", { "*": "v1/1.0.0+1" })).toBe(
      "/releases/v1/1.0.0+1",
    );
  });

  it("round-trips through matchPath for param values with special characters", () => {
    let pattern = "/products/:id";
    for (let id of [
      "shoes/2026-summer",
      "abc#frag",
      "abc?x=1",
      "a b",
      "$&+,;=:@",
      "1.0.0+1",
    ]) {
      let result = href(pattern, { id });
      // before the fix, href()'s own output didn't match its own pattern
      let match = matchPath(pattern, result);
      expect(match).not.toBeNull();
      expect(decodeURIComponent(match!.params.id!)).toBe(id);
    }
  });

  it("coerces values to strings", () => {
    expect(href("/:a/:b", { a: 1, b: true })).toBe("/1/true");
  });
});
