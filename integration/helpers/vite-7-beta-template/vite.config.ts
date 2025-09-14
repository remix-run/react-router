import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // @ts-expect-error `dev` depends on Vite 6, Plugin type is mismatched.
  plugins: [reactRouter(), tsconfigPaths()],
});
