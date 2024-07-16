import {
  vitePlugin as reactRouter,
  cloudflareDevProxyVitePlugin as reactRouterCloudflareDevProxy,
} from "@react-router/dev";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [reactRouterCloudflareDevProxy(), reactRouter()],
});
