import { logDevReady } from "@react-router/cloudflare";
import { createPagesFunctionHandler } from "@react-router/cloudflare-pages";
import * as build from "@react-router/dev/server-build";

if (process.env.NODE_ENV === "development") {
  logDevReady(build);
}

export const onRequest = createPagesFunctionHandler({ build });
