import fs from "node:fs/promises";
import vm from "node:vm";

import { jest } from "@jest/globals";

async function loadRefreshUtils(globals: Record<string, unknown>) {
  let on = jest.fn();
  let source = await fs.readFile(
    new URL("./static/refresh-utils.mjs", import.meta.url),
    "utf8",
  );
  let module = new vm.SourceTextModule(`const exports = {};\n${source}`, {
    context: vm.createContext(globals),
    initializeImportMeta(meta) {
      meta.hot = { on };
    },
  });
  await module.link(() => {
    throw new Error("Unexpected import in refresh utilities");
  });
  await module.evaluate();
  return on;
}

describe("React Refresh utilities", () => {
  it("loads in a worker without a window", async () => {
    let on = await loadRefreshUtils({});
    expect(on).not.toHaveBeenCalled();
  });

  it("initializes route module updates and listens for HMR in a window", async () => {
    let window: { __reactRouterRouteModuleUpdates?: Map<string, unknown> } = {};
    let on = await loadRefreshUtils({ window });
    expect(window.__reactRouterRouteModuleUpdates?.size).toBe(0);
    expect(on).toHaveBeenCalledWith("react-router:hmr", expect.any(Function));
  });
});
