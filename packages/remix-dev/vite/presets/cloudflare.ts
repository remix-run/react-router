import { type VitePluginPreset, setRemixDevLoadContext } from "../plugin";

export const preset: () => VitePluginPreset = () => ({
  name: "cloudflare",
  remixConfig: async () => {
    let { getBindingsProxy } = await import("wrangler");
    let { bindings } = await getBindingsProxy();
    let loadContext = bindings && { env: bindings };

    setRemixDevLoadContext(loadContext);

    return {};
  },
});
