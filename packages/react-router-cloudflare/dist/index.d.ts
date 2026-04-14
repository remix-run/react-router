import { SessionData, SessionIdStorageStrategy, SessionStorage, ServerBuild, UNSAFE_MiddlewareEnabled, RouterContextProvider, AppLoadContext } from 'react-router';
import { CacheStorage } from '@cloudflare/workers-types';

interface WorkersKVSessionStorageOptions {
    /**
     * The Cookie used to store the session id on the client, or options used
     * to automatically create one.
     */
    cookie?: SessionIdStorageStrategy["cookie"];
    /**
     * The KVNamespace used to store the sessions.
     */
    kv: KVNamespace;
}
/**
 * Creates a SessionStorage that stores session data in the Clouldflare KV Store.
 *
 * The advantage of using this instead of cookie session storage is that
 * KV Store may contain much more data than cookies.
 */
declare function createWorkersKVSessionStorage<Data = SessionData, FlashData = Data>({ cookie, kv, }: WorkersKVSessionStorageOptions): SessionStorage<Data, FlashData>;

type MaybePromise<T> = T | Promise<T>;
/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
type GetLoadContextFunction<Env = unknown, Params extends string = any, Data extends Record<string, unknown> = Record<string, unknown>> = (args: {
    request: Request;
    context: {
        cloudflare: EventContext<Env, Params, Data> & {
            cf: EventContext<Env, Params, Data>["request"]["cf"];
            ctx: {
                waitUntil: EventContext<Env, Params, Data>["waitUntil"];
                passThroughOnException: EventContext<Env, Params, Data>["passThroughOnException"];
            };
            caches: CacheStorage;
        };
    };
}) => UNSAFE_MiddlewareEnabled extends true ? MaybePromise<RouterContextProvider> : MaybePromise<AppLoadContext>;
type RequestHandler<Env = any> = PagesFunction<Env>;
interface createPagesFunctionHandlerParams<Env = any> {
    build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>);
    getLoadContext?: GetLoadContextFunction<Env>;
    mode?: string;
}
declare function createRequestHandler<Env = any>({ build, mode, getLoadContext, }: createPagesFunctionHandlerParams<Env>): RequestHandler<Env>;
declare function createPagesFunctionHandler<Env = any>({ build, getLoadContext, mode, }: createPagesFunctionHandlerParams<Env>): (context: EventContext<Env, any, any>) => Promise<Response>;

export { type GetLoadContextFunction, type RequestHandler, createPagesFunctionHandler, type createPagesFunctionHandlerParams, createRequestHandler, createWorkersKVSessionStorage };
