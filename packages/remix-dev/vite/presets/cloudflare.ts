import { type Preset, setRemixDevLoadContext } from "../plugin";

type GetRemixDevLoadContext = (
  loadContext: Record<string, unknown>
) => Record<string, unknown> | Promise<Record<string, unknown>>;

const importWrangler = async () => {
  try {
    return await import("wrangler");
  } catch (_) {
    throw Error("Could not import `wrangler`. Do you have it installed?");
  }
};

/**
 * @param options.getRemixDevLoadContext - Augment the load context.
 */
export const preset = (
  options: {
    getRemixDevLoadContext?: GetRemixDevLoadContext;
  } = {}
): Preset => ({
  name: "cloudflare",
  remixConfig: async () => {
    let { getBindingsProxy } = await importWrangler();
    let { bindings } = await getBindingsProxy();
    let loadContext: Record<string, unknown> = { env: bindings };
    if (options.getRemixDevLoadContext) {
      loadContext = await options.getRemixDevLoadContext(loadContext);
    }
    setRemixDevLoadContext(loadContext);
    return {};
  },
});
