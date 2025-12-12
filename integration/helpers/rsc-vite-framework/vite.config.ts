import { defineConfig } from "vite";
import { unstable_reactRouterRSC as reactRouterRSC } from "@react-router/dev/vite";
import rsc from "@vitejs/plugin-rsc";

export default defineConfig({
  environments: {
    client: {
      optimizeDeps: {
        exclude: ["react-router", "react-router/dom"],
      },
    },
  },
  plugins: [
    reactRouterRSC({ __runningWithinTheReactRouterMonoRepo: true }),
    rsc(),
  ],
});
