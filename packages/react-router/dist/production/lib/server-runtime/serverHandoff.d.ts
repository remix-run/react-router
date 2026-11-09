
import { CriticalCss, FutureConfig } from "../dom/ssr/entry.js";
import { ServerBuild } from "./build.js";

//#region lib/server-runtime/serverHandoff.d.ts
type ServerHandoff = {
  criticalCss?: CriticalCss;
  basename: string | undefined;
  future: FutureConfig;
  ssr: boolean;
  isSpaMode: boolean;
  unstable_apiOnly?: boolean;
  unstable_apiServerOrigin?: string;
  routeDiscovery: ServerBuild["routeDiscovery"];
};
//#endregion
export { ServerHandoff };