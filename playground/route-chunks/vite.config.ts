import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

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
