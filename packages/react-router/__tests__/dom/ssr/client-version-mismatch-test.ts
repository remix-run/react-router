/** @jest-environment node */

import { tick } from "../../router/utils/utils";

type FogOfWar = typeof import("../../../lib/dom/ssr/fog-of-war");

const storageKey = "react-router-manifest-version";
const mismatchMessage =
  "Unable to discover routes due to manifest version mismatch.";

describe("client version mismatch", () => {
  let fogOfWar: FogOfWar;
  let stored: Map<string, string>;
  let reload: jest.Mock;
  let windowEvents: EventTarget;
  let originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  let originalStorage = Object.getOwnPropertyDescriptor(
    globalThis,
    "sessionStorage",
  );

  beforeEach(async () => {
    // A new module instance models a new document, without exposing a reset API.
    await jest.isolateModulesAsync(async () => {
      fogOfWar = await import("../../../lib/dom/ssr/fog-of-war");
    });
    stored = new Map();
    reload = jest.fn();
    windowEvents = new EventTarget();
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        addEventListener: windowEvents.addEventListener.bind(windowEvents),
        removeEventListener:
          windowEvents.removeEventListener.bind(windowEvents),
        location: {
          origin: "http://localhost",
          get href() {
            return "http://localhost/";
          },
          set href(path: string) {
            reload(path);
          },
        },
      },
    });
    Object.defineProperty(globalThis, "sessionStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => stored.get(key) ?? null,
        setItem: (key: string, value: string) => stored.set(key, value),
        removeItem: (key: string) => stored.delete(key),
      },
    });
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    for (let [key, descriptor] of [
      ["window", originalWindow],
      ["sessionStorage", originalStorage],
    ] as const) {
      if (descriptor) {
        Object.defineProperty(globalThis, key, descriptor);
      } else {
        Reflect.deleteProperty(globalThis, key);
      }
    }
  });

  it("holds concurrent mismatches behind the pending document reload", async () => {
    let settled = jest.fn();
    fogOfWar
      .handleClientVersionMismatch(true, "v1", "/first?query=1#hash")
      .then(settled, settled);
    fogOfWar
      .handleClientVersionMismatch(true, "v1", "/second")
      .then(settled, settled);
    await tick();

    expect(reload.mock.calls).toEqual([["/first?query=1#hash"]]);
    expect(stored.get(storageKey)).toBe("v1");
    expect(settled).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
  });

  it("rejects discovery when a previous document already tried this version", async () => {
    stored.set(storageKey, "v1");
    await expect(
      fogOfWar.handleClientVersionMismatch(true, "v1", "/target"),
    ).rejects.toThrow(mismatchMessage);
    expect(reload).not.toHaveBeenCalled();
  });

  it("defers eager mismatches until a navigation needs discovery", async () => {
    await expect(
      fogOfWar.handleClientVersionMismatch(true, "v1", null),
    ).resolves.toBe(true);
    expect(stored.size).toBe(0);
    expect(reload).not.toHaveBeenCalled();

    let settled = jest.fn();
    fogOfWar
      .handleClientVersionMismatch(true, "v1", "/target")
      .then(settled, settled);
    await tick();
    expect(reload.mock.calls).toEqual([["/target"]]);
    expect(settled).not.toHaveBeenCalled();
  });

  it("clears loop detection on success when no reload is pending", async () => {
    stored.set(storageKey, "v1");
    await expect(
      fogOfWar.handleClientVersionMismatch(false, "v1", "/target"),
    ).resolves.toBe(false);
    expect(stored.has(storageKey)).toBe(false);

    fogOfWar.handleClientVersionMismatch(true, "v1", "/target");
    expect(reload.mock.calls).toEqual([["/target"]]);
  });

  it("does not let a late successful response clear a pending reload", async () => {
    fogOfWar.handleClientVersionMismatch(true, "v1", "/target");
    let settled = jest.fn();
    fogOfWar
      .handleClientVersionMismatch(false, "v1", "/other")
      .then(settled, settled);
    fogOfWar
      .handleClientVersionMismatch(true, "v1", null)
      .then(settled, settled);
    await tick();

    expect(stored.get(storageKey)).toBe("v1");
    expect(reload.mock.calls).toEqual([["/target"]]);
    expect(settled).not.toHaveBeenCalled();
  });

  it("allows recovery for a different client version", async () => {
    stored.set(storageKey, "v1");
    let settled = jest.fn();
    fogOfWar
      .handleClientVersionMismatch(true, "v2", "/target")
      .then(settled, settled);
    await tick();

    expect(stored.get(storageKey)).toBe("v2");
    expect(reload.mock.calls).toEqual([["/target"]]);
    expect(settled).not.toHaveBeenCalled();
  });

  it("resumes mismatch handling when the document is restored from BFCache", async () => {
    fogOfWar.handleClientVersionMismatch(true, "v1", "/target");

    // The initial pageshow must not clear an in-flight reload.
    windowEvents.dispatchEvent(
      Object.assign(new Event("pageshow"), { persisted: false }),
    );
    let beforeRestore = jest.fn();
    fogOfWar
      .handleClientVersionMismatch(true, "v1", "/other")
      .then(beforeRestore, beforeRestore);
    await tick();
    expect(beforeRestore).not.toHaveBeenCalled();

    windowEvents.dispatchEvent(
      Object.assign(new Event("pageshow"), { persisted: true }),
    );
    let afterRestore = jest.fn();
    fogOfWar
      .handleClientVersionMismatch(true, "v1", "/other")
      .then(afterRestore, afterRestore);
    await tick();

    expect(afterRestore).toHaveBeenCalledWith(new Error(mismatchMessage));
    expect(reload.mock.calls).toEqual([["/target"]]);
    await expect(
      fogOfWar.handleClientVersionMismatch(false, "v1", "/other"),
    ).resolves.toBe(false);
  });

  it.each(["getItem", "setItem", "removeItem"] as const)(
    "tolerates unavailable sessionStorage.%s",
    async (method) => {
      jest.spyOn(sessionStorage, method).mockImplementation(() => {
        throw new Error("Storage unavailable");
      });
      await expect(
        fogOfWar.handleClientVersionMismatch(false, "v1", "/target"),
      ).resolves.toBe(false);

      let settled = jest.fn();
      fogOfWar
        .handleClientVersionMismatch(true, "v1", "/target")
        .then(settled, settled);
      fogOfWar
        .handleClientVersionMismatch(true, "v1", "/other")
        .then(settled, settled);
      await tick();

      expect(reload.mock.calls).toEqual([["/target"]]);
      expect(settled).not.toHaveBeenCalled();
    },
  );
});
