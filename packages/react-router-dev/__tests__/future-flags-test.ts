import { logFutureFlagWarnings } from "../config/config";

describe("logFutureFlagWarnings", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it("warns about all stable v8_ flags when none are set", () => {
    logFutureFlagWarnings({});

    expect(warnSpy).toHaveBeenCalledTimes(4);
    expect(warnSpy.mock.calls[0][0]).toContain("v8_middleware");
    expect(warnSpy.mock.calls[1][0]).toContain("v8_splitRouteModules");
    expect(warnSpy.mock.calls[2][0]).toContain("v8_viteEnvironmentApi");
    expect(warnSpy.mock.calls[3][0]).toContain("v8_passThroughRequests");
  });

  it("does not warn about flags that are already opted in (true)", () => {
    logFutureFlagWarnings({
      v8_middleware: true,
      v8_splitRouteModules: true,
      v8_viteEnvironmentApi: true,
      v8_passThroughRequests: true,
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("does not warn about flags that are explicitly opted out (false)", () => {
    logFutureFlagWarnings({
      v8_middleware: false,
      v8_splitRouteModules: false,
      v8_viteEnvironmentApi: false,
      v8_passThroughRequests: false,
    });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("only warns about flags that are not yet set", () => {
    logFutureFlagWarnings({
      v8_middleware: true,
      v8_passThroughRequests: false,
    });

    // Only v8_splitRouteModules and v8_viteEnvironmentApi are missing
    expect(warnSpy).toHaveBeenCalledTimes(2);
    expect(warnSpy.mock.calls[0][0]).toContain("v8_splitRouteModules");
    expect(warnSpy.mock.calls[1][0]).toContain("v8_viteEnvironmentApi");
  });
});
