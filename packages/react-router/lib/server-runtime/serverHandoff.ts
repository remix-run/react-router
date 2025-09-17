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
};

export function createServerHandoffString(
  serverHandoff: ServerHandoff,
): string {
  // Uses faster alternative of jsesc to escape data returned from the loaders.
  // This string is inserted directly into the HTML in the `<Scripts>` element.
  return escapeHtml(JSON.stringify(serverHandoff));
}
