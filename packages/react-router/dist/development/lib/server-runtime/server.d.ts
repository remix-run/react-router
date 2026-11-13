
import { RouterContextProvider } from "../router/utils.js";
import { ServerBuild } from "./build.js";

//#region lib/server-runtime/server.d.ts
type RequestHandler = (request: Request, loadContext?: RouterContextProvider) => Promise<Response>;
type CreateRequestHandlerFunction = (build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>), mode?: string) => RequestHandler;
/**
 * Creates a request handler for a React Router server build.
 *
 * This is a low-level API used by server adapters to translate incoming
 * requests into React Router responses.
 *
 * @category Utils
 * @param build The server build, or a function that resolves to the server
 * build, used to handle requests.
 * @param mode The mode in which the server build is running.
 * @returns A request handler that returns a response for each incoming request.
 */
declare const createRequestHandler: CreateRequestHandlerFunction;
//#endregion
export { CreateRequestHandlerFunction, RequestHandler, createRequestHandler };