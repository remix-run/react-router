/**
 * @jest-environment jsdom
 */

import { joinPaths } from "../lib/router/utils";

describe("RSC Double Slashes Issue - URL Normalization", () => {
  test("joinPaths should normalize double slashes", () => {
    expect(joinPaths(["//en//test2/test"])).toBe("/en/test2/test");
    expect(joinPaths(["//en//test1", "//fr//test2"])).toBe("/en/test1/fr/test2");
    expect(joinPaths(["/app//base/"])).toBe("/app/base");
    expect(joinPaths(["/normal/path"])).toBe("/normal/path");
    expect(joinPaths([""])).toBe("/");
  });

  test("should handle various double slash scenarios", () => {
    // Test cases that would cause the original issue
    expect(joinPaths(["//en//test2/test"])).toBe("/en/test2/test");
    expect(joinPaths(["///multiple///slashes"])).toBe("/multiple/slashes");
    expect(joinPaths(["path//with//double//slashes"])).toBe("path/with/double/slashes");
    expect(joinPaths(["//"])).toBe("/");
  });

  test("should preserve single slashes", () => {
    expect(joinPaths(["/normal/path"])).toBe("/normal/path");
    expect(joinPaths(["path/without/leading/slash"])).toBe("path/without/leading/slash");
  });
});