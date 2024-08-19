import { reactRouter, cloudflareDevProxy } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [cloudflareDevProxy(), reactRouter()],
});
