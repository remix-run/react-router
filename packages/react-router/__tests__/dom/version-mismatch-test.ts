describe("React Router version mismatch diagnostics", () => {
  let consoleWarn: jest.SpyInstance;

  beforeEach(() => {
    jest.resetModules();
    consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {});
    Reflect.deleteProperty(window, "__reactRouterVersion");
    (
      globalThis as typeof globalThis & { REACT_ROUTER_VERSION: string }
    ).REACT_ROUTER_VERSION = "8.3.0";
  });

  afterEach(() => {
    consoleWarn.mockRestore();
    Reflect.deleteProperty(window, "__reactRouterVersion");
    Reflect.deleteProperty(globalThis, "REACT_ROUTER_VERSION");
  });

  it("warns when another React Router version loaded first", async () => {
    window.__reactRouterVersion = "7.13.1";

    await jest.isolateModulesAsync(async () => {
      await import("../../lib/dom/lib");
    });

    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      "React Router detected multiple versions loaded (7.13.1 and 8.3.0). " +
        "This can cause routing failures. Make sure all react-router and " +
        "react-router-dom packages use the same version.",
    );
    expect(window.__reactRouterVersion).toBe("8.3.0");
  });

  it("warns when another React Router version loads later", async () => {
    let versionModule!: typeof import("../../lib/dom/version");

    await jest.isolateModulesAsync(async () => {
      versionModule = await import("../../lib/dom/version");
    });

    versionModule.registerReactRouterVersion();
    expect(consoleWarn).not.toHaveBeenCalled();

    window.__reactRouterVersion = "7.13.1";
    versionModule.warnIfReactRouterVersionMismatch();
    versionModule.warnIfReactRouterVersionMismatch();

    expect(consoleWarn).toHaveBeenCalledTimes(1);
    expect(consoleWarn).toHaveBeenCalledWith(
      "React Router detected multiple versions loaded (7.13.1 and 8.3.0). " +
        "This can cause routing failures. Make sure all react-router and " +
        "react-router-dom packages use the same version.",
    );
  });

  it("does not warn when the detected version matches", async () => {
    window.__reactRouterVersion = "8.3.0";

    await jest.isolateModulesAsync(async () => {
      let versionModule = await import("../../lib/dom/version");
      versionModule.registerReactRouterVersion();
      versionModule.warnIfReactRouterVersionMismatch();
    });

    expect(consoleWarn).not.toHaveBeenCalled();
  });
});
