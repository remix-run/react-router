import { defineConfig } from "vite";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";

export default defineConfig({
  plugins: [
    // @ts-ignore
    reactRouterRSC({ __runningWithinTheReactRouterMonoRepo: true }),
    rsc(),
  ],
});
