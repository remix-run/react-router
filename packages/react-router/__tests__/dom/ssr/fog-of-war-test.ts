import {
  getManifestPathsParam,
  getPathsWithAncestors,
} from "../../../lib/dom/ssr/fog-of-war";

describe("fog of war", () => {
  describe("getPathsWithAncestors", () => {
    test("adds parent paths", () => {
      expect(getPathsWithAncestors(["/a/b/c"])).toEqual([
        "/a",
        "/a/b",
        "/a/b/c",
      ]);
    });

    test("dedupes shared parent paths", () => {
      expect(getPathsWithAncestors(["/a/b", "/a/c"])).toEqual([
        "/a",
        "/a/b",
        "/a/c",
      ]);
    });

    test("normalizes paths without leading slashes", () => {
      expect(getPathsWithAncestors(["a/b"])).toEqual(["/a", "/a/b"]);
    });
  });

  describe("getManifestPathsParam", () => {
    test("sorts and comma-joins paths", () => {
      expect(getManifestPathsParam(["/b", "/a"])).toBe("/a,/b");
    });

    test("encodes commas within paths", () => {
      expect(getManifestPathsParam(["/tags", "/tags/a,b"])).toBe(
        "/tags,/tags/a%2Cb",
      );
    });

    test("does not mutate the input", () => {
      let paths = ["/b", "/a"];
      getManifestPathsParam(paths);
      expect(paths).toEqual(["/b", "/a"]);
    });
  });
});
