import { UNSAFE_MiddlewareEnabled, RouterContextProvider, AppLoadContext } from 'react-router';
import { Plugin } from 'vite';
import { PlatformProxy, GetPlatformProxyOptions } from 'wrangler';

type MaybePromise<T> = T | Promise<T>;
type CfProperties = Record<string, unknown>;
type LoadContext<Env, Cf extends CfProperties> = {
    cloudflare: Omit<PlatformProxy<Env, Cf>, "dispose">;
};
type GetLoadContext<Env, Cf extends CfProperties> = (args: {
    request: Request;
    context: LoadContext<Env, Cf>;
}) => UNSAFE_MiddlewareEnabled extends true ? MaybePromise<RouterContextProvider> : MaybePromise<AppLoadContext>;
/**
 * Vite plugin that provides [Node proxies to local workerd
 * bindings](https://developers.cloudflare.com/workers/wrangler/api/#getplatformproxy)
 * to `context.cloudflare` in your server loaders and server actions during
 * development.
 */
declare const cloudflareDevProxyVitePlugin: <Env, Cf extends CfProperties>(options?: {
    getLoadContext?: GetLoadContext<Env, Cf>;
} & GetPlatformProxyOptions) => Plugin;

export { cloudflareDevProxyVitePlugin as cloudflareDevProxy };
