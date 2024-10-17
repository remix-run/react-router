import { reactRouter } from "@react-router/dev/vite";
import { installGlobals } from "@react-router/node";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

installGlobals();

export default defineConfig({
  plugins: [
    reactRouter({
      future: {
        unstable_routeChunks: true,
      },
    }),
    tsconfigPaths(),
  ],
});
