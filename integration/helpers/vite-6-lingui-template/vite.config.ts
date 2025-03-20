import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import macrosPlugin from "vite-plugin-babel-macros";
import { lingui } from "@lingui/vite-plugin";

export default defineConfig({
  plugins: [reactRouter(), macrosPlugin(), lingui(), tsconfigPaths()],
});
