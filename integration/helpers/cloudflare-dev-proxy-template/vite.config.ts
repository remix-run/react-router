import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { defineConfig } from "vite";

export default defineConfig({
  // @ts-expect-error - vite versions
  plugins: [cloudflareDevProxy(), reactRouter()],
});
