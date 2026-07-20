import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";

export default defineConfig(({ isSsrBuild }) => ({
  resolve: { tsconfigPaths: true },
  build: {
    minify: false,
    rolldownOptions: isSsrBuild
      ? {
          input: "./server.ts",
        }
      : undefined,
  },
  plugins: [reactRouter()],
}));
