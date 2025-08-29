import { href } from "../lib/href";

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
});
