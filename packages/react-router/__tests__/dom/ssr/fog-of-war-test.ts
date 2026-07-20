import { getPathsWithAncestors } from "../../../lib/dom/ssr/fog-of-war";

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
});
