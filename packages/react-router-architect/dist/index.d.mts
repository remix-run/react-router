import { SessionData, SessionIdStorageStrategy, SessionStorage, UNSAFE_MiddlewareEnabled, RouterContextProvider, AppLoadContext, ServerBuild } from 'react-router';
import { ArcTable } from '@architect/functions/types/tables';
import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2 } from 'aws-lambda';

interface ArcTableSessionStorageOptions {
    /**
     * The Cookie used to store the session id on the client, or options used
     * to automatically create one.
     */
    cookie?: SessionIdStorageStrategy["cookie"];
    /**
     * The table used to store sessions, or its name as it appears in your
     * project's app.arc file.
     */
    table: ArcTable<SessionData> | string;
    /**
     * The name of the DynamoDB attribute used to store the session ID.
     * This should be the table's partition key.
     */
    idx: string;
    /**
     * The name of the DynamoDB attribute used to store the expiration time.
     * If absent, then no TTL will be stored and session records will not expire.
     */
    ttl?: string;
}
/**
 * Session storage using a DynamoDB table managed by Architect.
 *
 * Add the following lines to your project's `app.arc` file:
 *
 *   @tables
 *   arc-sessions
 *     _idx *String
 *     _ttl TTL
 */
declare function createArcTableSessionStorage<Data = SessionData, FlashData = Data>({ cookie, ...props }: ArcTableSessionStorageOptions): SessionStorage<Data, FlashData>;

type MaybePromise<T> = T | Promise<T>;
/**
 * A function that returns the value to use as `context` in route `loader` and
 * `action` functions.
 *
 * You can think of this as an escape hatch that allows you to pass
 * environment/platform-specific values through to your loader/action.
 */
type GetLoadContextFunction = (event: APIGatewayProxyEventV2) => UNSAFE_MiddlewareEnabled extends true ? MaybePromise<RouterContextProvider> : MaybePromise<AppLoadContext>;
type RequestHandler = APIGatewayProxyHandlerV2;
/**
 * Returns a request handler for Architect that serves the response using
 * React Router.
 */
declare function createRequestHandler({ build, getLoadContext, mode, }: {
    build: ServerBuild;
    getLoadContext?: GetLoadContextFunction;
    mode?: string;
}): RequestHandler;

export { type GetLoadContextFunction, type RequestHandler, createArcTableSessionStorage, createRequestHandler };
