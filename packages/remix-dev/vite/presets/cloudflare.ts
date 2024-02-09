import { type AppLoadContext } from "@remix-run/server-runtime";

import { type Preset, setRemixDevLoadContext } from "../plugin";

type MaybePromise<T> = T | Promise<T>;

type GetRemixDevLoadContext = (args: {
  request: Request;
  env: AppLoadContext["env"];
}) => MaybePromise<Record<string, unknown>>;

type GetLoadContext = (
  request: Request
) => MaybePromise<Record<string, unknown>>;

type GetBindingsProxy = () => Promise<{ bindings: Record<string, unknown> }>;

/**
 * @param options.getRemixDevLoadContext - Augment the load context.
 */
export const cloudflarePreset = (
  getBindingsProxy: GetBindingsProxy,
  options: {
    getRemixDevLoadContext?: GetRemixDevLoadContext;
  } = {}
): Preset => ({
  name: "cloudflare",
  remixConfig: async () => {
    let getLoadContext: GetLoadContext = async () => {
      let { bindings } = await getBindingsProxy();
      return { env: bindings };
    };

    // eslint-disable-next-line prefer-let/prefer-let
    const { getRemixDevLoadContext } = options;
    if (getRemixDevLoadContext) {
      getLoadContext = async (request: Request) => {
        let { bindings } = await getBindingsProxy();
        let loadContext = await getRemixDevLoadContext({
          env: bindings,
          request,
        });
        return loadContext;
      };
    }

    setRemixDevLoadContext(getLoadContext);
    return {};
  },
});
