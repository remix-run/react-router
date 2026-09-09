import {
  bindings,
  defineWorker,
} from "@cloudflare/vite-plugin/experimental-config";
import * as entrypoint from "./workers/app.ts" with { type: "cf-worker" };

export default defineWorker({
  name: "react-router-app",
  entrypoint,
  compatibilityDate: "2025-03-17",
  env: {
    VALUE_FROM_CLOUDFLARE: bindings.text("Hello from Cloudflare"),
  },
});
