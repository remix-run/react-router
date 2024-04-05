import { createRequestHandler } from "@remix-run/server-runtime";
import type { AppLoadContext, ServerBuild } from "@remix-run/server-runtime";
import type { Plugin } from "vite";
import type { GetPlatformProxyOptions, PlatformProxy } from "wrangler";

import { fromNodeRequest, toNodeRequest } from "./node-adapter";

let serverBuildId = "virtual:react-router/server-build";

type CfProperties = Record<string, unknown>;

type LoadContext<Env, Cf extends CfProperties> = {
  cloudflare: Omit<PlatformProxy<Env, Cf>, "dispose">;
};

type GetLoadContext<Env, Cf extends CfProperties> = (args: {
  request: Request;
  context: LoadContext<Env, Cf>;
}) => AppLoadContext | Promise<AppLoadContext>;

function importWrangler() {
  try {
    return import("wrangler");
  } catch (_) {
    throw Error("Could not import `wrangler`. Do you have it installed?");
  }
}

const NAME = "vite-plugin-react-router-cloudflare-proxy";

export const cloudflareDevProxyVitePlugin = <Env, Cf extends CfProperties>({
  getLoadContext,
  ...options
}: {
  getLoadContext?: GetLoadContext<Env, Cf>;
} & GetPlatformProxyOptions = {}): Plugin => {
  return {
    name: NAME,
    config: () => ({
      ssr: {
        resolve: {
          externalConditions: ["workerd", "worker"],
        },
      },
    }),
    configResolved: (viteConfig) => {
      let pluginIndex = (name: string) =>
        viteConfig.plugins.findIndex((plugin) => plugin.name === name);
      let reactRouterPluginIndex = pluginIndex("react-router");
      if (
        reactRouterPluginIndex >= 0 &&
        reactRouterPluginIndex < pluginIndex(NAME)
      ) {
        throw new Error(
          `The "${NAME}" plugin should be placed before the React Router plugin in your Vite config file`
        );
      }
    },
    configureServer: async (viteDevServer) => {
      let { getPlatformProxy } = await importWrangler();
      // Do not include `dispose` in Cloudflare context
      let { dispose, ...cloudflare } = await getPlatformProxy<Env, Cf>(options);
      let context = { cloudflare };
      return () => {
        if (!viteDevServer.config.server.middlewareMode) {
          viteDevServer.middlewares.use(async (nodeReq, nodeRes, next) => {
            try {
              let build = (await viteDevServer.ssrLoadModule(
                serverBuildId
              )) as ServerBuild;

              let handler = createRequestHandler(build, "development");
              let req = fromNodeRequest(nodeReq);
              let loadContext = getLoadContext
                ? await getLoadContext({ request: req, context })
                : context;
              let res = await handler(req, loadContext);
              await toNodeRequest(res, nodeRes);
            } catch (error) {
              next(error);
            }
          });
        }
      };
    },
  };
};
