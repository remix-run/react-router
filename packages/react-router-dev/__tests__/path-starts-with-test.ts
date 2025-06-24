import pathStartsWith from "../config/path-starts-with";

describe("pathStartsWith", () => {
  it("real world example", () => {
    const APP_FOLDER = "/workspace/app";
    expect(pathStartsWith("/workspace/app/root.tsx", APP_FOLDER)).toBe(true);

    const IRRELEVANT_FILE = "/workspace/apps/irrelevant-project/package.json";
    expect(IRRELEVANT_FILE.startsWith(APP_FOLDER)).toBe(true);
    expect(pathStartsWith(IRRELEVANT_FILE, APP_FOLDER)).toBe(false);
  });

  it("edge cases", () => {
    expect(pathStartsWith("./dir", "./dir")).toBe(true);
    expect(pathStartsWith("./dir/", "./dir")).toBe(true);
    expect(pathStartsWith("./dir/path", "./dir")).toBe(true);
    expect(pathStartsWith("./dir/path", "./dir/")).toBe(true);
    expect(pathStartsWith("./dir/path/", "./dir")).toBe(true);
    expect(pathStartsWith("./dir/path/", "./dir/")).toBe(true);

    expect(pathStartsWith("dir", "dir")).toBe(true);
    expect(pathStartsWith("dir/", "dir")).toBe(true);
    expect(pathStartsWith("dir/path", "dir")).toBe(true);
    expect(pathStartsWith("dir/path", "dir/")).toBe(true);
    expect(pathStartsWith("dir/path/", "dir")).toBe(true);
    expect(pathStartsWith("dir/path/", "dir/")).toBe(true);

    expect(pathStartsWith("/dir", "/dir")).toBe(true);
    expect(pathStartsWith("/dir/", "/dir")).toBe(true);
    expect(pathStartsWith("/dir/path", "/dir")).toBe(true);
    expect(pathStartsWith("/dir/path", "/dir/")).toBe(true);
    expect(pathStartsWith("/dir/path/", "/dir")).toBe(true);
    expect(pathStartsWith("/dir/path/", "/dir/")).toBe(true);
  });

  it("paths are not normalized intentionally", () => {
    expect(pathStartsWith("./dir/path", "dir")).toBe(false);
    expect(pathStartsWith("/dir/a/b/c/../../..", "/dir/a/b/c")).toBe(true);
  });
});
