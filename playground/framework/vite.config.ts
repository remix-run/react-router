import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // @ts-expect-error - vite versions
  plugins: [reactRouter(), tsconfigPaths()],
});
