import {
  getSourceContentForPosition,
  relativeFilename,
  UNKNOWN_LOCATION_POSITION
} from "../errors";

describe("getSourceContentForPosition", () => {
  it("returns unknown position when no pos", () => {
    expect(getSourceContentForPosition(null!, null)).toBe(
      UNKNOWN_LOCATION_POSITION
    );
  });

  it("returns unknown position when no source", () => {
    expect(getSourceContentForPosition(null!, {} as any)).toBe(
      UNKNOWN_LOCATION_POSITION
    );
  });

  it("returns unknown position when no line", () => {
    expect(getSourceContentForPosition(null!, { source: "yay!" } as any)).toBe(
      UNKNOWN_LOCATION_POSITION
    );
  });

  it("returns trimmed source", () => {
    let smc = {
      sourceContentFor: jest.fn(() => "\n test() \n")
    };

    expect(
      getSourceContentForPosition(
        smc as any,
        { source: "yay!", line: 2 } as any
      )
    ).toBe("test()");
  });
});

describe("relativeFilename", () => {
  let root = process.cwd() + "/";
  let baseFilename = "./app/test.jsx";
  it("returns original filename", () => {
    expect(relativeFilename(baseFilename)).toBe(baseFilename);
  });

  it("returns clean filename for route-module: prefix", () => {
    let filename = "route-module:./app/test.jsx";
    expect(relativeFilename(filename)).toBe(baseFilename);
  });

  it("returns clean filename for absolute path route-module: prefix", () => {
    let filename = `route-module:${root}app/test.jsx`;
    expect(relativeFilename(filename)).toBe(baseFilename);
  });

  it("returns clean filename for absolute path route-module: prefix with extra stuff", () => {
    let filename = `extra-stuff:route-module:${root}app/test.jsx`;
    expect(relativeFilename(filename)).toBe(baseFilename);
  });
});
