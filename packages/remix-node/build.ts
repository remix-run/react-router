import type { EntryContext, AssetsManifest } from "./entry";
import type { Headers, Request, Response } from "./fetch";
import type { ServerRouteManifest } from "./routes";

export interface ServerBuild {
  entry: {
    module: ServerEntryModule;
  };
  routes: ServerRouteManifest;
  assets: AssetsManifest;
}

/**
 * A module that serves as the entry point for a Remix app during server
 * rendering.
 */
export interface ServerEntryModule {
  default(
    request: Request,
    responseStatusCode: number,
    responseHeaders: Headers,
    context: EntryContext
  ): Promise<Response>;
}
