import {
  getPathsWithAncestors,
  shouldUseInitialRouteDiscovery,
  URL_LIMIT,
} from "../../../lib/dom/ssr/fog-of-war";

function samplePath(segments: number, segmentLength = 1): string {
  return `/${Array.from({ length: segments }, (_, i) =>
    String(i % 10).repeat(segmentLength),
  ).join("/")}`;
}

describe("fog of war", () => {
  describe("shouldUseInitialRouteDiscovery", () => {
    test("keeps the match-cost budget inactive through ten segments", () => {
      for (let segments of [0, 1, 10]) {
        expect(
          shouldUseInitialRouteDiscovery(samplePath(segments), 50_001),
        ).toBe(false);
      }
      expect(shouldUseInitialRouteDiscovery(samplePath(11), 50_001)).toBe(true);
    });

    test("permits exactly the match-cost budget", () => {
      expect(shouldUseInitialRouteDiscovery(samplePath(20), 2500)).toBe(false);
      expect(shouldUseInitialRouteDiscovery(samplePath(20), 2501)).toBe(true);
    });

    test("bounds pathname work without a match cost", () => {
      expect(shouldUseInitialRouteDiscovery(samplePath(62))).toBe(false);
      expect(shouldUseInitialRouteDiscovery(samplePath(63))).toBe(true);
    });

    test("bounds pathname work even for shallow paths", () => {
      for (let matchCost of [undefined, 50_001]) {
        expect(
          shouldUseInitialRouteDiscovery(
            `${samplePath(1, URL_LIMIT - 4)}/x`,
            matchCost,
          ),
        ).toBe(false);
        expect(
          shouldUseInitialRouteDiscovery(
            `${samplePath(1, URL_LIMIT - 3)}/x`,
            matchCost,
          ),
        ).toBe(true);
      }
    });

    test("permits a single segment without ancestor work", () => {
      expect(shouldUseInitialRouteDiscovery(samplePath(1, URL_LIMIT))).toBe(
        false,
      );
    });

    test("ignores empty pathname segments", () => {
      let pathname = samplePath(10).replaceAll("/", "///");
      expect(shouldUseInitialRouteDiscovery(pathname, 50_001)).toBe(false);
    });
  });

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
