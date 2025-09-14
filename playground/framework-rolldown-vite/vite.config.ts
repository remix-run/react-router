import { reactRouter } from "@react-router/dev/vite";
import { defineConfig, type UserConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ isSsrBuild }) => {
  const config: UserConfig = {
    plugins: [
      // @ts-expect-error `dev` depends on Vite 6, Plugin type is mismatched.
      reactRouter(),
      tsconfigPaths(),
    ],
    build: {
      // Built-in minifier is still experimental
      minify: isSsrBuild ? false : "esbuild",
    },
  };

  return config;
});
