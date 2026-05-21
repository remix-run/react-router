import { logFutureFlagWarnings } from "../config/config";

describe("logFutureFlagWarnings", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("does not warn when there are no stable v8_ future flags", () => {
    logFutureFlagWarnings({});

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("does not warn about unstable future flags", () => {
    logFutureFlagWarnings({
      unstable_optimizeDeps: true,
    });

    expect(logSpy).not.toHaveBeenCalled();
  });
});
