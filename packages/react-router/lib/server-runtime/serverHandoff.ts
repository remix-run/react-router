import type { CriticalCss, FutureConfig } from "../dom/ssr/entry";
import { escapeHtml } from "../dom/ssr/markup";
import type { ServerBuild } from "./build";

export type ServerHandoff = {
  criticalCss?: CriticalCss;
  basename: string | undefined;
  future: FutureConfig;
  ssr: boolean;
  isSpaMode: boolean;
  routeDiscovery: ServerBuild["routeDiscovery"];
  // SPA documents are prerendered for one URL and then reused for every path.
  // The client hydrates against this location so the first render matches that
  // HTML, then updates to `window.location`.
  spaLocation?: {
    pathname: string;
    search: string;
    hash: string;
  };
};

export function createServerHandoffString(
  serverHandoff: ServerHandoff,
): string {
  // Uses faster alternative of jsesc to escape data returned from the loaders.
  // This string is inserted directly into the HTML in the `<Scripts>` element.
  return escapeHtml(JSON.stringify(serverHandoff));
}
