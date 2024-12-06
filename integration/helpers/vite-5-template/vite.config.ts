import { reactRouter } from "@react-router/dev/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    // @ts-expect-error `dev` depends on Vite 6, Plugin type is mismatched.
    reactRouter(),
    tsconfigPaths(),
  ],
});
