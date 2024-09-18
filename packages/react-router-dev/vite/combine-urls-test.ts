import { combineURLs } from "./combine-urls";

describe("combineURLs", () => {
  test("URLs without slashes", () => {
    expect(combineURLs("http://example.com", "path")).toBe(
      "http://example.com/path"
    );
  });

  test("URLs with slashes", () => {
    expect(combineURLs("http://example.com/", "/path")).toBe(
      "http://example.com/path"
    );
  });

  test("base URL with trailing slash and relative URL with no leading slash", () => {
    expect(combineURLs("http://example.com/", "path")).toBe(
      "http://example.com/path"
    );
  });

  test("base URL with no trailing slash and relative URL with leading slash", () => {
    expect(combineURLs("http://example.com", "/path")).toBe(
      "http://example.com/path"
    );
  });

  test("multiple trailing slashes on base URL and leading slashes on relative URL", () => {
    expect(combineURLs("http://example.com///", "///path")).toBe(
      "http://example.com/path"
    );
  });

  test("URLs with multiple slashes", () => {
    expect(combineURLs("http://example.com///", "///path")).toBe(
      "http://example.com/path"
    );
  });

  test("both URLs with nested paths", () => {
    expect(combineURLs("http://example.com/dir/", "/subdir/file")).toBe(
      "http://example.com/dir/subdir/file"
    );
  });

  test("empty relative URL", () => {
    expect(combineURLs("http://example.com/", "")).toBe("http://example.com/");
  });

  test("empty base URL", () => {
    expect(combineURLs("", "path")).toBe("/path");
  });

  test("both URLs empty", () => {
    expect(combineURLs("", "")).toBe("");
  });
});
