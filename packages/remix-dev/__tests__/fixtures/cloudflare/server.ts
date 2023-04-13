import { createPagesFunctionHandler } from "@remix-run/cloudflare-pages";
import * as build from "@remix-run/dev/server-build";

export const onRequest = createPagesFunctionHandler({
  build,
  getLoadContext: (context) => context.env,
  mode: process.env.NODE_ENV,
});
