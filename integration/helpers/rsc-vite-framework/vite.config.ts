import { defineConfig } from "vite";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import react from "@vitejs/plugin-react";
import rsc from "@vitejs/plugin-rsc";

export default defineConfig({
  plugins: [
    // @ts-ignore
    reactRouterRSC({ __runningWithinTheReactRouterMonoRepo: true }),
    react(),
    rsc(),
  ],
});
