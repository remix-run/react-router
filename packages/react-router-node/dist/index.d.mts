import { RequestListener } from 'node:http';
import { ServerBuild, UNSAFE_MiddlewareEnabled, RouterContextProvider, AppLoadContext, SessionData, SessionIdStorageStrategy, SessionStorage } from 'react-router';
import { ClientAddress } from '@mjackson/node-fetch-server';
import { Readable, Writable } from 'node:stream';

type MaybePromise<T> = T | Promise<T>;
interface RequestListenerOptions {
    build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>);
    getLoadContext?: (request: Request, client: ClientAddress) => UNSAFE_MiddlewareEnabled extends true ? MaybePromise<RouterContextProvider> : MaybePromise<AppLoadContext>;
    mode?: string;
}
/**
 * Creates a request listener that handles requests using Node's built-in HTTP server.
 *
 * @param options Options for creating a request listener.
 * @returns A request listener that can be used with `http.createServer`.
 */
declare function createRequestListener(options: RequestListenerOptions): RequestListener;

interface FileSessionStorageOptions {
    /**
     * The Cookie used to store the session id on the client, or options used
     * to automatically create one.
     */
    cookie?: SessionIdStorageStrategy["cookie"];
    /**
     * The directory to use to store session files.
     */
    dir: string;
}
/**
 * Creates a SessionStorage that stores session data on a filesystem.
 *
 * The advantage of using this instead of cookie session storage is that
 * files may contain much more data than cookies.
 *
 * @see https://api.reactrouter.com/v7/functions/_react-router_node.createFileSessionStorage
 */
declare function createFileSessionStorage<Data = SessionData, FlashData = Data>({ cookie, dir, }: FileSessionStorageOptions): SessionStorage<Data, FlashData>;

declare function writeReadableStreamToWritable(stream: ReadableStream, writable: Writable): Promise<void>;
declare function writeAsyncIterableToWritable(iterable: AsyncIterable<Uint8Array>, writable: Writable): Promise<void>;
declare function readableStreamToString(stream: ReadableStream<Uint8Array>, encoding?: BufferEncoding): Promise<string>;
declare const createReadableStreamFromReadable: (source: Readable & {
    readableHighWaterMark?: number;
}) => ReadableStream<Uint8Array>;

export { type RequestListenerOptions, createFileSessionStorage, createReadableStreamFromReadable, createRequestListener, readableStreamToString, writeAsyncIterableToWritable, writeReadableStreamToWritable };
