import { joinPaths } from "../lib/router/utils";

describe("joinPaths double slash normalization", () => {
  it("normalizes double slashes in single path", () => {
    expect(joinPaths(["//en//test2/test"])).toBe("/en/test2/test");
    expect(joinPaths(["/app//base/"])).toBe("/app/base/");
    expect(joinPaths(["///multiple///slashes"])).toBe("/multiple/slashes");
  });

  it("normalizes double slashes in multiple paths", () => {
    expect(joinPaths(["//en//test1", "//fr//test2"])).toBe("/en/test1/fr/test2");
    expect(joinPaths(["path//with//double", "slashes//here"])).toBe("path/with/double/slashes/here");
  });

  it("preserves normal paths", () => {
    expect(joinPaths(["/normal/path"])).toBe("/normal/path");
    expect(joinPaths(["path/without/leading/slash"])).toBe("path/without/leading/slash");
    expect(joinPaths([""])).toBe("");
  });
});