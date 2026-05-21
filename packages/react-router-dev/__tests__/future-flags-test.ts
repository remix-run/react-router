import { logFutureFlagWarnings } from "../config/config";

describe("logFutureFlagWarnings", () => {
  let logSpy: jest.SpyInstance;

  beforeEach(() => {
    logSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
  });

  it("warns about all stable v8_ flags when none are set", () => {
    logFutureFlagWarnings({});

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain("v8_splitRouteModules");
  });

  it("does not warn about flags that are already opted in (true)", () => {
    logFutureFlagWarnings({
      v8_splitRouteModules: true,
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("does not warn about flags that are explicitly opted out (false)", () => {
    logFutureFlagWarnings({
      v8_splitRouteModules: false,
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("only warns about flags that are not yet set", () => {
    logFutureFlagWarnings({
      unstable_optimizeDeps: true,
    });

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy.mock.calls[0][0]).toContain("v8_splitRouteModules");
  });
});
