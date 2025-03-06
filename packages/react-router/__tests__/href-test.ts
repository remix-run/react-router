import { href } from "../lib/href";

describe("href", () => {
  it("works with param-less paths", () => {
    expect(href("/a/b/c")).toBe("/a/b/c");
  });

  it("works with params", () => {
    expect(href("/a/:b", { b: "hello", z: "ignored" })).toBe("/a/hello");
    expect(href("/a/:b?", { b: "hello", z: "ignored" })).toBe("/a/hello");
    expect(href("/a/:b?")).toBe("/a");
  });

  it("works with repeated params", () => {
    expect(href("/a/:b?/:b/:b?/:b", { b: "hello" })).toBe(
      "/a/hello/hello/hello/hello"
    );
  });

  it("works with optional segments", () => {
    expect(href("/a/b?/:c", { c: "hello" })).toBe("/a/hello");
    expect(href("/a/b?/:c", { b: true, c: "hello" })).toBe("/a/b/hello");
  });

  it("works with slpats", () => {
    expect(href("/a/*", { "*": "hello" })).toBe("/a/hello");
    expect(href("/a/*", { "*": "hello/world" })).toBe("/a/hello/world");
  });

  it("throws when required params are missing", () => {
    expect(() => href("/a/:b")).toThrow(
      `Path '/a/:b' requires param 'b' but it was not provided`
    );
    expect(() => href("/a/*")).toThrow(
      `Path '/a/*' requires param '*' but it was not provided`
    );
  });
});
