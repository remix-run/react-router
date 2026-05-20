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

    expect(logSpy).toHaveBeenCalledTimes(3);
    expect(logSpy.mock.calls[0][0]).toContain("v8_splitRouteModules");
    expect(logSpy.mock.calls[1][0]).toContain("v8_viteEnvironmentApi");
    expect(logSpy.mock.calls[2][0]).toContain("v8_passThroughRequests");
  });

  it("does not warn about flags that are already opted in (true)", () => {
    logFutureFlagWarnings({
      v8_splitRouteModules: true,
      v8_viteEnvironmentApi: true,
      v8_passThroughRequests: true,
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("does not warn about flags that are explicitly opted out (false)", () => {
    logFutureFlagWarnings({
      v8_splitRouteModules: false,
      v8_viteEnvironmentApi: false,
      v8_passThroughRequests: false,
    });

    expect(logSpy).not.toHaveBeenCalled();
  });

  it("only warns about flags that are not yet set", () => {
    logFutureFlagWarnings({
      v8_passThroughRequests: false,
    });

    // Only v8_splitRouteModules and v8_viteEnvironmentApi are missing
    expect(logSpy).toHaveBeenCalledTimes(2);
    expect(logSpy.mock.calls[0][0]).toContain("v8_splitRouteModules");
    expect(logSpy.mock.calls[1][0]).toContain("v8_viteEnvironmentApi");
  });
});
