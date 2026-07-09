
import { RouterContextProvider } from "../router/utils.js";
import { ServerBuild } from "./build.js";

//#region lib/server-runtime/server.d.ts
type RequestHandler = (request: Request, loadContext?: RouterContextProvider) => Promise<Response>;
type CreateRequestHandlerFunction = (build: ServerBuild | (() => ServerBuild | Promise<ServerBuild>), mode?: string) => RequestHandler;
declare const createRequestHandler: CreateRequestHandlerFunction;
//#endregion
export { CreateRequestHandlerFunction, RequestHandler, createRequestHandler };