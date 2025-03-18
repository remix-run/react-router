import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => ({
  build: {
    minify: false,
    rollupOptions: isSsrBuild
      ? {
          input: "./server.ts",
        }
      : undefined,
  },
  plugins: [reactRouter(), tsconfigPaths()],
}));
